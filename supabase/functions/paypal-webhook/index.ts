const PAYPAL_API = "https://api-m.paypal.com";

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function paypalAccessToken(): Promise<string> {
  const clientId = requiredEnv("PAYPAL_CLIENT_ID");
  const clientSecret = requiredEnv("PAYPAL_CLIENT_SECRET");
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) throw new Error(`PayPal OAuth failed (${response.status})`);
  const data = await response.json();
  if (!data.access_token) throw new Error("PayPal OAuth did not return a token");
  return data.access_token;
}

async function verifyWebhook(request: Request, rawBody: string, token: string): Promise<boolean> {
  const headerNames = [
    "paypal-auth-algo",
    "paypal-cert-url",
    "paypal-transmission-id",
    "paypal-transmission-sig",
    "paypal-transmission-time",
  ];
  const headers = headerNames.map((name) => request.headers.get(name));
  if (headers.some((value) => !value)) return false;

  // Embed the original event bytes so PayPal receives the event as posted.
  const body = `{"auth_algo":${JSON.stringify(headers[0])},"cert_url":${JSON.stringify(headers[1])},"transmission_id":${JSON.stringify(headers[2])},"transmission_sig":${JSON.stringify(headers[3])},"transmission_time":${JSON.stringify(headers[4])},"webhook_id":${JSON.stringify(requiredEnv("PAYPAL_WEBHOOK_ID"))},"webhook_event":${rawBody}}`;
  const response = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body,
  });
  if (!response.ok) throw new Error(`PayPal signature check failed (${response.status})`);
  const result = await response.json();
  return result.verification_status === "SUCCESS";
}

async function paypalOrder(orderId: string, token: string): Promise<Record<string, any> | null> {
  const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  return await response.json();
}

function paymentRecord(event: Record<string, any>, order: Record<string, any> | null) {
  const capture = event.resource;
  const purchaseUnit = order?.purchase_units?.[0];
  const payer = order?.payer ?? order?.payment_source?.paypal ?? capture?.payer;
  const payerName = [payer?.name?.given_name, payer?.name?.surname].filter(Boolean).join(" ");
  const buyerEmail = payer?.email_address ?? null;
  const itemNames = purchaseUnit?.items?.map((item: Record<string, any>) => item.name).filter(Boolean);
  const itemName = itemNames?.join(", ") || purchaseUnit?.description || capture?.description || "PayPal purchase";
  const customId = purchaseUnit?.custom_id ?? capture?.custom_id ?? "";
  const paidAt = new Date(capture?.update_time ?? capture?.create_time ?? event.create_time);
  const amount = Number(capture?.amount?.value);

  if (
    event.event_type !== "PAYMENT.CAPTURE.COMPLETED" ||
    capture?.status !== "COMPLETED" ||
    !event.id || !capture?.id || !Number.isFinite(amount) || amount <= 0 ||
    capture?.amount?.currency_code !== "USD" || Number.isNaN(paidAt.getTime())
  ) return null;

  return {
    provider: "PayPal",
    provider_order_id: capture?.supplementary_data?.related_ids?.order_id ?? order?.id ?? null,
    transaction_id: capture.id,
    source_event_id: event.id,
    order_id: /^SG-[0-9]{8}-[A-Z0-9]{4}$/.test(customId) ? customId : null,
    customer_name: payerName || null,
    contact_email: purchaseUnit?.shipping?.email_address ?? buyerEmail,
    buyer_email: buyerEmail,
    item_name: String(itemName).slice(0, 240),
    amount,
    currency: "USD",
    paid_at: paidAt.toISOString(),
    payment_status: "COMPLETED",
    status: "unfulfilled",
  };
}

async function savePayment(record: Record<string, unknown>): Promise<void> {
  const url = requiredEnv("SUPABASE_URL");
  const configuredKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  const serviceKey = configuredKeys
    ? JSON.parse(configuredKeys).default
    : requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) throw new Error("Missing Supabase secret key");
  const response = await fetch(`${url}/rest/v1/payment_records?on_conflict=transaction_id`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      ...(serviceKey.startsWith("sb_secret_") ? {} : { authorization: `Bearer ${serviceKey}` }),
      "content-type": "application/json",
      prefer: "resolution=ignore-duplicates,return=minimal",
    },
    body: JSON.stringify(record),
  });
  if (response.ok) return;
  const error = await response.json().catch(() => ({}));
  if (response.status === 409 && error.code === "23505") return;
  throw new Error(`Payment record insert failed (${response.status})`);
}

async function markLinkedOrderPaid(record: Record<string, any>): Promise<void> {
  if (!record.order_id) return;
  const url = requiredEnv("SUPABASE_URL");
  const configuredKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  const serviceKey = configuredKeys
    ? JSON.parse(configuredKeys).default
    : requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const headers = {
    apikey: serviceKey,
    ...(serviceKey.startsWith("sb_secret_") ? {} : { authorization: `Bearer ${serviceKey}` }),
    "content-type": "application/json",
  };
  const query = `id=eq.${encodeURIComponent(record.order_id)}&select=id,amount,payment_status,paypal_order_id&limit=1`;
  const lookup = await fetch(`${url}/rest/v1/orders?${query}`, { headers });
  if (!lookup.ok) throw new Error("Could not verify the website order for this PayPal capture");
  const order = (await lookup.json())[0];
  if (!order || Number(order.amount) !== Number(record.amount) || order.payment_status === "FREE") {
    throw new Error("PayPal capture did not match a payable website order");
  }
  if (order.paypal_order_id && order.paypal_order_id !== record.provider_order_id) {
    throw new Error("PayPal capture order ID did not match the website order");
  }
  const update = await fetch(`${url}/rest/v1/orders?id=eq.${encodeURIComponent(order.id)}&payment_status=in.(PENDING,COMPLETED)`, {
    method: "PATCH",
    headers: { ...headers, prefer: "return=minimal" },
    body: JSON.stringify({ payment_status: "COMPLETED", paid_at: record.paid_at }),
  });
  if (!update.ok) throw new Error("Could not update the website order after payment");
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return jsonResponse(405, { error: "Method not allowed" });
  const rawBody = await request.text();
  let event: Record<string, any>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return jsonResponse(400, { error: "Invalid JSON" });
  }

  try {
    const token = await paypalAccessToken();
    if (!await verifyWebhook(request, rawBody, token)) {
      return jsonResponse(401, { error: "Invalid PayPal signature" });
    }
    if (event.event_type !== "PAYMENT.CAPTURE.COMPLETED") {
      return jsonResponse(200, { received: true, ignored: true });
    }
    const orderId = event.resource?.supplementary_data?.related_ids?.order_id;
    const order = orderId ? await paypalOrder(orderId, token) : null;
    const record = paymentRecord(event, order);
    if (!record) return jsonResponse(422, { error: "Unsupported payment capture" });
    await markLinkedOrderPaid(record);
    await savePayment(record);
    return jsonResponse(200, { received: true });
  } catch (error) {
    console.error("PayPal webhook processing failed", error);
    return jsonResponse(500, { error: "Webhook processing failed" });
  }
});

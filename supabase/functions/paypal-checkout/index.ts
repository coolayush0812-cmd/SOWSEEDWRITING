const PAYPAL_API = "https://api-m.paypal.com";
const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

type Payload = Record<string, unknown>;
type OrderDraft = {
  id: string;
  storyType: "Personal Request" | "Book Order";
  pageLength: string;
  pageCount: number | null;
  bookTitle: string | null;
  name: string;
  email: string;
  request: string;
  amount: number;
  itemName: string;
};

const BOOK_PRICES: Record<string, number> = {
  "A Kitchen Full of History": 0,
  "Hands That Built the Morning": 11,
  "Letters from the Monsoon": 22,
  "Midnight Radio Diaries": 33,
  "Notes from a Quiet Classroom": 44,
  "Portraits of the Night Train": 55,
  "Seeds Beneath Concrete": 66,
  "The Language of Clay": 77,
  "The Memory of Rivers": 88,
  "Thirty Steps to the Sea": 99,
  "A Map of Small Kindnesses": 0,
  "Paper Boats in June": 99,
  "The Lantern at Low Tide": 110,
  "The Last Blue Bicycle": 121,
  "The Orchard After Rain": 132,
  "The Window Garden": 143,
  "When the Clockmaker Smiled": 154,
  "A Prayer Between Seasons": 0,
  "Grace in the Waiting Room": 165,
  "The Chapel of Open Doors": 176,
  "The Mustard Seed Promise": 187,
};

function json(status: number, body: Payload): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function supabaseSecret(): string {
  const configured = Deno.env.get("SUPABASE_SECRET_KEYS");
  const key = configured ? JSON.parse(configured).default : Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) throw new Error("Missing Supabase server key");
  return key;
}

async function database(path: string, init: RequestInit = {}): Promise<Response> {
  const key = supabaseSecret();
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  headers.set("content-type", "application/json");
  if (!key.startsWith("sb_secret_")) headers.set("authorization", `Bearer ${key}`);
  return await fetch(`${requiredEnv("SUPABASE_URL")}/rest/v1/${path}`, {
    ...init,
    headers,
  });
}

async function paypalAccessToken(): Promise<string> {
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      authorization: `Basic ${btoa(`${requiredEnv("PAYPAL_CLIENT_ID")}:${requiredEnv("PAYPAL_CLIENT_SECRET")}`)}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) throw new Error(`PayPal authentication failed (${response.status})`);
  const result = await response.json();
  if (!result.access_token) throw new Error("PayPal did not provide an access token");
  return result.access_token;
}

async function paypalRequest(path: string, token: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);
  headers.set("content-type", "application/json");
  return await fetch(`${PAYPAL_API}${path}`, {
    ...init,
    headers,
  });
}

function newOrderId(): string {
  const date = new Date();
  const stamp = `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const suffix = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return `SG-${stamp}-${suffix}`;
}

function validateDraft(body: Payload): OrderDraft | null {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (name.length < 1 || name.length > 120 || !/^\S+@\S+\.\S+$/.test(email) || email.length > 254) return null;

  if (body.type === "book") {
    const title = typeof body.bookTitle === "string" ? body.bookTitle : "";
    if (!Object.hasOwn(BOOK_PRICES, title)) return null;
    const amount = BOOK_PRICES[title];
    return {
      id: newOrderId(),
      storyType: "Book Order",
      pageLength: "Book",
      pageCount: null,
      bookTitle: title,
      name,
      email,
      request: `Book order: ${title}`,
      amount,
      itemName: title,
    };
  }

  if (body.type !== "personal") return null;
  const pageCount = Number(body.pageCount);
  const request = typeof body.request === "string" ? body.request.trim() : "";
  if (!Number.isInteger(pageCount) || pageCount < 10 || pageCount > 130 || request.length < 1 || request.length > 10000) return null;
  return {
    id: newOrderId(),
    storyType: "Personal Request",
    pageLength: `${pageCount} pages`,
    pageCount,
    bookTitle: null,
    name,
    email,
    request,
    amount: 11 * (Math.floor((pageCount - 10) / 11) + 1),
    itemName: "Personalised Digital Writing - Custom Order Made Writing",
  };
}

async function insertOrder(order: OrderDraft, paymentStatus: "PENDING" | "FREE"): Promise<boolean> {
  const result = await database("orders", {
    method: "POST",
    headers: { prefer: "return=minimal" },
    body: JSON.stringify({
      id: order.id,
      story_type: order.storyType,
      page_length: order.pageLength,
      page_count: order.pageCount,
      book_title: order.bookTitle,
      customer_name: order.name,
      customer_email: order.email,
      request: order.request,
      amount: order.amount,
      seed_count: null,
      payment_status: paymentStatus,
      status: "pending",
    }),
  });
  return result.ok;
}

async function setPaymentState(orderId: string, fields: Record<string, unknown>, filter = ""): Promise<boolean> {
  const result = await database(`orders?id=eq.${encodeURIComponent(orderId)}${filter}`, {
    method: "PATCH",
    headers: { prefer: "return=representation" },
    body: JSON.stringify(fields),
  });
  if (!result.ok) return false;
  return (await result.json()).length > 0;
}

function paypalPurchaseUnit(order: OrderDraft): Payload {
  const price = order.amount.toFixed(2);
  const description = order.storyType === "Book Order" ? "Original digital book" : `Personalized writing · ${order.pageLength}`;
  return {
    reference_id: order.id,
    custom_id: order.id,
    invoice_id: order.id,
    description,
    items: [{
      name: order.itemName,
      description,
      quantity: "1",
      category: "DIGITAL_GOODS",
      unit_amount: { currency_code: "USD", value: price },
    }],
    amount: {
      currency_code: "USD",
      value: price,
      breakdown: { item_total: { currency_code: "USD", value: price } },
    },
  };
}

async function createCheckout(body: Payload): Promise<Response> {
  const order = validateDraft(body);
  if (!order) return json(400, { error: "Check the customer details and order information, then try again." });

  if (order.amount === 0) {
    if (!await insertOrder(order, "FREE")) return json(502, { error: "Could not save the free book order." });
    return json(200, { orderId: order.id, free: true });
  }

  if (!await insertOrder(order, "PENDING")) return json(502, { error: "Could not start this order. Please try again." });

  try {
    const token = await paypalAccessToken();
    const created = await paypalRequest("/v2/checkout/orders", token, {
      method: "POST",
      headers: { "PayPal-Request-Id": `create-${order.id}` },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [paypalPurchaseUnit(order)],
        payment_source: { paypal: { experience_context: { shipping_preference: "NO_SHIPPING", user_action: "PAY_NOW" } } },
      }),
    });
    const result = await created.json().catch(() => ({}));
    if (!created.ok || typeof result.id !== "string") {
      await setPaymentState(order.id, { payment_status: "FAILED" });
      console.error("PayPal order creation failed", JSON.stringify({
        status: created.status,
        name: result.name,
        debugId: result.debug_id,
        issues: Array.isArray(result.details) ? result.details.map((detail: Record<string, unknown>) => detail.issue) : [],
      }));
      return json(502, { error: "PayPal could not start checkout. Please try again." });
    }
    if (!await setPaymentState(order.id, { paypal_order_id: result.id })) {
      console.error("Could not associate PayPal order with website order", order.id);
      return json(502, { error: "Checkout started but could not be linked to your order. Please contact us before retrying." });
    }
    return json(200, { id: result.id, orderId: order.id });
  } catch (error) {
    console.error("PayPal checkout creation failed", error);
    await setPaymentState(order.id, { payment_status: "FAILED" });
    return json(502, { error: "PayPal checkout is temporarily unavailable." });
  }
}

async function loadOrderForCapture(paypalOrderId: string): Promise<Record<string, any> | null> {
  const result = await database(`orders?paypal_order_id=eq.${encodeURIComponent(paypalOrderId)}&select=id,story_type,page_length,page_count,book_title,customer_name,customer_email,amount,payment_status&limit=1`);
  if (!result.ok) throw new Error("Could not verify the order");
  return (await result.json())[0] || null;
}

async function saveCaptureRecord(order: Record<string, any>, paypalOrderId: string, capture: Record<string, any>, payer: Record<string, any>): Promise<boolean> {
  const buyerName = [payer?.name?.given_name, payer?.name?.surname].filter(Boolean).join(" ") || order.customer_name;
  const buyerEmail = payer?.email_address || order.customer_email;
  const itemName = order.book_title || "Personalised Digital Writing - Custom Order Made Writing";
  const result = await database("rpc/record_paypal_capture", {
    method: "POST",
    body: JSON.stringify({ p_record: {
      provider: "PayPal",
      provider_order_id: paypalOrderId,
      transaction_id: capture.id,
      source_event_id: `checkout-${capture.id}`,
      order_id: order.id,
      customer_name: buyerName,
      contact_email: order.customer_email,
      buyer_email: buyerEmail,
      item_name: itemName,
      amount: Number(capture.amount.value),
      currency: "USD",
      paid_at: capture.update_time || new Date().toISOString(),
      payment_status: "COMPLETED",
    } }),
  });
  if (!result.ok) console.error("Could not save PayPal payment record", result.status, order.id);
  return result.ok;
}

async function captureCheckout(body: Payload): Promise<Response> {
  const paypalOrderId = typeof body.paypalOrderId === "string" ? body.paypalOrderId : "";
  if (!/^[A-Z0-9]+$/.test(paypalOrderId) || paypalOrderId.length > 30) return json(400, { error: "Invalid PayPal order." });
  try {
    const order = await loadOrderForCapture(paypalOrderId);
    if (!order) return json(404, { error: "Could not find the order for this PayPal checkout." });
    if (order.payment_status === "FREE") return json(409, { error: "This is a free order and does not require a payment." });

    const token = await paypalAccessToken();
    const orderResponse = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`, token);
    const paypalOrder = await orderResponse.json().catch(() => ({}));
    const approvedUnit = paypalOrder.purchase_units?.[0];
    const expectedAmount = Number(order.amount).toFixed(2);
    if (
      !orderResponse.ok ||
      approvedUnit?.custom_id !== order.id ||
      approvedUnit?.amount?.currency_code !== "USD" || approvedUnit?.amount?.value !== expectedAmount
    ) return json(409, { error: "The PayPal order does not match this website order." });

    let result: Record<string, any>;
    if (paypalOrder.status === "COMPLETED") {
      result = paypalOrder;
    } else if (paypalOrder.status === "APPROVED") {
      if (order.payment_status === "CANCELLED") return json(409, { error: "This checkout was cancelled. Start a new checkout to pay." });
      const captureResponse = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, token, {
        method: "POST",
        headers: { "PayPal-Request-Id": `capture-${paypalOrderId}` },
        body: "{}",
      });
      result = await captureResponse.json().catch(() => ({}));
      if (!captureResponse.ok && result.details?.[0]?.issue === "ORDER_ALREADY_CAPTURED") {
        const refreshed = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`, token);
        result = await refreshed.json().catch(() => ({}));
      } else if (!captureResponse.ok) {
        console.error("PayPal capture not completed", captureResponse.status, result.name);
        return json(402, { error: "PayPal has not confirmed this payment. No order was marked paid." });
      }
    } else {
      return json(402, { error: "Approve the PayPal payment before completing this order." });
    }
    if (result.status !== "COMPLETED") return json(402, { error: "PayPal has not confirmed this payment. No order was marked paid." });

    if (!result.purchase_units?.[0]?.payments?.captures) {
      const refreshed = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`, token);
      if (!refreshed.ok) throw new Error("Could not read the completed PayPal capture");
      result = await refreshed.json();
    }
    const unit = result.purchase_units?.[0];
    const capture = unit?.payments?.captures?.find((item: Record<string, any>) => item.status === "COMPLETED");
    if (
      !capture || capture.amount?.currency_code !== "USD" || capture.amount?.value !== expectedAmount ||
      !capture.id
    ) return json(409, { error: "The PayPal payment does not match this order. Please contact us." });

    if (!await saveCaptureRecord(order, paypalOrderId, capture, result.payer || {})) {
      return json(502, { error: "Payment was captured, but we could not save the payment record. Please contact us with your PayPal receipt." });
    }
    return json(200, { status: "COMPLETED", orderId: order.id });
  } catch (error) {
    console.error("PayPal capture failed", error);
    return json(502, { error: "Could not confirm the PayPal payment. Check your PayPal activity before trying again." });
  }
}

async function cancelCheckout(body: Payload): Promise<Response> {
  const paypalOrderId = typeof body.paypalOrderId === "string" ? body.paypalOrderId : "";
  if (!paypalOrderId) return json(400, { error: "Invalid PayPal order." });
  const result = await database(`orders?paypal_order_id=eq.${encodeURIComponent(paypalOrderId)}&payment_status=eq.PENDING`, {
    method: "PATCH",
    headers: { prefer: "return=minimal" },
    body: JSON.stringify({ payment_status: "CANCELLED" }),
  });
  return result.ok ? json(200, { cancelled: true }) : json(502, { error: "Could not update the cancelled checkout." });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json(405, { error: "Method not allowed." });
  let body: Payload;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Invalid request." });
  }
  try {
    if (body.action === "config") return json(200, { clientId: requiredEnv("PAYPAL_CLIENT_ID"), currency: "USD" });
    if (body.action === "create") return await createCheckout(body);
    if (body.action === "capture") return await captureCheckout(body);
    if (body.action === "cancel") return await cancelCheckout(body);
    return json(400, { error: "Unknown checkout action." });
  } catch (error) {
    console.error("PayPal checkout request failed", error);
    return json(500, { error: "PayPal checkout is not configured. Confirm the function secrets and database migration." });
  }
});

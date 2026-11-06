type Handler = (request: Request) => Response | Promise<Response>;
type FetchMock = (url: string, init: RequestInit) => Response | Promise<Response>;
const handlers: Record<string, Handler> = {};
const nativeServe = Deno.serve;
let loading = "";
Object.defineProperty(Deno, "serve", { configurable: true, value: (handler: Handler) => { handlers[loading] = handler; } });
for (const name of ["admin-portal", "paypal-checkout", "paypal-webhook"]) {
  loading = name;
  await import(`../supabase/functions/${name}/index.ts`);
}
Object.defineProperty(Deno, "serve", { configurable: true, value: nativeServe });
for (const [name, value] of Object.entries({
  SUPABASE_URL: "https://database.example", SUPABASE_SERVICE_ROLE_KEY: "test-server-key",
  PAYPAL_CLIENT_ID: "test-client", PAYPAL_CLIENT_SECRET: "test-secret", PAYPAL_WEBHOOK_ID: "test-webhook",
  ADMIN_PASSWORD: "test-password-only", ADMIN_SESSION_SECRET: "test-session-signing-secret-only",
})) Deno.env.set(name, value);
Deno.env.delete("SUPABASE_SECRET_KEYS");

function assert(value: unknown, message = "Assertion failed"): asserts value {
  if (!value) throw new Error(message);
}
function equal(actual: unknown, expected: unknown) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
async function withFetch(mock: FetchMock, run: () => Promise<void>) {
  const original = globalThis.fetch;
  globalThis.fetch = ((input: RequestInfo | URL, init: RequestInit = {}) => mock(String(input), init)) as typeof fetch;
  try { await run(); } finally { globalThis.fetch = original; }
}
const call = (fn: string, body: unknown, token = "") => handlers[fn](new Request("https://function.example", {
  method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify(body),
}));
const orderId = "SG-20261106-TST1";
const order = { id: orderId, amount: 11, payment_status: "PENDING", customer_name: "Test Reader", customer_email: "reader@example.com", book_title: null };
const capture = { id: "CAPTURE123", status: "COMPLETED", amount: { currency_code: "USD", value: "11.00" }, update_time: "2026-11-06T00:00:00Z" };
function paypalOrder(status = "APPROVED", amount = "11.00") {
  return { id: "PAYPAL123", status, payer: { email_address: "payer@example.com" }, purchase_units: [{
    custom_id: orderId, amount: { currency_code: "USD", value: amount },
    items: [{ name: "Personalised Digital Writing - Custom Order Made Writing" }],
    ...(status === "COMPLETED" ? { payments: { captures: [capture] } } : {}),
  }] };
}

Deno.test("admin requires its password and signed session; fulfillment uses the atomic RPC", async () => {
  const writes: unknown[] = [];
  await withFetch((url, init) => {
    if (url.includes("admin_settings?")) return json([]);
    if (url.includes("orders?")) return json([{ ...order, payment_status: "PENDING" }]);
    if (url.includes("payment_records?")) return json([]);
    if (url.endsWith("rpc/fulfill_admin_order")) { writes.push(JSON.parse(String(init.body))); return json({ id: orderId, status: "fulfilled" }); }
    throw new Error(`Unexpected request ${url}`);
  }, async () => {
    equal((await call("admin-portal", { action: "list" })).status, 401);
    equal((await call("admin-portal", { action: "login", password: "wrong" })).status, 401);
    const login = await call("admin-portal", { action: "login", password: "test-password-only" });
    equal(login.status, 200);
    const { token } = await login.json();
    assert(typeof token === "string");
    const records = await call("admin-portal", { action: "list" }, token);
    equal((await records.json()).orders[0].payment_status, "PENDING");
    equal((await call("admin-portal", { action: "list" }, token + ".extra")).status, 401);
    equal((await call("admin-portal", { action: "fulfill", kind: "order", id: orderId, fulfilledAt: new Date(Date.now() - 1000).toISOString() }, token)).status, 200);
    equal(writes.length, 1);
    equal((writes[0] as Record<string, unknown>).p_id, orderId);
    equal((await call("admin-portal", { action: "fulfill", kind: "order", id: orderId, fulfilledAt: new Date(Date.now() + 60000).toISOString() }, token)).status, 400);
  });
});

Deno.test("checkout uses server prices and exact PayPal item names for personal writing and books", async () => {
  const units: Record<string, any>[] = [];
  const rows: Record<string, any>[] = [];
  await withFetch((url, init) => {
    if (url.endsWith("/rest/v1/orders")) { rows.push(JSON.parse(String(init.body))); return new Response(null, { status: 201 }); }
    if (url.includes("/rest/v1/orders?")) return json([{}]);
    if (url.endsWith("/v1/oauth2/token")) return json({ access_token: "test-token" });
    if (url.endsWith("/v2/checkout/orders")) { units.push(JSON.parse(String(init.body)).purchase_units[0]); return json({ id: "PAYPAL123" }, 201); }
    throw new Error(`Unexpected request ${url}`);
  }, async () => {
    equal((await call("paypal-checkout", { action: "create", type: "personal", name: "Test Reader", email: "reader@example.com", request: "A story", pageCount: 130, amount: 1 })).status, 200);
    equal(units[0].items[0].name, "Personalised Digital Writing - Custom Order Made Writing");
    equal(units[0].items[0].unit_amount.value, "121.00");
    equal(units[0].amount.breakdown.item_total.value, "121.00");
    equal(rows[0].payment_status, "PENDING");
    equal((await call("paypal-checkout", { action: "create", type: "book", name: "Test Reader", email: "reader@example.com", bookTitle: "Hands That Built the Morning", amount: 1 })).status, 200);
    equal(units[1].items[0].name, "Hands That Built the Morning");
    equal(units[1].items[0].unit_amount.value, "11.00");
    equal((await call("paypal-checkout", { action: "create", type: "personal", name: "Test Reader", email: "reader@example.com", request: "A story", pageCount: 131 })).status, 400);
    equal((await call("paypal-checkout", { action: "create", type: "book", name: "Test Reader", email: "reader@example.com", bookTitle: "Unknown" })).status, 400);
  });
});

Deno.test("free book orders are persisted as FREE without calling PayPal", async () => {
  await withFetch((url, init) => {
    assert(url.endsWith("/rest/v1/orders"), "Free books must not call PayPal");
    const row = JSON.parse(String(init.body));
    equal(row.payment_status, "FREE"); equal(row.amount, 0);
    return new Response(null, { status: 201 });
  }, async () => {
    const response = await call("paypal-checkout", { action: "create", type: "book", name: "Test Reader", email: "reader@example.com", bookTitle: "A Kitchen Full of History" });
    equal(response.status, 200); equal((await response.json()).free, true);
  });
});

Deno.test("capture verifies the amount and atomically records the completed payment", async () => {
  const records: Record<string, any>[] = [];
  let mismatch = false;
  let completed = false;
  let captureCalls = 0;
  await withFetch((url, init) => {
    if (url.includes("/rest/v1/orders?")) return json([{ ...order, payment_status: completed ? "COMPLETED" : "PENDING" }]);
    if (url.endsWith("/v1/oauth2/token")) return json({ access_token: "test-token" });
    if (url.endsWith("/v2/checkout/orders/PAYPAL123")) return json(paypalOrder(completed ? "COMPLETED" : "APPROVED", mismatch ? "99.00" : "11.00"));
    if (url.endsWith("/PAYPAL123/capture")) { captureCalls++; return json(paypalOrder("COMPLETED")); }
    if (url.endsWith("/rpc/record_paypal_capture")) { records.push(JSON.parse(String(init.body)).p_record); return json({ status: "COMPLETED", orderId }); }
    throw new Error(`Unexpected request ${url}`);
  }, async () => {
    mismatch = true;
    equal((await call("paypal-checkout", { action: "capture", paypalOrderId: "PAYPAL123" })).status, 409);
    equal(records.length, 0); equal(captureCalls, 0);
    mismatch = false;
    equal((await call("paypal-checkout", { action: "capture", paypalOrderId: "PAYPAL123" })).status, 200);
    equal(records[0].transaction_id, "CAPTURE123"); equal(records[0].amount, 11);
    completed = true;
    equal((await call("paypal-checkout", { action: "capture", paypalOrderId: "PAYPAL123" })).status, 200);
    equal(captureCalls, 1); equal(records.length, 2); // RPC deduplicates retries by transaction ID.
  });
});

Deno.test("webhook rejects invalid signatures and records only verified completed captures", async () => {
  let verified = false;
  const records: Record<string, any>[] = [];
  const event = { id: "WEBHOOK123", event_type: "PAYMENT.CAPTURE.COMPLETED", resource: { ...capture, supplementary_data: { related_ids: { order_id: "PAYPAL123" } } } };
  const request = () => new Request("https://function.example", { method: "POST", headers: {
    "paypal-auth-algo": "test", "paypal-cert-url": "https://api.paypal.com/test", "paypal-transmission-id": "test", "paypal-transmission-sig": "test", "paypal-transmission-time": "test",
  }, body: JSON.stringify(event) });
  await withFetch((url, init) => {
    if (url.endsWith("/v1/oauth2/token")) return json({ access_token: "test-token" });
    if (url.endsWith("/verify-webhook-signature")) return json({ verification_status: verified ? "SUCCESS" : "FAILURE" });
    if (url.endsWith("/v2/checkout/orders/PAYPAL123")) return json(paypalOrder("COMPLETED"));
    if (url.endsWith("/rpc/record_paypal_capture")) { records.push(JSON.parse(String(init.body)).p_record); return json({ status: "COMPLETED" }); }
    throw new Error(`Unexpected request ${url}`);
  }, async () => {
    equal((await handlers["paypal-webhook"](request())).status, 401); equal(records.length, 0);
    verified = true;
    equal((await handlers["paypal-webhook"](request())).status, 200);
    equal(records[0].order_id, orderId); equal(records[0].transaction_id, "CAPTURE123");
  });
});

Deno.test("portal includes unmatched payments once and excludes unpaid orders from revenue and fulfillment", async () => {
  const source = await Deno.readTextFile(new URL("../script.js", import.meta.url));
  const admin = await Deno.readTextFile(new URL("../admin.js", import.meta.url));
  const receipt = await Deno.readTextFile(new URL("../receipt.js", import.meta.url));
  const api = new Function("document", "window", source + admin + receipt + "; return { mergeAdminOrders, recordedPaymentTotal, orderCanFulfill, buildReceiptPdf };")({ addEventListener() {} }, {});
  const paid = { ...order, created_at: "2026-11-06T00:00:00Z", payment_status: "COMPLETED", status: "pending" };
  const payment = { id: "payment1", orderId, providerOrderId: "PAYPAL123", transactionId: "CAPTURE123", paymentStatus: "COMPLETED", paidAt: "2026-11-06T00:01:00Z", amount: 11, itemName: "A story", status: "unfulfilled" };
  const orphan = { ...payment, id: "payment2", orderId: null, transactionId: "CAPTURE456", amount: 22 };
  const merged = api.mergeAdminOrders([paid, { ...paid, id: "pending", payment_status: "PENDING", amount: 99 }, { ...paid, id: "legacy", payment_status: "UNVERIFIED", amount: 77 }], [payment, orphan]);
  equal(merged.length, 4);
  equal(merged[0].transactionId, "CAPTURE123");
  equal(merged[3].recordKind, "payment");
  equal(api.recordedPaymentTotal(merged), 33);
  equal(api.orderCanFulfill(merged[1]), false);
  const pdf = new TextDecoder().decode(api.buildReceiptPdf({ ...merged[0], status: "fulfilled", fulfilledAt: "2026-11-06T00:02:00Z" }));
  assert(pdf.startsWith("%PDF-1.4")); assert(pdf.includes("CAPTURE123")); assert(pdf.includes("Total paid".toUpperCase()));
  const free = new TextDecoder().decode(api.buildReceiptPdf({ ...merged[0], amount: 0, paymentStatus: "FREE", transactionId: null, status: "fulfilled", fulfilledAt: "2026-11-06T00:02:00Z" }));
  assert(free.includes("ORDER TOTAL"));
});

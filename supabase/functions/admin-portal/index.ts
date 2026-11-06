const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const PBKDF2_ITERATIONS = 150_000;

type Payload = Record<string, unknown>;

function response(status: number, body: Payload): Response {
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

function serviceKey(): string {
  const configuredKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  const key = configuredKeys ? JSON.parse(configuredKeys).default : Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) throw new Error("Missing Supabase server key");
  return key;
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => binary += String.fromCharCode(byte));
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(base64 + "=".repeat((4 - base64.length % 4) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function hmacKey(): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(requiredEnv("ADMIN_SESSION_SECRET")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function issueToken(): Promise<string> {
  const record = await passwordRecord();
  const version = record?.changed_at || "initial";
  const payload = base64Url(new TextEncoder().encode(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS, ver: version })));
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(), new TextEncoder().encode(payload)));
  return `${payload}.${base64Url(signature)}`;
}

async function validToken(request: Request): Promise<boolean> {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return false;
    const valid = await crypto.subtle.verify("HMAC", await hmacKey(), fromBase64Url(signature), new TextEncoder().encode(payload));
    if (!valid) return false;
    const claims = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    if (Number(claims.exp) <= Math.floor(Date.now() / 1000)) return false;
    const record = await passwordRecord();
    return claims.ver === (record?.changed_at || "initial");
  } catch {
    return false;
  }
}

async function hashPassword(password: string, salt?: Uint8Array): Promise<{ salt: string; hash: string }> {
  const saltBytes = salt || crypto.getRandomValues(new Uint8Array(16));
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: saltBytes, iterations: PBKDF2_ITERATIONS }, material, 256);
  return { salt: base64Url(saltBytes), hash: base64Url(new Uint8Array(bits)) };
}

async function database(path: string, init: RequestInit = {}): Promise<Response> {
  const key = serviceKey();
  const url = `${requiredEnv("SUPABASE_URL")}/rest/v1/${path}`;
  return await fetch(url, {
    ...init,
    headers: {
      apikey: key,
      ...(key.startsWith("sb_secret_") ? {} : { authorization: `Bearer ${key}` }),
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
}

async function passwordRecord(): Promise<{ password_salt: string; password_hash: string; changed_at: string } | null> {
  const result = await database("admin_settings?id=eq.1&select=password_salt,password_hash,changed_at");
  // The shared ADMIN_PASSWORD secret remains usable when the optional password
  // settings migration has not been applied yet.
  if (result.status === 404) return null;
  if (!result.ok) throw new Error("Could not read admin settings");
  return (await result.json())[0] || null;
}

async function passwordMatches(password: string): Promise<boolean> {
  const record = await passwordRecord();
  if (!record) return password === requiredEnv("ADMIN_PASSWORD");
  const actual = await hashPassword(password, fromBase64Url(record.password_salt));
  return actual.hash === record.password_hash;
}

async function login(request: Request, body: Payload): Promise<Response> {
  const password = typeof body.password === "string" ? body.password : "";
  if (!password || password.length > 256 || !await passwordMatches(password)) return response(401, { error: "Incorrect portal password." });
  return response(200, { token: await issueToken(), expiresIn: SESSION_SECONDS });
}

async function listRecords(): Promise<Response> {
  const ordersResponse = await database("orders?select=id,created_at,story_type,page_length,page_count,book_title,customer_name,customer_email,request,amount,seed_count,status,fulfilled_at,payment_status,paid_at&payment_status=in.(COMPLETED,FREE)&order=created_at.desc&limit=1000");
  if (!ordersResponse.ok) return response(502, { error: "Could not load orders. Check that the orders migration is applied." });
  let payments: unknown[] = [];
  const paymentsResponse = await database("payment_records?select=id,order_id,provider_order_id,transaction_id,customer_name,contact_email,buyer_email,item_name,amount,paid_at,payment_status,status,fulfilled_at&order=paid_at.desc&limit=1000");
  if (paymentsResponse.ok) payments = await paymentsResponse.json();
  return response(200, { orders: await ordersResponse.json(), payments });
}

async function fulfill(body: Payload): Promise<Response> {
  const kind = body.kind === "payment" ? "payment" : body.kind === "order" ? "order" : null;
  const id = typeof body.id === "string" ? body.id : "";
  const fulfilledAt = typeof body.fulfilledAt === "string" ? new Date(body.fulfilledAt) : null;
  if (!kind || !id || !fulfilledAt || Number.isNaN(fulfilledAt.getTime()) || fulfilledAt > new Date()) {
    return response(400, { error: "Invalid fulfillment details." });
  }
  const table = kind === "payment" ? "payment_records" : "orders";
  const pendingStatus = kind === "payment" ? "unfulfilled" : "pending";
  const paymentFilter = kind === "payment" ? "&payment_status=eq.COMPLETED" : "&payment_status=in.(COMPLETED,FREE)";
  const result = await database(`${table}?id=eq.${encodeURIComponent(id)}&status=eq.${pendingStatus}${paymentFilter}`, {
    method: "PATCH",
    headers: { prefer: "return=representation" },
    body: JSON.stringify({ status: "fulfilled", fulfilled_at: fulfilledAt.toISOString() }),
  });
  if (!result.ok) return response(502, { error: "Could not save fulfillment." });
  const updated = await result.json();
  if (!updated.length) return response(409, { error: "This order is already fulfilled or could not be found." });
  return response(200, { record: updated[0] });
}

async function changePassword(request: Request, body: Payload): Promise<Response> {
  if (!await validToken(request)) return response(401, { error: "Your admin session expired. Sign in again." });
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
  if (newPassword.length < 10 || newPassword.length > 256) return response(400, { error: "Use a password with at least 10 characters." });
  if (!await passwordMatches(currentPassword)) return response(401, { error: "Current password is incorrect." });
  const hashed = await hashPassword(newPassword);
  const result = await database("admin_settings?on_conflict=id", {
    method: "POST",
    headers: { prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ id: 1, password_salt: hashed.salt, password_hash: hashed.hash, changed_at: new Date().toISOString() }),
  });
  if (!result.ok) return response(502, { error: "Could not change the portal password." });
  return response(200, { token: await issueToken(), expiresIn: SESSION_SECONDS });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return response(405, { error: "Method not allowed" });
  let body: Payload;
  try {
    body = await request.json();
  } catch {
    return response(400, { error: "Invalid JSON" });
  }

  try {
    if (body.action === "login") return await login(request, body);
    if (body.action === "change-password") return await changePassword(request, body);
    if (!await validToken(request)) return response(401, { error: "Your admin session expired. Sign in again." });
    if (body.action === "list") return await listRecords();
    if (body.action === "fulfill") return await fulfill(body);
    return response(400, { error: "Unknown admin action." });
  } catch (error) {
    console.error("Admin portal request failed", error);
    return response(500, { error: "Admin portal could not complete the request." });
  }
});

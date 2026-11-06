function assert(value: unknown, message = "Assertion failed"): asserts value {
  if (!value) throw new Error(message);
}
function equal(actual: unknown, expected: unknown) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

class ElementFixture {
  textContent = "";
  innerHTML = "";
  hidden = false;
  inert = false;
  value = "";
  isConnected = true;
  dataset: Record<string, string> = {};
  attributes: Record<string, string> = {};
  children: ElementFixture[] = [];
  listeners: Record<string, (...args: any[]) => unknown> = {};
  classes = new Set<string>();
  classList = {
    toggle: (name: string, enabled: boolean) => enabled ? this.classes.add(name) : this.classes.delete(name),
    add: (name: string) => this.classes.add(name),
    remove: (name: string) => this.classes.delete(name),
    contains: (name: string) => this.classes.has(name),
  };
  style = { setProperty(_name: string, _value: string) {} };
  constructor(public tagName = "DIV", public onFocus = (_element: ElementFixture) => {}) {}
  addEventListener(name: string, handler: (...args: any[]) => unknown) { this.listeners[name] = handler; }
  setAttribute(name: string, value: string) { this.attributes[name] = value; }
  removeAttribute(name: string) { delete this.attributes[name]; }
  closest() { return this; }
  querySelector() { return this; }
  append(child: ElementFixture) { this.children.push(child); }
  replaceChildren() { this.children = []; }
  contains(element: ElementFixture) { return this.children.includes(element); }
  focus() { this.onFocus(this); }
}

async function portalFixture(fetcher: typeof fetch = async () => new Response(JSON.stringify({ orders: [], payments: [] })), paypal?: any) {
  const elements = new Map<string, ElementFixture>();
  const timers = new Map<number, () => void>();
  let timerId = 0;
  const document: any = {
    activeElement: null,
    visibilityState: "visible",
    body: new ElementFixture(),
    listeners: new Map<string, () => void>(),
    addEventListener(name: string, handler: () => void) { this.listeners.set(name, handler); },
    querySelector(selector: string) {
      if (!elements.has(selector)) elements.set(selector, new ElementFixture("DIV", (node) => { document.activeElement = node; }));
      return elements.get(selector)!;
    },
    querySelectorAll() { return []; },
    createElement(tag: string) { return new ElementFixture(tag.toUpperCase(), (node) => { document.activeElement = node; }); },
  };
  let sdkLoads = 0;
  const window: any = { SEED_GARDEN_SUPABASE: { url: "https://database.example", publicKey: "test-public-key" } };
  document.head = { append(script: ElementFixture) {
    sdkLoads++;
    if (!paypal) throw new Error("Unexpected PayPal SDK load");
    window.paypal = paypal;
    queueMicrotask(() => script.listeners.load());
  } };
  document.querySelector("#page-count").value = "10";
  document.querySelector("#fulfill-modal").hidden = true;
  document.querySelector("#password-modal").hidden = true;
  const storage = new Map<string, string>();
  const source = await Deno.readTextFile(new URL("../script.js", import.meta.url));
  const admin = await Deno.readTextFile(new URL("../admin.js", import.meta.url));
  const receipt = await Deno.readTextFile(new URL("../receipt.js", import.meta.url));
  const api = new Function("document", "window", "setInterval", "clearInterval", "localStorage", "requestAnimationFrame", "fetch", "Option", source + admin + receipt + `;
    return { state, adminState, renderAdminCalendar, renderSelectedDay, moveCalendar, goToToday,
      renderWritingRequests, renderAdmin, showAdminDashboard, closeAdmin, showAdminLogin,
      startAdminRefresh, stopAdminRefresh, pdfLines, buildReceiptPdf, localDateKey, openAdmin,
      configureOrderForm, showOrderMode, beginCheckout, resetPaymentOptions };
  `)(document, window,
    (callback: () => void, delay: number) => { equal(delay, 60000); timers.set(++timerId, callback); return timerId; },
    (id: number) => timers.delete(id),
    { getItem: (key: string) => storage.get(key), setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) },
    (callback: () => void) => callback(), fetcher, class OptionFixture extends ElementFixture {});
  api.adminState.selectedDate = api.localDateKey(new Date());
  return { api, document, timers, sdkLoads: () => sdkLoads };
}

Deno.test("calendar handles leap days, year navigation, payment totals, and selected-day focus", async () => {
  const { api, document } = await portalFixture();
  api.adminState.calendarCursor = new Date(2028, 1, 1);
  api.adminState.selectedDate = "2028-02-29";
  const makeOrder = (id: string, paymentStatus: string, amount: number, date: string) => ({ id, name: "Test Reader", email: "reader@example.com", pageLength: "10 pages", createdAt: date, paymentStatus, amount, status: "pending" });
  api.state.orders = [makeOrder("paid", "COMPLETED", 11, "2028-02-29T12:00:00"), makeOrder("pending", "PENDING", 99, "2028-02-29T13:00:00"), makeOrder("march", "COMPLETED", 44, "2028-03-01T12:00:00")];
  const grid = document.querySelector("#calendar-grid");
  const focused = document.createElement("button"); focused.dataset.date = "2028-02-29";
  grid.append(focused); document.activeElement = focused;
  api.renderAdminCalendar(); api.renderSelectedDay();
  const days = grid.children.filter((node: ElementFixture) => node.tagName === "BUTTON");
  equal(days.length, 29);
  equal(days[28].attributes["aria-pressed"], "true");
  equal(document.activeElement, days[28]);
  assert(days[28].innerHTML.includes("$11.00"));
  equal(document.querySelector("#month-summary-total").textContent, "$11.00");
  assert(document.querySelector("#selected-day-total").textContent.includes("2 orders"));
  api.adminState.calendarCursor = new Date(2026, 11, 1); api.moveCalendar(1);
  equal(api.adminState.selectedDate, "2027-01-01");
  api.goToToday(); equal(api.adminState.selectedDate, api.localDateKey(new Date()));
});

Deno.test("all orders awaiting fulfillment can be expanded beyond the first twenty", async () => {
  const { api, document } = await portalFixture();
  api.state.orders = Array.from({ length: 25 }, (_, index) => ({ id: `order-${index}`, name: "Test Reader", email: "reader@example.com", pageLength: "10 pages", createdAt: "2026-11-06T12:00:00", paymentStatus: "FREE", amount: 0, status: "pending" }));
  api.renderWritingRequests();
  equal(document.querySelector("#requests-load-more").hidden, false);
  equal((document.querySelector("#request-list").innerHTML.match(/class="request-card"/g) || []).length, 20);
  api.adminState.requestsShown = 40; api.renderWritingRequests();
  equal(document.querySelector("#requests-load-more").hidden, true);
  equal((document.querySelector("#request-list").innerHTML.match(/class="request-card"/g) || []).length, 25);
});

Deno.test("automatic refresh has one timer and stops when the portal is closed or signed out", async () => {
  const { api, timers } = await portalFixture();
  await api.showAdminDashboard(); equal(timers.size, 1);
  api.startAdminRefresh(); equal(timers.size, 1);
  api.closeAdmin(); equal(timers.size, 0);
  await api.showAdminDashboard(); equal(timers.size, 1);
  api.showAdminLogin(); equal(timers.size, 0); equal(api.state.orders, []);
});

Deno.test("a slower previous refresh cannot replace the latest order records", async () => {
  const pending: Array<(response: Response) => void> = [];
  const fetcher = (() => new Promise<Response>((resolve) => pending.push(resolve))) as typeof fetch;
  const { api } = await portalFixture(fetcher);
  const first = api.renderAdmin(); const second = api.renderAdmin();
  equal(pending.length, 2);
  const row = (id: string) => ({ id, created_at: new Date().toISOString(), customer_name: "Test Reader", customer_email: "reader@example.com", amount: 0, payment_status: "FREE", page_length: "Book", status: "pending" });
  pending[1](new Response(JSON.stringify({ orders: [row("newest")], payments: [] }))); await second;
  pending[0](new Response(JSON.stringify({ orders: [row("older")], payments: [] }))); await first;
  equal(api.state.orders.map((record: { id: string }) => record.id), ["newest"]);
});

Deno.test("receipt fields wrap long email addresses within their column width", async () => {
  const { api } = await portalFixture();
  const lines = api.pdfLines("a".repeat(90) + "@example.com", 39);
  equal(lines.length, 2);
  assert(lines.every((line: string) => line.length <= 39));
  assert(lines[1].endsWith("..."));
});

Deno.test("Order validates first and shows payment blocks only after the SDK finishes rendering", async () => {
  let requests = 0, renders = 0;
  let finishRendering: (() => void) | undefined;
  const paypal = { Buttons: () => ({ render: () => { renders++; return new Promise<void>((resolve) => { finishRendering = resolve; }); } }) };
  const { api, document, sdkLoads } = await portalFixture((async () => { requests++; return new Response(JSON.stringify({ clientId: "test-client" })); }) as typeof fetch, paypal);
  api.configureOrderForm();
  equal(requests, 0); equal(sdkLoads(), 0);
  equal(document.querySelector("#personal-payment-options").hidden, true);
  equal(await api.beginCheckout("personal"), false); equal(requests, 0);
  document.querySelector("#name").value = "Test Reader";
  document.querySelector("#email").value = "reader@example.com";
  document.querySelector("#request").value = "A family story";
  const loading = api.beginCheckout("personal");
  equal(document.querySelector("#personal-order-button").disabled, true);
  equal(await api.beginCheckout("personal"), false);
  for (let step = 0; step < 20 && !finishRendering; step++) await Promise.resolve();
  assert(finishRendering, "PayPal render was not started");
  equal(renders, 1); equal(sdkLoads(), 1);
  assert(document.querySelector("#personal-payment-options").classList.contains("is-loading"));
  finishRendering(); equal(await loading, true);
  equal(document.querySelector("#personal-order-button").hidden, true);
  equal(document.querySelector("#personal-payment-options").hidden, false);
  assert(!document.querySelector("#personal-payment-options").classList.contains("is-loading"));
  api.resetPaymentOptions("personal");
  equal(document.querySelector("#personal-payment-options").hidden, true);
  equal(document.querySelector("#personal-order-button").hidden, false);
});

Deno.test("switching books while payment controls load cannot reveal an outdated checkout", async () => {
  let finishRendering: (() => void) | undefined;
  const paypal = { Buttons: () => ({ render: () => new Promise<void>((resolve) => { finishRendering = resolve; }) }) };
  const { api, document } = await portalFixture((async () => new Response(JSON.stringify({ clientId: "test-client" }))) as typeof fetch, paypal);
  api.configureOrderForm();
  document.querySelector("#book-select").value = "Hands That Built the Morning";
  api.showOrderMode("Hands That Built the Morning");
  document.querySelector("#book-customer-name").value = "Test Reader";
  document.querySelector("#book-customer-email").value = "reader@example.com";
  const loading = api.beginCheckout("book");
  for (let step = 0; step < 20 && !finishRendering; step++) await Promise.resolve();
  assert(finishRendering);
  document.querySelector("#book-select").value = "A Kitchen Full of History";
  api.showOrderMode("A Kitchen Full of History");
  finishRendering(); equal(await loading, false);
  equal(document.querySelector("#book-payment-options").hidden, true);
  equal(document.querySelector("#book-buy-label").textContent, "Get free ebook");
  equal(document.querySelector("#book-buy-button").hidden, false);
});

Deno.test("free book Order bypasses the PayPal SDK", async () => {
  const requests: string[] = [];
  const { api, document, sdkLoads } = await portalFixture((async (_url: unknown, init: RequestInit) => {
    requests.push(JSON.parse(String(init.body)).action);
    return new Response(JSON.stringify({ orderId: "SG-20261106-FREE", free: true }));
  }) as typeof fetch);
  api.configureOrderForm();
  document.querySelector("#admin-dashboard").hidden = true;
  document.querySelector("#book-select").value = "A Kitchen Full of History";
  api.showOrderMode("A Kitchen Full of History");
  document.querySelector("#book-customer-name").value = "Test Reader";
  document.querySelector("#book-customer-email").value = "reader@example.com";
  await document.querySelector("#book-buy-button").listeners.click();
  equal(requests, ["create"]); equal(sdkLoads(), 0);
  equal(document.querySelector("#book-payment-options").hidden, true);
});

Deno.test("admin uses the compact login mode and suppresses background payment controls", async () => {
  const { api, document } = await portalFixture();
  await api.openAdmin();
  assert(document.body.classList.contains("admin-is-open"));
  assert(document.querySelector(".admin-dialog").classList.contains("is-login"));
  await api.showAdminDashboard();
  assert(!document.querySelector(".admin-dialog").classList.contains("is-login"));
  api.closeAdmin();
  assert(!document.body.classList.contains("admin-is-open"));
});

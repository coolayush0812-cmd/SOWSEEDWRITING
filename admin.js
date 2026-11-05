const adminState = {
  payments: [],
  paymentError: null,
  requestError: null,
  selectedDate: null,
  calendarCursor: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  pendingPaymentId: null,
  returnFocus: null,
  lastFocusedElement: null,
};

function localDateKey(value) {
  const date = new Date(value);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

function adminMoney(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function adminDayLabel(key) {
  return new Date(`${key}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function adminTime(value) {
  return new Date(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function adminDateTime(value) {
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function mapPayment(row) {
  return {
    id: row.id,
    orderId: row.order_id,
    providerOrderId: row.provider_order_id,
    transactionId: row.transaction_id,
    customerName: row.customer_name,
    contactEmail: row.contact_email,
    buyerEmail: row.buyer_email,
    itemName: row.item_name,
    amount: Number(row.amount),
    paidAt: row.paid_at,
    paymentStatus: row.payment_status,
    status: row.status,
    fulfilledAt: row.fulfilled_at,
  };
}

async function loadPaymentRecords() {
  const client = requireSupabase();
  const payments = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client.from("payment_records")
      .select("id, order_id, provider_order_id, transaction_id, customer_name, contact_email, buyer_email, item_name, amount, paid_at, payment_status, status, fulfilled_at")
      .order("paid_at", { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    payments.push(...(data || []).map(mapPayment));
    if (!data || data.length < pageSize) break;
  }
  return payments;
}

function setAdminStatus(message, isError = false) {
  const status = document.querySelector("#admin-status");
  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

async function renderAdmin() {
  if (document.querySelector("#admin-dashboard").hidden) return;
  setAdminStatus("Loading payment and request records…");
  const [paymentResult, requestResult] = await Promise.allSettled([loadPaymentRecords(), loadOrders()]);

  if (paymentResult.status === "fulfilled") {
    adminState.payments = paymentResult.value;
    adminState.paymentError = null;
  } else {
    adminState.payments = [];
    adminState.paymentError = paymentResult.reason;
    console.error("Unable to load payment records", paymentResult.reason);
  }
  if (requestResult.status === "fulfilled") {
    adminState.requestError = null;
  } else {
    state.orders = [];
    adminState.requestError = requestResult.reason;
    console.error("Unable to load writing requests", requestResult.reason);
  }

  renderAdminCalendar();
  renderSelectedDay();
  renderPaymentActivity();
  renderWritingRequests();
  if (adminState.paymentError || adminState.requestError) {
    setAdminStatus("Some records could not be loaded. Check the Supabase migrations and connection.", true);
  } else {
    setAdminStatus(`Updated ${adminDateTime(new Date())}`);
  }
}

function completedPayments() {
  return adminState.payments.filter((payment) => payment.paymentStatus === "COMPLETED");
}

function renderAdminCalendar() {
  const grid = document.querySelector("#calendar-grid");
  const year = adminState.calendarCursor.getFullYear();
  const month = adminState.calendarCursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dailyTotals = new Map();

  completedPayments().forEach((payment) => {
    const key = localDateKey(payment.paidAt);
    const current = dailyTotals.get(key) || { count: 0, total: 0 };
    current.count += 1;
    current.total += payment.amount;
    dailyTotals.set(key, current);
  });

  document.querySelector("#calendar-title").textContent = adminState.calendarCursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  grid.replaceChildren();
  for (let index = 0; index < firstDay; index += 1) {
    const spacer = document.createElement("span");
    spacer.className = "calendar-spacer";
    grid.append(spacer);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const total = dailyTotals.get(key);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "calendar-day";
    button.dataset.date = key;
    button.innerHTML = `<strong>${day}</strong>${total ? `<small>${adminMoney(total.total)}</small>` : ""}`;
    button.setAttribute("aria-label", `${adminDayLabel(key)}${total ? `, ${total.count} paid order${total.count === 1 ? "" : "s"}, ${adminMoney(total.total)}` : ", no payments"}`);
    button.classList.toggle("has-orders", Boolean(total));
    button.classList.toggle("is-today", key === localDateKey(new Date()));
    button.classList.toggle("is-selected", key === adminState.selectedDate);
    grid.append(button);
  }
}

function renderPaymentCard(payment) {
  const fulfilled = payment.status === "fulfilled";
  const id = escapeHtml(payment.id);
  const fields = [
    ["Order ID", payment.orderId || payment.providerOrderId || "—"],
    ["Transaction ID", payment.transactionId],
    ["Contact email", payment.contactEmail || "—"],
    ["Item", payment.itemName],
    ["Status", fulfilled ? `Fulfilled ${adminDateTime(payment.fulfilledAt)}` : "Unfulfilled"],
  ];
  return `
    <article class="payment-card">
      <div class="payment-card-head">
        <div><strong>${escapeHtml(payment.customerName || "PayPal buyer")}</strong><small>${escapeHtml(adminTime(payment.paidAt))} · PayPal</small></div>
        <strong>${adminMoney(payment.amount)}</strong>
      </div>
      <div class="payment-fields">${fields.map(([label, value]) => `<div><small>${label}</small><span>${escapeHtml(value)}</span></div>`).join("")}</div>
      <div class="payment-actions">
        <button type="button" data-action="receipt" data-id="${id}" ${fulfilled ? "" : "disabled title=\"Available after fulfillment\""}>Download PDF</button>
        <button type="button" data-action="fulfill" data-id="${id}" ${fulfilled ? "disabled" : ""}>${fulfilled ? "✓ Fulfilled" : "Mark fulfilled"}</button>
      </div>
    </article>`;
}

function renderSelectedDay() {
  const key = adminState.selectedDate;
  const payments = completedPayments().filter((payment) => localDateKey(payment.paidAt) === key);
  const total = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const year = adminState.calendarCursor.getFullYear();
  const month = adminState.calendarCursor.getMonth();
  const monthPayments = completedPayments().filter((payment) => {
    const date = new Date(payment.paidAt);
    return date.getFullYear() === year && date.getMonth() === month;
  });
  const monthTotal = monthPayments.reduce((sum, payment) => sum + payment.amount, 0);
  document.querySelector("#selected-day-label").textContent = adminDayLabel(key);
  document.querySelector("#selected-day-total").textContent = `${payments.length} order${payments.length === 1 ? "" : "s"} · ${adminMoney(total)}`;
  document.querySelector("#selected-day-summary").textContent = adminMoney(total);
  document.querySelector("#selected-day-count").textContent = `${payments.length} payment${payments.length === 1 ? "" : "s"}`;
  document.querySelector("#month-summary-label").textContent = adminState.calendarCursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  document.querySelector("#month-summary-total").textContent = adminMoney(monthTotal);
  document.querySelector("#month-summary-count").textContent = `${monthPayments.length} payment${monthPayments.length === 1 ? "" : "s"}`;
  document.querySelector("#orders-list").innerHTML = payments.length
    ? payments.map(renderPaymentCard).join("")
    : '<div class="empty-orders">No completed payments on this date.</div>';
}

function renderPaymentActivity() {
  const payments = completedPayments();
  document.querySelector("#payment-count").textContent = payments.length;
  document.querySelector("#payment-total").textContent = adminMoney(payments.reduce((sum, payment) => sum + payment.amount, 0));
  document.querySelector("#unfulfilled-count").textContent = payments.filter((payment) => payment.status !== "fulfilled").length;
  document.querySelector("#activity-list").innerHTML = payments.length
    ? payments.slice(0, 6).map((payment) => `<button type="button" class="activity-item" data-date="${localDateKey(payment.paidAt)}"><span><strong>${escapeHtml(payment.itemName)}</strong><small>${escapeHtml(adminDateTime(payment.paidAt))}</small></span><b>${adminMoney(payment.amount)}</b></button>`).join("")
    : '<div class="empty-orders">No verified payments have been recorded yet.</div>';
}

function renderWritingRequests() {
  const linked = new Set(adminState.payments.map((payment) => payment.orderId).filter(Boolean));
  const requests = state.orders.filter((order) => !linked.has(order.id));
  document.querySelector("#request-list").innerHTML = requests.length
    ? requests.slice(0, 8).map((order) => `<article class="request-card"><div><strong>${escapeHtml(order.name)}</strong><span>${escapeHtml(order.pageLength)} · ${adminMoney(order.amount)} quoted</span></div><small>${escapeHtml(adminDateTime(order.createdAt))}</small><p>${escapeHtml(order.request)}</p></article>`).join("")
    : '<div class="empty-orders">No writing requests awaiting a matching payment.</div>';
}

function openFulfillModal(paymentId, trigger) {
  const payment = adminState.payments.find((item) => item.id === paymentId);
  if (!payment || payment.status === "fulfilled" || payment.paymentStatus !== "COMPLETED") return;
  adminState.pendingPaymentId = paymentId;
  adminState.returnFocus = trigger;
  const now = new Date();
  document.querySelector("#fulfilled-date").value = localDateKey(now);
  document.querySelector("#fulfilled-date").max = localDateKey(now);
  document.querySelector("#fulfilled-time").value = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  document.querySelector("#fulfill-error").textContent = "";
  document.querySelector("#admin-dashboard").inert = true;
  document.querySelector("#fulfill-modal").hidden = false;
  document.querySelector("#fulfilled-date").focus();
}

function closeFulfillModal(restoreFocus = true) {
  const modal = document.querySelector("#fulfill-modal");
  if (modal.hidden) return;
  modal.hidden = true;
  document.querySelector("#admin-dashboard").inert = false;
  adminState.pendingPaymentId = null;
  if (restoreFocus) (adminState.returnFocus?.isConnected ? adminState.returnFocus : document.querySelector("#admin-reload")).focus();
  adminState.returnFocus = null;
}

async function submitFulfillment(event) {
  event.preventDefault();
  const payment = adminState.payments.find((item) => item.id === adminState.pendingPaymentId);
  if (!payment) return;
  const date = document.querySelector("#fulfilled-date").value;
  const time = document.querySelector("#fulfilled-time").value;
  const fulfilledAt = new Date(`${date}T${time}:00`);
  const error = document.querySelector("#fulfill-error");
  error.textContent = "";
  if (!date || !time || Number.isNaN(fulfilledAt.getTime()) || fulfilledAt < new Date(payment.paidAt) || fulfilledAt > new Date()) {
    error.textContent = "Choose a valid date and time between the payment and now.";
    return;
  }

  const button = document.querySelector("#fulfill-confirm");
  button.disabled = true;
  button.textContent = "Saving…";
  try {
    const client = requireSupabase();
    const { data, error: updateError } = await client.from("payment_records")
      .update({ status: "fulfilled", fulfilled_at: fulfilledAt.toISOString() })
      .eq("id", payment.id).eq("status", "unfulfilled").select("id").single();
    if (updateError || !data) throw updateError || new Error("The payment could not be updated.");
    closeFulfillModal(false);
    await renderAdmin();
    document.querySelector("#admin-reload").focus();
  } catch (saveError) {
    console.error("Unable to mark payment fulfilled", saveError);
    error.textContent = "Could not save fulfillment. Please try again.";
  } finally {
    button.disabled = false;
    button.textContent = "Mark fulfilled";
  }
}

function configureAdminPortal() {
  const portal = document.querySelector("#admin-portal");
  const loginForm = document.querySelector("#admin-login-form");
  adminState.selectedDate = localDateKey(new Date());

  document.querySelector("#admin-open").addEventListener("click", openAdmin);
  document.querySelectorAll("[data-admin-close]").forEach((button) => button.addEventListener("click", closeAdmin));
  document.querySelector("#admin-reload").addEventListener("click", renderAdmin);
  document.querySelector("#admin-signout").addEventListener("click", async () => {
    if (supabaseClient) await supabaseClient.auth.signOut();
    adminState.payments = [];
    state.orders = [];
    showAdminLogin();
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.querySelector("#admin-email").value.trim().toLowerCase();
    const password = document.querySelector("#admin-password").value;
    const error = document.querySelector("#admin-login-error");
    const button = loginForm.querySelector(".admin-login-button");
    error.textContent = "";
    button.disabled = true;
    button.textContent = "Signing in…";
    try {
      const client = requireSupabase();
      const { data, error: authError } = await client.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      if (data.user?.email?.toLowerCase() !== ADMIN_EMAIL) {
        await client.auth.signOut();
        throw new Error("This account does not have admin access.");
      }
      loginForm.reset();
      await showAdminDashboard();
    } catch (authError) {
      console.error("Admin sign-in failed", authError);
      error.textContent = "Sign-in failed. Check the account and password.";
    } finally {
      button.disabled = false;
      button.textContent = "Open dashboard";
    }
  });

  document.querySelector("#calendar-prev").addEventListener("click", () => moveCalendar(-1));
  document.querySelector("#calendar-next").addEventListener("click", () => moveCalendar(1));
  document.querySelector("#calendar-grid").addEventListener("click", (event) => {
    const day = event.target.closest(".calendar-day");
    if (!day) return;
    adminState.selectedDate = day.dataset.date;
    renderAdminCalendar();
    renderSelectedDay();
  });
  document.querySelector("#activity-list").addEventListener("click", (event) => {
    const item = event.target.closest(".activity-item");
    if (!item) return;
    adminState.selectedDate = item.dataset.date;
    const date = new Date(`${item.dataset.date}T12:00:00`);
    adminState.calendarCursor = new Date(date.getFullYear(), date.getMonth(), 1);
    renderAdminCalendar();
    renderSelectedDay();
    document.querySelector("#calendar-heading").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.querySelector("#orders-list").addEventListener("click", (event) => {
    const action = event.target.closest("button[data-action]");
    if (!action || action.disabled) return;
    const payment = adminState.payments.find((item) => item.id === action.dataset.id);
    if (!payment) return;
    if (action.dataset.action === "fulfill") openFulfillModal(payment.id, action);
    if (action.dataset.action === "receipt") {
      try { downloadPaymentReceipt(payment); }
      catch (error) { console.error("Receipt download failed", error); setAdminStatus("The receipt could not be downloaded.", true); }
    }
  });
  document.querySelector("#fulfill-cancel").addEventListener("click", () => closeFulfillModal());
  document.querySelector("#fulfill-form").addEventListener("submit", submitFulfillment);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || portal.hidden) return;
    if (!document.querySelector("#fulfill-modal").hidden) closeFulfillModal();
    else closeAdmin();
  });
}

function moveCalendar(direction) {
  const date = adminState.calendarCursor;
  adminState.calendarCursor = new Date(date.getFullYear(), date.getMonth() + direction, 1);
  const selected = new Date(adminState.calendarCursor.getFullYear(), adminState.calendarCursor.getMonth(), 1);
  adminState.selectedDate = localDateKey(selected);
  renderAdminCalendar();
  renderSelectedDay();
}

async function openAdmin() {
  adminState.lastFocusedElement = document.activeElement;
  document.querySelector(".page-shell").inert = true;
  document.querySelector("#admin-portal").hidden = false;
  try {
    const { data } = supabaseClient ? await supabaseClient.auth.getSession() : { data: { session: null } };
    if (data.session?.user?.email?.toLowerCase() === ADMIN_EMAIL) {
      await showAdminDashboard();
      return;
    }
  } catch (error) {
    console.error("Unable to restore admin session", error);
  }
  showAdminLogin();
}

function closeAdmin() {
  closeFulfillModal(false);
  document.querySelector("#admin-portal").hidden = true;
  document.querySelector(".page-shell").inert = false;
  adminState.lastFocusedElement?.focus();
}

function showAdminLogin() {
  document.querySelector("#admin-login").hidden = false;
  document.querySelector("#admin-dashboard").hidden = true;
  requestAnimationFrame(() => document.querySelector("#admin-email").focus());
}

async function showAdminDashboard() {
  document.querySelector("#admin-login").hidden = true;
  document.querySelector("#admin-dashboard").hidden = false;
  await renderAdmin();
  requestAnimationFrame(() => document.querySelector("#admin-reload").focus());
}

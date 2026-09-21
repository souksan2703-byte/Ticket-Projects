// ตัวกลางเรียก backend API (Node.js/Express ที่รันอยู่ port 5000)
// เปลี่ยน URL ได้ผ่านไฟล์ .env -> VITE_API_URL

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {

  }

  if (!res.ok) {
    const message = data?.message || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return data;
}


function fromBackend(row) {
  return {
    id: row.tickid,
    name: row.Title,
    price: row.Price,
    stock: row.Stock,
    location: row.Location,
    date: row.DateEvent,
    status: row.Status?.trim(), // Status เป็น char(100) มี space ปน ต้อง trim
    description: row.Description,
    logo: row.Logo,
  };
}

function toBackend(payload) {
  return {
    title: payload.name,
    price: Number(payload.price),
    stock: Number(payload.stock),
    location: payload.location,
    dateEvent: payload.date,
    description: payload.description,
    status: payload.status,
  };
}

export async function getTickets() {
  const rows = await request("/tickets");
  return rows.map(fromBackend);
}

export async function getTicket(id) {
  const row = await request(`/tickets/${id}`);
  return fromBackend(row);
}

export async function createTicket(payload) {
  const row = await request("/tickets", {
    method: "POST",
    body: JSON.stringify(toBackend(payload)),
  });
  return fromBackend(row);
}

export async function updateTicket(id, payload) {
  const row = await request(`/tickets/${id}`, {
    method: "PUT",
    body: JSON.stringify(toBackend(payload)),
  });
  return fromBackend(row);
}

export async function toggleTicketStatus(id, status) {
  const row = await request(`/tickets/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return fromBackend(row);
}

export function deleteTicket(id) {
  return request(`/tickets/${id}`, {
    method: "DELETE",
  });
}

// ---------- Auth (Sign in) ----------

export async function login(username, password) {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data.user;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getCurrentUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

export function isLoggedIn() {
  return Boolean(getToken());
}

// ---------- Admin users ----------

export function getAdminUsers() {
  return request("/admin-users");
}

export function createAdminUser(payload) {
  return request("/admin-users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminUser(id, payload) {
  return request(`/admin-users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function resetAdminUserPassword(id, newPassword) {
  return request(`/admin-users/${id}/reset-password`, {
    method: "PATCH",
    body: JSON.stringify({ newPassword }),
  });
}

export function toggleAdminUserStatus(id, status) {
  return request(`/admin-users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function changeOwnPassword(newPassword) {
  return request("/admin-users/me/password", {
    method: "PATCH",
    body: JSON.stringify({ newPassword }),
  });
}

// ---------- Ticket codes ----------

export function getTicketCodes({ tickid, status, search } = {}) {
  const params = new URLSearchParams();
  if (tickid) params.set("tickid", tickid);
  if (status && status !== "All") params.set("status", status);
  if (search) params.set("search", search);
  const qs = params.toString();
  return request(`/ticket-codes${qs ? `?${qs}` : ""}`);
}

export function getTicketCodeStats(tickid) {
  const qs = tickid ? `?tickid=${tickid}` : "";
  return request(`/ticket-codes/stats${qs}`);
}

export function generateTicketCodes({ tickid, quantity, prefix }) {
  return request("/ticket-codes/generate", {
    method: "POST",
    body: JSON.stringify({ tickid, quantity, prefix }),
  });
}

export function markTicketCodeReceived(id) {
  return request(`/ticket-codes/${id}/receive`, {
    method: "PATCH",
  });
}

export function sellTicketCode({ tickid, owner, tranid }) {
  return request("/ticket-codes/sell", {
    method: "POST",
    body: JSON.stringify({ tickid, owner, tranid }),
  });
}

export function scanTicketCode(code) {
  return request("/ticket-codes/scan", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export function getQrCodeUrl(code) {
  return `${API_URL}/ticket-codes/qrcode/${encodeURIComponent(code)}`;
}

// ---------- Reports ----------

function buildDateParams(from, to) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  return params.toString();
}

export function getReportSummary(from, to) {
  const qs = buildDateParams(from, to);
  return request(`/reports/summary${qs ? `?${qs}` : ""}`);
}

export function getRevenueByEvent(from, to) {
  const qs = buildDateParams(from, to);
  return request(`/reports/revenue-by-event${qs ? `?${qs}` : ""}`);
}

export function getReportTransactions(from, to) {
  const qs = buildDateParams(from, to);
  return request(`/reports/transactions${qs ? `?${qs}` : ""}`);
}

// ---------- Dashboard ----------

export function getDashboardSummary() {
  return request("/dashboard/summary");
}

export function getDashboardSoldByEvent(from, to) {
  const qs = buildDateParams(from, to);
  return request(`/dashboard/sold-by-event${qs ? `?${qs}` : ""}`);
}

export function getDashboardTicketMix(from, to) {
  const qs = buildDateParams(from, to);
  return request(`/dashboard/ticket-mix${qs ? `?${qs}` : ""}`);
}

export function getDashboardTransactions(from, to) {
  const qs = buildDateParams(from, to);
  return request(`/dashboard/transactions${qs ? `?${qs}` : ""}`);
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
  }

  if (!res.ok) {
    throw new Error(data?.message || `Request failed with status ${res.status}`);
  }
  return data;
}

export function getEvents() {
  return request("/public/events");
}

export function getEvent(id) {
  return request(`/public/events/${id}`);
}

export function checkout(payload) {
  return request("/public/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getQrCodeUrl(code) {
  return `${API_URL}/ticket-codes/qrcode/${encodeURIComponent(code)}`;
}

export function getImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const baseUrl = API_URL.replace(/\/api$/, "");
  return `${baseUrl}${path}`;
}
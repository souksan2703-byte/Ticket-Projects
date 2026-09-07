// Placeholder sample data — replace with real API data later.

export const EVENTS = [
  {
    id: 1,
    name: "Sunset Music Festival",
    location: "Riverside Grounds",
    price: 690000,
    stock: 120,
    date: "Oct 4, 2026, 17:00 - 23:30",
    status: "Open",
    color: "#DC2626",
  },
  {
    id: 2,
    name: "City Marathon 5K",
    location: "Central Park Start Line",
    price: 45000,
    stock: 1800,
    date: "Oct 18, 2026, 06:00",
    status: "Open",
    color: "#F59E0B",
  },
  {
    id: 3,
    name: "Tech Conference 2026",
    location: "Grand Convention Hall",
    price: 180000,
    stock: 300,
    date: "Nov 2, 2026, 09:00",
    status: "Open",
    color: "#7C2D12",
  },
  {
    id: 4,
    name: "VIP Gala Night",
    location: "Grand Convention Hall, 3F",
    price: 3200000,
    stock: 20,
    date: "Nov 2, 2026, 19:00",
    status: "OFF",
    color: "#9CA3AF",
  },
];

export const TICKET_CODES = [
  {
    code: "SMF-4K19",
    event: "Sunset Music Festival",
    owner: "2071834821",
    txn: "TXN-20260901-0141",
    received: "Yes",
    status: "Sold",
  },
  {
    code: "SMF-4K20",
    event: "Sunset Music Festival",
    owner: "2098271644",
    txn: "TXN-20260901-0142",
    received: "No",
    status: "Sold",
  },
  {
    code: "CM5-0001",
    event: "City Marathon 5K",
    owner: "2064412098",
    txn: "—",
    received: "—",
    status: "Available",
  },
  {
    code: "CM5-0002",
    event: "City Marathon 5K",
    owner: "2077310522",
    txn: "TXN-20260828-0087",
    received: "Yes",
    status: "Used",
  },
];

export const ADMIN_USERS = [
  { name: "Nokham Vilay", username: "nokham", role: "Admin", status: "Active", last: "Today, 08:41" },
  { name: "Sengdao Phim", username: "sengdao", role: "User", status: "Active", last: "Yesterday, 20:05" },
  { name: "Vientiane Souk", username: "vsouk", role: "User", status: "Active", last: "2 days ago" },
  { name: "Ary Chanthavong", username: "arych", role: "User", status: "Disabled", last: "3 weeks ago" },
];

export const REVENUE_BY_EVENT = [
  { name: "Sunset Music Festival", value: 82800000, max: 120000000 },
  { name: "City Marathon 5K", value: 81000000, max: 120000000 },
  { name: "Tech Conference 2026", value: 54000000, max: 120000000 },
  { name: "VIP Gala Night", value: 32000000, max: 120000000 },
];

export const PIE_DATA = [
  { name: "City Marathon 5K", value: 62, color: "#2563EB" },
  { name: "Sunset Music Festival", value: 38, color: "#F97316" },
];

export const LINE_DATA = [
  { day: "Mon", event1: 12000000, event2: 8000000 },
  { day: "Tue", event1: 15000000, event2: 9500000 },
  { day: "Wed", event1: 11000000, event2: 14000000 },
  { day: "Thu", event1: 18000000, event2: 12500000 },
  { day: "Fri", event1: 21000000, event2: 17000000 },
  { day: "Sat", event1: 26000000, event2: 22000000 },
  { day: "Sun", event1: 19000000, event2: 20000000 },
];

export const currency = (n) => `${n.toLocaleString()} LAK`;

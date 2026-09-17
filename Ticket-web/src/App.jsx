import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ManageTicketsPage from "./pages/ManageTicketsPage.jsx";
import TicketCodesPage from "./pages/TicketCodesPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import AdminUsersPage from "./pages/AdminUsersPage.jsx";
import MyProfilePage from "./pages/MyProfilePage.jsx";
import { isLoggedIn, getCurrentUser, logout } from "./api.js";

// URL ของหน้าร้านลูกค้า (Ticket-store) - ตั้งค่าผ่าน .env ได้ ถ้าไม่ตั้งจะใช้ค่านี้เป็นค่าเริ่มต้น
const STORE_URL = import.meta.env.VITE_STORE_URL || "http://localhost:5174";

const PAGES = {
  dashboard: DashboardPage,
  tickets: ManageTicketsPage,
  codes: TicketCodesPage,
  reports: ReportsPage,
  users: AdminUsersPage,
  profile: MyProfilePage,
};

// หน้าที่ Admin เท่านั้นเข้าได้ (ต้องตรงกับ adminOnly ใน Sidebar.jsx)
const ADMIN_ONLY_PAGES = ["tickets", "users"];

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [checked, setChecked] = useState(false);

  // เช็คตอนโหลดหน้าเว็บครั้งแรกว่ามี token ค้างอยู่ไหม (จะได้ไม่ต้อง login ใหม่ทุกครั้งที่ refresh)
  useEffect(() => {
    if (isLoggedIn()) {
      setUser(getCurrentUser());
    }
    setChecked(true);
  }, []);

  // ถ้า login เป็น role "User" ให้เด้งออกไปที่หน้าร้าน Ticket Store ทันที ไม่ต้องเข้า Admin panel เลย
  // (ใช้ window.location.href เพราะ Ticket Store เป็นคนละแอปคนละ origin ไม่ใช่แค่ route ในแอปเดียวกัน)
  useEffect(() => {
    if (user && user.role === "User") {
      logout(); // เคลียร์ token ของฝั่ง admin ทิ้งไปด้วย เพราะ user role นี้ไม่ควรมี session ค้างอยู่ในแอปนี้
      window.location.href = STORE_URL;
    }
  }, [user]);

  function handleLogout() {
    logout();
    setUser(null);
    setPage("dashboard");
  }

  if (!checked) return null; // กันหน้าจอกระพริบตอนกำลังเช็ค token

  if (!user) {
    return <LoginPage onSignIn={setUser} />;
  }

  // ระหว่างที่กำลังจะเด้งไป Ticket Store (role User) ให้แสดงข้อความรอไว้ก่อน ไม่ต้อง render admin UI เลย
  if (user.role === "User") {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50 text-neutral-500">
        กำลังนำท่านไปที่ Ticket Store...
      </div>
    );
  }

  // กันไว้อีกชั้น เผื่อ role อื่นที่ไม่ใช่ Admin หลุดเข้ามาถึงตรงนี้ได้ (ตอนนี้เหลือแค่ Admin เท่านั้นที่ควรมาถึงจุดนี้)
  const isAdmin = user.role === "Admin";
  const safePage = ADMIN_ONLY_PAGES.includes(page) && !isAdmin ? "dashboard" : page;

  const Page = PAGES[safePage];

  return (
    // h-screen + overflow-hidden ที่ตัวนอกสุด กันไม่ให้ทั้งหน้าเลื่อนรวมกัน
    // แล้วให้ Sidebar กับ main แบ่งกันเลื่อนอิสระของใครของมันแทน
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <Sidebar page={safePage} setPage={setPage} user={user} onLogout={handleLogout} />
      <main className="h-screen flex-1 overflow-y-auto overflow-x-auto p-8">
        <Page currentUser={user} />
      </main>
    </div>
  );
}

import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ManageTicketsPage from "./pages/ManageTicketsPage.jsx";
import TicketCodesPage from "./pages/TicketCodesPage.jsx";
import ScanPage from "./pages/ScanPage.jsx";
import SellTicketPage from "./pages/SellTicketPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import AdminUsersPage from "./pages/AdminUsersPage.jsx";
import MyProfilePage from "./pages/MyProfilePage.jsx";
import { isLoggedIn, getCurrentUser, logout } from "./api.js";

const PAGES = {
  dashboard: DashboardPage,
  tickets: ManageTicketsPage,
  codes: TicketCodesPage,
  sell: SellTicketPage,
  scan: ScanPage,
  reports: ReportsPage,
  users: AdminUsersPage,
  profile: MyProfilePage,
};

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

  function handleLogout() {
    logout();
    setUser(null);
    setPage("dashboard");
  }

  if (!checked) return null; // กันหน้าจอกระพริบตอนกำลังเช็ค token

  if (!user) {
    return <LoginPage onSignIn={setUser} />;
  }

  const Page = PAGES[page];

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar page={page} setPage={setPage} user={user} onLogout={handleLogout} />
      <main className="flex-1 overflow-x-auto p-8">
        <Page currentUser={user} />
      </main>
    </div>
  );
}

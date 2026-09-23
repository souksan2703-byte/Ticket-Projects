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
import { useLanguage } from "./i18n/LanguageContext";

const STORE_URL = import.meta.env.VITE_STORE_URL || "http://localhost:5174";

const PAGES = {
  dashboard: DashboardPage,
  tickets: ManageTicketsPage,
  codes: TicketCodesPage,
  reports: ReportsPage,
  users: AdminUsersPage,
  profile: MyProfilePage,
};

const ADMIN_ONLY_PAGES = ["tickets", "users"];

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) {
      setUser(getCurrentUser());
    }
    setChecked(true);
  }, []);

  useEffect(() => {
    if (user && user.role === "User") {
      logout();
      window.location.href = STORE_URL;
    }
  }, [user]);

  function handleLogout() {
    logout();
    setUser(null);
    setPage("dashboard");
  }

  if (!checked) return null;

  if (!user) {
    return <LoginPage onSignIn={setUser} />;
  }

  if (user.role === "User") {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50 text-neutral-500">
        {t("redirectingToStore")}
      </div>
    );
  }

  const isAdmin = user.role === "Admin";
  const safePage = ADMIN_ONLY_PAGES.includes(page) && !isAdmin ? "dashboard" : page;

  const Page = PAGES[safePage];

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <Sidebar page={safePage} setPage={setPage} user={user} onLogout={handleLogout} />
      <main className="h-screen flex-1 overflow-y-auto overflow-x-auto p-8">
        <Page currentUser={user} />
      </main>
    </div>
  );
}

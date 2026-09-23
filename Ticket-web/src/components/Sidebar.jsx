import {
  LayoutDashboard,
  Ticket,
  KeyRound,
  BarChart3,
  Users,
  UserRound,
  LogOut,
} from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";

const NAV_ITEMS = [
  { key: "dashboard", labelKey: "dashboard", icon: LayoutDashboard, adminOnly: false },
  { key: "tickets", labelKey: "manageTickets", icon: Ticket, adminOnly: true },
  { key: "codes", labelKey: "ticketCodes", icon: KeyRound, adminOnly: false },
  { key: "reports", labelKey: "reports", icon: BarChart3, adminOnly: false },
  { key: "users", labelKey: "adminUsers", icon: Users, adminOnly: true },
  { key: "profile", labelKey: "myProfile", icon: UserRound, adminOnly: false },
];

export default function Sidebar({ page, setPage, user, onLogout }) {
  const { t } = useLanguage();
  const isAdmin = user?.role === "Admin";
  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-neutral-200 bg-white px-4 py-6">
      <div className="mb-4 flex items-center justify-between px-2">
        <span className="text-lg font-semibold text-neutral-900">{t("appTitle")}</span>
      </div>
      <div className="mb-4 px-2">
        <LanguageSwitcher />
      </div>
      <nav className="flex-1 space-y-1">
        {visibleItems.map(({ key, labelKey, icon: Icon }) => {
          const active = page === key;
          return (
            <button
              key={key}
              onClick={() => setPage(key)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                active
                  ? "bg-red-50 font-medium text-red-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t(labelKey)}
            </button>
          );
        })}
      </nav>

      {user && (
        <div className="mt-4 border-t border-neutral-100 pt-4">
          <div className="mb-2 px-3">
            <p className="truncate text-sm font-medium text-neutral-900">{user.name}</p>
            <p className="truncate text-xs text-neutral-500">
              {user.role === "Admin" ? t("roleAdmin") : t("roleUser")} · {user.username}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-neutral-600 transition hover:bg-neutral-50"
          >
            <LogOut className="h-4 w-4" />
            {t("logOut")}
          </button>
        </div>
      )}
    </aside>
  );
}

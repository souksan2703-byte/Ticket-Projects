import {
  LayoutDashboard,
  Ticket,
  KeyRound,
  BarChart3,
  Users,
  UserRound,
  LogOut,
  ScanLine,
  ShoppingCart,
} from "lucide-react";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "tickets", label: "Manage tickets", icon: Ticket },
  { key: "codes", label: "Ticket codes", icon: KeyRound },
  { key: "sell", label: "Sell ticket", icon: ShoppingCart },
  { key: "scan", label: "Scan ticket", icon: ScanLine },
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: "users", label: "Admin users", icon: Users },
  { key: "profile", label: "My profile", icon: UserRound },
];

export default function Sidebar({ page, setPage, user, onLogout }) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-neutral-200 bg-white px-4 py-6">
      <div className="mb-6 px-2 text-lg font-semibold text-neutral-900">Ticket admin</div>
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
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
              {label}
            </button>
          );
        })}
      </nav>

      {user && (
        <div className="mt-4 border-t border-neutral-100 pt-4">
          <div className="mb-2 px-3">
            <p className="truncate text-sm font-medium text-neutral-900">{user.name}</p>
            <p className="truncate text-xs text-neutral-500">
              {user.role} · {user.username}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-neutral-600 transition hover:bg-neutral-50"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </aside>
  );
}

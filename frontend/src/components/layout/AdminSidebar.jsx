import { NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: "📊" },
  { to: "/admin/properties", label: "Properties", icon: "🏠" },
  { to: "/admin/sales", label: "Sales", icon: "💼" },
  { to: "/admin/inquiries", label: "Inquiries", icon: "📥" },
  { to: "/admin/analytics", label: "Analytics", icon: "📈" },
  { to: "/admin/reports", label: "Reports", icon: "🗂️" },
  { to: "/admin/profile", label: "Profile", icon: "👤" },
];

export default function AdminSidebar() {
  const { logout } = useAuth();

  return (
    <aside className="flex flex-col w-64 bg-neutral-950 text-neutral-200 border-r border-neutral-800 shadow-xl">
      {/* Brand */}
      <div className="px-5 py-4 text-lg font-bold tracking-wide border-b border-neutral-800 bg-gradient-to-r from-brand-primary to-brand-green text-white shadow-md">
        GIEWELLZON
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700">
        {navItems.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-neutral-800 text-white border-l-4 border-brand-green shadow-inner"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white hover:border-l-4 hover:border-neutral-600"
              }`
            }
          >
            <span className="text-lg">{n.icon}</span>
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-neutral-800 bg-neutral-900">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md bg-brand-green hover:bg-green-700 hover:shadow-lg transition-all duration-200"
        >
          🚪 Log Out
        </button>
      </div>
    </aside>
  );
}

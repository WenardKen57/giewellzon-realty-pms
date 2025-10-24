import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import { Menu, LogOut } from "lucide-react";

export default function AdminLayout() {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = [
    { to: "/admin/dashboard", label: "Dashboard" },
    { to: "/admin/properties", label: "Properties" },
    { to: "/admin/sales", label: "Sales" },
    { to: "/admin/inquiries", label: "Inquiries" },
    { to: "/admin/reports", label: "Reports" },
    { to: "/admin/profile", label: "Profile" },
  ];

  async function onLogout() {
    await logout();
    nav("/admin/login");
  }

  return (
    <div className="min-h-screen bg-brand-light flex">
      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 transform bg-white border-r border-brand-gray flex flex-col w-64 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-center h-16 px-4 text-lg font-semibold tracking-wide text-white bg-gradient-to-r from-brand-primary to-brand-green shadow-md">
          GIEWELLZON
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-primary text-white shadow-sm"
                    : "text-neutral-800 hover:bg-brand-light hover:text-brand-primary"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-brand-gray p-4 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-brand-light rounded-full flex items-center justify-center text-brand-primary font-semibold">
              {user?.fullName?.[0] || user?.username?.[0] || "U"}
            </div>
            <div className="text-xs truncate text-neutral-600">
              {user?.fullName || user?.username || user?.email}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 text-sm font-medium text-white bg-brand-secondary hover:bg-red-700 transition rounded-md py-2"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex flex-col flex-1 min-h-screen">
        {/* Top Bar */}
        <header className="flex items-center justify-between h-16 px-4 bg-white border-b border-brand-gray shadow-sm">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-brand-primary"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={24} />
            </button>
            <h1 className="font-semibold text-brand-primary text-lg md:hidden">
              GIEWELLZON Admin
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-neutral-700">
              {user?.fullName || user?.username || user?.email}
            </span>
            <div className="w-8 h-8 bg-brand-light rounded-full flex items-center justify-center text-brand-primary font-semibold">
              {user?.fullName?.[0] || user?.username?.[0] || "U"}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 bg-brand-light">
          <div className="bg-white rounded-2xl shadow-card p-4 md:p-6 min-h-[80vh]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

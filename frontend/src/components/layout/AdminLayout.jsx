import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminLayout() {
  const nav = useNavigate();
  const { user, logout } = useAuth();

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
    <div className="min-h-screen bg-brand-light">
      <div className="grid md:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="hidden min-h-screen bg-white border-r md:flex border-brand-gray flex-col">
          {/* Brand */}
          <div className="flex items-center h-16 px-4 border-b border-brand-gray">
            <div className="text-lg font-semibold tracking-wide text-brand-primary">
              GIEWELLZON
            </div>
          </div>

          {/* Nav links (scrollable) */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-sm ${
                    isActive
                      ? "bg-brand-primary text-white"
                      : "text-neutral-800 hover:bg-brand-light"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* Sticky logout section */}
          <div className="sticky bottom-0 left-0 right-0 p-4 bg-white border-t border-brand-gray">
            <div className="mb-2 text-xs truncate text-neutral-500">
              {user?.fullName || user?.username || user?.email}
            </div>
            <button className="w-full btn btn-secondary" onClick={onLogout}>
              Logout
            </button>
          </div>
        </aside>

        {/* Content */}
        <div className="flex flex-col min-h-screen">
          {/* Topbar (also visible on mobile) */}
          <header className="flex items-center justify-between h-16 px-4 bg-white border-b border-brand-gray">
            <div className="font-semibold md:hidden text-brand-primary">
              GIEWELLZON Admin
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <span className="hidden text-sm sm:block text-neutral-600">
                {user?.fullName || user?.username || user?.email}
              </span>
            </div>
          </header>

          <main className="p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

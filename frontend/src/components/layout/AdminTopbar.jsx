import useAuth from "../../hooks/useAuth";
import { LogOut } from "lucide-react";

export default function AdminTopbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between px-6 h-14 bg-brand-primary text-white shadow-md">
      {/* Left: Title */}
      <div className="text-base font-semibold tracking-wide">
        Admin Dashboard
      </div>

      {/* Right: User Info + Logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {/* User Avatar */}
          <div className="w-8 h-8 rounded-full bg-brand-light/20 flex items-center justify-center font-semibold text-sm border border-white/20">
            {user?.fullName?.[0]?.toUpperCase() ||
              user?.username?.[0]?.toUpperCase() ||
              "U"}
          </div>

          {/* Name + Email */}
          <div className="hidden sm:block text-right">
            <div className="text-sm font-medium">
              {user?.fullName || user?.username || "Admin"}
            </div>
            <div className="text-xs text-white/80 truncate max-w-[180px]">
              {user?.email}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-1 text-sm text-white/90 hover:text-brand-gray transition"
        >
          <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

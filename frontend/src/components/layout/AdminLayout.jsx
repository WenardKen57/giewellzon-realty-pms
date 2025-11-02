import React, { useState } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import {
  Menu,
  LayoutDashboard,
  Building,
  Briefcase,
  MessageSquare,
  BarChart3,
  User,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext"; // Using the actual project hook
import logo from "../../assets/client-logo.jpeg"; // <-- new: client logo

// --- AdminSidebar Component ---
// Helper component for sidebar links with tooltips
const SidebarLink = ({ to, icon: Icon, label, isCollapsed, isActive }) => {
  return (
    <div className="relative group">
      <NavLink
        to={to}
        className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out ${
          isActive
            ? "bg-brand-primary text-white shadow-lg shadow-green-500/20" // Elevated active state
            : "text-neutral-600 hover:bg-green-50" // Subtle hover for inactive
        } ${
          isCollapsed
            ? "w-12 h-12 justify-center mx-auto"
            : "px-4 py-2.5"
        }`}
      >
        {/* Icon color now explicitly set for inactive state */}
        <Icon
          size={20}
          className={`flex-shrink-0 transition-colors ${
            isActive ? "text-white" : "text-neutral-500"
          }`}
        />
        <span
          className={`whitespace-nowrap transition-opacity ${
            isCollapsed ? "opacity-0 hidden" : "opacity-100 inline"
          }`}
        >
          {label}
        </span>
      </NavLink>
      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-neutral-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          {label}
        </span>
      )}
    </div>
  );
};

function AdminSidebar({
  sidebarOpen,
  setSidebarOpen,
  isCollapsed,
  setIsCollapsed,
  user, // user prop is still passed but not used for display here
  onLogout,
}) {
  const links = [
    {
      to: "/admin/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    { to: "/admin/properties", label: "Properties", icon: Building },
    { to: "/admin/sales", label: "Sales", icon: Briefcase },
    { to: "/admin/inquiries", label: "Inquiries", icon: MessageSquare },
    { to: "/admin/reports", label: "Reports & Analytics", icon: BarChart3 },
    { to: "/admin/profile", label: "Profile", icon: User },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen flex-col bg-white border-r border-brand-gray/60 shadow-xl rounded-r-lg transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-64"
        } ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header & Toggle */}
        <div
          className={`flex items-center h-16 border-b border-brand-gray/60 ${
            isCollapsed ? "justify-center px-2" : "justify-between px-4"
          }`}
        >
          <div
            className={`flex items-center gap-2 transition-opacity ${
              isCollapsed ? "opacity-0 hidden" : "opacity-100 flex"
            }`}
          >
            {/* Logo next to brand name (replaced building icon with actual image) */}
            <div className="w-8 h-8 overflow-hidden rounded-md">
              <img
                src={logo}
                alt="GIEWELLZON logo"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Brand text changed from gradient to solid color */}
            <span
              className="text-lg font-semibold tracking-wide text-brand-primary"
            >
              GIEWELLZON
            </span>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-full text-brand-primary hover:bg-brand-light transition-colors"
          >
            <ChevronLeft
              size={20}
              className={`transition-transform duration-300 ${
                isCollapsed ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>
        </div>

        {/* Nav Links */}
        {/* Adjusted padding and spacing for a cleaner list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {links.map((l) => (
            // Using 'end' prop for NavLink to only match exact routes
            <NavLink key={l.to} to={l.to} end>
              {({ isActive }) => (
                <SidebarLink
                  to={l.to}
                  icon={l.icon}
                  label={l.label}
                  isCollapsed={isCollapsed}
                  isActive={isActive}
                />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="border-t border-brand-gray/60 p-4 bg-white">
          {/* Updated Logout Button Style to be red by default */}
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-2 text-sm font-medium rounded-md py-2.5 transition-all duration-300 ease-in-out group ${
              isCollapsed
                ? "justify-center text-red-600 hover:bg-red-50 hover:text-red-700" // Collapsed state
                : "justify-start px-4 text-red-600 hover:bg-red-50 hover:text-red-700" // Expanded state
            }`}
          >
            {/* Icon default state is now red, darkens on hover */}
            <LogOut
              size={16}
              className={`flex-shrink-0 transition-colors text-red-600 group-hover:text-red-700`}
            />
            <span
              className={`transition-opacity ${
                isCollapsed ? "opacity-0 hidden" : "opacity-100 inline"
              }`}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}


// --- Main AdminLayout Component ---
export default function AdminLayout() {
  const nav = useNavigate();
  
  // Using the actual hook from your project context
  const { user, logout } = useAuth();
  
  // State for mobile sidebar (slide in/out)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // State for desktop sidebar (collapse/expand)
  const [isCollapsed, setIsCollapsed] = useState(false);

  async function onLogout() {
    // This will call your actual logout function from useAuth
    await logout(); 
    nav("/admin/login");
    console.log("Redirecting to /admin/login");
  }

  return (
    <div className="min-h-screen bg-brand-light flex">
      {/* --- Sidebar --- */}
      {/* We now call the AdminSidebar component defined in this same file */}
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        user={user}
        onLogout={onLogout}
      />

      {/* --- Content Area --- */}
      {/* This main content area adjusts its left margin based on sidebar state */}
      <div
        className={`flex flex-col flex-1 min-h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 bg-white border-b border-brand-gray/60 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden text-brand-primary"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            
            {/* Mobile Page Title (optional, good for context) */}
            <h1 className="font-semibold text-brand-primary text-lg md:hidden">
              GIEWELLZON Admin
            </h1>
          </div>

          {/* Top-right user info */}
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
        {/* Main content is now scrollable, independent of the fixed sidebar */}
        <main className="flex-1 p-4 md:p-6 bg-brand-light overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-card p-4 md:p-6 min-h-[calc(100vh-10rem)]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
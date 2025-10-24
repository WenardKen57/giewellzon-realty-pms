import { NavLink, Link, useLocation } from "react-router-dom";

export default function PublicNavbar() {
  const loc = useLocation();
  if (loc.pathname.startsWith("/admin")) return null;
  return (
    <header className="bg-white border-b border-green-200">
      <div className="flex items-center justify-between h-16 container-page">
        <Link
          to="/"
          className="text-lg font-semibold tracking-wide text-green-700"
        >
          GIEWELLZON
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `nav-link px-3 py-2 rounded-md transition ${
                isActive
                  ? "bg-green-100 text-green-700"
                  : "text-gray-700 hover:text-green-700"
              }`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/properties"
            className={({ isActive }) =>
              `nav-link px-3 py-2 rounded-md transition ${
                isActive
                  ? "bg-green-100 text-green-700"
                  : "text-gray-700 hover:text-green-700"
              }`
            }
          >
            Properties
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `nav-link px-3 py-2 rounded-md transition ${
                isActive
                  ? "bg-green-100 text-green-700"
                  : "text-gray-700 hover:text-green-700"
              }`
            }
          >
            About
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `nav-link px-3 py-2 rounded-md transition ${
                isActive
                  ? "bg-green-100 text-green-700"
                  : "text-gray-700 hover:text-green-700"
              }`
            }
          >
            Contact
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

import { NavLink, Link, useLocation } from "react-router-dom";

export default function PublicNavbar() {
  const loc = useLocation();
  if (loc.pathname.startsWith("/admin")) return null;

  const navLinkClasses = ({ isActive }) => {
    return (
      "relative px-4 py-3 text-sm font-medium transition-colors duration-200 ease-in-out " +
      (isActive
        ? "text-green-700"
        : "text-gray-700 hover:text-green-700") +
      " after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full" +
      " after:h-[2px] after:bg-green-600" +
      " after:transition-transform after:duration-300 after:ease-in-out after:origin-center" +
      (isActive
        ? " after:scale-x-100"
        : " after:scale-x-0 hover:after:scale-x-100")
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-between h-16 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-800"
        >
          GIEWELLZON
        </Link>
        <nav className="hidden md:flex items-center gap-2 text-sm">
          <NavLink to="/" className={navLinkClasses}>
            Home
          </NavLink>
          <NavLink to="/properties" className={navLinkClasses}>
            Properties
          </NavLink>
          <NavLink to="/about" className={navLinkClasses}>
            About
          </NavLink>
          <NavLink to="/contact" className={navLinkClasses}>
            Contact
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
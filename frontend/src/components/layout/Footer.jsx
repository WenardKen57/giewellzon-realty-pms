import { useLocation } from "react-router-dom";

export default function Footer() {
  const loc = useLocation();
  // Hide footer on all admin pages
  if (loc.pathname.startsWith("/admin")) return null;

  return (
    <footer className="mt-12 bg-brand-primary text-brand-white">
      <div className="grid gap-8 py-10 container-page md:grid-cols-4">
        <div>
          <div className="text-lg font-semibold text-white">GIEWELLZON</div>
          <p className="mt-2 text-sm text-brand-light/90">
            Your trusted partner in finding the perfect property.
          </p>
        </div>
        <div>
          <div className="mb-2 font-semibold text-white">Contact</div>
          <ul className="space-y-1 text-sm text-brand-light">
            <li>Brgy. San Isidro, Cabanatuan City, Nueva Ecija, Philippines</li>
            <li>+63 966 752 7631</li>
            <li>info@giewellzon.com</li>
          </ul>
        </div>
        <div>
          <div className="mb-2 font-semibold text-white">Quick Links</div>
          <ul className="space-y-1 text-sm text-brand-light">
            <li>
              <a href="/" className="hover:underline">
                Home
              </a>
            </li>
            <li>
              <a href="/properties" className="hover:underline">
                Properties
              </a>
            </li>
            <li>
              <a href="/about" className="hover:underline">
                About
              </a>
            </li>
            <li>
              <a href="/contact" className="hover:underline">
                Contact
              </a>
            </li>
          </ul>
        </div>
        <div>
          <div className="mb-2 font-semibold text-white">Get in Touch</div>
          <button className="text-white border-white btn btn-outline hover:bg-white hover:text-brand-primary">
            Click Here
          </button>
          <div className="mt-3 text-xs opacity-75">
            © 2025 Giewellzon Realty. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}

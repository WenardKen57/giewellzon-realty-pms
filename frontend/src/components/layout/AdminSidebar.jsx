import { NavLink } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: '📊' },
  { to: '/admin/properties', label: 'Properties', icon: '🏠' },
  { to: '/admin/sales', label: 'Sales', icon: '💼' },
  { to: '/admin/inquiries', label: 'Inquiries', icon: '📥' },
  { to: '/admin/analytics', label: 'Analytics', icon: '📈' },
  { to: '/admin/reports', label: 'Reports', icon: '🗂️' },
  { to: '/admin/profile', label: 'Profile', icon: '👤' }
];

export default function AdminSidebar() {
  const { logout } = useAuth();
  return (
    <aside className="flex flex-col w-60 bg-neutral-900 text-neutral-200">
      <div className="px-4 py-4 text-lg font-semibold border-b border-neutral-700">GIEWELLZON</div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded text-sm hover:bg-neutral-800 ${
                isActive ? 'bg-neutral-800 text-white font-medium' : ''
              }`
            }
          >
            <span>{n.icon}</span>
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-neutral-700">
        <button
          onClick={logout}
          className="w-full px-3 py-2 text-sm text-white rounded bg-brand-green hover:bg-green-700"
        >
          Log Out
        </button>
      </div>
    </aside>
  );
}
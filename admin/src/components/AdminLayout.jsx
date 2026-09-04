import { Link, NavLink, useNavigate } from 'react-router-dom';
import Icon from './ui/Icon';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Overview', icon: 'layers', end: true },
  { to: '/catalogue', label: 'Catalogue', icon: 'package' },
  { to: '/enquiries', label: 'Enquiries', icon: 'chat' },
  { to: '/bookings', label: 'Bookings', icon: 'calendar' },
  { to: '/projects', label: 'Projects', icon: 'building' },
  { to: '/payments', label: 'Payments', icon: 'rupee' },
  { to: '/users', label: 'Staff', icon: 'users' },
];

/**
 * Sidebar shell wrapped around every signed-in admin page. Mounted only by
 * AdminRoute once `user` is a confirmed, signed-in ADMIN — the pages here
 * never need to check that themselves.
 */
export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const name = user.fullName || user.email;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-brand">
          <img src="/assets/brand/logo.png" alt="Supplybase Projects logo" />
        </Link>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-foot">
          <div className="admin-user">
            <span className="admin-user-avatar">
              <Icon name="user" size={16} />
            </span>
            <div className="admin-user-info">
              <strong>{name}</strong>
              <span>Administrator</span>
            </div>
          </div>
          <button type="button" className="btn btn-outline btn-sm btn-block" onClick={handleLogout}>
            SIGN OUT
          </button>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);

  // Changing pages should always collapse the menu — including a re-click
  // of the page already open, which is why this isn't the only place it closes.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Below the sidebar's 900px breakpoint, only the hamburger controls this;
  // Escape is still the expected way out of any open overlay.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const name = user.fullName || user.email;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <Link to="/" className="admin-brand">
            <img src="/assets/brand/logo.png" alt="Supplybase Projects logo" />
          </Link>

          <button
            type="button"
            className="admin-menu-toggle"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={22} />
          </button>
        </div>

        {/* One collapsible unit on mobile — the hamburger reveals both nav
            and account actions together, same as any standard mobile menu. */}
        <div className={`admin-sidebar-menu${menuOpen ? ' open' : ''}`}>
          <nav className="admin-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMenuOpen(false)}
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
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
}

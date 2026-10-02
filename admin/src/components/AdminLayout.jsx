import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Icon from './ui/Icon';
import { useAuth } from '../context/AuthContext';
import { AttentionProvider, useAttention } from '../context/AttentionContext';
import { ToastProvider } from './admin/Toast';

const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://www.supplybase.co.in').replace(/\/$/, '');

/**
 * The sidebar, grouped by what staff are doing: the daily work first, then
 * the business records, the people, and the setup that rarely changes.
 * `badge` names a count in AttentionContext — the number of items on that
 * page waiting for someone to act.
 */
const navGroups = [
  {
    title: null,
    items: [{ to: '/', label: 'Dashboard', icon: 'dashboard', end: true }],
  },
  {
    title: 'Daily work',
    items: [
      { to: '/bookings', label: 'Bookings', icon: 'calendar', badge: 'bookingsNeedingAction', badgeHint: 'bookings waiting on you' },
      { to: '/enquiries', label: 'Enquiries', icon: 'chat', badge: 'newEnquiries', badgeHint: 'new enquiries' },
    ],
  },
  {
    title: 'Business',
    items: [
      { to: '/projects', label: 'Projects', icon: 'building' },
      { to: '/payments', label: 'Payments', icon: 'rupee' },
    ],
  },
  {
    title: 'People',
    items: [
      { to: '/partners', label: 'Partners', icon: 'helmet', badge: 'pendingPartners', badgeHint: 'applications to review' },
      { to: '/users', label: 'Users', icon: 'users' },
    ],
  },
  {
    title: 'Setup',
    items: [{ to: '/catalogue', label: 'Catalogue', icon: 'package' }],
  },
];

const allItems = navGroups.flatMap((g) => g.items);

function currentSection(pathname) {
  const match = allItems
    .filter((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to)))
    .sort((a, b) => b.to.length - a.to.length)[0];
  return match ? match.label : 'Dashboard';
}

function Shell({ children }) {
  const { user, logout } = useAuth();
  const { counts } = useAttention();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Changing pages always collapses the mobile menu.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // While the phone menu is open, the page behind it must not scroll, and
  // Escape closes it like any other overlay.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  // On a phone, tabs and filter chips are one sideways-scrolling strip; keep
  // the selected one in view (a filter picked from the dashboard may be off
  // to the right). Scrolls only the strip, never the page.
  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelectorAll('.admin-tab.active, .admin-chip.active').forEach((el) => {
        const strip = el.parentElement;
        if (strip && strip.scrollWidth > strip.clientWidth) {
          // Where the item sits inside the strip's scrollable content.
          const left = el.getBoundingClientRect().left - strip.getBoundingClientRect().left + strip.scrollLeft;
          strip.scrollLeft = Math.max(0, left - (strip.clientWidth - el.offsetWidth) / 2);
        }
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const name = user.fullName || user.email;
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="admin-shell">
      <a href="#admin-main" className="admin-skip-link">
        Skip to content
      </a>

      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <Link to="/" className="admin-brand" aria-label="Supplybase admin — dashboard">
            <img src="/assets/brand/logo.png" alt="" />
            <span>
              <strong>Supplybase</strong>
              <small>Admin console</small>
            </span>
          </Link>

          <button
            type="button"
            className="admin-menu-toggle"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="admin-sidebar-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={22} />
          </button>
        </div>

        <div id="admin-sidebar-menu" className={`admin-sidebar-menu${menuOpen ? ' open' : ''}`}>
          <nav className="admin-nav" aria-label="Admin sections">
            {navGroups.map((group) => (
              <div key={group.title || 'home'} className="admin-nav-group">
                {group.title && <span className="admin-nav-heading">{group.title}</span>}
                {group.items.map((item) => {
                  const n = item.badge && counts ? counts[item.badge] : 0;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
                    >
                      <span className="admin-nav-icon">
                        <Icon name={item.icon} size={18} />
                      </span>
                      <span className="admin-nav-label">{item.label}</span>
                      {n > 0 && (
                        <span className="admin-nav-badge" title={`${n} ${item.badgeHint}`}>
                          {n > 99 ? '99+' : n}
                          <span className="sr-only"> {item.badgeHint}</span>
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="admin-sidebar-foot">
            <div className="admin-user">
              <span className="admin-user-avatar" aria-hidden="true">
                {(name || 'A').charAt(0).toUpperCase()}
              </span>
              <div className="admin-user-info">
                <strong>{name}</strong>
                <span>Administrator</span>
              </div>
            </div>
            <button type="button" className="admin-signout" onClick={handleLogout}>
              <Icon name="logout" size={17} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Phone only (hidden by CSS on wider screens): tapping outside the open menu closes it. */}
      {menuOpen && <div className="admin-menu-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <div className="admin-main-wrap">
        <div className="admin-topbar">
          <div className="admin-crumbs">
            <span>Admin</span>
            <Icon name="chevron-right" size={14} />
            <strong>{currentSection(location.pathname)}</strong>
          </div>
          <div className="admin-topbar-right">
            <span className="admin-today">
              <Icon name="calendar" size={15} />
              {today}
            </span>
            <a className="admin-topbar-link" href={SITE_URL} target="_blank" rel="noopener noreferrer">
              View website
              <Icon name="external" size={14} />
            </a>
          </div>
        </div>

        <main id="admin-main" className="admin-main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * The frame around every signed-in admin page. Mounted only by AdminRoute once
 * `user` is a confirmed ADMIN — the pages never need to check that themselves.
 */
export default function AdminLayout({ children }) {
  return (
    <ToastProvider>
      <AttentionProvider>
        <Shell>{children}</Shell>
      </AttentionProvider>
    </ToastProvider>
  );
}

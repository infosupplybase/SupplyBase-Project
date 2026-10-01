import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import ServiceMegaMenu from './ServiceMegaMenu';
import MobileMenu from './MobileMenu';
import LocationSelector from './LocationSelector';
import NotificationBell from './NotificationBell';
import { mainNav, company } from '../../data/siteConfig';
import { useAuth } from '../../context/AuthContext';

/**
 * Navbar — sticky header with the services mega menu and mobile drawer.
 */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const initials = user?.fullName
    ? (() => {
        const parts = user.fullName.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return 'U';
        const first = parts[0][0]?.toUpperCase() || '';
        const last = parts[parts.length - 1][0]?.toUpperCase() || '';
        return `${first}${last}` || 'U';
      })()
    : 'U';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // close menus on navigation
  useEffect(() => {
    setMegaOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  // lock body scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // close the mega menu with Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMegaOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <div onMouseLeave={() => setMegaOpen(false)}>
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="header-inner">
            <Link to="/" className="brand" aria-label={`${company.name} — home`}>
              <img src="/assets/brand/logo.webp" alt={`${company.name} logo`} />
            </Link>

            <nav className="nav" aria-label="Main">
              {mainNav.map((item) =>
                item.hasMegaMenu ? (
                  <div
                    key={item.path}
                    className="has-mega"
                    onMouseEnter={() => setMegaOpen(true)}
                    style={{ display: 'inline-flex' }}
                  >
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `nav-link ${isActive ? 'active' : ''} ${megaOpen ? 'open' : ''}`
                      }
                      onClick={() => setMegaOpen(false)}
                      aria-expanded={megaOpen}
                    >
                      {item.label}
                      {/* <Icon name="chevron-down" size={15} className="nav-caret" /> */}
                    </NavLink>
                  </div>
                ) : (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onMouseEnter={() => setMegaOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                )
              )}
            </nav>

            <div className="header-actions">
              <LocationSelector />
              <NotificationBell />
              {user ? (
                <>
                  <Link to="/dashboard" className="login-btn user-logout-btn">
                    <span className="user-avatar-badge" aria-hidden="true">{initials}</span>
                    <span className="logout-label">MY ACCOUNT</span>
                  </Link>
                  <button
                    type="button"
                    className="login-btn icon-only-btn"
                    onClick={handleLogout}
                    aria-label="Log out"
                    title="Log out"
                  >
                    <Icon name="log-out" size={17} />
                  </button>
                </>
              ) : (
                <Link to="/login" className="login-btn">
                  <Icon name="user" size={17} />
                  LOGIN
                </Link>
              )}
              <button
                type="button"
                className="burger"
                aria-label="Open menu"
                onClick={() => setMobileOpen(true)}
              >
                <Icon name="menu" size={22} />
              </button>
            </div>
          </div>
        </div>

      </header>
      {/* <ServiceMegaMenu
  open={megaOpen}
  scrolled={scrolled}
  onNavigate={() => setMegaOpen(false)}
/> */}
</div>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}

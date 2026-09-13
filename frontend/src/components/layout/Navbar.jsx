import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
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
  const { user } = useAuth();

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
              <img src="/assets/brand/logo.png" alt={`${company.name} logo`} />
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
                      <Icon name="chevron-down" size={15} className="nav-caret" />
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
              <Link to={user ? '/dashboard' : '/login'} className="login-btn">
                <Icon name="user" size={17} />
                {user ? 'MY ACCOUNT' : 'LOGIN'}
              </Link>
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
      <ServiceMegaMenu
  open={megaOpen}
  scrolled={scrolled}
  onNavigate={() => setMegaOpen(false)}
/>
</div>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}

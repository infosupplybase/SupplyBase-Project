'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NavLink from './NavLink';
import Icon from '../ui/Icon';
import ServiceMegaMenu from './ServiceMegaMenu';
import MobileMenu from './MobileMenu';
import { mainNav, company } from '../../data/siteConfig';
import { useAuth } from '../../context/AuthContext';

/**
 * Navbar — sticky header with the services mega menu and mobile drawer.
 */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
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
  }, [pathname]);

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
      <header className={`header ${scrolled ? 'scrolled' : ''}`} onMouseLeave={() => setMegaOpen(false)}>
        <div className="container">
          <div className="header-inner">
            <Link href="/" className="brand" aria-label={`${company.name} — home`}>
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
                      href={item.path}
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
                    href={item.path}
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
              {/* The admin panel is a separate app (different origin), not an
                  in-app route — a plain href, not next/link's client-side
                  transition, is what actually navigates there. */}
              <a
                href={
                  user
                    ? user.role === 'ADMIN'
                      ? process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'
                      : '/dashboard'
                    : '/login'
                }
                className="login-btn"
              >
                <Icon name="user" size={17} />
                {user ? (user.role === 'ADMIN' ? 'ADMIN PANEL' : 'MY ACCOUNT') : 'LOGIN'}
              </a>
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

        <ServiceMegaMenu open={megaOpen} onNavigate={() => setMegaOpen(false)} />
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}

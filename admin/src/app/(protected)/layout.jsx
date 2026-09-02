'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import NavLink from '../../components/admin/NavLink';
import { useRouter } from 'next/navigation';
import Icon from '../../components/ui/Icon';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { href: '/', label: 'Overview', icon: 'layers', exact: true },
  { href: '/enquiries', label: 'Enquiries', icon: 'chat' },
  { href: '/bookings', label: 'Bookings', icon: 'calendar' },
  { href: '/projects', label: 'Projects', icon: 'building' },
  { href: '/payments', label: 'Payments', icon: 'rupee' },
];

/**
 * Guards every page under this route group and, once signed in, wraps it in
 * the sidebar shell. Combines what were two separate pieces on the main
 * site (AdminRoute + AdminLayout) into one layout, since this app has
 * nowhere else for a non-admin to land — a client account here just gets
 * signed out and sent to /login, not to a /dashboard that doesn't exist here.
 */
export default function ProtectedLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'ADMIN') {
      logout();
      router.replace('/login');
    }
  }, [loading, user, logout, router]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (loading || !user || user.role !== 'ADMIN') {
    return (
      <div className="admin-loading">
        <p style={{ color: 'var(--grey-500)' }}>Checking your sign-in…</p>
      </div>
    );
  }

  const name = user.fullName || user.email;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="admin-brand">
          <img src="/assets/brand/logo.png" alt="Supplybase Projects logo" />
        </Link>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} exact={item.exact} className="admin-nav-link">
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

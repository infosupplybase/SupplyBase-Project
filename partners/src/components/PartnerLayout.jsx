import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Icon from './ui/Icon';
import { useAuth } from '../context/AuthContext';
import { COMPANY_NAME, SITE_URL } from '../config';

/** "Ravi Kumar" -> "RK"; one name -> its first letter. */
const initials = (name) =>
  String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '?';

/**
 * The frame around the signed-in pages: a dark top bar with the brand, who is
 * signed in and a sign-out button that is always one tap away, and a small
 * footer that links back to the customer site. The sign-in and apply screens
 * are full-screen and sit outside this.
 */
export default function PartnerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const verified = user && user.role === 'PROFESSIONAL';

  // Only someone who has sent an application is a "partner applicant"; a
  // customer who signed in here without applying is shown as a customer.
  const [applied, setApplied] = useState(null);
  useEffect(() => {
    if (!user || user.role !== 'CUSTOMER') return undefined;
    let cancelled = false;
    api
      .application()
      .then(() => !cancelled && setApplied(true))
      .catch((err) => !cancelled && setApplied(err && err.status === 404 ? false : null));
    return () => {
      cancelled = true;
    };
  }, [user]);

  const roleLabel = verified
    ? 'Verified partner'
    : user?.role === 'ADMIN'
      ? 'Admin account'
      : applied === false
        ? 'Customer account'
        : 'Partner applicant';

  return (
    <div className="pp-app">
      <a href="#pp-main" className="skip-link">
        Skip to content
      </a>

      <header className="pp-topbar">
        <div className="container pp-topbar-inner">
          <Link to="/" className="pp-brand" aria-label={`${COMPANY_NAME} Partners — dashboard`}>
            <img src="/assets/brand/logo.png" alt="" width="51" height="38" />
            <span>Partners</span>
          </Link>

          {user && (
            <div className="pp-user">
              <span className="pp-avatar" aria-hidden="true">
                {initials(user.fullName)}
              </span>
              <span className="pp-user-text">
                <strong>{user.fullName}</strong>
                <small className={verified ? 'is-verified' : ''}>
                  {verified && <Icon name="shield" size={13} />}
                  {roleLabel}
                </small>
              </span>
              <button type="button" className="pp-signout" onClick={handleSignOut}>
                <Icon name="logout" size={18} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main id="pp-main" className="pp-content" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="pp-footer">
        <div className="container pp-footer-inner">
          <span>
            © {new Date().getFullYear()} {COMPANY_NAME}. Partner portal.
          </span>
          <a href={SITE_URL}>Supplybase website</a>
        </div>
      </footer>
    </div>
  );
}

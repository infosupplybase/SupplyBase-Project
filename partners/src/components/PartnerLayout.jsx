import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { COMPANY_NAME, SITE_URL } from '../config';

/**
 * The frame around the signed-in pages: a header with the brand and a sign-out
 * button, and a small footer that links back to the customer site. The sign-in
 * and apply screens are full-screen and sit outside this.
 */
export default function PartnerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="partner-shell">
      <header className="partner-header">
        <div className="container partner-header-inner">
          <Link to="/" className="partner-brand">
            <img src="/assets/brand/logo.png" alt={`${COMPANY_NAME} logo`} />
            <span>Partners</span>
          </Link>

          {user && (
            <div className="partner-header-user">
              <span>
                <strong>{user.fullName}</strong>
              </span>
              <button type="button" className="btn btn-outline btn-sm" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="partner-content">
        <Outlet />
      </main>

      <footer className="partner-footer">
        <div className="container partner-footer-inner">
          <span>
            © {new Date().getFullYear()} {COMPANY_NAME}. Partner portal.
          </span>
          <span>
            <a href={SITE_URL}>Supplybase website</a>
          </span>
        </div>
      </footer>
    </div>
  );
}

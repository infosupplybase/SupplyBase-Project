import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Wraps any page that should only be visible after signing in.
 * Not signed in -> sent to the login page.
 *
 * `loginPath` is where "not signed in" goes. Customer pages use the default;
 * the partner area passes '/partner/login' so a professional lands on their
 * own sign-in instead of the customer one.
 */
export default function ProtectedRoute({ children, loginPath = '/login' }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="notfound">
        <p style={{ color: 'var(--grey-500)' }}>Checking your sign-in…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  }

  return children;
}

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Layout route that lets only signed-in people through to what is nested
 * inside it. Not signed in -> the partner sign-in page.
 *
 * It checks for *a* signed-in user, not for approval: a partner whose
 * application is still under review must be able to reach their dashboard to
 * see that. What each person is shown there, and what the API lets them do, is
 * decided by their role and application status on the server.
 */
export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="partner-loading">Checking your sign-in…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

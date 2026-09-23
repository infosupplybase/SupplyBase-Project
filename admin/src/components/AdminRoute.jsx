import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminLayout from './AdminLayout';

/**
 * Guards every page under the sidebar shell and, once signed in as an admin,
 * renders the shell (AdminLayout) around the matched child route via
 * <Outlet/>. Combines what were two separate pieces on the main site
 * (ProtectedRoute + Layout) into one, since this standalone app has nowhere
 * else for a non-admin to land — a client account here just gets signed out
 * and sent to /login, not to a /dashboard that doesn't exist here.
 */
export default function AdminRoute() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const isWrongRole = !loading && Boolean(user) && user.role !== 'ADMIN';

  useEffect(() => {
    if (isWrongRole) logout();
  }, [isWrongRole, logout]);

  if (loading) {
    return (
      <div className="admin-loading">
        <p style={{ color: 'var(--grey-500)' }}>Checking your sign-in…</p>
      </div>
    );
  }

  if (!user || isWrongRole) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}

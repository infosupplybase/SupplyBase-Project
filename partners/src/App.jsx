import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import PartnerLayout from './components/PartnerLayout';
import Login from './pages/Login';
import Join from './pages/Join';
import Dashboard from './pages/Dashboard';

/**
 * ROUTES
 * /login     Partner sign in         (full screen, no header)
 * /join      Apply to become a partner (full screen, no header)
 * /          Dashboard: application status, then assigned jobs
 *
 * Only the dashboard sits behind ProtectedRoute. Whether someone is *approved*
 * is not decided here — the dashboard shows the right thing for their status,
 * and the API refuses job endpoints to anyone who is not an approved partner.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/join" element={<Join />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<PartnerLayout />}>
          <Route index element={<Dashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

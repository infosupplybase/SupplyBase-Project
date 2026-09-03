import { Routes, Route } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import AdminOverview from './pages/AdminOverview';
import AdminEnquiries from './pages/AdminEnquiries';
import AdminBookings from './pages/AdminBookings';
import AdminProjects from './pages/AdminProjects';
import AdminProjectDetail from './pages/AdminProjectDetail';
import AdminPayments from './pages/AdminPayments';

/**
 * ROUTES
 * /login                Staff sign in (no sidebar)
 * /                     Overview — counts and quick links
 * /enquiries            Quote/contact form leads
 * /bookings             Site visit and project bookings
 * /projects             Client projects list + create
 * /projects/:id         One project — stages, status
 * /payments             Advances/milestones/invoices
 *
 * Everything except /login sits behind AdminRoute, which both guards
 * (ADMIN role required) and supplies the sidebar shell as a layout route.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AdminRoute />}>
        <Route index element={<AdminOverview />} />
        <Route path="enquiries" element={<AdminEnquiries />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="projects" element={<AdminProjects />} />
        <Route path="projects/:id" element={<AdminProjectDetail />} />
        <Route path="payments" element={<AdminPayments />} />
      </Route>
    </Routes>
  );
}

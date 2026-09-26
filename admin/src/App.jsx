import { Routes, Route, Navigate } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import AdminOverview from './pages/AdminOverview';
import AdminCatalogue from './pages/AdminCatalogue';
import AdminEnquiries from './pages/AdminEnquiries';
import AdminBookings from './pages/AdminBookings';
import AdminProjects from './pages/AdminProjects';
import AdminProjectDetail from './pages/AdminProjectDetail';
import AdminPayments from './pages/AdminPayments';
import AdminUsers from './pages/AdminUsers';
import AdminPartners from './pages/AdminPartners';

/**
 * ROUTES
 * /login                Staff sign in (no sidebar)
 * /                     Dashboard — what needs doing, today's visits, totals
 * /catalogue            Service categories + their booking-wizard questions
 * /enquiries            Quote/contact form leads
 * /bookings             Site visit and project bookings
 * /projects             Client projects list + create
 * /projects/:id         One project — stages, status
 * /payments             Advances/milestones/invoices
 * /partners             Professionals: applications, approval, and their jobs
 * /users                Every account — role and enabled status
 * anything else         Redirects to the dashboard
 *
 * Lists keep their filters in the URL (?status=, ?q=, ?page=, ?open=<id>),
 * so the dashboard can link straight to a filtered list or one record.
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
        <Route path="catalogue" element={<AdminCatalogue />} />
        <Route path="enquiries" element={<AdminEnquiries />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="projects" element={<AdminProjects />} />
        <Route path="projects/:id" element={<AdminProjectDetail />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="partners" element={<AdminPartners />} />
        <Route path="users" element={<AdminUsers />} />
        {/* Anything else signed in goes to the dashboard, not a blank page. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

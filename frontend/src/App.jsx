import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Home from './pages/Home';
import Services from './pages/Services';
import ServiceBooking from './pages/ServiceBooking';
import Projects from './pages/Projects';
import Materials from './pages/Materials';
import Book from './pages/Book';
import ProjectDetail from './pages/ProjectDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import Quote from './pages/Quote';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import { PrivacyPolicy, Terms } from './pages/Legal';

/**
 * ROUTES
 * /                       Home
 * /services               All services
 * /services/:slug         Book a site visit for one of the four services
 * /booking/:slug          Same booking page, reached from the hero banners
 * /projects               Projects with category filter
 * /projects/:slug         Project detail
 * /materials              Materials and brands we use
 * /book                   Book a site visit (?type=service | ?type=project)
 * /about                  About us
 * /contact                Contact
 * /quote                  Get a quote  (?service=<slug> pre-selects a service)
 * /login                  Sign in       (no header/footer)
 * /register               Create account (same page, other tab)
 * /dashboard              Client account page — only visible once signed in
 * /privacy-policy, /terms Legal pages
 */
export default function App() {
  return (
    <Routes>
      {/* the account page sits outside the main layout — full-screen split page.
          both paths render it; the tab that opens is taken from the URL. */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Login />} />

      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="services" element={<Services />} />

        {/* Old catalogue slugs, renamed when the backend categories were
            aligned with the marketing site (see V9 migration). Kept as
            redirects so any bookmarked or previously-shared link still
            lands on the real page instead of "service not found". */}
        <Route path="services/painting-waterproofing" element={<Navigate to="/services/painting" replace />} />
        <Route path="services/electrician" element={<Navigate to="/services/electrical" replace />} />
        <Route path="services/interior-work" element={<Navigate to="/services/interior-design" replace />} />
        <Route path="booking/painting-waterproofing" element={<Navigate to="/services/painting" replace />} />
        <Route path="booking/electrician" element={<Navigate to="/services/electrical" replace />} />
        <Route path="booking/interior-work" element={<Navigate to="/services/interior-design" replace />} />

        <Route path="services/:slug" element={<ServiceBooking />} />
        {/* The hero banners link to /booking/<slug>; same page, second door. */}
        <Route path="booking/:slug" element={<ServiceBooking />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:slug" element={<ProjectDetail />} />
        <Route path="materials" element={<Materials />} />
        <Route path="book" element={<Book />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="quote" element={<Quote />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="privacy-policy" element={<PrivacyPolicy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

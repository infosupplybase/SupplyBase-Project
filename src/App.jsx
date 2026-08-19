import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Home from './pages/Home';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Projects from './pages/Projects';
import Materials from './pages/Materials';
import ProjectDetail from './pages/ProjectDetail';
import About from './pages/About';
import WhyUs from './pages/WhyUs';
import Contact from './pages/Contact';
import Quote from './pages/Quote';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import { PrivacyPolicy, Terms } from './pages/Legal';

/**
 * ROUTES
 * /                       Home
 * /services               All services
 * /services/:slug         Service detail (one template, 11 services)
 * /projects               Projects with category filter
 * /projects/:slug         Project detail
 * /materials              Materials and brands we use
 * /about                  About us
 * /why-us                 Why us
 * /contact                Contact
 * /quote                  Get a quote  (?service=<slug> pre-selects a service)
 * /login                  Login (no header/footer)
 * /register               Create an account (no header/footer)
 * /dashboard              Client account page — only visible once signed in
 * /privacy-policy, /terms Legal pages
 */
export default function App() {
  return (
    <Routes>
      {/* login and register sit outside the main layout — full-screen split pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="services" element={<Services />} />
        <Route path="services/:slug" element={<ServiceDetail />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:slug" element={<ProjectDetail />} />
        <Route path="materials" element={<Materials />} />
        <Route path="about" element={<About />} />
        <Route path="why-us" element={<WhyUs />} />
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

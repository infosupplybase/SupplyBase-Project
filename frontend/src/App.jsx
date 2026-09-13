import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Home from './pages/Home';
import Services from './pages/Services';
import ServiceBooking from './pages/ServiceBooking';
import Projects from './pages/Projects';
import Materials from './pages/Materials';
import Book from './pages/Book';
import InteriorByChoice from './pages/InteriorByChoice';
import InteriorSpaceGallery from './pages/InteriorSpaceGallery';
import InteriorDesignDetail from './pages/InteriorDesignDetail';
import InteriorBooking from './pages/InteriorBooking';
import ElectricalCategory from './pages/ElectricalCategory';
import ElectricianService from './pages/ElectricianService';
import OtherServicesCategory from './pages/OtherServicesCategory';
import ProjectDetail from './pages/ProjectDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import Quote from './pages/Quote';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import { PrivacyPolicy, Terms } from './pages/Legal';

export default function App() {
  return (
    <Routes>
      {/* Login/Register sit outside the main layout */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Login />} />

      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="services" element={<Services />} />

        {/* ---------- Legacy URL redirects ---------- */}
        <Route path="services/painting-waterproofing" element={<Navigate to="/services/painting" replace />} />
        <Route path="services/electrician" element={<Navigate to="/services/electrical" replace />} />
        <Route path="services/interior-work" element={<Navigate to="/services/interior-design" replace />} />
        <Route path="services/pop-false-ceiling" element={<Navigate to="/services/pop-ceiling-design" replace />} />
        <Route path="booking/painting-waterproofing" element={<Navigate to="/services/painting" replace />} />
        <Route path="booking/electrician" element={<Navigate to="/services/electrical" replace />} />
        <Route path="booking/interior-work" element={<Navigate to="/services/interior-design" replace />} />

        {/* ---------- Interior by Choice redirects ---------- */}
        {/* Both /services/interior-by-choice AND /services/interior-design
            redirect to the richer catalogue page. This must come BEFORE
            the wildcard services/:slug route below. */}
        <Route path="services/interior-by-choice" element={<Navigate to="/interior-by-choice" replace />} />
        <Route path="services/interior-design" element={<Navigate to="/interior-by-choice" replace />} />

        {/* ---------- Electrical: category list + sub-service pages ---------- */}
        {/* Must be BEFORE services/:slug wildcard */}
        <Route path="services/electrical" element={<ElectricalCategory />} />
        <Route path="services/electric" element={<ElectricalCategory />} />
        <Route path="services/electrical/:subSlug" element={<ElectricianService />} />

        {/* ---------- Other Services: category list ---------- */}
        {/* Must be BEFORE services/:slug wildcard */}
        <Route path="services/other-services" element={<OtherServicesCategory />} />

        {/* ---------- Generic service page (booking form) ---------- */}
        {/* Handles: painting, waterproofing, plumbing, pop-ceiling-design */}
        {/* These already show the correct service landing pages */}
        <Route path="services/:slug" element={<ServiceBooking />} />
        <Route path="booking/:slug" element={<ServiceBooking />} />

        {/* ---------- Projects & Materials ---------- */}
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:slug" element={<ProjectDetail />} />
        <Route path="materials" element={<Materials />} />
        <Route path="book" element={<Book />} />

        {/* ---------- Interior by Choice (full catalogue tree) ---------- */}
        <Route path="interior-by-choice" element={<InteriorByChoice />} />
        <Route path="interior-by-choice/book" element={<InteriorBooking />} />
        <Route path="interior-by-choice/:spaceSlug" element={<InteriorSpaceGallery />} />
        <Route path="interior-by-choice/:spaceSlug/:designSlug" element={<InteriorDesignDetail />} />
        <Route path="interior-by-choice/:spaceSlug/:designSlug/book" element={<InteriorBooking />} />

        {/* ---------- Static pages ---------- */}
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
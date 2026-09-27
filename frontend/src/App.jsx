import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Home from './pages/Home';
import Services from './pages/Services';
import ServiceBooking from './pages/ServiceBooking';

// Projects and Materials sections are disabled sitewide
// import Projects from './pages/Projects';
// import Materials from './pages/Materials';

import InteriorByChoice from './pages/InteriorByChoice';
import InteriorSpaceGallery from './pages/InteriorSpaceGallery';
import InteriorDesignDetail from './pages/InteriorDesignDetail';
import InteriorBooking from './pages/InteriorBooking';

import ElectricalCategory from './pages/ElectricalCategory';
import ElectricianService from './pages/ElectricianService';
import OtherServicesCategory from './pages/OtherServicesCategory';

import PlumbingCategory from './pages/PlumbingCategory';
import PlumbingTab from './pages/PlumbingTab';
import PlumbingConsultationList from './pages/PlumbingConsultationList';
import PlumbingConsultationBook from './pages/PlumbingConsultationBook';
import PlumbingCart from './pages/PlumbingCart';
import PlumbingCheckout from './pages/PlumbingCheckout';

import PaintingCategory from './pages/PaintingCategory';
import PaintingFlow from './pages/PaintingFlow';

import PopCeilingCategory from './pages/PopCeilingCategory';
import PopCeilingFlow from './pages/PopCeilingFlow';

import WaterproofingCategory from './pages/WaterproofingCategory';
import WaterproofingBathroom from './pages/WaterproofingBathroom';
import WaterproofingFlow from './pages/WaterproofingFlow';

import InteriorDesignCategory from './pages/InteriorDesignCategory';
import InteriorDesignCatalogue from './pages/InteriorDesignCatalogue';
import InteriorDesignFlow from './pages/InteriorDesignFlow';

import About from './pages/About';
import Contact from './pages/Contact';
import Quote from './pages/Quote';
import Login from './pages/Login';

import MyBookings from './pages/MyBookings';
import BookingDetail from './pages/BookingDetail';
import Profile from './pages/Profile';

import PartnerRedirect from './pages/PartnerRedirect';
import NotFound from './pages/NotFound';
import { PrivacyPolicy, Terms } from './pages/Legal';

/**
 * ROUTES
 *
 * PUBLIC:
 * /                       Home
 * /services               All services
 * /services/electrical    Electrical category
 * /services/plumbing      Plumbing category
 * /services/painting      Painting category
 * /services/pop-ceiling-design
 * /services/waterproofing
 * /services/interior-design
 * /interior-by-choice
 * /about
 * /contact
 * /quote
 *
 * PROTECTED / LOGIN REQUIRED:
 * /services/:slug
 * /booking/:slug
 * /services/electrical/:subSlug
 * /services/plumbing/checkout
 * /services/plumbing/consultation/:typeSlug
 * /services/painting/:flowSlug
 * /services/pop-ceiling-design/:flowSlug
 * /services/waterproofing/:flowSlug
 * /services/interior-design/:categorySlug/:projectSlug
 * /interior-by-choice/book
 * /interior-by-choice/:spaceSlug/:designSlug/book
 *
 * ACCOUNT:
 * /dashboard
 * /dashboard/bookings
 * /dashboard/bookings/:id
 * /dashboard/profile
 *
 * AUTH:
 * /login
 * /register
 */

export default function App() {
  return (
    <Routes>

      {/* =========================================================
          AUTHENTICATION
          ========================================================= */}

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Login />} />

      {/* =========================================================
          PARTNER APP
          ========================================================= */}

      <Route
        path="/partner/*"
        element={<PartnerRedirect />}
      />

      {/* =========================================================
          MAIN WEBSITE
          ========================================================= */}

      <Route element={<Layout />}>

        {/* =======================================================
            HOME
            ======================================================= */}

        <Route index element={<Home />} />

        {/* =======================================================
            SERVICES - PUBLIC
            Users can browse services without logging in.
            ======================================================= */}

        <Route
          path="services"
          element={<Services />}
        />

        {/* =======================================================
            OLD / LEGACY SERVICE REDIRECTS
            ======================================================= */}

        <Route
          path="services/painting-waterproofing"
          element={
            <Navigate
              to="/services/painting"
              replace
            />
          }
        />

        <Route
          path="services/electrician"
          element={
            <Navigate
              to="/services/electrical"
              replace
            />
          }
        />

        <Route
          path="services/interior-work"
          element={
            <Navigate
              to="/services/interior-design"
              replace
            />
          }
        />

        <Route
          path="services/pop-false-ceiling"
          element={
            <Navigate
              to="/services/pop-ceiling-design"
              replace
            />
          }
        />

        <Route
          path="booking/painting-waterproofing"
          element={
            <Navigate
              to="/services/painting"
              replace
            />
          }
        />

        <Route
          path="booking/electrician"
          element={
            <Navigate
              to="/services/electrical"
              replace
            />
          }
        />

        <Route
          path="booking/interior-work"
          element={
            <Navigate
              to="/services/interior-design"
              replace
            />
          }
        />

        {/* =======================================================
            INTERIOR BY CHOICE REDIRECT
            ======================================================= */}

        <Route
          path="services/interior-by-choice"
          element={
            <Navigate
              to="/interior-by-choice"
              replace
            />
          }
        />

        {/* =======================================================
            ELECTRICAL SERVICES
            Category is PUBLIC.
            Actual booking journey is PROTECTED.
            ======================================================= */}

        <Route
          path="services/electrical"
          element={<ElectricalCategory />}
        />

        <Route
          path="services/electric"
          element={<ElectricalCategory />}
        />

        <Route
          path="services/electrical/:subSlug"
          element={
            <ProtectedRoute>
              <ElectricianService />
            </ProtectedRoute>
          }
        />

        {/* =======================================================
            OTHER SERVICES
            Category is PUBLIC.
            ======================================================= */}

        <Route
          path="services/other-services"
          element={<OtherServicesCategory />}
        />

        {/* =======================================================
            PLUMBING SERVICES
            ======================================================= */}

        {/* Public category */}
        <Route
          path="services/plumbing"
          element={<PlumbingCategory />}
        />

        {/* Public cart - user can add/remove items */}
        <Route
          path="services/plumbing/cart"
          element={<PlumbingCart />}
        />

        {/* Login required before checkout */}
        <Route
          path="services/plumbing/checkout"
          element={
            <ProtectedRoute>
              <PlumbingCheckout />
            </ProtectedRoute>
          }
        />

        {/* Public consultation list */}
        <Route
          path="services/plumbing/consultation"
          element={<PlumbingConsultationList />}
        />

        {/* Login required to actually book consultation */}
        <Route
          path="services/plumbing/consultation/:typeSlug"
          element={
            <ProtectedRoute>
              <PlumbingConsultationBook />
            </ProtectedRoute>
          }
        />

        {/* Public plumbing service/item list */}
        <Route
          path="services/plumbing/:tabSlug"
          element={<PlumbingTab />}
        />

        {/* =======================================================
            PAINTING SERVICES
            ======================================================= */}

        {/* Public category */}
        <Route
          path="services/painting"
          element={<PaintingCategory />}
        />

        {/* Login required for booking journey */}
        <Route
          path="services/painting/:flowSlug"
          element={
            <ProtectedRoute>
              <PaintingFlow />
            </ProtectedRoute>
          }
        />

        {/* =======================================================
            POP CEILING & DESIGN
            ======================================================= */}

        {/* Public category */}
        <Route
          path="services/pop-ceiling-design"
          element={<PopCeilingCategory />}
        />

        {/* Login required for detailed booking */}
        <Route
          path="services/pop-ceiling-design/:flowSlug"
          element={
            <ProtectedRoute>
              <PopCeilingFlow />
            </ProtectedRoute>
          }
        />

        {/* =======================================================
            WATERPROOFING
            ======================================================= */}

        {/* Public category */}
        <Route
          path="services/waterproofing"
          element={<WaterproofingCategory />}
        />

        {/* Public bathroom category */}
        <Route
          path="services/waterproofing/bathroom"
          element={<WaterproofingBathroom />}
        />

        {/* Login required for actual booking flow */}
        <Route
          path="services/waterproofing/:flowSlug"
          element={
            <ProtectedRoute>
              <WaterproofingFlow />
            </ProtectedRoute>
          }
        />

        {/* =======================================================
            INTERIOR DESIGN
            ======================================================= */}

        {/* Public category */}
        <Route
          path="services/interior-design"
          element={<InteriorDesignCategory />}
        />

        {/* Public project catalogue */}
        <Route
          path="services/interior-design/:categorySlug"
          element={<InteriorDesignCatalogue />}
        />

        {/* Login required for actual project booking flow */}
        <Route
          path="services/interior-design/:categorySlug/:projectSlug"
          element={
            <ProtectedRoute>
              <InteriorDesignFlow />
            </ProtectedRoute>
          }
        />

        {/* =======================================================
            GENERIC BOOKING
            LOGIN REQUIRED
            ======================================================= */}

        <Route
          path="services/:slug"
          element={
            <ProtectedRoute>
              <ServiceBooking />
            </ProtectedRoute>
          }
        />

        {/* Hero banners use /booking/:slug */}
        <Route
          path="booking/:slug"
          element={
            <ProtectedRoute>
              <ServiceBooking />
            </ProtectedRoute>
          }
        />

        {/* =======================================================
            OLD /BOOK ROUTE
            ======================================================= */}

        <Route
          path="book"
          element={
            <Navigate
              to="/services"
              replace
            />
          }
        />

        {/* =======================================================
            INTERIOR BY CHOICE
            Browse = PUBLIC
            Booking = PROTECTED
            ======================================================= */}

        {/* Public catalogue */}
        <Route
          path="interior-by-choice"
          element={<InteriorByChoice />}
        />

        {/* Login required */}
        <Route
          path="interior-by-choice/book"
          element={
            <ProtectedRoute>
              <InteriorBooking />
            </ProtectedRoute>
          }
        />

        {/* Public space gallery */}
        <Route
          path="interior-by-choice/:spaceSlug"
          element={<InteriorSpaceGallery />}
        />

        {/* Public design details */}
        <Route
          path="interior-by-choice/:spaceSlug/:designSlug"
          element={<InteriorDesignDetail />}
        />

        {/* Login required */}
        <Route
          path="interior-by-choice/:spaceSlug/:designSlug/book"
          element={
            <ProtectedRoute>
              <InteriorBooking />
            </ProtectedRoute>
          }
        />

        {/* =======================================================
            GENERAL PUBLIC PAGES
            ======================================================= */}

        <Route
          path="about"
          element={<About />}
        />

        <Route
          path="contact"
          element={<Contact />}
        />

        <Route
          path="quote"
          element={<Quote />}
        />

        {/* =======================================================
            DASHBOARD
            LOGIN REQUIRED
            ======================================================= */}

        <Route
          path="dashboard"
          element={
            <Navigate
              to="/dashboard/bookings"
              replace
            />
          }
        />

        <Route
          path="dashboard/bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />

        <Route
          path="dashboard/bookings/:id"
          element={
            <ProtectedRoute>
              <BookingDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="dashboard/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* =======================================================
            LEGAL
            ======================================================= */}

        <Route
          path="privacy-policy"
          element={<PrivacyPolicy />}
        />

        <Route
          path="terms"
          element={<Terms />}
        />

        {/* =======================================================
            404
            ======================================================= */}

        <Route
          path="*"
          element={<NotFound />}
        />

      </Route>
    </Routes>
  );
}
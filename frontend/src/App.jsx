
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import RequireBookingAuth from './components/layout/RequireBookingAuth';

import Home from './pages/Home';
import NotFound from './pages/NotFound';

/*
 * Pages are loaded only when first visited.
 * This keeps the initial bundle smaller.
 */
const lazyPage = (loader) => lazy(loader);

const Services = lazyPage(() => import('./pages/Services'));
const ServiceBooking = lazyPage(() => import('./pages/ServiceBooking'));

const InteriorByChoice = lazyPage(() => import('./pages/InteriorByChoice'));
const InteriorSpaceGallery = lazyPage(() => import('./pages/InteriorSpaceGallery'));
const InteriorDesignDetail = lazyPage(() => import('./pages/InteriorDesignDetail'));
const InteriorBooking = lazyPage(() => import('./pages/InteriorBooking'));

const ElectricalCategory = lazyPage(() => import('./pages/ElectricalCategory'));
const ElectricalCart = lazyPage(() => import('./pages/ElectricalCart'));
const ElectricalCheckout = lazyPage(() => import('./pages/ElectricalCheckout'));
const ElectricalSubPage = lazyPage(() =>
  import('./pages/ElectricalCheckout').then((m) => ({
    default: m.ElectricalSubPage,
  }))
);

const PlumbingCategory = lazyPage(() => import('./pages/PlumbingCategory'));
const PlumbingTab = lazyPage(() => import('./pages/PlumbingTab'));
const PlumbingConsultationList = lazyPage(
  () => import('./pages/PlumbingConsultationList')
);
const PlumbingConsultationBook = lazyPage(
  () => import('./pages/PlumbingConsultationBook')
);
const PlumbingCart = lazyPage(() => import('./pages/PlumbingCart'));
const PlumbingCheckout = lazyPage(() => import('./pages/PlumbingCheckout'));

const PaintingCategory = lazyPage(() => import('./pages/PaintingCategory'));
const PaintingFlow = lazyPage(() => import('./pages/PaintingFlow'));

const PopCeilingCategory = lazyPage(
  () => import('./pages/PopCeilingCategory')
);
const PopCeilingFlow = lazyPage(() => import('./pages/PopCeilingFlow'));

const WaterproofingCategory = lazyPage(
  () => import('./pages/WaterproofingCategory')
);
const WaterproofingBathroom = lazyPage(
  () => import('./pages/WaterproofingBathroom')
);
const WaterproofingFlow = lazyPage(
  () => import('./pages/WaterproofingFlow')
);

const InteriorDesignCategory = lazyPage(
  () => import('./pages/InteriorDesignCategory')
);
const InteriorDesignCatalogue = lazyPage(
  () => import('./pages/InteriorDesignCatalogue')
);
const InteriorDesignFlow = lazyPage(
  () => import('./pages/InteriorDesignFlow')
);

const About = lazyPage(() => import('./pages/About'));
const Contact = lazyPage(() => import('./pages/Contact'));
const Quote = lazyPage(() => import('./pages/Quote'));

const Login = lazyPage(() => import('./pages/Login'));

const ResetPassword = lazyPage(() =>
  import('./pages/EmailLink').then((m) => ({
    default: m.ResetPassword,
  }))
);

const VerifyEmail = lazyPage(() =>
  import('./pages/EmailLink').then((m) => ({
    default: m.VerifyEmail,
  }))
);

const MyBookings = lazyPage(() => import('./pages/MyBookings'));
const BookingDetail = lazyPage(() => import('./pages/BookingDetail'));
const Profile = lazyPage(() => import('./pages/Profile'));
const PartnerRedirect = lazyPage(() => import('./pages/PartnerRedirect'));

const PrivacyPolicy = lazyPage(() =>
  import('./pages/Legal').then((m) => ({
    default: m.PrivacyPolicy,
  }))
);

const Terms = lazyPage(() =>
  import('./pages/Legal').then((m) => ({
    default: m.Terms,
  }))
);

export default function App() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '50vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Loading...
        </div>
      }
    >
      <Routes>
        {/* Authentication pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login />} />

        {/* Email authentication links */}
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Partner application */}
        <Route path="/partner/*" element={<PartnerRedirect />} />

        <Route element={<Layout />}>
          {/* Home */}
          <Route index element={<Home />} />

          {/* Services */}
          <Route path="services" element={<Services />} />

          {/* Legacy service redirects */}
          <Route
            path="services/painting-waterproofing"
            element={<Navigate to="/services/painting" replace />}
          />

          <Route
            path="services/electrician"
            element={<Navigate to="/services/electrical" replace />}
          />

          <Route
            path="services/interior-work"
            element={<Navigate to="/services/interior-design" replace />}
          />

          <Route
            path="services/pop-false-ceiling"
            element={<Navigate to="/services/pop-ceiling-design" replace />}
          />

          <Route
            path="booking/painting-waterproofing"
            element={<Navigate to="/services/painting" replace />}
          />

          <Route
            path="booking/electrician"
            element={<Navigate to="/services/electrical" replace />}
          />

          <Route
            path="booking/interior-work"
            element={<Navigate to="/services/interior-design" replace />}
          />

          {/* Interior by Choice redirect */}
          <Route
            path="services/interior-by-choice"
            element={<Navigate to="/interior-by-choice" replace />}
          />

          {/* ==================== ELECTRICAL ==================== */}

          <Route
            path="services/electrical"
            element={
              <RequireBookingAuth>
                <ElectricalCategory />
              </RequireBookingAuth>
            }
          />

          <Route
            path="services/electric"
            element={
              <RequireBookingAuth>
                <ElectricalCategory />
              </RequireBookingAuth>
            }
          />

          <Route
            path="services/electrical/cart"
            element={
              <RequireBookingAuth>
                <ElectricalCart />
              </RequireBookingAuth>
            }
          />

          <Route
            path="services/electrical/checkout"
            element={
              <RequireBookingAuth>
                <ElectricalCheckout />
              </RequireBookingAuth>
            }
          />

          <Route
            path="services/electrical/:subSlug"
            element={
              <RequireBookingAuth>
                <ElectricalSubPage />
              </RequireBookingAuth>
            }
          />

          {/* ==================== OTHER SERVICES ==================== */}

          <Route
            path="services/other-services"
            element={<Navigate to="/services" replace />}
          />

          {/* ==================== PLUMBING ==================== */}

          <Route
            path="services/plumbing"
            element={
              <RequireBookingAuth>
                <PlumbingCategory />
              </RequireBookingAuth>
            }
          />

          <Route
            path="services/plumbing/cart"
            element={
              <RequireBookingAuth>
                <PlumbingCart />
              </RequireBookingAuth>
            }
          />

          <Route
            path="services/plumbing/checkout"
            element={
              <RequireBookingAuth>
                <PlumbingCheckout />
              </RequireBookingAuth>
            }
          />

          <Route
            path="services/plumbing/consultation"
            element={
              <RequireBookingAuth>
                <PlumbingConsultationList />
              </RequireBookingAuth>
            }
          />

          <Route
            path="services/plumbing/consultation/:typeSlug"
            element={
              <RequireBookingAuth>
                <PlumbingConsultationBook />
              </RequireBookingAuth>
            }
          />

          <Route
            path="services/plumbing/:tabSlug"
            element={
              <RequireBookingAuth>
                <PlumbingTab />
              </RequireBookingAuth>
            }
          />

          {/* ==================== PAINTING ==================== */}

          <Route
            path="services/painting"
            element={
              <RequireBookingAuth>
                <PaintingCategory />
              </RequireBookingAuth>
            }
          />

          <Route
            path="services/painting/:flowSlug"
            element={
              <RequireBookingAuth>
                <PaintingFlow />
              </RequireBookingAuth>
            }
          />

          {/* ==================== POP CEILING ==================== */}

          <Route
            path="services/pop-ceiling-design"
            element={
              <RequireBookingAuth>
                <PopCeilingCategory />
              </RequireBookingAuth>
            }
          />

          <Route
            path="services/pop-ceiling-design/:flowSlug"
            element={
              <RequireBookingAuth>
                <PopCeilingFlow />
              </RequireBookingAuth>
            }
          />

          {/* ==================== WATERPROOFING ==================== */}

          <Route
            path="services/waterproofing"
            element={
              <RequireBookingAuth>
                <WaterproofingCategory />
              </RequireBookingAuth>
            }
          />

          <Route
            path="services/waterproofing/bathroom"
            element={
              <RequireBookingAuth>
                <WaterproofingBathroom />
              </RequireBookingAuth>
            }
          />

          <Route
            path="services/waterproofing/:flowSlug"
            element={
              <RequireBookingAuth>
                <WaterproofingFlow />
              </RequireBookingAuth>
            }
          />

          {/* ==================== INTERIOR DESIGN ==================== */}

          <Route
            path="services/interior-design"
            element={
              <RequireBookingAuth>
                <InteriorDesignCategory />
              </RequireBookingAuth>
            }
          />

          <Route
            path="services/interior-design/:categorySlug"
            element={
              <RequireBookingAuth>
                <InteriorDesignCatalogue />
              </RequireBookingAuth>
            }
          />

          <Route
            path="services/interior-design/:categorySlug/:projectSlug"
            element={
              <RequireBookingAuth>
                <InteriorDesignFlow />
              </RequireBookingAuth>
            }
          />

          {/* Generic service booking */}
          <Route
            path="services/:slug"
            element={
              <RequireBookingAuth>
                <ServiceBooking />
              </RequireBookingAuth>
            }
          />

          {/* Booking route */}
          <Route
            path="booking/:slug"
            element={
              <RequireBookingAuth>
                <ServiceBooking />
              </RequireBookingAuth>
            }
          />

          {/* Old standalone booking page */}
          <Route
            path="book"
            element={<Navigate to="/services" replace />}
          />

          {/* ==================== INTERIOR BY CHOICE ==================== */}

          <Route
            path="interior-by-choice"
            element={
              <RequireBookingAuth>
                <InteriorByChoice />
              </RequireBookingAuth>
            }
          />

          <Route
            path="interior-by-choice/book"
            element={
              <RequireBookingAuth>
                <InteriorBooking />
              </RequireBookingAuth>
            }
          />

          <Route
            path="interior-by-choice/:spaceSlug"
            element={
              <RequireBookingAuth>
                <InteriorSpaceGallery />
              </RequireBookingAuth>
            }
          />

          <Route
            path="interior-by-choice/:spaceSlug/:designSlug"
            element={
              <RequireBookingAuth>
                <InteriorDesignDetail />
              </RequireBookingAuth>
            }
          />

          <Route
            path="interior-by-choice/:spaceSlug/:designSlug/book"
            element={
              <RequireBookingAuth>
                <InteriorBooking />
              </RequireBookingAuth>
            }
          />

          {/* ==================== GENERAL PAGES ==================== */}

          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="quote" element={<Quote />} />

          {/* ==================== DASHBOARD ==================== */}

          <Route
            path="dashboard"
            element={
              <Navigate to="/dashboard/bookings" replace />
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

          {/* ==================== LEGAL ==================== */}

          <Route
            path="privacy-policy"
            element={<PrivacyPolicy />}
          />

          <Route
            path="terms"
            element={<Terms />}
          />

          {/* ==================== 404 ==================== */}

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

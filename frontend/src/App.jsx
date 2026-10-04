import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Home from './pages/Home';
import Services from './pages/Services';
import ServiceBooking from './pages/ServiceBooking';
// Projects and Materials sections are disabled sitewide — see the commented
// routes below. Imports kept (not deleted) so re-enabling is a two-line diff.
// import Projects from './pages/Projects';
// import Materials from './pages/Materials';
import InteriorByChoice from './pages/InteriorByChoice';
import InteriorSpaceGallery from './pages/InteriorSpaceGallery';
import InteriorDesignDetail from './pages/InteriorDesignDetail';
import InteriorBooking from './pages/InteriorBooking';
import ElectricalCategory from './pages/ElectricalCategory';
import ElectricalCart from './pages/ElectricalCart';
import ElectricalCheckout, { ElectricalSubPage } from './pages/ElectricalCheckout';
import ElectricianService from './pages/ElectricianService';
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
// import ProjectDetail from './pages/ProjectDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import Quote from './pages/Quote';
import Login from './pages/Login';
import MyBookings from './pages/MyBookings';
import BookingDetail from './pages/BookingDetail';
import Profile from './pages/Profile';
import PartnerRedirect from './pages/PartnerRedirect';
import NotFound from './pages/NotFound';
import RequireBookingAuth from './components/layout/RequireBookingAuth';

/* Pages load when first visited (a visitor to the home page does not need
   the booking flows' code up front). Home and the not-found page stay in the
   main file. */
const Services = lazyPage(() => import('./pages/Services'));
const ServiceBooking = lazyPage(() => import('./pages/ServiceBooking'));
const InteriorByChoice = lazyPage(() => import('./pages/InteriorByChoice'));
const InteriorSpaceGallery = lazyPage(() => import('./pages/InteriorSpaceGallery'));
const InteriorDesignDetail = lazyPage(() => import('./pages/InteriorDesignDetail'));
const InteriorBooking = lazyPage(() => import('./pages/InteriorBooking'));
const ElectricalCategory = lazyPage(() => import('./pages/ElectricalCategory'));
const ElectricalCart = lazyPage(() => import('./pages/ElectricalCart'));
const ElectricalCheckout = lazyPage(() => import('./pages/ElectricalCheckout'));
const ElectricalSubPage = lazyPage(() => import('./pages/ElectricalCheckout').then((m) => ({ default: m.ElectricalSubPage })));
const AcServices = lazyPage(() => import('./pages/AcServices'));
const PlumbingCategory = lazyPage(() => import('./pages/PlumbingCategory'));
const PlumbingTab = lazyPage(() => import('./pages/PlumbingTab'));
const PlumbingConsultationList = lazyPage(() => import('./pages/PlumbingConsultationList'));
const PlumbingConsultationBook = lazyPage(() => import('./pages/PlumbingConsultationBook'));
const PlumbingCart = lazyPage(() => import('./pages/PlumbingCart'));
const PlumbingCheckout = lazyPage(() => import('./pages/PlumbingCheckout'));
const Cart = lazyPage(() => import('./pages/Cart'));
const PaintingCategory = lazyPage(() => import('./pages/PaintingCategory'));
const PaintingFlow = lazyPage(() => import('./pages/PaintingFlow'));
const PopCeilingCategory = lazyPage(() => import('./pages/PopCeilingCategory'));
const PopCeilingFlow = lazyPage(() => import('./pages/PopCeilingFlow'));
const WaterproofingCategory = lazyPage(() => import('./pages/WaterproofingCategory'));
const WaterproofingBathroom = lazyPage(() => import('./pages/WaterproofingBathroom'));
const WaterproofingFlow = lazyPage(() => import('./pages/WaterproofingFlow'));
const InteriorDesignCategory = lazyPage(() => import('./pages/InteriorDesignCategory'));
const InteriorDesignCatalogue = lazyPage(() => import('./pages/InteriorDesignCatalogue'));
const InteriorDesignFlow = lazyPage(() => import('./pages/InteriorDesignFlow'));
const About = lazyPage(() => import('./pages/About'));
const Contact = lazyPage(() => import('./pages/Contact'));
const Quote = lazyPage(() => import('./pages/Quote'));
const Login = lazyPage(() => import('./pages/Login'));
const ResetPassword = lazyPage(() => import('./pages/EmailLink').then((m) => ({ default: m.ResetPassword })));
const VerifyEmail = lazyPage(() => import('./pages/EmailLink').then((m) => ({ default: m.VerifyEmail })));
const MyBookings = lazyPage(() => import('./pages/MyBookings'));
const BookingDetail = lazyPage(() => import('./pages/BookingDetail'));
const Profile = lazyPage(() => import('./pages/Profile'));
const PartnerRedirect = lazyPage(() => import('./pages/PartnerRedirect'));
const PrivacyPolicy = lazyPage(() => import('./pages/Legal').then((m) => ({ default: m.PrivacyPolicy })));
const Terms = lazyPage(() => import('./pages/Legal').then((m) => ({ default: m.Terms })));

const RETIRED_SERVICE_SLUGS = [
  'other-services',
  'architectural-design',
  'civil-construction',
  'furniture',
  'fabrication',
  'finishing',
];

/**
 * ROUTES
 * /                       Home
 * /services               All services
 * /services/:slug         Book a site visit for one service
 * /services/electrical    Electrical Services category list
 * /services/electrical/:subSlug  One of the seven detailed electrician booking journeys
 * /services/plumbing      Plumbing Services overview grid (8 categories + consultation)
 * /services/plumbing/cart, /checkout  The item cart and its checkout flow
 * /services/plumbing/consultation, /consultation/:typeSlug  Consultation list + booking
 * /services/plumbing/:tabSlug  One plumbing category's itemised service list
 * /services/painting      Painting Services overview grid (Full Home / Few Walls / Room / Renovation)
 * /services/painting/:flowSlug  One painting journey (full-home | few-walls | renovation)
 * /services/pop-ceiling-design  POP Ceiling & Design overview list (six subservices)
 * /services/pop-ceiling-design/:flowSlug  One of the two detailed POP journeys (full-home | room)
 * /services/waterproofing       Waterproofing overview list (six subservices)
 * /services/waterproofing/bathroom  Bathroom's own six-row list (only Floor Waterproofing is detailed)
 * /services/waterproofing/:flowSlug  One of six detailed journeys (terrace | exterior-wall |
 *                                 bathroom-floor | interior-wall | water-tank | basement)
 * /services/interior-design      Category grid (1 BHK / 2 BHK / 3 BHK / Villa) — separate
 *                                 from /interior-by-choice below, which is untouched
 * /services/interior-design/:categorySlug  Project grid for one category
 * /services/interior-design/:categorySlug/:projectSlug  One project's full flow
 * /booking/:slug          Same booking page, reached from the hero banners — also where
 *                          POP's four non-detailed subservices land, via ?preselect=<value>
 *                          (see ServiceBooking.jsx)
 * /projects, /projects/:slug, /materials   DISABLED sitewide — see the commented-out routes below
 * /book                   Redirects to /services (old standalone booking page, removed)
 * /interior-by-choice      Design catalogue: browse by space, pick a design, book a ₹99 home visit
 * /about                  About us
 * /contact                Contact
 * /quote                  Get a quote  (?service=<slug> pre-selects a service)
 * /login                  Sign in       (no header/footer)
 * /register               Create account (same page, other tab)
 * /dashboard              Redirects to /dashboard/bookings
 * /dashboard/bookings     Every booking the signed-in client has made, with real status
 * /dashboard/profile      Edit name/phone, verify email, reset password, sign out
 * /partner/*              Forwards to the separate partners app (see partners/)
 * /privacy-policy, /terms Legal pages
 */
export default function App() {
  return (
    <Routes>
      {/* the account page sits outside the main layout — full-screen split page.
          both paths render it; the tab that opens is taken from the URL. */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Login />} />
      {/* Where the API's emails link to (AuthService). */}
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      {/* Professionals have their own app now (partners/). Old /partner links
          forward there once VITE_PARTNERS_URL is set; until then they go home. */}
      <Route path="/partner/*" element={<PartnerRedirect />} />

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
        <Route path="services/pop-false-ceiling" element={<Navigate to="/services/pop-ceiling-design" replace />} />
        <Route path="booking/painting-waterproofing" element={<Navigate to="/services/painting" replace />} />
        <Route path="booking/electrician" element={<Navigate to="/services/electrical" replace />} />
        <Route path="booking/interior-work" element={<Navigate to="/services/interior-design" replace />} />

        {/* Interior by Choice has its own richer browse-then-book page at
            /interior-by-choice; a link generated from the catalogue
            (mega menu, search results, the seven-card grid) points at
            /services/interior-by-choice like every other category, so it
            redirects there instead of opening the generic booking wizard. */}
        <Route path="services/interior-by-choice" element={<Navigate to="/interior-by-choice" replace />} />

        {/* Electrical Services: a category list (matching the approved
            journey's step 2) in front of the generic wizard, with seven of
            its eight tiles opening their own richer, catalogue-driven
            booking flow instead. Declared ahead of services/:slug so these
            exact paths win over that wildcard. */}
        {/* services/electrician already redirects to services/electrical
            above, so only that exact path needs to render the category
            list here. */}
        <Route path="services/electrical" element={<RequireBookingAuth><ElectricalCategory /></RequireBookingAuth>} />
        <Route path="services/electric" element={<RequireBookingAuth><ElectricalCategory /></RequireBookingAuth>} />
        <Route path="services/electrical/cart" element={<RequireBookingAuth><ElectricalCart /></RequireBookingAuth>} />
        <Route path="services/electrical/checkout" element={<RequireBookingAuth><ElectricalCheckout /></RequireBookingAuth>} />
        <Route path="services/electrical/:subSlug" element={<RequireBookingAuth><ElectricalSubPage /></RequireBookingAuth>} />

        {/* Other Services was withdrawn in V31; keep old links working by
            sending them to the current service list. */}
        <Route path="services/other-services" element={<Navigate to="/services" replace />} />

        {/* Plumbing Services: an itemised cart catalogue (V14 migration)
            replacing the old generic wizard for this one category. Exact
            child paths declared ahead of services/:slug so they win over
            that wildcard, same precedent as services/electrical above. */}
        <Route path="services/plumbing" element={<RequireBookingAuth><PlumbingCategory /></RequireBookingAuth>} />
        <Route path="services/plumbing/cart" element={<RequireBookingAuth><PlumbingCart /></RequireBookingAuth>} />
        <Route path="services/plumbing/checkout" element={<RequireBookingAuth><PlumbingCheckout /></RequireBookingAuth>} />
        <Route path="services/plumbing/consultation" element={<RequireBookingAuth><PlumbingConsultationList /></RequireBookingAuth>} />
        <Route path="services/plumbing/consultation/:typeSlug" element={<RequireBookingAuth><PlumbingConsultationBook /></RequireBookingAuth>} />
        <Route path="services/plumbing/:tabSlug" element={<RequireBookingAuth><PlumbingTab /></RequireBookingAuth>} />

        {/* Painting Services: three itemised booking journeys (V15
            migration) replacing the old generic wizard for this one
            category — same precedent as plumbing above. One page component
            (PaintingFlow) driven by the :flowSlug param and paintingContent.js's
            flow config, rather than one file per journey. */}
        <Route path="services/painting" element={<RequireBookingAuth><PaintingCategory /></RequireBookingAuth>} />
        <Route path="services/painting/:flowSlug" element={<RequireBookingAuth><PaintingFlow /></RequireBookingAuth>} />

        {/* POP Ceiling & Design: only two of its six subservices have a
            detailed reference journey (V16 migration) — Full Home POP and
            Room POP get their own dedicated flow here; the other four
            (False Ceiling, POP Design Work, POP TV Wall, POP Repair &
            Renovation) link to /booking/pop-ceiling-design?preselect=...,
            the existing generic wizard below, with their subservice
            preselected (see ServiceBooking.jsx). */}
        <Route path="services/pop-ceiling-design" element={<RequireBookingAuth><PopCeilingCategory /></RequireBookingAuth>} />
        <Route path="services/pop-ceiling-design/:flowSlug" element={<RequireBookingAuth><PopCeilingFlow /></RequireBookingAuth>} />

        {/* Waterproofing: six subservices, in the reference's own order.
            Five open WaterproofingFlow directly; Bathroom opens its own
            six-row sub-list first (WaterproofingBathroom), where only
            Floor Waterproofing has a detailed flow of its own — the other
            five link to /booking/waterproofing?preselect=..., same
            fallback pattern as POP Ceiling's non-detailed subservices. */}
        <Route path="services/waterproofing" element={<RequireBookingAuth><WaterproofingCategory /></RequireBookingAuth>} />
        <Route path="services/waterproofing/bathroom" element={<RequireBookingAuth><WaterproofingBathroom /></RequireBookingAuth>} />
        <Route path="services/waterproofing/:flowSlug" element={<RequireBookingAuth><WaterproofingFlow /></RequireBookingAuth>} />

        {/* Interior Design: separate from Interior by Choice (its own
            routes below, untouched) — a category grid (1/2/3 BHK + Villa),
            each opening a project grid, each project opening one
            config-driven flow (package -> details -> customise ->
            consultation -> confirm). */}
        <Route path="services/interior-design" element={<RequireBookingAuth><InteriorDesignCategory /></RequireBookingAuth>} />
        <Route path="services/interior-design/:categorySlug" element={<RequireBookingAuth><InteriorDesignCatalogue /></RequireBookingAuth>} />
        <Route path="services/interior-design/:categorySlug/:projectSlug" element={<RequireBookingAuth><InteriorDesignFlow /></RequireBookingAuth>} />

        <Route path="services/:slug" element={<RequireBookingAuth><ServiceBooking /></RequireBookingAuth>} />
        {/* The hero banners link to /booking/<slug>; same page, second door. */}
        <Route path="booking/:slug" element={<RequireBookingAuth><ServiceBooking /></RequireBookingAuth>} />
        {/* Projects and Materials sections — disabled sitewide on request.
            Routes commented out rather than removed so this is a quick
            revert; every Link that pointed here is also commented out
            (siteConfig.js's mainNav/quickLinks, Home.jsx, About.jsx,
            AccountSidebar.jsx). */}
        {/* <Route path="projects" element={<Projects />} /> */}
        {/* <Route path="projects/:slug" element={<ProjectDetail />} /> */}
        {/* <Route path="materials" element={<Materials />} /> */}
        {/* The old standalone /book page had its own hard-coded list of
            services that had drifted from the real ones. Every booking now
            starts from a service, so old links go to the services page. */}
        <Route path="book" element={<Navigate to="/services" replace />} />

        {/* Interior by Choice — the ready-made design catalogue. Its own
            small route tree, separate from the generic /services/:slug
            wizard, since it's a browse-then-book flow rather than a
            question-at-a-time site visit request. */}
        <Route path="interior-by-choice" element={<RequireBookingAuth><InteriorByChoice /></RequireBookingAuth>} />
        <Route path="interior-by-choice/book" element={<RequireBookingAuth><InteriorBooking /></RequireBookingAuth>} />
        <Route path="interior-by-choice/:spaceSlug" element={<RequireBookingAuth><InteriorSpaceGallery /></RequireBookingAuth>} />
        <Route path="interior-by-choice/:spaceSlug/:designSlug" element={<RequireBookingAuth><InteriorDesignDetail /></RequireBookingAuth>} />
        <Route path="interior-by-choice/:spaceSlug/:designSlug/book" element={<RequireBookingAuth><InteriorBooking /></RequireBookingAuth>} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="quote" element={<Quote />} />
        {/* /dashboard has no page of its own — Bookings and Profile are
            separate pages (own routes, own content), each reachable directly
            from the bottom nav; a bare /dashboard visit (the desktop header's
            "MY ACCOUNT" link) lands on Bookings, the more actionable of the
            two. */}
        <Route path="dashboard" element={<Navigate to="/dashboard/bookings" replace />} />
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
        <Route path="privacy-policy" element={<PrivacyPolicy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

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
import Book from './pages/Book';
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
// import ProjectDetail from './pages/ProjectDetail';
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
 * /book                   Book a site visit (?type=service | ?type=project)
 * /interior-by-choice      Design catalogue: browse by space, pick a design, book a ₹99 home visit
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
        <Route path="services/electrical" element={<ElectricalCategory />} />
        <Route path="services/electric" element={<ElectricalCategory />} />
        <Route path="services/electrical/:subSlug" element={<ElectricianService />} />

        {/* Other Services: the catch-all eighth tile, reactivated on
            request. A category list in front of five existing generic
            wizard pages, same shape as the electrical category list. */}
        <Route path="services/other-services" element={<OtherServicesCategory />} />

        {/* Plumbing Services: an itemised cart catalogue (V14 migration)
            replacing the old generic wizard for this one category. Exact
            child paths declared ahead of services/:slug so they win over
            that wildcard, same precedent as services/electrical above. */}
        <Route path="services/plumbing" element={<PlumbingCategory />} />
        <Route path="services/plumbing/cart" element={<PlumbingCart />} />
        <Route path="services/plumbing/checkout" element={<PlumbingCheckout />} />
        <Route path="services/plumbing/consultation" element={<PlumbingConsultationList />} />
        <Route path="services/plumbing/consultation/:typeSlug" element={<PlumbingConsultationBook />} />
        <Route path="services/plumbing/:tabSlug" element={<PlumbingTab />} />

        {/* Painting Services: three itemised booking journeys (V15
            migration) replacing the old generic wizard for this one
            category — same precedent as plumbing above. One page component
            (PaintingFlow) driven by the :flowSlug param and paintingContent.js's
            flow config, rather than one file per journey. */}
        <Route path="services/painting" element={<PaintingCategory />} />
        <Route path="services/painting/:flowSlug" element={<PaintingFlow />} />

        {/* POP Ceiling & Design: only two of its six subservices have a
            detailed reference journey (V16 migration) — Full Home POP and
            Room POP get their own dedicated flow here; the other four
            (False Ceiling, POP Design Work, POP TV Wall, POP Repair &
            Renovation) link to /booking/pop-ceiling-design?preselect=...,
            the existing generic wizard below, with their subservice
            preselected (see ServiceBooking.jsx). */}
        <Route path="services/pop-ceiling-design" element={<PopCeilingCategory />} />
        <Route path="services/pop-ceiling-design/:flowSlug" element={<PopCeilingFlow />} />

        {/* Waterproofing: six subservices, in the reference's own order.
            Five open WaterproofingFlow directly; Bathroom opens its own
            six-row sub-list first (WaterproofingBathroom), where only
            Floor Waterproofing has a detailed flow of its own — the other
            five link to /booking/waterproofing?preselect=..., same
            fallback pattern as POP Ceiling's non-detailed subservices. */}
        <Route path="services/waterproofing" element={<WaterproofingCategory />} />
        <Route path="services/waterproofing/bathroom" element={<WaterproofingBathroom />} />
        <Route path="services/waterproofing/:flowSlug" element={<WaterproofingFlow />} />

        {/* Interior Design: separate from Interior by Choice (its own
            routes below, untouched) — a category grid (1/2/3 BHK + Villa),
            each opening a project grid, each project opening one
            config-driven flow (package -> details -> customise ->
            consultation -> confirm). */}
        <Route path="services/interior-design" element={<InteriorDesignCategory />} />
        <Route path="services/interior-design/:categorySlug" element={<InteriorDesignCatalogue />} />
        <Route path="services/interior-design/:categorySlug/:projectSlug" element={<InteriorDesignFlow />} />

        <Route path="services/:slug" element={<ServiceBooking />} />
        {/* The hero banners link to /booking/<slug>; same page, second door. */}
        <Route path="booking/:slug" element={<ServiceBooking />} />
        {/* Projects and Materials sections — disabled sitewide on request.
            Routes commented out rather than removed so this is a quick
            revert; every Link that pointed here is also commented out
            (siteConfig.js's mainNav/quickLinks, Home.jsx, About.jsx,
            Dashboard.jsx). */}
        {/* <Route path="projects" element={<Projects />} /> */}
        {/* <Route path="projects/:slug" element={<ProjectDetail />} /> */}
        {/* <Route path="materials" element={<Materials />} /> */}
        <Route path="book" element={<Book />} />

        {/* Interior by Choice — the ready-made design catalogue. Its own
            small route tree, separate from the generic /services/:slug
            wizard, since it's a browse-then-book flow rather than a
            question-at-a-time site visit request. */}
        <Route path="interior-by-choice" element={<InteriorByChoice />} />
        <Route path="interior-by-choice/book" element={<InteriorBooking />} />
        <Route path="interior-by-choice/:spaceSlug" element={<InteriorSpaceGallery />} />
        <Route path="interior-by-choice/:spaceSlug/:designSlug" element={<InteriorDesignDetail />} />
        <Route path="interior-by-choice/:spaceSlug/:designSlug/book" element={<InteriorBooking />} />
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

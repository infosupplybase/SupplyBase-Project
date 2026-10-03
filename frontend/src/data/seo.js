/**
 * SEO — what each public page calls itself in a browser tab, a search result
 * and a link preview. PageMeta (components/layout/PageMeta.jsx) applies the
 * entry for the current URL; index.html carries the home page's version for
 * crawlers and previews that do not run JavaScript.
 *
 * Only the pages listed in `indexable` are meant to appear in search results
 * (they are also in public/sitemap.xml - keep the two in step). Booking
 * steps, carts, the account area and unknown addresses are marked noindex.
 */

export const SITE_URL = 'https://www.supplybase.co.in';
export const SITE_NAME = 'Supplybase';

const areas = 'Mumbai, Navi Mumbai, Thane, Kalyan, Panvel and Pune';

export const homeMeta = {
  title: 'Supplybase | One Partner. Complete Project.',
  description:
    'Supplybase - painting, waterproofing, plumbing, electrical, POP ceiling and interior design. Book a site visit and deal with one accountable team from first look to finish.',
};

/** path -> { title, description } for every page that should be found in search. */
export const indexable = {
  '/': homeMeta,
  '/services': {
    title: 'Home Services | Supplybase',
    description: `Book a site visit for painting, waterproofing, plumbing, electrical work, POP ceilings and interior design in ${areas}.`,
  },
  '/services/painting': {
    title: 'Painting Services | Supplybase',
    description:
      'Certified painters, premium paint brands and transparent pricing for full-home and room painting. Book a home visit.',
  },
  '/services/waterproofing': {
    title: 'Waterproofing Services | Supplybase',
    description:
      'Terrace, bathroom, wall, basement and water-tank waterproofing for leak-free spaces. Book a site inspection.',
  },
  '/services/plumbing': {
    title: 'Plumbing Services | Supplybase',
    description:
      'Plumbers for installations, repairs and fittings at your home. Pick the work you need and book a visit.',
  },
  '/services/electrical': {
    title: 'Electrician Services | Supplybase',
    description:
      'Electricians for wiring, fittings, appliances and repairs. Choose your services and book one visit.',
  },
  '/services/pop-ceiling-design': {
    title: 'POP Ceiling & Design | Supplybase',
    description:
      'Flat, double-layer, floating, border, non-drop and recessed POP ceilings for your whole home or a single room.',
  },
  '/services/interior-design': {
    title: 'Interior Design | Supplybase',
    description:
      'Interiors designed, built and installed - pick a package for your 1, 2, 3 BHK or villa, or describe what you want.',
  },
  '/services/ac-services': {
    title: 'AC Services | Supplybase',
    description:
      'AC servicing, repair, installation, uninstallation, gas charging and annual maintenance for split, window, inverter and other AC types.',
  },
  '/interior-by-choice': {
    title: 'Interior by Choice | Supplybase',
    description:
      'Browse ready-made interior designs room by room, pick the one you like and book a home visit.',
  },
  '/about': {
    title: 'About Us | Supplybase',
    description:
      'Supplybase is a construction, architectural design, interior design and turnkey project execution company - one partner from the first drawing to handover.',
  },
  '/contact': {
    title: 'Contact Us | Supplybase',
    description: 'Call, WhatsApp or write to Supplybase. We visit every day, 9:00 AM to 9:00 PM.',
  },
  '/quote': {
    title: 'Get a Quote | Supplybase',
    description: 'Tell us about your project and get a written quotation from Supplybase.',
  },
  '/privacy-policy': {
    title: 'Privacy Policy | Supplybase',
    description: 'How Supplybase collects and uses the details you share when you book or enquire.',
  },
  '/terms': {
    title: 'Terms & Conditions | Supplybase',
    description: 'The terms that apply to enquiries, quotations and work booked through Supplybase.',
  },
};

/** Sections that are real pages of the app but not search landing pages. */
const appSections = [
  { prefix: '/services/', parentOf: (parts) => '/' + parts.slice(0, 2).join('/') },
  { prefix: '/booking/', parentOf: (parts) => '/services/' + parts[1] },
  { prefix: '/interior-by-choice/', parentOf: () => '/interior-by-choice' },
];
const privateSections = ['/dashboard', '/login', '/register', '/partner'];

/**
 * The meta for a URL path:
 *   { title, description, canonical, noindex }
 */
export function resolveMeta(rawPath) {
  const path = (rawPath || '/').replace(/\/+$/, '') || '/';

  if (indexable[path]) {
    return { ...indexable[path], canonical: SITE_URL + (path === '/' ? '/' : path), noindex: false };
  }

  if (privateSections.some((p) => path === p || path.startsWith(p + '/'))) {
    return {
      title: `${path.startsWith('/dashboard') ? 'My Account' : 'Sign in'} | ${SITE_NAME}`,
      description: homeMeta.description,
      canonical: SITE_URL + '/',
      noindex: true,
    };
  }

  const section = appSections.find((s) => path.startsWith(s.prefix));
  if (section) {
    // A step inside a service (cart, checkout, a booking flow): the service's
    // own page is its canonical address, and the step itself stays out of search.
    const parts = path.split('/').filter(Boolean);
    const candidate = section.parentOf(parts);
    const parentPath = indexable[candidate] ? candidate : '/services';
    const parent = indexable[parentPath];
    return {
      title: parent.title.replace(' | ', ' - Book | '),
      description: parent.description,
      canonical: SITE_URL + parentPath,
      noindex: true,
    };
  }

  return {
    title: `Page not found | ${SITE_NAME}`,
    description: homeMeta.description,
    canonical: SITE_URL + '/',
    noindex: true,
  };
}

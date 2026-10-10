/**
 * SEO — what each public page calls itself in a browser tab, a search result
 * and a link preview. PageMeta (components/layout/PageMeta.jsx) applies the
 * entry for the current URL; index.html carries the home page's version for
 * crawlers and previews that do not run JavaScript.
 *
 * Only the pages listed in `indexable` are meant to appear in search results
 * (the build writes them into dist/sitemap.xml and gives each one its own
 * HTML file with these tags - see vite.config.js). Booking steps, carts, the
 * account area, coming-soon services and unknown addresses are noindex.
 */

export const SITE_URL = 'https://www.supplybase.co.in';
export const SITE_NAME = 'Supplybase';

const areas = 'Mumbai, Navi Mumbai, Thane, Kalyan, Panvel and Pune';

export const homeMeta = {
  title: 'Supplybase | Painting, POP Ceiling & Interiors in Mumbai & Thane',
  description:
    'Painting, waterproofing, POP and false ceilings, and home interior design across Mumbai, Thane and Navi Mumbai. Book a site visit with one accountable team.',
};

/**
 * path -> { title, description, image? } for every page that should be
 * found in search. `image` is the page's link-preview picture (defaults to
 * the logo). Titles lead with the service and the area, and stay near 60
 * characters so search results show them whole.
 */
export const indexable = {
  '/': homeMeta,
  '/services': {
    title: 'Home Services in Mumbai & Thane | Supplybase',
    description: `Book a site visit for painting, waterproofing, POP ceilings and interior design in ${areas}.`,
  },
  '/services/painting': {
    title: 'Painting Services in Mumbai & Thane | House Painters | Supplybase',
    description:
      'House painting for full homes, single rooms and damaged walls in Mumbai and Thane. Choose your brand and colours, then book a home visit.',
    image: '/assets/painting/hero/painter-roller.webp',
  },
  '/services/waterproofing': {
    title: 'Waterproofing Services in Mumbai & Thane | Supplybase',
    description:
      'Terrace, bathroom, wall, basement and water-tank waterproofing in Mumbai and Thane. We trace the leak first, then treat it. Book a site inspection.',
    image: '/assets/waterproofing/curated-v2/terrace-service-v3.webp',
  },
  '/services/pop-ceiling-design': {
    title: 'POP & False Ceiling Contractor in Mumbai & Thane | Supplybase',
    description:
      'POP and gypsum false ceilings, cove lighting, POP design work, TV walls and ceiling repairs for a whole home or one room in Mumbai and Thane.',
    image: '/assets/pop-ceiling/hero/living-room-cove.webp',
  },
  '/services/interior-design': {
    title: 'Interior Designers in Mumbai & Thane | Home Interiors | Supplybase',
    description:
      'Complete home interiors for 1, 2 and 3 BHK flats and villas: modular kitchens, wardrobes, ceilings and finishes, designed and built by one team.',
    image: '/assets/projects/modern-interior.webp',
  },
  '/interior-by-choice': {
    title: 'Interior by Choice | Ready-Made Interior Designs | Supplybase',
    description:
      'Browse ready-made interior designs room by room, pick the one you like and book a home visit in Mumbai, Thane or Navi Mumbai.',
  },
  '/about': {
    title: 'About Us | Supplybase',
    description:
      'Supplybase brings painting, waterproofing, POP ceiling and interior design work under one accountable team - one partner from the first visit to handover.',
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

/**
 * Services the site shows as "Coming Soon" (Services.jsx, the home page and
 * search). Their pages still open, but they stay out of search results and
 * the sitemap until bookings open: move an entry back into `indexable` then.
 */
export const comingSoon = {
  '/services/plumbing': {
    title: 'Plumbing Services | Supplybase',
    description: 'Plumbers for installations, repairs and fittings at your home. Coming soon to Supplybase.',
  },
  '/services/electrical': {
    title: 'Electrician Services | Supplybase',
    description: 'Electricians for wiring, fittings, appliances and repairs. Coming soon to Supplybase.',
  },
  '/services/ac-services': {
    title: 'AC Services | Supplybase',
    description: 'AC servicing, repair, installation and gas charging. Coming soon to Supplybase.',
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

  if (comingSoon[path]) {
    return { ...comingSoon[path], canonical: SITE_URL + path, noindex: true };
  }

  if (privateSections.some((p) => path === p || path.startsWith(p + '/'))) {
    return {
      title: `${path.startsWith('/dashboard') ? 'My Account' : 'Sign in'} | ${SITE_NAME}`,
      description: homeMeta.description,
      canonical: SITE_URL + '/',
      noindex: true,
    };
  }

  if (path === '/cart') {
    return {
      title: `Your Cart | ${SITE_NAME}`,
      description: homeMeta.description,
      canonical: SITE_URL + '/services',
      noindex: true,
    };
  }

  const section = appSections.find((s) => path.startsWith(s.prefix));
  if (section) {
    // A step inside a service (cart, checkout, a booking flow): the service's
    // own page is its canonical address, and the step itself stays out of search.
    const parts = path.split('/').filter(Boolean);
    const candidate = section.parentOf(parts);
    const parentPath = indexable[candidate] || comingSoon[candidate] ? candidate : '/services';
    const parent = indexable[parentPath] || comingSoon[parentPath];
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

/**
 * Services that are shown as "Coming Soon" and take no bookings yet.
 *
 * One list for the whole website: the home page, search, the Services page,
 * the footer and menus read it, and ComingSoonGate shows a "Coming soon" page
 * in place of these services' own booking pages. The API refuses bookings for
 * the same services (app.booking.coming-soon-services in the backend's
 * application.yml), so when a service launches remove it from both places.
 */
export const COMING_SOON_SERVICES = ['plumbing', 'electrical', 'ac-services'];

/**
 * Catalogue slugs and old URL spellings that belong to a coming-soon service,
 * mapped to that service. Electrical bookings are made under several
 * categories (home-electrical-services, fan-installation, …).
 */
const SLUG_TO_SERVICE = {
  plumbing: 'plumbing',
  electrical: 'electrical',
  electric: 'electrical',
  electrician: 'electrical',
  'home-electrical-services': 'electrical',
  'fan-installation': 'electrical',
  'switch-socket-installation': 'electrical',
  'wiring-rewiring-services': 'electrical',
  'electrical-repair-services': 'electrical',
  'mcb-db-installation': 'electrical',
  'appliance-installation-services': 'electrical',
  'ac-services': 'ac-services',
};

/** The coming-soon service a catalogue slug belongs to, or null. */
export function comingSoonServiceFor(slug) {
  const service = SLUG_TO_SERVICE[slug];
  return service && COMING_SOON_SERVICES.includes(service) ? service : null;
}

/** True when the slug is (part of) a service that is still coming soon. */
export function isComingSoonService(slug) {
  return comingSoonServiceFor(slug) !== null;
}

/**
 * The coming-soon service a website path belongs to (/services/plumbing/cart,
 * /booking/electrician, /services/ac-services/split-ac …), or null.
 */
export function comingSoonServiceForPath(pathname) {
  const match = /^\/(?:services|booking)\/([^/?#]+)/.exec(pathname || '');
  return match ? comingSoonServiceFor(decodeURIComponent(match[1]).toLowerCase()) : null;
}

/** Names shown on the "Coming soon" page. */
export const COMING_SOON_NAMES = {
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  'ac-services': 'AC Services',
};

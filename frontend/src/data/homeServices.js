/**
 * SUPPLYBASE — HOMEPAGE SERVICE CARDS
 *
 * Seed data for the approved "What do you need help with?" section. Five
 * cards: the original four, plus Interior by Choice — the browsable design
 * catalogue (see src/data/interiorCatalog.js) — added as its own card rather
 * than folded into Interior Work, since it is a distinct booking flow with
 * its own pages, not a sub-option of the site-visit wizard.
 *
 * These values are the DEFAULTS, not the source of truth. `service_categories`
 * already holds name, description and the visit fee in MySQL, and the admin
 * screen will edit image, starting price, active flag and display order there.
 * When that endpoint lands, this file becomes the fallback used only while the
 * API is unreachable.
 *
 * NOTE ON IMAGES
 * The photographs in the approved mockup are baked into that single flat image
 * and do not exist as separate files. Each card points at the matching hero
 * banner for now — approved Supplybase artwork showing the same professional —
 * with a per-service focal point, because the banners carry their headline on
 * the left and a blind centre-crop would frame the text instead of the work.
 *
 * To finish it: drop the four approved photos into public/assets/services/ as
 * painting-waterproofing.jpg, plumbing.jpg, electrician.jpg, interior-work.jpg
 * and change `image` below. Nothing else needs touching.
 */
export const homeServices = [
  {
    id: 'painting-waterproofing',
    number: '1',
    title: 'Painting & Waterproofing',
    description: 'Interior & exterior painting, wall putty, texture, waterproofing & more.',
    route: '/booking/painting',
    image: '/assets/hero/painting.png',
    // the painter stands right of centre in the banner
    focus: '72% center',
    alt: 'Supplybase Painting and Waterproofing Service',
    icon: 'roller',
    badge: 'gold',
  },
  {
    id: 'plumbing',
    number: '2',
    title: 'Plumbing',
    description: 'Pipe fitting, leakage repair, tap fitting, drainage cleaning & more.',
    route: '/booking/plumbing',
    image: '/assets/hero/plumbing.png',
    focus: '70% center',
    alt: 'Supplybase Plumbing Service',
    icon: 'tap',
    badge: 'blue',
  },
  {
    id: 'electrician',
    number: '3',
    title: 'Electrician',
    description: 'Wiring, light installation, fan, switchboard repair, short circuit & more.',
    route: '/services/electrical',
    image: '/assets/hero/electrical.png',
    // the electrician sits nearer the middle than the other three
    focus: '52% center',
    alt: 'Supplybase Electrical Service',
    icon: 'bolt',
    badge: 'gold',
  },
  {
    id: 'interior-work',
    number: '4',
    title: 'Interior Work',
    description: 'Modular kitchen, wardrobe, TV unit, false ceiling, carpentry & more.',
    route: '/booking/interior-design',
    image: '/assets/hero/interior-design.png',
    focus: '75% center',
    alt: 'Supplybase Interior Work Service',
    icon: 'sofa',
    badge: 'purple',
  },
  {
    id: 'interior-by-choice',
    number: '5',
    title: 'Interior by Choice',
    description: 'Browse ready-made designs by room, pick your finish and book a home visit for just ₹99.',
    route: '/interior-by-choice',
    image: '/assets/projects/modern-interior.jpeg',
    focus: '60% center',
    alt: 'Supplybase Interior by Choice catalogue',
    icon: 'layers',
    badge: 'gold',
  },
];

/**
 * The five booking steps. Wording is fixed by the approved design — these are
 * marketing lines, not data the admin edits.
 */
export const bookingSteps = [
  { icon: 'layers', title: '1. Choose Service', text: 'Select the service you need' },
  { icon: 'calendar', title: '2. Select Date & Time', text: 'Pick a convenient date and time slot' },
  { icon: 'map-pin', title: '3. Share Details', text: 'Tell us about your requirement' },
  { icon: 'user', title: '4. Get Expert', text: 'Our professional will reach you on time' },
  { icon: 'shield', title: '5. Work Completed', text: 'Quality service with 100% satisfaction' },
];

export default homeServices;

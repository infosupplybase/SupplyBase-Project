/**
 * SUPPLYBASE — ELECTRICIAN SERVICES
 * ---------------------------------
 * The seven detailed electrician journeys, plus Light Installation which
 * keeps using the existing generic site-visit wizard rather than getting a
 * new one of its own.
 *
 * The actual questions, options and add-on prices for the seven detailed
 * services are NOT here — those are catalogue data (service_categories /
 * service_options in MySQL), fetched at runtime via api.serviceForm(slug).
 * This file only holds the presentational shell around that dynamic form:
 * the category tile grid, and each service's intro screen.
 */

export const electricalCategoryIntro = {
  eyebrow: 'ELECTRICIAN SERVICES',
  title: 'Home Electrical Services',
  text: 'Certified electricians for every job — installation, repair and replacement, done safely and on time.',
  image: '/assets/services/electrician/home-electrical-services.webp',
};

/**
 * The category list shown at /services/electrical.
 * Names are intentionally short (Urban Company style) and blurbs are
 * pricing hints so the card matches the Plumber overview grid.
 */
export const electricianCategoryTiles = [
  // {
  //   slug: 'home-electrical-services',
  //   name: 'Home',
  //   blurb: 'On-site quote',
  //   fromPrice: null,
  //   image: '/assets/services/electrician/Home1.jpg',
  //   detailed: true,
  // },
  {
    slug: 'fan-installation',
    name: 'Fan',
    blurb: 'From ₹199',
    fromPrice: 199,
    image: '/assets/services/electrician/FAN.png',
    detailed: true,
  },
  {
    slug: 'light-installation',
    name: 'Light',
    blurb: 'From ₹149',
    fromPrice: 149,
    image: '/assets/services/electrician/LIGHT.jpg',
    detailed: false,
    route: '/booking/electrical',
  },
  {
    slug: 'switch-socket-installation',
    name: 'Switch & Socket',
    blurb: 'From ₹149',
    fromPrice: 149,
    image: '/assets/services/electrician/HOME.jpg',
    detailed: true,
  },
  {
    slug: 'wiring-rewiring-services',
    name: 'Wiring',
    blurb: 'On-site quote',
    fromPrice: null,
    image: '/assets/services/electrician/WIRE.jpg',
    detailed: true,
  },
  {
    slug: 'electrical-repair-services',
    name: 'Repair',
    blurb: 'From ₹199',
    fromPrice: 199,
    image: '/assets/services/electrician/REPAIR.jpg',
    detailed: true,
  },
  {
    slug: 'mcb-db-installation',
    name: 'MCB & DB',
    blurb: 'On-site quote',
    fromPrice: null,
    image: '/assets/services/electrician/DCBjpg.jpg',
    detailed: true,
  },
  {
    slug: 'appliance-installation-services',
    name: 'Appliance',
    blurb: 'From ₹299',
    fromPrice: 299,
    image: '/assets/services/electrician/APPLICACE.jpg',
    detailed: true,
  },
];

/**
 * Intro screen content per detailed service — everything that isn't a
 * catalogue question. `whatsIncluded` and the trust badges are marketing
 * copy, not form data, so they stay in the frontend.
 */
export const electricianServiceIntros = {
  'home-electrical-services': {
    tagline: 'Complete electrical solutions for a safe and modern home.',
    image: '/assets/services/electrician/home-electrical-services.webp',
    badges: [
      { icon: 'user', label: 'Verified Electricians' },
      { icon: 'package', label: 'Quality Materials' },
      { icon: 'shield', label: 'Safe Installation' },
      { icon: 'clock', label: 'On-Time Service' },
    ],
    whatsIncluded: [
      'Installation, repair and replacement',
      'Wiring, switches, sockets, lights, fans, etc.',
      'Safe & standard electrical work',
      'For entire home (all rooms)',
      '1 year service support',
    ],
  },
  'fan-installation': {
    tagline: 'Expert installation of ceiling fans, exhaust fans and designer fans.',
    image: '/assets/services/electrician/fan-installation.webp',
    badges: [
      { icon: 'user', label: 'Verified Professionals' },
      { icon: 'package', label: 'Quality Installation' },
      { icon: 'shield', label: 'Safe & Secure' },
      { icon: 'clock', label: '1 Year Service Support' },
    ],
    whatsIncluded: [
      'Safe and professional installation',
      'Proper wiring and connection',
      'Checking of speed & balance',
      'Cleanup after installation',
      '1 year service support',
    ],
  },
  'light-installation': {
    tagline: 'Professional installation of LED lights, panel lights, chandeliers and decorative lighting.',
    image: '/assets/services/electrician/light-installation.webp',
    badges: [
      { icon: 'user', label: 'Verified Electricians' },
      { icon: 'package', label: 'Quality Materials' },
      { icon: 'shield', label: 'Safe Installation' },
      { icon: 'clock', label: 'On-Time Service' },
    ],
    whatsIncluded: [
      'LED and panel light installation',
      'Chandelier and decorative light fitting',
      'Proper wiring and connection',
      'Ceiling and wall light installation',
      'Testing for safety and functionality',
      'Neat finishing and cleanup',
      '1 year service support',
    ],
  },
  'switch-socket-installation': {
    tagline: 'Modern, safe and professional installation for all types of switches & sockets.',
    image: '/assets/services/electrician/switch-socket-installation.webp',
    badges: [
      { icon: 'package', label: 'Branded Products' },
      { icon: 'user', label: 'Certified Electricians' },
      { icon: 'shield', label: 'Neat Finishing' },
      { icon: 'clock', label: '1 Year Service Support' },
    ],
    whatsIncluded: [
      'Installation of all types of switches & sockets',
      'Proper wiring and connection',
      'Alignment and neat finishing',
      'Testing for safety and functionality',
      'Replacement of old switches (optional)',
      '1 year service support',
    ],
  },
  'wiring-rewiring-services': {
    tagline: 'Safe, reliable and standard wiring for a secure home.',
    image: '/assets/services/electrician/wiring-rewiring-services.webp',
    badges: [
      { icon: 'user', label: 'Certified Electricians' },
      { icon: 'package', label: 'Quality Materials' },
      { icon: 'shield', label: 'Safe Installation' },
      { icon: 'clock', label: '1 Year Service Support' },
    ],
    whatsIncluded: [
      'New electrical wiring installation',
      'Old wiring replacement (rewiring)',
      'Concealed or surface wiring',
      'Proper load calculation & planning',
      'Testing & safety check',
      'Cleanup after installation',
      '1 year service support',
    ],
  },
  'electrical-repair-services': {
    tagline: 'Quick, safe and reliable repair for all electrical issues in your home.',
    image: '/assets/services/electrician/electrical-repair-services.webp',
    badges: [
      { icon: 'user', label: 'Verified Electricians' },
      { icon: 'package', label: 'Genuine Spare Parts' },
      { icon: 'rupee', label: 'Transparent Pricing' },
      { icon: 'clock', label: 'Same Day Service' },
    ],
    whatsIncluded: [
      'Fault detection & diagnosis',
      'Repair of switches, sockets, lights, fans, etc.',
      'Fix short circuit, tripping, loose connection',
      'Replacement of damaged parts (if needed)',
      'Safe & standard electrical repair work',
      '1 year service support',
    ],
  },
  'mcb-db-installation': {
    tagline: 'Professional installation of MCBs, Distribution Boards & electrical protection for a safer home.',
    image: '/assets/services/electrician/mcb-db-installation.webp',
    badges: [
      { icon: 'user', label: 'Certified Electricians' },
      { icon: 'package', label: 'Branded Materials' },
      { icon: 'shield', label: 'Safe & Standard' },
      { icon: 'clock', label: '1 Year Service Support' },
    ],
    whatsIncluded: [
      'Site inspection & load assessment',
      'Installation of MCB / RCCB / ELCB',
      'Distribution board (DB) installation',
      'Proper wiring & labelling',
      'Testing & safety check',
      'Cleanup after installation',
      '1 year service support',
    ],
  },
  'appliance-installation-services': {
    tagline: 'Professional installation for all home appliances. Safe. Secure. Hassle-Free.',
    image: '/assets/services/electrician/appliance-installation-services.webp',
    badges: [
      { icon: 'user', label: 'Trained Technicians' },
      { icon: 'package', label: 'All Major Brands' },
      { icon: 'shield', label: 'Safe & Standard Setup' },
      { icon: 'clock', label: '1 Year Service Support' },
    ],
    whatsIncluded: [
      'Installation by certified electricians',
      'Proper wiring and safety check',
      'Wall mounting / fitting (where required)',
      'Testing and demonstration',
      'Cleanup after installation',
      '1 year service support',
    ],
  },
};

/** The four PDF "Add Ons"-adjacent steps into readable stage labels for the
    stepper — folded down to five stages so it reads the same way the
    existing wizard's does, whatever the service's real question count. */
export const ELECTRICIAN_STAGES = ['Type', 'Details', 'Add-Ons', 'Schedule', 'Confirm'];
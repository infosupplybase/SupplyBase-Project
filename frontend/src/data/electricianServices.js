/**
 * SUPPLYBASE — ELECTRICIAN SERVICES
 * ---------------------------------
 * The seven detailed electrician journeys, plus Light Installation which
 * keeps using the existing generic site-visit wizard rather than getting a
 * new one of its own (there's no separate detailed flow for it in the brief,
 * and none existed in the project before this).
 *
 * The actual questions, options and add-on prices for the seven detailed
 * services are NOT here — those are catalogue data (service_categories /
 * service_options in MySQL), fetched at runtime via api.serviceForm(slug),
 * the same way the original four services already work. This file only
 * holds the presentational shell around that dynamic form: the category
 * tile grid, and each service's intro screen (hero, trust badges, "what's
 * included").
 */

export const electricalCategoryIntro = {
  eyebrow: 'ELECTRICIAN SERVICES',
  title: 'Home Electrical Services',
  text: 'Certified electricians for every job — installation, repair and replacement, done safely and on time.',
  image: '/assets/services/electrical.svg',
};

/** The category list shown at /services/electrical (PDF step 2). */
export const electricianCategoryTiles = [
  {
    slug: 'home-electrical-services',
    name: 'Home Electrical Services',
    blurb: 'Complete electrical solutions for your home',
    icon: 'bolt',
    detailed: true,
  },
  {
    slug: 'fan-installation',
    name: 'Fan Installation',
    blurb: 'Ceiling & exhaust fans',
    icon: 'fan',
    detailed: true,
  },
  {
    slug: 'light-installation',
    name: 'Light Installation',
    blurb: 'LED, panel, chandelier, etc.',
    icon: 'plus',
    detailed: false,
    // Retained exactly as it already worked — the generic site-visit wizard,
    // where "Lighting installation" is one of the electrician work options.
    route: '/booking/electrical',
  },
  {
    slug: 'switch-socket-installation',
    name: 'Switch & Socket Installation',
    blurb: 'Modular switches & sockets',
    icon: 'plug',
    detailed: true,
  },
  {
    slug: 'wiring-rewiring-services',
    name: 'Wiring & Rewiring',
    blurb: 'New wiring or old wiring replacement',
    icon: 'bolt',
    detailed: true,
  },
  {
    slug: 'electrical-repair-services',
    name: 'Electrical Repair',
    blurb: 'Fix faults, short circuit, tripping, etc.',
    icon: 'wrench',
    detailed: true,
  },
  {
    slug: 'mcb-db-installation',
    name: 'MCB & DB Installation',
    blurb: 'Distribution board, MCB, RCCB',
    icon: 'shield',
    detailed: true,
  },
  {
    slug: 'appliance-installation-services',
    name: 'Appliance Installation',
    blurb: 'Geyser, chimney, AC point, etc.',
    icon: 'package',
    detailed: true,
  },
];

/**
 * Intro screen content per detailed service (PDF step 3) — everything that
 * isn't a catalogue question. `whatsIncluded` and the trust badges are
 * marketing copy, not form data, so they stay in the frontend rather than
 * being modelled as unanswerable catalogue questions.
 */
export const electricianServiceIntros = {
  'home-electrical-services': {
    tagline: 'Complete electrical solutions for a safe and modern home.',
    image: '/assets/services/electrical.svg',
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
    image: '/assets/services/electrical.svg',
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
  'switch-socket-installation': {
    tagline: 'Modern, safe and professional installation for all types of switches & sockets.',
    image: '/assets/services/electrical.svg',
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
    image: '/assets/services/electrical.svg',
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
    image: '/assets/services/electrical.svg',
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
    image: '/assets/services/electrical.svg',
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
    image: '/assets/services/electrical.svg',
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

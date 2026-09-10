/**
 * SUPPLYBASE — PLUMBING SERVICES: PRESENTATIONAL CONTENT
 * -------------------------------------------------------
 * Names, descriptions and prices are NOT here — those come live from the
 * catalogue (GET /api/catalogue/services/plumbing/form), the same source of
 * truth every other category uses, so this page can never drift from the
 * real, server-trusted rate card. This file only holds the things the
 * catalogue has no column for: hero copy, tab icons and card photographs.
 *
 * Images: the project has no per-sub-service plumbing photography (no
 * distinct toilet/tap/basin/pipe/tank photos) and none was supplied. The one
 * real plumbing photo already in the project (/assets/hero/plumbing.png, a
 * plumber working under a sink) has marketing text, trust icons and a fee
 * panel baked into roughly its left 55% — at a full-width hero (viewport
 * ≥ ~1280px) object-fit:cover's own horizontal crop isn't enough to hide it
 * (the scaled image's width matches the container's, so nothing overflows
 * to crop away), so that text showed through behind this page's own real
 * HTML heading. Fixed by pre-cropping a text-free 772x941 strip from the
 * clean right-hand portion of that same source photo — see
 * /assets/plumbing/hero-plumber.jpg — and using THAT as the hero background
 * across every plumbing page instead. It is reused, not new photography.
 * The nine overview-card thumbnails ARE real, distinct product photography:
 * cropped directly from the client-supplied SupplyBase_Actual_Screenshots_Catalog.pdf
 * at the small size these cards actually render at (the PDF's own source
 * images are too low-resolution — as low as 463x1000px for the whole phone
 * mockup — to extract at any larger size without visibly softening). Per-item
 * row thumbnails (the ~49 individual line items) use the existing gold
 * outline icon set instead: at native PDF resolution each item photo is only
 * ~35-70px, well below "sufficient quality" for even a small UI thumbnail.
 * See the redesign summary for the full asset-sourcing note.
 */

export const PLUMBING_HERO_IMAGE = '/assets/plumbing/hero-plumber.jpg';

export const plumbingOverviewIntro = {
  eyebrow: 'PLUMBING SERVICES',
  title: 'Plumbing Services',
  text: 'Verified plumbers. Quality materials. Transparent pricing. On-time service.',
};

/** Order here = display order everywhere (overview grid, tab bar). */
export const plumbingTabs = [
  {
    slug: 'toilet-installation',
    group: 'Toilet Installation',
    name: 'Toilet Installation',
    icon: 'droplet',
    heroTagline: 'Hygienic homes. Hassle-free installation.',
    overviewImage: '/assets/plumbing/overview/toilet-installation.jpg',
    filterTabs: ['All Services', 'Western Toilet', 'Indian Toilet', 'Flush System', 'Accessories'],
  },
  {
    slug: 'tap-faucet-installation',
    group: 'Tap & Faucet Installation',
    name: 'Tap & Faucet Installation',
    icon: 'tap',
    heroTagline: 'Precise fittings, zero drips.',
    overviewImage: '/assets/plumbing/overview/tap-faucet-installation.jpg',
    filterTabs: ['All Services', 'Taps', 'Faucets', 'Mixers', 'Angle Valves', 'Accessories'],
  },
  {
    slug: 'bathroom-fitting',
    group: 'Bathroom Fitting',
    name: 'Bathroom Fitting',
    icon: 'droplet',
    heroTagline: 'Complete bathroom fitting solutions for a modern and functional space.',
    overviewImage: '/assets/plumbing/overview/bathroom-fitting.jpg',
    filterTabs: ['All Services', 'Showers', 'Accessories', 'Fittings', 'Repair & Replacement'],
  },
  {
    slug: 'basin-sink-installation',
    group: 'Basin & Sink Installation',
    name: 'Basin & Sink Installation',
    icon: 'tap',
    heroTagline: 'Expert installation for a cleaner, smarter home.',
    overviewImage: '/assets/plumbing/overview/basin-sink-installation.jpg',
    filterTabs: ['All Services', 'Wash Basin', 'Kitchen Sink', 'Accessories', 'Repairs', 'Other Services'],
  },
  {
    slug: 'bathroom-accessories',
    group: 'Bathroom Accessories',
    name: 'Bathroom Accessories',
    icon: 'ruler',
    heroTagline: 'Small details. A more beautiful home.',
    overviewImage: '/assets/plumbing/overview/bathroom-accessories.jpg',
    filterTabs: ['All Accessories', 'Towel Racks', 'Soap Holders', 'Mirrors & Shelves', 'Hooks', 'Other Accessories'],
  },
  {
    slug: 'drainage-blockage',
    group: 'Drainage & Blockage',
    name: 'Drainage & Blockage',
    icon: 'droplet',
    heroTagline: 'Fast. Clean. Reliable. We keep your home flowing.',
    overviewImage: '/assets/plumbing/overview/drainage-blockage.jpg',
    filterTabs: ['All Services', 'Drain Cleaning', 'Pipe Repair', 'Blockage Removal', 'Inspection'],
  },
  {
    slug: 'leakage-repair-connections',
    group: 'Leakage Repair & Connections',
    name: 'Leakage Repair & Connections',
    icon: 'wrench',
    heroTagline: 'Identify. Repair. Prevent. For a leak-free home.',
    overviewImage: '/assets/plumbing/overview/leakage-repair-connections.jpg',
    filterTabs: ['All Services', 'Leakage Repair', 'Pipe Connections', 'Water Supply', 'Other Services'],
  },
  {
    slug: 'water-tank-motor-installation',
    group: 'Water Tank & Motor Installation',
    name: 'Water Tank & Motor Installation',
    icon: 'package',
    heroTagline: 'Safe water. Smooth flow. For a hassle-free home.',
    overviewImage: '/assets/plumbing/overview/water-tank-motor-installation.jpg',
    filterTabs: ['All Services', 'Water Tank', 'Motor', 'Pipeline & Fittings', 'Repairs', 'Other Services'],
  },
];

export const plumbingConsultationContent = {
  slug: 'consultation',
  name: 'Book a Consultation',
  overviewImage: '/assets/plumbing/overview/consultation.jpg',
  heroTagline: 'Get expert advice for all your home service needs.',
};

/** A rough per-item icon, used only where the item name doesn't map cleanly
    to its tab's default icon (e.g. accessories, which mixes several kinds
    of fitting). Falls back to the tab's own icon when a slug isn't listed. */
export const ITEM_ICON_OVERRIDES = {
  'toilet-seat-installation': 'droplet',
  'flush-mechanism-repair': 'wrench',
  'flush-tank-installation': 'droplet',
  'towel-rod-installation': 'ruler',
  'towel-rack-installation': 'ruler',
  'soap-dish-installation': 'droplet',
  'tumbler-holder-installation': 'droplet',
  'robe-hook-installation': 'ruler',
  'toilet-paper-holder-installation': 'ruler',
  'glass-shelf-installation': 'ruler',
  'bathroom-mirror-installation': 'ruler',
  'motor-repair-replacement': 'wrench',
  'drain-pipe-repair': 'wrench',
  'pipe-leakage-repair': 'wrench',
  'tap-faucet-leakage-repair': 'wrench',
  'toilet-connection-leak-repair': 'wrench',
  'sink-basin-connection-repair': 'wrench',
};

export const plumbingTrustPoints = [
  { icon: 'shield', label: 'Verified Plumbers' },
  { icon: 'award', label: 'Quality Materials' },
  { icon: 'rupee', label: 'Transparent Pricing' },
  { icon: 'clock', label: 'On-Time Service' },
];

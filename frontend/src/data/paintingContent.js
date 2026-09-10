/**
 * SUPPLYBASE — PAINTING SERVICES: PRESENTATIONAL CONTENT
 * --------------------------------------------------------
 * Names, descriptions and prices are NOT here — those come live from the
 * catalogue (GET /api/catalogue/services/painting/form), the same source of
 * truth every other category uses (see V15 migration). This file only holds
 * what the catalogue has no column for: hero copy, step titles, icons and
 * photographs.
 *
 * IMAGES: matched against the approved reference (SupplyBase_Painting_Services.pdf).
 * Real project photography reused everywhere a suitable shot exists:
 *   - hero/painting.png (existing site asset) cropped to its clean
 *     photograph (painter + roller + wall), text removed since this file's
 *     own components render real HTML text on top instead — same technique
 *     already used for the plumbing hero.
 *   - projects/painting-finishing.jpeg / projects/modern-interior.jpeg
 *     (existing project photography) for the Full Home and Few Walls intro
 *     screens — a premium living room and a TV-wall living room
 *     respectively, both genuine matches for what those two flows sell.
 *   - materials/asian-paints.png and materials/berger-paints.jpg (existing
 *     real brand assets) for brand selection — no logo was generated or
 *     extracted; both are the project's own files, and Berger's already
 *     carries its real "Paint your imagination" tagline, matching the
 *     reference exactly.
 *
 * GAP, reported rather than faked: the reference's "Common Wall Problems"
 * photos (cracks, dampness, peeling paint, stains, mould, faded walls) and
 * the per-product paint-can packshots have no real equivalent anywhere in
 * this project, and the PDF's own embedded images are far too low-resolution
 * to extract (an entire 13-screen page is only ~1000×667px natively) — using
 * them would mean stretching a soft, tiny crop into a real banner, which the
 * brief explicitly rules out. Both use the existing gold-outline icon set
 * instead, the same documented trade-off already made for plumbing's ~49
 * line-item thumbnails this same project made earlier.
 */

export const PAINTING_HERO_IMAGE = '/assets/painting/hero/painter-roller.jpg';

export const paintingOverviewIntro = {
  eyebrow: 'PAINTING',
  title: 'Paint Your Space',
  text: 'Professional painting for a brighter tomorrow.',
};

export const paintingTrustPoints = [
  { icon: 'shield', label: 'Trusted Professionals' },
  { icon: 'award', label: 'Premium Paint Brands' },
  { icon: 'droplet', label: 'Clean & Safe Execution' },
  { icon: 'check-circle', label: 'Warranty on Work' },
];

/** The four category cards on /services/painting. "Room Painting" has no
    detailed journey of its own in the reference or the existing site — it
    reuses the Few Walls flow's area-first structure per the brief ("reuse
    the appropriate room-selection flow without inventing unsupported
    packages or prices"), rather than a fourth invented wizard. */
export const paintingCategories = [
  {
    slug: 'full-home',
    name: 'Full Home Painting',
    tagline: 'Complete painting for your entire home',
    image: '/assets/projects/painting-finishing.jpeg',
    route: '/services/painting/full-home',
  },
  {
    slug: 'few-walls',
    name: 'Few Walls Painting',
    tagline: 'Perfect for a quick refresh',
    image: '/assets/projects/modern-interior.jpeg',
    route: '/services/painting/few-walls',
  },
  {
    slug: 'room',
    name: 'Room Painting',
    tagline: 'Bedroom, Living Room, Kitchen',
    image: '/assets/popular-services/painting.png',
    route: '/services/painting/few-walls',
  },
  {
    slug: 'renovation',
    name: 'Renovation Painting',
    tagline: 'For old / damaged walls',
    image: '/assets/painting/overview/renovation-painting.jpg',
    route: '/services/painting/renovation',
  },
];

/** Brand hint copy shown under the brand picker — matches the reference's
    "Why Asian Paints?" checklist; Berger gets its own real tagline instead
    of an invented equivalent, since the reference never shows a "Why
    Berger?" list. */
export const BRAND_WHY = {
  'asian-paints': [
    'Wide range of colours',
    'Long lasting finish',
    'Trusted brand',
    'Low odour options',
    'Stain resistant',
    'Perfect for Indian homes',
  ],
};

/** Shown on the product step when the selected brand/tier combination has no
    priced catalogue data — see V15's gap notes (Berger has no product data
    at all; Full Home has no Economy/Luxury tier; Few Walls has no
    Premium/Luxury tier). Never fabricated — an honest next step instead. */
export const PRODUCT_GAP_MESSAGE =
  'Our team will help you choose the right product and share exact pricing during your free home visit.';

/** Colour swatch tab order — Full Home/Few Walls share one tab set, Renovation
    uses a different one (Warm/Cool instead of Brights), matching the
    reference exactly. Tab membership itself comes from the catalogue's own
    option_group per swatch. */
export const COLOUR_TABS = {
  standard: ['Popular', 'Neutrals', 'Brights'],
  renovation: ['Popular', 'Neutrals', 'Warm', 'Cool'],
};

const WHATS_INCLUDED_STANDARD = [
  'Surface preparation',
  '1 coat putty',
  '1 coat lambi',
  '1 coat primer',
  '2 coats colour',
  'Furniture & floor protection',
  'Clean-up after work',
  'Post-service support',
];

const WHATS_INCLUDED_RENOVATION = [
  'Surface repair & crack filling',
  '1 coat putty, 1 coat lambi',
  '1 coat primer',
  '2 coats colour',
  'Anti-fungal treatment (if selected)',
  'Clean-up after work',
  'Post-service support',
];

/** The six problems the Renovation intro calls out — illustrative icons only
    (see the file-level gap note above), matching the reference's own six. */
export const WALL_PROBLEMS = [
  { icon: 'wall-crack', label: 'Cracks' },
  { icon: 'droplet', label: 'Dampness' },
  { icon: 'wall-peel', label: 'Peeling Paint' },
  { icon: 'wall-stain', label: 'Stains' },
  { icon: 'wall-mould', label: 'Mould / Fungus' },
  { icon: 'wall-faded', label: 'Old / Faded Walls' },
];

/** Icon per add-on / repair line — falls back to 'roller' when a slug isn't
    listed. */
export const ITEM_ICON_OVERRIDES = {
  'ceiling-painting': 'ceiling',
  'doors-windows-painting': 'wardrobe',
  'grill-painting': 'ruler',
  'waterproofing-treatment': 'droplet',
  'texture-feature-wall': 'layers',
  'deep-cleaning': 'sparkle',
  'furniture-shifting': 'package',
  'crack-filling': 'wall-crack',
  'peeling-paint-removal': 'wall-peel',
  'damp-treatment': 'droplet',
  'wall-putty': 'trowel',
  lambi: 'trowel',
  primer: 'roller',
  'anti-fungal-coating': 'wall-mould',
  'wall-stencil-design': 'palette',
  'wood-metal-painting': 'wrench',
};

/**
 * One config object per flow — the single source the generic PaintingFlow
 * page renders from. Every step is numbered consecutively (no compressed
 * "step 3 of 4" covering four actual screens the way the reference's own
 * dot-indicator does) per the brief's instruction to keep the journey
 * "complete and consistently numbered".
 */
export const paintingFlows = {
  'full-home': {
    slug: 'full-home',
    name: 'Full Home Painting',
    heroTagline: 'Give your entire home a fresh, beautiful look.',
    introHeading: 'Complete Home Painting',
    introText: 'Give your entire home a fresh, beautiful look with professional painting.',
    introImage: '/assets/projects/painting-finishing.jpeg',
    introTrustPoints: [
      { icon: 'award', label: 'Premium Paint Brands' },
      { icon: 'users', label: 'Skilled Professionals' },
      { icon: 'droplet', label: 'Clean & Safe Execution' },
      { icon: 'shield', label: 'Service Warranty' },
    ],
    whatsIncluded: WHATS_INCLUDED_STANDARD,
    colourTabSet: 'standard',
    steps: [
      { id: 'home_type', type: 'option', questionKey: 'home_type', title: 'Choose Your Home Type', showThumb: true },
      { id: 'painting_type', type: 'option', questionKey: 'full_home_painting_type', title: 'Choose Painting Type', showThumb: false, icon: 'roller' },
      { id: 'brand', type: 'brand', title: 'Choose Paint Brand' },
      { id: 'product', type: 'product', questionKey: 'full_home_product', title: 'Select Product Range' },
      { id: 'colour', type: 'colour', questionKey: 'full_home_colour', title: 'Choose Your Colours' },
      { id: 'addons', type: 'addon', questionKey: 'full_home_addon', title: 'Add-on Services' },
      { id: 'summary', type: 'summary', title: 'Your Selection' },
    ],
  },
  'few-walls': {
    slug: 'few-walls',
    name: 'Few Walls Painting',
    heroTagline: 'Give your favourite walls a fresh, new look.',
    introHeading: 'Few Walls Painting',
    introText: 'Give your favourite walls a fresh, new look with professional painting.',
    introImage: '/assets/projects/modern-interior.jpeg',
    introTrustPoints: [
      { icon: 'award', label: 'Trusted Brands' },
      { icon: 'palette', label: 'Colour Consultation' },
      { icon: 'clock', label: 'Hassle-Free Execution' },
      { icon: 'shield', label: 'Warranty on Work' },
    ],
    whatsIncluded: WHATS_INCLUDED_STANDARD,
    colourTabSet: 'standard',
    steps: [
      { id: 'area', type: 'option', questionKey: 'few_walls_area', title: 'Which Area Do You Want to Paint?', showThumb: false, icon: 'building', notSureNote: true },
      { id: 'painting_type', type: 'option', questionKey: 'few_walls_painting_type', title: 'Choose Painting Type', showThumb: false, icon: 'roller' },
      { id: 'brand', type: 'brand', title: 'Choose Paint Brand' },
      { id: 'product', type: 'product', questionKey: 'few_walls_product', title: 'Select Product Range' },
      { id: 'colour', type: 'colour', questionKey: 'few_walls_colour', title: 'Choose Your Colours' },
      { id: 'addons', type: 'addon', questionKey: 'few_walls_addon', title: 'Add-on Services' },
      { id: 'summary', type: 'summary', title: 'Your Selection' },
    ],
  },
  renovation: {
    slug: 'renovation',
    name: 'Renovation Painting',
    heroTagline: 'We repair, prepare and give your walls a fresh, long-lasting finish.',
    introHeading: 'Renovation Painting',
    introText:
      'Say goodbye to old, stained and damaged walls. We repair, prepare and give your walls a fresh, long-lasting finish.',
    introImage: '/assets/painting/overview/renovation-painting.jpg',
    introTrustPoints: [
      { icon: 'trowel', label: 'Surface Repair' },
      { icon: 'award', label: 'Premium Products' },
      { icon: 'users', label: 'Expert Execution' },
      { icon: 'shield', label: 'Warranty on Work' },
    ],
    whatsIncluded: WHATS_INCLUDED_RENOVATION,
    colourTabSet: 'renovation',
    steps: [
      { id: 'area', type: 'option', questionKey: 'renovation_area', title: 'Where Do You Need Renovation Painting?', showThumb: false, icon: 'building' },
      { id: 'repair', type: 'addon', questionKey: 'renovation_repair', title: 'Select Repair & Preparation Work', required: true },
      { id: 'brand', type: 'brand', title: 'Choose Paint Brand' },
      { id: 'product', type: 'product', questionKey: 'renovation_product', title: 'Select Paint / Finish' },
      { id: 'colour', type: 'colour', questionKey: 'renovation_wall_colour', title: 'Choose Your Wall Colour' },
      { id: 'ceiling_colour', type: 'colour', questionKey: 'renovation_ceiling_colour', title: 'Choose Your Ceiling Colour', optional: true },
      { id: 'addons', type: 'addon', questionKey: 'renovation_addon', title: 'Add-on Services' },
      { id: 'summary', type: 'summary', title: 'Your Selection' },
    ],
    closing: {
      heading: 'Old Walls. New Beginnings.',
      cta: 'Explore Painting Services',
    },
  },
};

export default { PAINTING_HERO_IMAGE, paintingOverviewIntro, paintingCategories, paintingTrustPoints, paintingFlows };

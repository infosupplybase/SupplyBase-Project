/**
 * SUPPLYBASE — INTERIOR DESIGN CATALOGUE
 * ---------------------------------------
 * Presentational + catalogue content for the Interior Design section —
 * separate from, and independent of, Interior by Choice
 * (data/interiorCatalog.js), which keeps its own routes, category and
 * records untouched. Real prices, hints and copy live here; nothing about
 * pricing is computed or summed server-side (see V18's migration comment
 * on why — same "no real cart" reasoning as Waterproofing, plus this
 * category's own established sibling, Interior by Choice, which already
 * keeps its whole catalogue in a frontend file rather than the database).
 *
 * IMAGE SOURCES — real existing project photography only, reused across
 * multiple project cards the same way interiorCatalog.js already does
 * (that file's own header comment calls this out explicitly: a small,
 * honestly-labelled set of real photos standing in for photography this
 * project doesn't have yet, not one-photo-per-project):
 * - projects/modern-interior.jpeg and pop-ceiling/hero/living-room-cove.jpg
 *   (a crop of hero/interior-design.png, already used for POP Ceiling) —
 *   the two real, high-resolution living-room photos in this project.
 * - projects/office-fitout.jpeg — reused for "urban"/"industrial"-leaning
 *   entries; it's an office interior, not residential, the closest
 *   available match for that visual register.
 * - projects/luxury-bungalow.jpeg and projects/villa-renovation.jpeg —
 *   genuine villa exteriors (with interior glimpses through glass), used
 *   for the two Villa entries.
 * ONLY the illustrated reference example, "Modern Minimal" (1 BHK,
 * Mumbai), carries real package prices, area, timeline and warranty — see
 * V18's migration comment: inventing numbers for the other 11 projects
 * would violate the brief's own instruction not to guess 2 BHK/3 BHK/
 * Villa pricing, so they show "Quotation after site visit" instead.
 */

export const ID_HERO_IMAGE = '/assets/projects/modern-interior.jpeg';

export const idOverviewIntro = {
  eyebrow: 'INTERIOR DESIGN',
  title: 'Interior Design',
  text: 'Your Style. Our Expertise. Complete Home Interiors. Designed Around You.',
};

export const idTrustPoints = [
  { icon: 'award', label: 'Verified Designers' },
  { icon: 'package', label: 'Branded Materials' },
  { icon: 'shield', label: 'Warranty Backed' },
  { icon: 'inspect', label: 'Site Consultation' },
];

export const idProjectTypeFilters = [
  { key: 'all', label: 'All' },
  { key: 'apartment', label: 'Apartments' },
  { key: 'villa', label: 'Villas' },
  { key: 'custom', label: 'Custom' },
];

export const idCategories = [
  {
    slug: '1bhk',
    name: '1 BHK Interiors',
    type: 'apartment',
    tagline: 'Smart. Stylish. Affordable.',
    areaNote: 'Up to 650 sq. ft.',
    image: ID_HERO_IMAGE,
  },
  {
    slug: '2bhk',
    name: '2 BHK Interiors',
    type: 'apartment',
    tagline: 'Perfect Balance of Space & Style.',
    areaNote: '650 – 1,000 sq. ft.',
    image: '/assets/pop-ceiling/hero/living-room-cove.jpg',
  },
  {
    slug: '3bhk',
    name: '3 BHK Interiors',
    type: 'apartment',
    tagline: 'More Space. More Possibilities.',
    areaNote: '1,000 – 1,500 sq. ft.',
    image: '/assets/projects/office-fitout.jpeg',
  },
  {
    slug: 'villa',
    name: 'Villa Interiors',
    type: 'villa',
    tagline: 'Luxury Living Without Limits.',
    areaNote: '1,500 sq. ft. and above',
    image: '/assets/projects/luxury-bungalow.jpeg',
  },
];

/** The one project with real reference numbers — everything else shows an
    honest "quote after site visit" state (see V18's migration comment). */
export const ID_REFERENCE_PROJECT_SLUG = 'modern-minimal';

export const ID_REFERENCE_PACKAGES = {
  standard: { priceRupees: 499000, priceDisplay: '₹4.99 Lakhs' },
  premium: { priceRupees: 699000, priceDisplay: '₹6.99 Lakhs' },
  luxury: { priceRupees: 999000, priceDisplay: '₹9.99 Lakhs' },
};

export const ID_REFERENCE_STATS = {
  areaSqft: '650 sq. ft.',
  timeline: '45 – 60 Days',
  warranty: '5 Years',
};

export const idPackageTiers = [
  { key: 'standard', name: 'Standard', blurb: 'Smart designs, great functionality.', icon: 'sofa' },
  { key: 'premium', name: 'Premium', blurb: 'Elevated living, premium finishes.', icon: 'award' },
  { key: 'luxury', name: 'Luxury', blurb: 'Bespoke design, ultimate experience.', icon: 'sparkle' },
];

/** Shared across every tier's card — the reference shows one inclusion
    grid below the package cards, not a different list per tier, so this
    project does the same rather than inventing per-tier feature splits
    the reference never specifies. */
export const idInclusions = [
  { icon: 'ruler', label: 'Design & Execution' },
  { icon: 'package', label: 'Modular Kitchen' },
  { icon: 'wardrobe', label: 'Wardrobes & Storage' },
  { icon: 'ceiling', label: 'False Ceiling & Lighting' },
  { icon: 'roller', label: 'Painting & Finishes' },
  { icon: 'award', label: 'Branded Materials' },
  { icon: 'blueprint', label: 'Project Management' },
  { icon: 'shield', label: 'Up to 5 Years Warranty' },
];

export const idStyles = [
  { key: 'modern', name: 'Modern', hint: 'Contemporary look', icon: 'layers' },
  { key: 'classic', name: 'Classic', hint: 'Timeless design', icon: 'award' },
  { key: 'luxury', name: 'Luxury', hint: 'Premium finish', icon: 'shield' },
  { key: 'contemporary', name: 'Contemporary', hint: 'Bold and current', icon: 'palette' },
  { key: 'minimal', name: 'Minimal', hint: 'Clean and simple', icon: 'sparkle' },
  { key: 'scandinavian', name: 'Scandinavian', hint: 'Light and functional', icon: 'ruler' },
];

export const idColourThemes = [
  { key: 'white', name: 'White', hex: '#f5f3ef' },
  { key: 'beige', name: 'Beige', hex: '#d8c9b0' },
  { key: 'grey', name: 'Grey', hex: '#9a9a9a' },
  { key: 'wood', name: 'Wood', hex: '#a87c52' },
  { key: 'black', name: 'Black', hex: '#1c1c1c' },
];

/**
 * 12 projects, real photography reused honestly (see header note). Only
 * `modern-minimal` carries real pricing/area/timeline/warranty — every
 * other project's `hasReferencePricing` is false, driving the honest
 * "Quotation after site visit" state on the package screen.
 */
export const idProjects = [
  // ------------------------------------------------------------- 1 BHK
  {
    slug: 'modern-minimal',
    categorySlug: '1bhk',
    name: 'Modern Minimal',
    location: 'Mumbai',
    tier: 'standard',
    image: '/assets/projects/modern-interior.jpeg',
    hasReferencePricing: true,
  },
  {
    slug: 'urban-elegant',
    categorySlug: '1bhk',
    name: 'Urban Elegant',
    location: 'Pune',
    tier: 'premium',
    image: '/assets/pop-ceiling/hero/living-room-cove.jpg',
    hasReferencePricing: false,
  },
  {
    slug: 'warm-contemporary',
    categorySlug: '1bhk',
    name: 'Warm Contemporary',
    location: 'Bangalore',
    tier: 'standard',
    image: '/assets/projects/office-fitout.jpeg',
    hasReferencePricing: false,
  },
  {
    slug: 'classic-white',
    categorySlug: '1bhk',
    name: 'Classic White',
    location: 'Thane',
    tier: 'premium',
    image: '/assets/projects/modern-interior.jpeg',
    hasReferencePricing: false,
  },
  {
    slug: 'earthy-modern',
    categorySlug: '1bhk',
    name: 'Earthy Modern',
    location: 'Navi Mumbai',
    tier: 'standard',
    image: '/assets/pop-ceiling/hero/living-room-cove.jpg',
    hasReferencePricing: false,
  },
  {
    slug: 'industrial-chic',
    categorySlug: '1bhk',
    name: 'Industrial Chic',
    location: 'Hyderabad',
    tier: 'luxury',
    image: '/assets/projects/office-fitout.jpeg',
    hasReferencePricing: false,
  },

  // ------------------------------------------------------------- 2 BHK
  {
    slug: 'coastal-comfort',
    categorySlug: '2bhk',
    name: 'Coastal Comfort',
    location: 'Panvel',
    tier: 'standard',
    image: '/assets/projects/modern-interior.jpeg',
    hasReferencePricing: false,
  },
  {
    slug: 'heritage-warmth',
    categorySlug: '2bhk',
    name: 'Heritage Warmth',
    location: 'Kalyan',
    tier: 'premium',
    image: '/assets/pop-ceiling/hero/living-room-cove.jpg',
    hasReferencePricing: false,
  },

  // ------------------------------------------------------------- 3 BHK
  {
    slug: 'skyline-modern',
    categorySlug: '3bhk',
    name: 'Skyline Modern',
    location: 'Mumbai',
    tier: 'premium',
    image: '/assets/projects/office-fitout.jpeg',
    hasReferencePricing: false,
  },
  {
    slug: 'garden-retreat',
    categorySlug: '3bhk',
    name: 'Garden Retreat',
    location: 'Thane',
    tier: 'luxury',
    image: '/assets/projects/modern-interior.jpeg',
    hasReferencePricing: false,
  },

  // ------------------------------------------------------------- Villa
  {
    slug: 'luxury-villa-escape',
    categorySlug: 'villa',
    name: 'Luxury Villa Escape',
    location: 'Pune',
    tier: 'luxury',
    image: '/assets/projects/luxury-bungalow.jpeg',
    hasReferencePricing: false,
  },
  {
    slug: 'poolside-villa',
    categorySlug: 'villa',
    name: 'Poolside Villa',
    location: 'Navi Mumbai',
    tier: 'luxury',
    image: '/assets/projects/villa-renovation.jpeg',
    hasReferencePricing: false,
  },
];

export const getCategoryBySlug = (slug) => idCategories.find((c) => c.slug === slug);
export const getProjectsByCategory = (categorySlug) => idProjects.filter((p) => p.categorySlug === categorySlug);
export const getProjectBySlug = (categorySlug, projectSlug) =>
  idProjects.find((p) => p.categorySlug === categorySlug && p.slug === projectSlug);

export const idWhatsNext = [
  { title: 'Expert Confirmation', text: 'Our team will call you shortly to confirm your booking.' },
  { title: 'Site Visit / Home Consultation', text: 'Our interior expert will visit your home at the scheduled time.' },
  { title: 'Design Discussion', text: "We'll understand your needs, suggest ideas and share a customised plan." },
  { title: 'Detailed Quotation', text: 'Receive a detailed quotation based on your selections and the site visit.' },
  { title: '₹99 Adjusted in Final Bill', text: 'If you proceed, the ₹99 consultation fee is adjusted in your final project cost.' },
];

export const idProcessSteps = [
  { icon: 'chat', label: 'Consult' },
  { icon: 'blueprint', label: 'Design' },
  { icon: 'helmet', label: 'Execute' },
  { icon: 'handover', label: 'Handover' },
];

/** Reuses the same three FAQs already approved for Interior Design in
    data/services.js, rather than inventing new ones for this screen. */
export const idFaqs = [
  { q: 'How long does a full home interior take?', a: 'A 2BHK turnkey interior typically takes 45 to 60 days from design approval, depending on the scope and material availability.' },
  { q: 'Can I choose my own materials and brands?', a: 'Yes. We work to a written material specification and you can upgrade or change any item before production starts.' },
  { q: 'Do you handle the electrical and false ceiling too?', a: 'Yes — those are our own services, so the whole fit-out is delivered by one team on one schedule.' },
];

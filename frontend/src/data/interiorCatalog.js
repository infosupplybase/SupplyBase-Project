/**
 * SUPPLYBASE — INTERIOR BY CHOICE CATALOGUE
 * ------------------------------------------
 * A browsable, ready-made design catalogue: pick a space, pick a design,
 * book a ₹99 home visit. This is placeholder content — real photography,
 * pricing and material specs replace it before launch — but the shape
 * (space -> designs -> colours/features/material detail) is the real one
 * the UI is built against.
 *
 * Booking submitted through this flow does not yet take a live payment;
 * see InteriorBooking.jsx.
 */

export const interiorSpaces = [
  {
    slug: 'living-room',
    name: 'Living Room',
    image: '/assets/projects/modern-interior.jpeg',
  },
  {
    slug: 'bedroom',
    name: 'Bedroom',
    image: '/assets/projects/painting-finishing.jpeg',
  },
  {
    slug: 'tv-wall',
    name: 'TV Wall',
    image: '/assets/projects/office-fitout.jpeg',
  },
  {
    slug: 'dining-area',
    name: 'Dining Area',
    image: '/assets/projects/retail-showroom.jpeg',
  },
  {
    slug: 'home-entrance',
    name: 'Home Entrance',
    image: '/assets/projects/hero-house.jpeg',
  },
  {
    slug: 'office-commercial',
    name: 'Office / Commercial',
    image: '/assets/projects/office-fitout.jpeg',
  },
];

/* Shared vocabulary so every design's feature list points at the same icon
   and label rather than each entry spelling it out. */
export const interiorFeatures = {
  waterproof: { icon: 'droplet', label: 'Waterproof' },
  'termite-resistant': { icon: 'shield', label: 'Termite Resistant' },
  'easy-clean': { icon: 'check-circle', label: 'Easy to Clean' },
  warranty: { icon: 'award', label: '5 Years Warranty' },
};

export const interiorDesigns = [
  /* ---------------------------------------------------------- TV Wall */
  {
    slug: 'modern-minimal',
    spaceSlug: 'tv-wall',
    name: 'Modern Minimal',
    tagline: 'Clean lines. Timeless look.',
    pricePerSqft: 699,
    image: '/assets/projects/modern-interior.jpeg',
    colours: ['#6b4a34', '#2e2e2e', '#d8c9b0', '#9a9a9a', '#a87c52', '#3b2a20'],
    features: ['waterproof', 'termite-resistant', 'easy-clean', 'warranty'],
    materialDetails: {
      'Panel Type': 'WPC / MDF Fluted Panel',
      Thickness: '8 mm / 12 mm',
      Finish: 'Matte / Woodgrain',
      'Installation Time': '1–2 Days',
    },
  },
  {
    slug: 'marble-luxury',
    spaceSlug: 'tv-wall',
    name: 'Marble Luxury',
    tagline: 'A statement stone finish.',
    pricePerSqft: 1199,
    image: '/assets/projects/retail-showroom.jpeg',
    colours: ['#efe9e2', '#c9c2b8', '#8a8478', '#3a3733'],
    features: ['easy-clean', 'warranty'],
    materialDetails: {
      'Panel Type': 'Marble-finish PVC Panel',
      Thickness: '10 mm',
      Finish: 'Glossy Marble',
      'Installation Time': '2–3 Days',
    },
  },
  {
    slug: 'wood-white',
    spaceSlug: 'tv-wall',
    name: 'Wood & White',
    tagline: 'Warm wood meets crisp white.',
    pricePerSqft: 899,
    image: '/assets/projects/painting-finishing.jpeg',
    colours: ['#ffffff', '#c9a876', '#8a6a45', '#e8e4dc'],
    features: ['waterproof', 'easy-clean', 'warranty'],
    materialDetails: {
      'Panel Type': 'WPC Fluted + Laminate',
      Thickness: '8 mm',
      Finish: 'Matte',
      'Installation Time': '1–2 Days',
    },
  },
  {
    slug: 'stone-texture',
    spaceSlug: 'tv-wall',
    name: 'Stone Texture',
    tagline: 'Raw texture, refined edge.',
    pricePerSqft: 1099,
    image: '/assets/projects/office-fitout.jpeg',
    colours: ['#5a5650', '#8a8378', '#2b2924', '#b3ab9c'],
    features: ['waterproof', 'termite-resistant', 'warranty'],
    materialDetails: {
      'Panel Type': 'Stone-veneer PU Panel',
      Thickness: '12 mm',
      Finish: 'Textured Matte',
      'Installation Time': '2–3 Days',
    },
  },
  {
    slug: 'classic-elegant',
    spaceSlug: 'tv-wall',
    name: 'Classic Elegant',
    tagline: 'Traditional panelling, elevated.',
    pricePerSqft: 899,
    image: '/assets/projects/modern-interior.jpeg',
    colours: ['#3b2a20', '#6b4a34', '#d8c9b0', '#1c1c1c'],
    features: ['termite-resistant', 'easy-clean', 'warranty'],
    materialDetails: {
      'Panel Type': 'MDF Moulded Panel',
      Thickness: '12 mm',
      Finish: 'Satin',
      'Installation Time': '2 Days',
    },
  },
  {
    slug: 'contemporary-colour',
    spaceSlug: 'tv-wall',
    name: 'Contemporary Colour',
    tagline: 'Bold tones for a modern room.',
    pricePerSqft: 999,
    image: '/assets/projects/painting-finishing.jpeg',
    colours: ['#2b5ea6', '#9c3b5c', '#5f6b23', '#111111'],
    features: ['waterproof', 'easy-clean', 'warranty'],
    materialDetails: {
      'Panel Type': 'Laminate on MDF',
      Thickness: '8 mm',
      Finish: 'Glossy',
      'Installation Time': '1–2 Days',
    },
  },

  /* ------------------------------------------------------ Living Room */
  {
    slug: 'warm-neutrals',
    spaceSlug: 'living-room',
    name: 'Warm Neutrals',
    tagline: 'Soft tones, easy to live in.',
    pricePerSqft: 749,
    image: '/assets/projects/modern-interior.jpeg',
    colours: ['#d8c9b0', '#a87c52', '#efe9e2', '#6b4a34'],
    features: ['waterproof', 'easy-clean', 'warranty'],
    materialDetails: {
      'Panel Type': 'WPC Fluted Panel',
      Thickness: '8 mm',
      Finish: 'Matte',
      'Installation Time': '2–3 Days',
    },
  },
  {
    slug: 'modern-luxe',
    spaceSlug: 'living-room',
    name: 'Modern Luxe',
    tagline: 'A living room that feels curated.',
    pricePerSqft: 1099,
    image: '/assets/projects/retail-showroom.jpeg',
    colours: ['#2e2e2e', '#c9a876', '#3a3733', '#efe9e2'],
    features: ['termite-resistant', 'easy-clean', 'warranty'],
    materialDetails: {
      'Panel Type': 'Veneer + Laminate Mix',
      Thickness: '10 mm',
      Finish: 'Satin',
      'Installation Time': '3–4 Days',
    },
  },

  /* ---------------------------------------------------------- Bedroom */
  {
    slug: 'soft-minimal',
    spaceSlug: 'bedroom',
    name: 'Soft Minimal',
    tagline: 'Calm colours, restful room.',
    pricePerSqft: 799,
    image: '/assets/projects/painting-finishing.jpeg',
    colours: ['#efe9e2', '#c9c2b8', '#a87c52'],
    features: ['easy-clean', 'warranty'],
    materialDetails: {
      'Panel Type': 'MDF Fluted Panel',
      Thickness: '8 mm',
      Finish: 'Matte',
      'Installation Time': '2 Days',
    },
  },
  {
    slug: 'classic-wood',
    spaceSlug: 'bedroom',
    name: 'Classic Wood',
    tagline: 'A headboard wall that anchors the room.',
    pricePerSqft: 949,
    image: '/assets/projects/modern-interior.jpeg',
    colours: ['#6b4a34', '#3b2a20', '#d8c9b0'],
    features: ['termite-resistant', 'easy-clean', 'warranty'],
    materialDetails: {
      'Panel Type': 'Veneer Panel',
      Thickness: '10 mm',
      Finish: 'Woodgrain',
      'Installation Time': '2–3 Days',
    },
  },

  /* ------------------------------------------------------ Dining Area */
  {
    slug: 'elegant-oak',
    spaceSlug: 'dining-area',
    name: 'Elegant Oak',
    tagline: 'Warm wood for shared meals.',
    pricePerSqft: 849,
    image: '/assets/projects/office-fitout.jpeg',
    colours: ['#a87c52', '#6b4a34', '#efe9e2'],
    features: ['waterproof', 'easy-clean', 'warranty'],
    materialDetails: {
      'Panel Type': 'WPC Fluted Panel',
      Thickness: '8 mm',
      Finish: 'Woodgrain',
      'Installation Time': '2 Days',
    },
  },
  {
    slug: 'contemporary-edge',
    spaceSlug: 'dining-area',
    name: 'Contemporary Edge',
    tagline: 'A sharper, modern dining wall.',
    pricePerSqft: 999,
    image: '/assets/projects/retail-showroom.jpeg',
    colours: ['#2e2e2e', '#9a9a9a', '#111111'],
    features: ['waterproof', 'termite-resistant', 'warranty'],
    materialDetails: {
      'Panel Type': 'PU Textured Panel',
      Thickness: '12 mm',
      Finish: 'Matte',
      'Installation Time': '2–3 Days',
    },
  },

  /* --------------------------------------------------- Home Entrance */
  {
    slug: 'grand-foyer',
    spaceSlug: 'home-entrance',
    name: 'Grand Foyer',
    tagline: 'A welcome that sets the tone.',
    pricePerSqft: 899,
    image: '/assets/projects/hero-house.jpeg',
    colours: ['#3b2a20', '#a87c52', '#efe9e2'],
    features: ['termite-resistant', 'easy-clean', 'warranty'],
    materialDetails: {
      'Panel Type': 'Veneer + Stone Mix',
      Thickness: '12 mm',
      Finish: 'Satin',
      'Installation Time': '3 Days',
    },
  },
  {
    slug: 'minimal-welcome',
    spaceSlug: 'home-entrance',
    name: 'Minimal Welcome',
    tagline: 'Clean and low-maintenance.',
    pricePerSqft: 649,
    image: '/assets/projects/luxury-bungalow.jpeg',
    colours: ['#efe9e2', '#c9c2b8', '#6b4a34'],
    features: ['waterproof', 'easy-clean'],
    materialDetails: {
      'Panel Type': 'MDF Fluted Panel',
      Thickness: '8 mm',
      Finish: 'Matte',
      'Installation Time': '1–2 Days',
    },
  },

  /* ---------------------------------------------------- Office / Commercial */
  {
    slug: 'corporate-clean',
    spaceSlug: 'office-commercial',
    name: 'Corporate Clean',
    tagline: 'Sharp and professional.',
    pricePerSqft: 949,
    image: '/assets/projects/office-fitout.jpeg',
    colours: ['#2e2e2e', '#9a9a9a', '#efe9e2'],
    features: ['waterproof', 'easy-clean', 'warranty'],
    materialDetails: {
      'Panel Type': 'Laminate on MDF',
      Thickness: '8 mm',
      Finish: 'Matte',
      'Installation Time': '2–3 Days',
    },
  },
  {
    slug: 'showroom-bold',
    spaceSlug: 'office-commercial',
    name: 'Showroom Bold',
    tagline: 'Built to be noticed.',
    pricePerSqft: 1149,
    image: '/assets/projects/retail-showroom.jpeg',
    colours: ['#111111', '#c9a876', '#9c3b5c'],
    features: ['termite-resistant', 'easy-clean', 'warranty'],
    materialDetails: {
      'Panel Type': 'Veneer + Laminate Mix',
      Thickness: '10 mm',
      Finish: 'Glossy',
      'Installation Time': '3–4 Days',
    },
  },
];

export const getSpaceBySlug = (slug) => interiorSpaces.find((s) => s.slug === slug);

export const getDesignsBySpace = (spaceSlug) =>
  interiorDesigns.filter((d) => d.spaceSlug === spaceSlug);

export const getDesignBySlug = (spaceSlug, designSlug) =>
  interiorDesigns.find((d) => d.spaceSlug === spaceSlug && d.slug === designSlug);

export const HOME_VISIT_FEE = 99;

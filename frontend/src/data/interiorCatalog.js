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
    slug: 'tv-wall',
    name: 'TV wall',
    image: '/assets/projects/tv_wall.webp',
  },
  {
    slug: 'bed-back-wall',
    name: 'Bed back wall',
    image: '/assets/projects/bedroom.webp',
  },
  {
    slug: 'living-room',
    name: 'Living room',
    image: '/assets/projects/Living_room.webp',
  },
  {
    slug: 'entrance',
    name: 'Entrance',
    image: '/assets/projects/home_Entrance.webp',
  },
  {
    slug: 'study',
    name: 'Study',
    image: '/assets/projects/study_room.webp',
  },
  {
    slug: 'mandir',
    name: 'Mandir',
    image: '/assets/projects/mandir.webp',
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

const subDesignNames = {
  'tv-wall': [
    'Modern Minimal',
    'Marble Luxury',
    'Wood & White',
    'Stone Texture',
    'Classic Elegant',
    'Contemporary Colour',
    'Fluted Luxe',
    'Warm Walnut',
    'Charcoal Frame',
    'Beige Calm',
    'Oak Slat',
    'Grey Stone',
    'Black & Brass',
    'Ivory Panel',
    'Earthy Modern',
    'Linear Luxe',
    'Urban Concrete',
    'Natural Veneer',
    'Soft Taupe',
    'Bold Black',
    'Terracotta Accent',
    'Sage & Oak',
    'Cream & Walnut',
    'Mocha Modern',
    'Minimal Grid',
    'Vertical Rhythm',
    'Floating Console',
    'Backlit Marble',
    'Dark Wood Luxe',
    'Sandstone Modern',
    'Monochrome Edge',
    'Light Oak Frame',
    'Textured Beige',
    'Graphite Stone',
    'Warm Grey Luxe',
    'White Oak Minimal',
    'Bronze Detail',
    'Japandi TV Wall',
    'Scandinavian Slat',
    'Contemporary Classic',
    'Luxury Flute',
    'Soft Contrast',
    'Statement Marble',
    'Rustic Modern',
    'Clean Geometry',
    'Modern Arch',
    'Natural Stone Luxe',
    'Slimline Modern',
    'Warm Contemporary',
    'Signature TV Wall',
  ],

  'bed-back-wall': [
    'Soft Minimal',
    'Classic Wood',
    'Hotel Luxe',
    'Warm Beige',
    'Fluted Headboard',
    'Walnut Retreat',
    'Ivory Calm',
    'Earthy Bedroom',
    'Modern Panel',
    'Luxury Upholstery',
    'Vertical Wood',
    'Stone & Wood',
    'Taupe Harmony',
    'Charcoal Luxe',
    'Cream & Oak',
    'Japandi Bedroom',
    'Scandinavian Calm',
    'Contemporary Warmth',
    'Natural Veneer',
    'Soft Grey',
    'Mocha Retreat',
    'Sage Bedroom',
    'Blush Neutral',
    'Textured Headboard',
    'Floating Bed Wall',
    'Backlit Luxe',
    'Minimal Arch',
    'Modern Classic',
    'Warm Walnut',
    'Sand Beige',
    'Elegant Flute',
    'Urban Bedroom',
    'Graphite & Oak',
    'White Wood Calm',
    'Cocoa Luxe',
    'Linear Headboard',
    'Hotel Minimal',
    'Earth Tone Retreat',
    'Black Accent',
    'Cream Stone',
    'Modern Symmetry',
    'Oak & Beige',
    'Soft Luxury',
    'Statement Headboard',
    'Natural Calm',
    'Contemporary Classic',
    'Warm Modern',
    'Quiet Luxury',
    'Signature Bedroom',
    'Dreamy Minimal',
  ],

  'living-room': [
    'Warm Neutrals',
    'Modern Luxe',
    'Contemporary Comfort',
    'Beige Harmony',
    'Wood & Stone',
    'Soft Modern',
    'Japandi Living',
    'Scandinavian Light',
    'Earthy Luxe',
    'Modern Classic',
    'Warm Walnut',
    'Cream & Oak',
    'Greige Living',
    'Charcoal Luxe',
    'Natural Textures',
    'Minimal Calm',
    'Hotel Living',
    'Elegant Flutes',
    'Urban Chic',
    'Mocha Modern',
    'Sage & Beige',
    'Ivory Luxe',
    'Stone Accent',
    'Linear Living',
    'Soft Contrast',
    'Backlit Feature',
    'Modern Arch',
    'Classic Contemporary',
    'Oak Frame',
    'Textured Neutral',
    'Black & Wood',
    'Sandstone Luxe',
    'Warm Grey',
    'White Oak',
    'Terracotta Calm',
    'Graphite Modern',
    'Natural Veneer',
    'Quiet Luxury',
    'Contemporary Edge',
    'Cozy Minimal',
    'Statement Wall',
    'Light Luxury',
    'Earth Tone Luxe',
    'Modern Heritage',
    'Clean Lines',
    'Warm Contemporary',
    'Timeless Neutral',
    'Refined Minimal',
    'Signature Living',
    'Grand Living',
  ],

  entrance: [
    'Grand Foyer',
    'Minimal Welcome',
    'Warm Entry',
    'Modern Console',
    'Luxury Foyer',
    'Fluted Entrance',
    'Wood & Stone Entry',
    'Beige Welcome',
    'Classic Entry',
    'Contemporary Foyer',
    'Japandi Entry',
    'Scandinavian Welcome',
    'Natural Oak Entry',
    'Marble Console',
    'Statement Mirror Wall',
    'Backlit Entrance',
    'Archway Welcome',
    'Modern Classic Entry',
    'Taupe Foyer',
    'Charcoal Entry',
    'Warm Walnut Foyer',
    'Cream Stone Entry',
    'Elegant Flute',
    'Urban Welcome',
    'Earthy Entrance',
    'Black & Brass Entry',
    'Ivory Foyer',
    'Soft Grey Welcome',
    'Mocha Entry',
    'Linear Console',
    'Hotel Style Foyer',
    'Slimline Entry',
    'Textured Welcome',
    'Oak & Beige Entry',
    'Graphite Foyer',
    'Natural Veneer Entry',
    'Quiet Luxury Foyer',
    'Modern Heritage Entry',
    'Sage Accent Entry',
    'Terracotta Welcome',
    'Clean Geometry Entry',
    'Contemporary Classic Foyer',
    'Warm Minimal Entry',
    'Luxury Arch Entry',
    'Stone Luxe Foyer',
    'Soft Contrast Entry',
    'Signature Entrance',
    'Premium Welcome',
    'Refined Foyer',
    'Statement Entry',
  ],

  study: [
    'Focus Minimal',
    'Executive Wood',
    'Modern Study',
    'Warm Workroom',
    'Japandi Study',
    'Scandinavian Desk Wall',
    'Walnut Office',
    'Beige Study',
    'Charcoal Executive',
    'Natural Veneer Study',
    'Fluted Workspace',
    'Stone & Wood Study',
    'Contemporary Office',
    'Classic Library',
    'Quiet Luxury Study',
    'Minimalist Work Wall',
    'Oak & Black Study',
    'Cream & Walnut',
    'Graphite Workspace',
    'Soft Grey Office',
    'Earthy Study',
    'Hotel Executive',
    'Backlit Study',
    'Floating Desk Wall',
    'Modern Shelving',
    'Elegant Study',
    'Urban Workspace',
    'Warm Contemporary',
    'Ivory Office',
    'Mocha Study',
    'Linear Workspace',
    'Sage Study',
    'Black & Brass Office',
    'White Oak Study',
    'Textured Study',
    'Modern Heritage Office',
    'Compact Study',
    'Premium Workroom',
    'Clean Geometry Study',
    'Statement Library',
    'Natural Calm Study',
    'Contemporary Classic Study',
    'Warm Minimal Workspace',
    'Luxury Home Office',
    'Refined Executive',
    'Signature Study',
    'Creative Workspace',
    'Timeless Study',
    'Grand Library',
    'Smart Minimal Study',
  ],

  mandir: [
    'Traditional Mandir',
    'Modern Mandir',
    'Marble Mandir',
    'Wooden Mandir',
    'Backlit Mandir',
    'Fluted Mandir',
    'Minimal Pooja',
    'Luxury Pooja',
    'Compact Mandir',
    'Grand Pooja',
    'Warm Wood Mandir',
    'White Marble Mandir',
    'Stone Mandir',
    'Brass Accent Mandir',
    'Arch Mandir',
    'Jaali Mandir',
    'Contemporary Pooja',
    'Classic Pooja Room',
    'Japandi Mandir',
    'Ivory Mandir',
    'Walnut Pooja',
    'Cream & Gold Mandir',
    'Beige Mandir',
    'Black & Brass Pooja',
    'Temple Arch',
    'Floating Mandir',
    'Vertical Flute Mandir',
    'Natural Stone Pooja',
    'Soft Light Mandir',
    'Elegant Pooja',
    'Modern Heritage Mandir',
    'Carved Wood Mandir',
    'Minimal Arch Pooja',
    'Warm Marble Mandir',
    'Sandalwood Mandir',
    'Statement Mandir',
    'Sacred Niche',
    'Contemporary Classic Pooja',
    'Premium Pooja Wall',
    'Quiet Luxury Mandir',
    'Natural Wood Pooja',
    'Textured Marble Mandir',
    'Gold Detail Mandir',
    'Slimline Mandir',
    'Corner Mandir',
    'Family Pooja Room',
    'Traditional Luxe Mandir',
    'Modern Spiritual',
    'Signature Mandir',
    'Grand Temple Wall',
  ],
};

//new 

const designPresets = {
  'tv-wall': {
    features: [
      'waterproof',
      'termite-resistant',
      'easy-clean',
      'warranty',
    ],
    materialDetails: {
      'Panel Type': 'WPC / MDF Fluted Panel',
      Thickness: '8 mm / 12 mm',
      Finish: 'Matte / Woodgrain',
      'Installation Time': '1–2 Days',
    },
  },

  'bed-back-wall': {
    features: [
      'termite-resistant',
      'easy-clean',
      'warranty',
    ],
    materialDetails: {
      'Panel Type': 'MDF / Veneer Fluted Panel',
      Thickness: '8 mm / 12 mm',
      Finish: 'Matte / Woodgrain',
      'Installation Time': '2–3 Days',
    },
  },

  'living-room': {
    features: [
      'waterproof',
      'easy-clean',
      'warranty',
    ],
    materialDetails: {
      'Panel Type': 'WPC / Veneer / Laminate Mix',
      Thickness: '8 mm / 10 mm',
      Finish: 'Matte / Satin',
      'Installation Time': '2–3 Days',
    },
  },

  entrance: {
    features: [
      'waterproof',
      'easy-clean',
      'warranty',
    ],
    materialDetails: {
      'Panel Type': 'Veneer / Stone / MDF Mix',
      Thickness: '8 mm / 12 mm',
      Finish: 'Matte / Satin',
      'Installation Time': '1–3 Days',
    },
  },

  study: {
    features: [
      'termite-resistant',
      'easy-clean',
      'warranty',
    ],
    materialDetails: {
      'Panel Type': 'Laminate / Veneer on MDF',
      Thickness: '8 mm / 12 mm',
      Finish: 'Matte / Woodgrain',
      'Installation Time': '2–3 Days',
    },
  },

  mandir: {
    features: [
      'easy-clean',
      'warranty',
    ],
    materialDetails: {
      'Panel Type': 'MDF / Veneer / Marble-finish Panel',
      Thickness: '8 mm / 12 mm',
      Finish: 'Matte / Woodgrain',
      'Installation Time': '2–3 Days',
    },
  },
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const basePrices = {
  'tv-wall': 699,
  'bed-back-wall': 799,
  'living-room': 749,
  entrance: 649,
  study: 849,
  mandir: 899,
};

const taglines = {
  'tv-wall': 'Clean lines. Timeless look.',
  'bed-back-wall': 'Calm colours, restful room.',
  'living-room': 'Soft tones, easy to live in.',
  entrance: 'A welcome that sets the tone.',
  study: 'A focused, functional workspace.',
  mandir: 'A peaceful, beautifully finished pooja space.',
};

export const interiorDesigns = interiorSpaces.flatMap((space) =>
  subDesignNames[space.slug].map((name, index) => {
    const preset = designPresets[space.slug];

    const priceSteps = [0, 50, 100, 150, 200];

    const pricePerSqft =
      basePrices[space.slug] +
      priceSteps[index % priceSteps.length];

    const dedicatedImage =
      `/assets/projects/interior-by-choice/${space.slug}/${slugify(name)}.webp`;

    return {
      slug: slugify(name),
      spaceSlug: space.slug,
      name,
      tagline: taglines[space.slug],
      pricePerSqft,

      // Individual image path
      image: dedicatedImage,

      // Agar individual image nahi hai to main category image use hogi
      fallbackImage: space.image,

      colours: [
        '#efe9e2',
        '#d8c9b0',
        '#6b4a34',
        '#2e2e2e',
      ],

      features: preset.features,

      materialDetails: preset.materialDetails,
    };
  })
);






export const getSpaceBySlug = (slug) => interiorSpaces.find((s) => s.slug === slug);

export const getDesignsBySpace = (spaceSlug) =>
  interiorDesigns.filter((d) => d.spaceSlug === spaceSlug);

export const getDesignBySlug = (spaceSlug, designSlug) =>
  interiorDesigns.find((d) => d.spaceSlug === spaceSlug && d.slug === designSlug);

export const HOME_VISIT_FEE = 99;

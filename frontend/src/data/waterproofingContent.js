/**
 * Presentational-only content for the Waterproofing section — copy, icons
 * and image paths. Brand names/descriptions and every rate come live from
 * the catalogue API (useWaterproofingCatalogue), same split as
 * paintingContent.js / popCeilingContent.js.
 *
 * IMAGE SOURCES (asset priority per the brief: existing project assets
 * first — nothing here was generated, downloaded or extracted from the
 * PDF, whose own embedded images are too low-resolution to reuse — see
 * the delivery report). This project has no dedicated waterproofing
 * photography at all, so these are the closest genuine, on-topic matches
 * from existing assets, each reused rather than invented:
 * - WP_HERO_IMAGE / Terrace / Exterior Wall: the existing
 *   frontend/public/assets/projects/hero-house.jpg — the project's one
 *   real modern-house exterior photo. The site-wide dark hero scrim (the
 *   same treatment already used on every Painting/POP hero) turns this
 *   into the "dramatic evening" look the brief asks for regardless of the
 *   source photo's actual daytime lighting.
 * - Bathroom: cropped from the existing frontend/public/assets/hero/
 *   plumbing.png marketing banner (the clean bathroom-fixture photograph,
 *   its own text/CTA panel cropped out) — a real bathroom photo, the
 *   closest available match even though it depicts pipe repair rather
 *   than waterproofing specifically.
 * - Interior Wall: reuses the existing frontend/public/assets/projects/
 *   modern-interior.jpeg (already used for POP Ceiling) for the
 *   "restored room" side of the benefits section; the "damp/before" side
 *   uses the existing wall-crack/wall-stain/wall-mould icons (added for
 *   Painting) rather than a fabricated damp-wall photo.
 * - Water Tank and Basement: NO existing photo in this project is a
 *   defensible match (no tank or basement/parking photography exists
 *   anywhere in the asset library) — these two intros reuse WP_HERO_IMAGE
 *   (the same house exterior as the category hero) rather than a
 *   stretched or mismatched photo. Flagged in the delivery report as a
 *   genuine asset gap: neither section has photography specific to it.
 * - Brand cards: the project's own real Dr. Fixit / Asian Paints / Berger
 *   logo files (materials/dr-fixit.png, asian-paints.png,
 *   berger-paints.jpg) — no product packshots are shown at all, which is
 *   also how this sidesteps the reference's own asset bug (several of its
 *   Asian Paints cards actually show a Berger-labelled bucket photo — see
 *   the delivery report).
 */

export const WP_HERO_IMAGE = '/assets/waterproofing/hero/modern-house.jpg';
export const WP_BATHROOM_IMAGE = '/assets/waterproofing/bathroom/bathroom.jpg';

export const wpOverviewIntro = {
  eyebrow: 'WATERPROOFING',
  title: 'Protect Your Home Inside & Out',
  text: 'Leak-Free Spaces. Longer Life.',
};

export const wpTrustPoints = [
  { icon: 'award', label: 'Certified Experts' },
  { icon: 'package', label: 'Genuine Materials' },
  { icon: 'shield', label: 'Preventive Care' },
  { icon: 'inspect', label: 'Site Inspection' },
];

export const BRAND_LOGO = {
  'dr-fixit': '/assets/materials/dr-fixit.png',
  'asian-paints': '/assets/materials/asian-paints.png',
  berger: '/assets/materials/berger-paints.jpg',
};

/** The six category-page rows, in the reference's own order. Terrace,
    Bathroom (its own sub-overview — see wpBathroomServices below),
    Interior Wall, Exterior Wall, Basement and Water Tank each open a full
    dedicated flow except Bathroom, which opens a second list first. */
export const wpCategories = [
  { slug: 'terrace', name: 'Terrace Waterproofing', tagline: 'Protect your terrace from leakage, heat and harsh weather.', icon: 'terrace', route: '/services/waterproofing/terrace' },
  { slug: 'bathroom', name: 'Bathroom Waterproofing', tagline: 'Keep your bathroom dry and damage-free.', icon: 'droplet', route: '/services/waterproofing/bathroom' },
  { slug: 'interior-wall', name: 'Interior Wall Waterproofing', tagline: 'Stop dampness and seepage from inside walls.', icon: 'wall-stain', route: '/services/waterproofing/interior-wall' },
  { slug: 'exterior-wall', name: 'Exterior Wall Waterproofing', tagline: 'Protect external walls from rainwater and cracks.', icon: 'building', route: '/services/waterproofing/exterior-wall' },
  { slug: 'basement', name: 'Basement Waterproofing', tagline: 'Prevent water seepage in basements and parking areas.', icon: 'grout', route: '/services/waterproofing/basement' },
  { slug: 'water-tank', name: 'Water Tank Waterproofing', tagline: 'Leak-proof solutions for overhead and underground tanks.', icon: 'tank', route: '/services/waterproofing/water-tank' },
];

/** Bathroom's own six subservices — only Floor Waterproofing has a full
    reference flow; the rest fall back to the existing generic wizard with
    their subservice preselected (see App.jsx / ServiceBooking.jsx). */
export const wpBathroomServices = [
  { slug: 'bathroom-floor', name: 'Floor Waterproofing', tagline: 'Protects bathroom floors from seepage.', icon: 'droplet', route: '/services/waterproofing/bathroom-floor' },
  { slug: 'wall', name: 'Wall Waterproofing', tagline: 'Prevents water from penetrating bathroom walls.', icon: 'wall-stain', route: '/booking/waterproofing?preselect=Bathroom%20Wall%20Waterproofing' },
  { slug: 'corner-joint', name: 'Corner & Joint Sealing', tagline: 'Seals joints, cracks and pipe openings.', icon: 'grout', route: '/booking/waterproofing?preselect=Bathroom%20Corner%20%26%20Joint%20Sealing' },
  { slug: 'shower-area', name: 'Shower Area Waterproofing', tagline: 'Extra protection for wet zones.', icon: 'droplet', route: '/booking/waterproofing?preselect=Bathroom%20Shower%20Area%20Waterproofing' },
  { slug: 'pipeline-fixture', name: 'Pipeline & Fixture Sealing', tagline: 'Seals around pipes and fittings.', icon: 'wrench', route: '/booking/waterproofing?preselect=Bathroom%20Pipeline%20%26%20Fixture%20Sealing' },
  { slug: 'tile-resealing', name: 'Tile Re-sealing', tagline: 'Protects existing tiles and grout lines.', icon: 'layers', route: '/booking/waterproofing?preselect=Bathroom%20Tile%20Re-sealing' },
];

const FEE_NOTE = 'Rates are indicative and may vary based on site condition, area and material selection. For projects above ₹5,000, a ₹99 home visit fee applies — adjusted in your final bill if you proceed.';

/**
 * One config object per detailed flow, consumed by WaterproofingFlow.jsx.
 * `ratesKey` is the catalogue question_key holding that flow's rate rows
 * (see V17) — grouped by option.group (a brand, or Overhead/Underground
 * for the water tank flow). `onlyBrand`, where set, means the reference
 * gives no legible rate data for any other brand (see V17's note 2) — the
 * rate screen then shows the honest "quote after inspection" state for
 * any other brand instead of an invented number.
 */
export const wpFlows = {
  terrace: {
    slug: 'terrace',
    title: 'Terrace Waterproofing',
    heroTagline: 'Leak-Free Roofs. Happier Homes.',
    intro: {
      image: WP_HERO_IMAGE,
      heading: 'Terrace waterproofing protects your home from rainwater, heat and structural damage.',
      text: 'We use premium materials and proven techniques to ensure a durable, leak-free terrace for years.',
      points: [
        { icon: 'droplet', label: 'Prevents Leakage' },
        { icon: 'sparkle', label: 'Weather Resistant' },
        { icon: 'shield', label: 'Longer Life' },
        { icon: 'award', label: 'Increases Property Value' },
      ],
    },
    stages: [
      { icon: 'inspect', title: 'Surface Inspection & Analysis', text: 'Detailed site inspection to identify cracks, seepage and problem areas.' },
      { icon: 'sparkle', title: 'Surface Cleaning', text: 'Removal of dust, dirt, loose particles and old coating.' },
      { icon: 'wall-crack', title: 'Crack & Joint Treatment', text: 'Sealing cracks and expansion joints with specialised materials.' },
      { icon: 'roller', title: 'Waterproof Coating Application', text: 'Application of premium waterproofing membranes and coatings.' },
      { icon: 'drain', title: 'Drainage & Finishing', text: 'Improving water flow and final finishing for long-lasting protection.' },
    ],
    ratesKey: 'wp_terrace_rates',
    onlyBrand: 'dr-fixit',
    feeNote: FEE_NOTE,
  },
  'exterior-wall': {
    slug: 'exterior-wall',
    title: 'Exterior Wall Waterproofing',
    heroTagline: 'Leak-Free Walls. Stronger Homes.',
    intro: {
      image: WP_HERO_IMAGE,
      heading: 'Exterior wall waterproofing protects your home from rainwater penetration, wall cracks, dampness and paint peeling.',
      text: 'We use premium materials and proven techniques to ensure a durable and beautiful finish.',
      points: [
        { icon: 'droplet', label: 'Prevents Leakage' },
        { icon: 'sparkle', label: 'Weather Resistant' },
        { icon: 'award', label: 'Increases Property Value' },
        { icon: 'shield', label: 'Longer Life' },
      ],
    },
    stages: [
      { icon: 'inspect', title: 'Wall Inspection', text: 'Detailed analysis to identify cracks, dampness and problem areas.' },
      { icon: 'sparkle', title: 'Surface Cleaning', text: 'High-pressure cleaning to remove dust, dirt, loose paint and algae.' },
      { icon: 'wall-crack', title: 'Crack & Joint Treatment', text: 'Sealing cracks and expansion joints with specialised materials.' },
      { icon: 'roller', title: 'Waterproof Coating Application', text: 'Premium exterior waterproofing coatings for long-term protection.' },
      { icon: 'palette', title: 'Exterior Paint / Finish (Optional)', text: 'Weather-resistant paint for a clean and beautiful look.' },
      { icon: 'check-circle', title: 'Final Inspection', text: 'Quality check to confirm a leak-free and durable finish.' },
    ],
    ratesKey: 'wp_exterior_rates',
    onlyBrand: 'dr-fixit',
    feeNote: FEE_NOTE,
    closing: { heading: 'Stronger Walls. Brighter Tomorrows.', cta: 'Explore Waterproofing Services' },
  },
  'bathroom-floor': {
    slug: 'bathroom-floor',
    title: 'Floor Waterproofing',
    heroTagline: 'Keep Your Bathroom Dry. Stop Leaks Before They Start.',
    intro: {
      image: WP_BATHROOM_IMAGE,
      heading: 'Special waterproofing treatment that protects bathroom floors from water seepage and leakage.',
      text: 'Suitable for new and existing bathrooms — homes, apartments and villas, all types of tiles and finishes.',
      points: [
        { icon: 'droplet', label: 'Prevents Leakage' },
        { icon: 'shield', label: 'Protects Structure' },
        { icon: 'layers', label: 'Suitable For All Tile Types' },
        { icon: 'award', label: 'Long-Lasting Solution' },
      ],
    },
    stages: [
      { icon: 'droplet', title: 'Floor Waterproofing', text: 'Protects bathroom floors from seepage.' },
      { icon: 'wall-stain', title: 'Wall Waterproofing', text: 'Prevents water from penetrating bathroom walls.' },
      { icon: 'grout', title: 'Corner & Joint Sealing', text: 'Seals joints, cracks and pipe openings.' },
      { icon: 'droplet', title: 'Shower Area Waterproofing', text: 'Extra protection for wet zones.' },
      { icon: 'wrench', title: 'Pipeline & Fixture Sealing', text: 'Seals around pipes and fittings.' },
      { icon: 'layers', title: 'Tile Re-sealing', text: 'Protects existing tiles and grout lines.' },
    ],
    ratesKey: 'wp_bathroom_floor_rates',
    onlyBrand: 'dr-fixit',
    feeNote: FEE_NOTE,
  },
  'interior-wall': {
    slug: 'interior-wall',
    title: 'Interior Wall Waterproofing',
    heroTagline: 'Stop dampness. Protect your walls. Enjoy a healthier home.',
    intro: {
      image: '/assets/projects/modern-interior.jpeg',
      heading: 'Stop rising and lateral dampness before it damages your walls and paint.',
      text: 'Ideal for bedrooms, living rooms, kitchens — any interior wall prone to dampness.',
      points: [
        { icon: 'droplet', label: 'Prevents Seepage' },
        { icon: 'wall-stain', label: 'Stops Dampness' },
        { icon: 'fan', label: 'Improves Indoor Air' },
        { icon: 'shield', label: 'Longer Wall Life' },
      ],
    },
    stages: [
      { icon: 'wall-stain', title: 'Dampness Treatment', text: 'Stops rising and lateral seepage on interior walls.' },
      { icon: 'wall-crack', title: 'Crack Sealing', text: 'Fills and seals cracks to prevent water entry.' },
      { icon: 'roller', title: 'Waterproof Coating Application', text: 'Premium waterproof coatings for long-lasting protection.' },
      { icon: 'wall-mould', title: 'Mould & Fungus Treatment', text: 'Removes fungus and helps prevent future growth.' },
      { icon: 'sparkle', title: 'Surface Preparation', text: 'Cleaning and repair before waterproofing.' },
      { icon: 'palette', title: 'Finishing & Paint (Optional)', text: 'Premium interior paint after waterproofing.' },
    ],
    ratesKey: 'wp_interior_rates',
    onlyBrand: 'dr-fixit',
    feeNote: FEE_NOTE,
    benefits: {
      heading: 'Healthier Walls. Happier Homes.',
      points: [
        'Stops dampness and peeling paint',
        'Helps prevent mould and fungus',
        'Supports better indoor air quality',
        'Enhances wall life and appearance',
        'Suitable for all types of interior walls',
      ],
    },
  },
  'water-tank': {
    slug: 'water-tank',
    title: 'Water Tank Waterproofing',
    heroTagline: 'Clean Water. Healthy Living.',
    intro: {
      image: WP_HERO_IMAGE,
      heading: 'Protect your overhead and underground water tanks from leakage, seepage and contamination.',
      text: 'Suitable for overhead water tanks (RCC/Plastic), underground sump tanks — residential, commercial and industrial, new and existing.',
      points: [
        { icon: 'droplet', label: 'Prevents Leakage' },
        { icon: 'shield', label: 'Keeps Water Safe' },
        { icon: 'wall-crack', label: 'Prevents Contamination' },
        { icon: 'award', label: 'Longer Tank Life' },
      ],
    },
    stages: [
      { icon: 'inspect', title: 'Tank Inspection & Leakage Check', text: 'Detailed inspection to identify leakage points.' },
      { icon: 'sparkle', title: 'Tank Cleaning', text: 'Removal of dirt, sludge, fungus and loose particles.' },
      { icon: 'wall-crack', title: 'Crack Repair & Surface Preparation', text: 'Sealing cracks and smoothing the surface.' },
      { icon: 'roller', title: 'Waterproof Coating Application', text: 'Premium waterproof coatings for long-lasting protection.' },
      { icon: 'wrench', title: 'Pipe & Joint Sealing', text: 'Sealing inlet, outlet and overflow joints.' },
      { icon: 'check-circle', title: 'Final Testing', text: 'A water-filling test to check for leaks before handover.' },
    ],
    ratesKey: 'wp_water_tank_rates',
    onlyBrand: null,
    feeNote: FEE_NOTE,
    benefits: {
      heading: 'Safe Water. Healthier Families.',
      points: [
        'Helps prevent water leakage and wastage',
        'Supports clean, well-maintained drinking water storage',
        'Stops cracks and seepage',
        'Increases tank life',
        'Reduces maintenance cost',
        'Suitable for RCC, plastic and masonry tanks',
      ],
    },
  },
  basement: {
    slug: 'basement',
    title: 'Basement Waterproofing',
    heroTagline: 'Leak-Free Spaces. Longer Life.',
    intro: {
      image: WP_HERO_IMAGE,
      heading: 'Protect your valuable space from water seepage, dampness and structural damage.',
      text: 'Ideal for residential and commercial basements, parking areas, storage spaces, lift pits and machine rooms.',
      points: [
        { icon: 'droplet', label: 'Prevents Seepage' },
        { icon: 'shield', label: 'Protects Structure' },
        { icon: 'layers', label: 'Increases Usable Space' },
        { icon: 'award', label: 'Longer Life' },
      ],
    },
    stages: [
      { icon: 'inspect', title: 'Leakage Inspection', text: 'Detailed site inspection to identify seepage points and water entry sources.' },
      { icon: 'wall-crack', title: 'Crack & Joint Treatment', text: 'Sealing cracks, honeycombing and construction joints with specialised materials.' },
      { icon: 'roller', title: 'Wall & Floor Waterproofing', text: 'High-performance coatings and membranes on basement walls and floors.' },
      { icon: 'grout', title: 'Injection Grouting', text: 'Pressure injection to stop active water leakages.' },
      { icon: 'drain', title: 'Drainage System', text: 'Installation of drainage and sump pump solutions to manage water flow.' },
      { icon: 'shield', title: 'Pressure Side Waterproofing', text: 'Advanced solutions for underground structures facing high water pressure.' },
    ],
    ratesKey: 'wp_basement_rates',
    onlyBrand: 'dr-fixit',
    feeNote: FEE_NOTE,
    benefits: {
      heading: 'Dry Spaces. More Possibilities.',
      points: [
        'Prevents water seepage and flooding',
        'Protects structural strength',
        'Reduces dampness, mould and odour',
        'Increases usable space',
        'Adds long-term property value',
      ],
    },
  },
};

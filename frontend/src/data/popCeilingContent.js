/**
 * Presentational-only content for the POP Ceiling & Design section —
 * copy, icons and image paths. Names, prices and option lists come live
 * from the catalogue API (usePopCeilingCatalogue), same split as
 * paintingContent.js.
 *
 * IMAGE SOURCES (asset priority per the brief: existing project assets
 * first — nothing here was generated or downloaded):
 * - POP_HERO_IMAGE: cropped from the existing frontend/public/assets/hero/
 *   interior-design.png marketing banner — the clean photographic region
 *   (a living room with a cove-lit tray ceiling and chandelier), with the
 *   banner's own baked-in text and CTA strip cropped out. Matches the
 *   reference's own "premium living room with layered false ceiling and
 *   warm cove lighting" hero brief closely.
 * - Full Home POP intro: reuses the existing frontend/public/assets/
 *   projects/modern-interior.jpeg (a real project photo already used
 *   elsewhere in the site) — its own wood box-panel false ceiling with
 *   recessed lighting is the most ceiling-prominent existing photo in the
 *   project.
 * - Room POP intro: reuses the same interior-design.png crop as the
 *   category hero (POP_HERO_IMAGE) rather than the homepage tile photo
 *   (frontend/public/assets/popular-services/pop-ceiling-design.png) —
 *   that tile photo is only 600×540 and would visibly soften if stretched
 *   to fill this flow's full-bleed hero the way PaintingHero renders it
 *   (object-fit: cover at whatever width the container is).
 * - Category-overview row icons and design-style/add-on icons: the
 *   existing gold-outline Icon set, extended with a small number of new
 *   ceiling-specific glyphs (see components/ui/Icon.jsx) — there is no
 *   per-item photography for cornice/moulding/cove/tray/etc. in the
 *   reference or the project (its own embedded contact-sheet images are
 *   ~1000px for an entire 10-screen page, unusable at any individual size),
 *   so these follow the same icon-only precedent already used for
 *   Plumbing's and Painting's line items.
 */

export const POP_HERO_IMAGE = '/assets/pop-ceiling/hero/living-room-cove.jpg';

export const popOverviewIntro = {
  eyebrow: 'POP & GYPSUM',
  title: 'POP Ceiling & Design',
  text: 'Elegant ceilings. Beautiful spaces. Expert installation.',
};

export const popTrustPoints = [
  { icon: 'package', label: 'Premium Materials' },
  { icon: 'users', label: 'Skilled Professionals' },
  { icon: 'sparkle', label: 'Clean & Safe Execution' },
  { icon: 'clock', label: 'On-Time Completion' },
];

/**
 * The reference's own "POP Category" screen renders all six subservices as
 * plain icon + name + description rows (not photo cards) — this list
 * matches that shape. Full Home POP and Room POP open their own dedicated
 * flow; the other four have no detail screens in the reference and fall
 * back to the existing generic site-visit wizard with their closest
 * `service_needed` option preselected (see ServiceBooking.jsx's `preselect`
 * query param and V16's two additive options for the pair with no existing
 * match).
 */
export const popCategories = [
  {
    slug: 'full-home',
    name: 'Full Home POP',
    tagline: 'Complete POP ceiling work for your entire home.',
    icon: 'building',
    route: '/services/pop-ceiling-design/full-home',
  },
  {
    slug: 'room',
    name: 'Room POP',
    tagline: 'Stylish POP for individual rooms.',
    icon: 'layers',
    route: '/services/pop-ceiling-design/room',
  },
  {
    slug: 'false-ceiling',
    name: 'False Ceiling',
    tagline: 'Simple, elegant and modern designs.',
    icon: 'ceiling',
    route: '/booking/pop-ceiling-design?preselect=False%20Ceiling',
  },
  {
    slug: 'design-work',
    name: 'POP Design Work',
    tagline: 'Cornice, moulding and decorative designs.',
    icon: 'cornice',
    route: '/booking/pop-ceiling-design?preselect=Cornice',
  },
  {
    slug: 'tv-wall',
    name: 'POP TV Wall',
    tagline: 'Decorative POP TV wall designs.',
    icon: 'tv',
    route: '/booking/pop-ceiling-design?preselect=POP%20TV%20Wall',
  },
  {
    slug: 'repair-renovation',
    name: 'POP Repair & Renovation',
    tagline: 'Fix cracks, damage and old ceilings.',
    icon: 'wall-crack',
    route: '/booking/pop-ceiling-design?preselect=POP%20Repair%20%26%20Renovation',
  },
];

/** Per-design-style icon, looked up by option.value — falls back to the
    step's own icon (see PopCeilingFlow) for any style not listed here. */
export const DESIGN_STYLE_ICONS = {
  'simple-elegant': 'sparkle',
  simple: 'sparkle',
  modern: 'layers',
  classic: 'award',
  luxury: 'shield',
  'cove-ceiling': 'cove',
  'tray-ceiling': 'tray',
  'border-ceiling': 'border',
  'custom-design': 'palette',
};

/** Per-add-on icon, looked up by option.value (POP's own AddonList, not
    Painting's — see components/pop-ceiling/AddonList.jsx). */
export const ADDON_ICONS = {
  'pop-cornice': 'cornice',
  'pop-moulding': 'moulding',
  'curtain-cove-pelmet': 'curtain',
  'pop-wall-moulding': 'moulding',
  'pop-wall-panels': 'panel',
  'tv-wall-pop': 'tv',
  'ceiling-repair': 'wall-crack',
};

export const WHATS_INCLUDED_FULL_HOME = [
  'Design consultation',
  'Material supply (POP/Gypsum)',
  'Labour & installation',
  'Finishing & cleaning',
  'All rooms (living, bedrooms, kitchen, dining)',
  'Site supervision',
];

export const WHATS_INCLUDED_ROOM = [
  'Design consultation',
  'Material supply (POP/Gypsum)',
  'Labour & installation',
  'Finishing & cleaning',
  'Site supervision',
];

/**
 * Flow configs consumed by PopCeilingFlow.jsx — steps array only names
 * question keys and UI shape; option lists, hints and (never, here) prices
 * come from the live catalogue.
 */
export const popFlows = {
  'full-home': {
    slug: 'full-home',
    title: 'Full Home POP',
    heroTagline: 'Complete false ceiling packages for 1 BHK to Duplex homes.',
    intro: {
      eyebrow: 'PROFESSIONAL',
      heading: 'Transform your entire home with elegant POP ceilings.',
      image: '/assets/pop-ceiling/full-home/ceiling-design.jpg',
      points: [
        { icon: 'sparkle', label: 'Modern Designs' },
        { icon: 'award', label: 'Premium Finish' },
        { icon: 'shield', label: 'Durable & Long-lasting' },
        { icon: 'helmet', label: 'Expert Installation' },
      ],
    },
    whatsIncluded: WHATS_INCLUDED_FULL_HOME,
    steps: [
      { id: 'home_type', type: 'option', questionKey: 'pop_home_type', title: 'Select Your Home Type', icon: 'building' },
      { id: 'design_style', type: 'style', questionKey: 'pop_home_design_style', title: 'Choose Design Style', icon: 'layers' },
      { id: 'addons', type: 'addon', questionKey: 'pop_addon', title: 'Additional Options (Optional)' },
      { id: 'summary', type: 'summary', title: 'Your Selection' },
    ],
  },
  room: {
    slug: 'room',
    title: 'Room POP',
    heroTagline: 'Stylish POP ceilings for individual rooms.',
    intro: {
      eyebrow: 'PROFESSIONAL',
      heading: 'Stylish POP ceilings for individual rooms.',
      image: POP_HERO_IMAGE,
      points: [
        { icon: 'palette', label: 'Custom Designs' },
        { icon: 'package', label: 'Quality Materials' },
        { icon: 'helmet', label: 'Expert Installation' },
        { icon: 'clock', label: 'On-Time Completion' },
      ],
    },
    whatsIncluded: WHATS_INCLUDED_ROOM,
    steps: [
      { id: 'room_type', type: 'option', questionKey: 'pop_room_type', title: 'Which Room Do You Need POP For?', icon: 'home-check', notesFor: 'other-room', notesLabel: 'Describe the room', notesPlaceholder: 'e.g. Pooja room, guest room, home office…' },
      { id: 'design_style', type: 'style', questionKey: 'pop_room_design_style', title: 'Choose Design Style', icon: 'layers', notesFor: 'custom-design', notesLabel: 'Your design brief (optional)', notesPlaceholder: 'Describe what you have in mind — style, colours, references you can share on your visit…' },
      { id: 'addons', type: 'addon', questionKey: 'pop_addon', title: 'Add-On Services (Optional)' },
      { id: 'summary', type: 'summary', title: 'Your Selection' },
    ],
  },
};

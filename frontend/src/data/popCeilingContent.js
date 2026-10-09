/**
 * Presentational content for POP Ceiling & Design.
 * Option lists and prices come from the catalogue API.
 */

export const POP_HERO_IMAGE = '/assets/pop-ceiling/hero/living-room-cove.webp';

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

export const DESIGN_STYLE_ICONS = {
  'flat-ceiling': 'ceiling',
  'double-layer-ceiling': 'layers',
  'floating-ceiling': 'cove',
  'border-ceiling': 'border',
  'profile-pop': 'cove',
  'pvc-panel-pop': 'panel',

  // Existing catalogue values retained for compatibility.
  'simple-elegant': 'sparkle',
  simple: 'sparkle',
  modern: 'layers',
  classic: 'award',
  luxury: 'shield',
  'cove-ceiling': 'cove',
  'tray-ceiling': 'tray',
  'custom-design': 'palette',
};

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

export const popFlows = {
  'full-home': {
    slug: 'full-home',
    title: 'Full Home POP',
    heroTagline: 'Complete POP ceiling work for 1 BHK, 2 BHK, 3 BHK and 4 BHK / Villa.',
    intro: {
      eyebrow: 'PROFESSIONAL',
      heading: 'Transform your entire home with elegant POP ceilings.',
      image: '/assets/pop-ceiling/full-home/ceiling-design.webp',
      points: [
        { icon: 'sparkle', label: 'Modern Designs' },
        { icon: 'award', label: 'Premium Finish' },
        { icon: 'shield', label: 'Durable & Long-lasting' },
        { icon: 'helmet', label: 'Expert Installation' },
      ],
    },
    whatsIncluded: WHATS_INCLUDED_FULL_HOME,
    steps: [
      {
        id: 'home_type',
        type: 'option',
        questionKey: 'pop_home_type',
        title: 'Select Your Home Type',
        icon: 'building',
      },
      {
        id: 'design_style',
        type: 'style',
        questionKey: 'pop_home_design_style',
        title: 'Choose Ceiling Type',
        icon: 'layers',
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Your Selection',
      },
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
      {
        id: 'room_type',
        type: 'option',
        questionKey: 'pop_room_type',
        title: 'Which Room Do You Need POP For?',
        icon: 'home-check',
        notesFor: 'other-room',
        notesLabel: 'Describe the room',
        notesPlaceholder: 'e.g. Pooja room, guest room, home office…',
      },
      {
        id: 'design_style',
        type: 'style',
        questionKey: 'pop_room_design_style',
        title: 'Choose Ceiling Type',
        icon: 'layers',
      },
      {
        id: 'summary',
        type: 'summary',
        title: 'Your Selection',
      },
    ],
  },
};
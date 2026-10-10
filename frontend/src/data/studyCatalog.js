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

/** Names for the design-page colour swatches, shown to the customer and sent with the booking. */
export const interiorColourNames = {
  '#efe9e2': 'Ivory',
  '#d8c9b0': 'Beige',
  '#6b4a34': 'Walnut',
  '#2e2e2e': 'Charcoal',
};

export const interiorFeatures = {
  waterproof: {
    icon: 'droplet',
    label: 'Waterproof',
  },

  'termite-resistant': {
    icon: 'shield',
    label: 'Termite Resistant',
  },

  'easy-clean': {
    icon: 'check-circle',
    label: 'Easy to Clean',
  },

  warranty: {
    icon: 'award',
    label: '5 Years Warranty',
  },

  'premium-wood': {
    icon: 'layers',
    label: 'Premium Wood Finish',
  },

  'designer-panel': {
    icon: 'blueprint',
    label: 'Designer Panel',
  },

  'durable-hardware': {
    icon: 'key',
    label: 'Durable Hardware',
  },

  installation: {
    icon: 'check-circle',
    label: 'Installation & Finishing',
  },
};

/* =========================================================
   STUDY — all 22 pages of Study_table.pdf
   Images: 15 unique sets, named by the PDF page of first use.
   Repeated pages reuse the same set.
   ========================================================= */

const STUDY_DIR = '/assets/projects/interior-by-choice/study';
const pad = (n) => String(n).padStart(2, '0');

const studyViews = (n) => ({
  front: `${STUDY_DIR}/${pad(n)}-front.webp`,
  side: `${STUDY_DIR}/${pad(n)}-side.webp`,
  detail: `${STUDY_DIR}/${pad(n)}-detail.webp`,
});

// rows = [title, description, icon]; the photo is the n-th crop of that page
const studyIncluded = (n, rows) =>
  rows.map(([title, desc, icon], i) => ({
    title,
    desc,
    icon,
    image: `${STUDY_DIR}/included/${pad(n)}-${i + 1}.webp`,
  }));

const STUDY_TAGLINE = 'A perfect blend of functionality and modern aesthetics.';
const STUDY_EXCL = 'Chair, laptop, accessories, décor items, electrical points and wiring (if required).';
const STUDY_EXCL_NO_LAPTOP = 'Chair, accessories, décor items, electrical points and wiring (if required).';

const R_DESK = ['Study Desk & Worktop', 'Spacious and durable work surface with premium finish', 'desk'];
const R_TABLE = ['Study Table & Worktop', 'Spacious and durable work surface with premium finish', 'desk'];
const R_DRAWERS = ['Storage Drawers', 'Smooth glide drawers for organised storage', 'cabinet'];
const R_LED = ['LED Profile Lighting', 'Warm lighting to enhance the look and functionality', 'bulb'];
const R_INSTALL = ['Installation & Finishing', 'Professional installation with neat finishing', 'install'];
const R_OVERHEAD = ['Overhead Storage Cabinets', 'Closed cabinets to keep your space organised', 'door'];
const R_DISPLAY = ['Open Display Shelves', 'Stylish open shelves for books and décor items', 'shelves'];
const R_MATERIALS = ['Premium Materials', 'High-quality laminate/MDF with wood finish', 'finish'];

const studyDesignsById = {
  1: {
    name: 'Modern Study Workstation',
    price: '₹18,000 – ₹35,000',
    description: 'This study workstation features a spacious desk with integrated storage drawers, elegant wall shelves, warm LED lighting and a stylish wall panel backdrop, creating a comfortable and space-efficient workspace for your home.',
    rows: [
      R_DESK,
      ['Storage Drawers', 'Integrated drawers for organized storage', 'cabinet'],
      ['Wall Shelves', 'Open shelves to keep essentials within reach', 'shelves'],
      R_LED,
      ['Wall Panel / Backdrop', 'Stylish panel design for a premium modern look', 'slat'],
      R_INSTALL,
    ],
  },
  2: {
    name: 'Modern Study Table',
    price: '₹12,000 – ₹28,000',
    description: 'This study table features a spacious work surface, integrated storage shelves, a utility drawer and a cabinet, with warm LED lighting — creating a stylish and organised workspace for your home.',
    exclusions: STUDY_EXCL_NO_LAPTOP,
    rows: [
      R_TABLE,
      ['Storage Drawer', 'Smooth glide drawer for organized storage', 'cabinet'],
      ['Wall Shelves', 'Multiple open shelves to keep essentials within reach', 'shelves'],
      R_LED,
      ['Storage Cabinet', 'Closed cabinet with internal shelves for extra storage', 'door'],
      R_INSTALL,
    ],
  },
  3: {
    name: 'Minimalist Study Desk',
    price: '₹12,000 – ₹28,000',
    description: 'This study desk features a compact yet spacious work surface with open shelves, storage drawers and a clean minimal design, creating a cosy and organised workspace for your home.',
    exclusions: STUDY_EXCL_NO_LAPTOP,
    rows: [
      R_DESK,
      ['Storage Drawers', 'Smooth glide drawers for organised storage', 'cabinet'],
      ['Wall Shelves', 'Open shelves to keep essentials within reach', 'shelves'],
      R_LED,
      R_MATERIALS,
      R_INSTALL,
    ],
  },
  4: {
    name: 'Modern Wooden Study Table',
    tagline: 'A warm blend of functionality and timeless aesthetics.',
    price: '₹15,000 – ₹30,000',
    description: 'This study table features a spacious worktop, integrated bookshelf with open storage, convenient drawer storage and a beautiful wood finish, along with warm task lighting — creating a stylish and organised workspace for your home.',
    rows: [
      R_DESK,
      ['Open Bookshelves', 'Multiple open shelves to keep books and essentials within reach', 'shelves'],
      R_DRAWERS,
      ['LED/Task Lighting', 'Warm lighting to enhance the look and functionality', 'bulb'],
      ['Wood Finish & Panels', 'High-quality laminate/MDF with wood finish', 'slat'],
      R_INSTALL,
    ],
  },
  5: {
    name: 'Modern Study Desk',
    price: '₹18,000 – ₹35,000',
    description: 'This study desk features a spacious worktop with integrated storage drawers, open shelves and a side cabinet, along with warm LED lighting — creating a comfortable and organised workspace for your home.',
    rows: [
      R_DESK,
      R_DRAWERS,
      ['Open Bookshelves', 'Multiple open shelves to keep books and essentials within reach', 'shelves'],
      R_LED,
      ['Side Cabinet', 'Closed storage with internal shelves for extra space', 'door'],
      R_INSTALL,
    ],
  },
  6: {
    name: 'Modern Study Table',
    price: '₹18,000 – ₹35,000',
    description: 'This study table features a spacious worktop with overhead storage cabinets, open display shelves and a tall glass unit with LED lighting — creating a stylish and organised workspace for your home.',
    rows: [
      R_TABLE,
      ['Overhead Storage', 'Closed cabinets to keep your space clutter-free', 'door'],
      R_DISPLAY,
      R_LED,
      ['Storage Drawers & Cabinet', 'Drawer and closed cabinet for extra storage', 'cabinet'],
      R_INSTALL,
    ],
  },
  7: {
    name: 'Modern Study Table',
    price: '₹20,000 – ₹38,000',
    description: 'This study table features a spacious worktop with overhead storage cabinets, open shelves and a tall display unit with LED lighting — creating a clean and stylish workspace for your home.',
    rows: [
      R_TABLE,
      ['Storage Cabinets', 'Closed cabinets to keep your space organised', 'door'],
      ['Open Shelves', 'Multiple open shelves for books and essentials within reach', 'shelves'],
      R_LED,
      ['Display Unit with Glass', 'Elegant glass unit with LED lighting for décor items', 'glass'],
      R_INSTALL,
    ],
  },
  8: {
    name: 'Modern Study Table',
    price: '₹18,000 – ₹32,000',
    description: 'This study table features a sleek wall-mounted design with overhead storage cabinets, open shelves and warm LED lighting — creating a stylish and space-efficient workspace for your home.',
    rows: [
      R_TABLE,
      R_OVERHEAD,
      ['Open Shelves', 'Stylish open shelves for books and décor items', 'shelves'],
      R_LED,
      ['Wall Panel Detailing', 'Modern vertical panel design for a premium look', 'slat'],
      R_INSTALL,
    ],
  },
  9: {
    name: 'Modern Study Table',
    price: '₹18,000 – ₹32,000',
    description: 'This wall-mounted study table features a sleek worktop with overhead storage cabinets, a spacious drawer unit and a modern wood finish — creating a stylish and space-efficient workspace for your home.',
    rows: [R_TABLE, R_OVERHEAD, R_DRAWERS, R_LED, R_MATERIALS, R_INSTALL],
  },
  10: {
    name: 'Modern Study Table',
    price: '₹18,000 – ₹34,000',
    description: 'This wall-mounted study table features a spacious worktop with floating drawers, overhead storage cabinets and open shelves — creating a stylish and organised workspace for your home.',
    rows: [
      R_TABLE,
      R_OVERHEAD,
      ['Open Display Shelves', 'Multiple open shelves for books and décor items', 'shelves'],
      ['Floating Drawers', 'Smooth glide drawers for organised storage', 'cabinet'],
      R_LED,
      R_INSTALL,
    ],
  },
  11: {
    name: 'Modern Study Table',
    price: '₹35,000 – ₹60,000',
    description: 'This study table features a spacious worktop with open shelves, storage cabinets and a wardrobe unit — creating a stylish and organised workspace for your home.',
    rows: [
      R_TABLE,
      ['Open Display Shelves', 'Multiple open shelves for books and décor items', 'shelves'],
      ['Storage Cabinets', 'Closed cabinets to keep your space organised', 'door'],
      R_LED,
      ['Drawers', 'Smooth glide drawers for organised storage', 'cabinet'],
      R_INSTALL,
    ],
  },
  12: {
    name: 'Modern Study Table',
    price: '₹32,000 – ₹55,000',
    description: 'This study table features a sleek wall-mounted design with overhead storage cabinets, open shelves and a modern laminate finish — creating a stylish and space-efficient workspace for your home.',
    rows: [
      R_TABLE,
      R_OVERHEAD,
      R_DISPLAY,
      ['Premium Back Panel', 'Modern marble/laminate back panel for a premium look', 'marble'],
      ['Drawers', 'Smooth glide drawers for organised storage', 'cabinet'],
      R_LED,
    ],
  },
  13: {
    name: 'Modern Study Table',
    price: '₹38,000 – ₹65,000',
    description: 'This study table features a sleek wall-mounted design with overhead storage cabinets, open display shelves and a modern laminate finish — creating a stylish and organised workspace for your home.',
    rows: [
      R_TABLE,
      R_OVERHEAD,
      R_DISPLAY,
      ['Glass Display Unit', 'Premium glass shutters with LED lighting', 'glass'],
      R_LED,
      R_INSTALL,
    ],
  },
  15: {
    name: 'Modern Study Table',
    price: '₹28,000 – ₹48,000',
    description: 'This study table features a sleek wall-mounted design with overhead storage cabinets, an open display niche and a premium laminate finish — creating a stylish and organised workspace for your home.',
    rows: [
      R_TABLE,
      R_OVERHEAD,
      ['Open Display Shelf', 'Stylish open shelf for décor items and books', 'shelves'],
      ['Premium Laminate Finish', 'Modern finish with elegant edge design', 'finish'],
      R_LED,
      R_INSTALL,
    ],
  },
  16: {
    name: 'Modern Study Table',
    price: '₹32,000 – ₹58,000',
    description: 'This study table features a sleek wall-mounted design with overhead storage cabinets, an open display shelf and a premium laminate finish — creating a stylish and organised workspace for your home.',
    rows: [
      R_TABLE,
      R_OVERHEAD,
      ['Open Display Shelf', 'Stylish open shelf for décor items and books', 'shelves'],
      ['Premium Laminate Finish', 'Modern finish with elegant curved edge design', 'finish'],
      R_LED,
      R_INSTALL,
    ],
  },
};

// The 22 PDF pages, in order. Repeats reuse the same data and images.
const studyPageOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 13, 15, 16, 6, 5, 4, 3, 2, 1];

export const studyCatalog = studyPageOrder.map((id) => {
  const d = studyDesignsById[id];
  return {
    id,
    name: d.name,
    tagline: d.tagline || STUDY_TAGLINE,
    price: d.price,
    description: d.description,
    images: studyViews(id),
    included: studyIncluded(id, d.rows),
    exclusions: d.exclusions || STUDY_EXCL,
  };
});

const subDesignNames = {
  'tv-wall': [
    'Marble Frame TV Unit',
    'Vertical Slat TV Unit',
    'Walnut Marble Luxe TV Unit',
    'Floating Walnut TV Unit',
    'Walnut Slat TV Unit',
    'Walnut Slat TV Unit',
    'Sage & Walnut Fluted TV Unit',
    'Sage Fluted TV Unit',
    'Warm Minimalist TV Unit',
    'Charcoal & Walnut Floating TV Unit',
    'Modern Walnut & Slat TV Unit',
    'Walnut Slat & Textured Panel TV Unit',
    'Contemporary Wood Panel TV Unit',
    'Premium TV Unit Design',
    'Modern Fluted TV Unit',
    'Minimal TV Unit',
    'Contemporary Fluted TV Unit',
    'Luxury Panelled TV Unit',
    'Contemporary Wood Panel TV Unit',
    'Modern Fluted TV Unit',
    'Premium Wooden TV Unit',
    'Modern Panelled TV Unit',
    'Contemporary Fluted TV Unit',
    'Modern Fluted TV Unit',
    'Modern Fluted TV Unit',
    'Contemporary TV Wall Unit',
    'Modern Fluted TV Unit',
    'Modern Fluted TV Unit',
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
  ],

  'living-room': [
    'Fluted Panel',
    'Wooden Panel',
    'Marble + Fluted Panel',
    'Plain Panel',
    'Designer Panel',
  ],

  entrance: [
    'Warli Art Wooden Entrance Door',
    'Contemporary LED Entrance Door',
    'Mandala Carved Wooden Entrance Door',
    'Arched Cane & Jali Entrance Door',
    'Glass & Grill Modern Entrance Door',
    'Jali Panel Wooden Entrance Door',
    'Vertical Groove Wooden Entrance Door',
    'Geometric Wood Panel Entrance Door',
    'Arched Ribbed Wooden Door',
    'Wood & Mesh Panel Entrance Door',
    'Vertical Glass Inlay Entrance Door',
    'Diagonal Glass Inlay Entrance Door',
    'Geometric Panel Wooden Entrance Door',
    'Hexagon Panel Wooden Entrance Door',
    'Arched Glass-Grill Entrance Door',
    'Traditional Metal Jali Entrance Door',
    'Contemporary Grill Panel Entrance Door',
    'Vertical Slat Glass Entrance Door',
    'Carved Leaf Pattern Entrance Door',
    'Curved Slat Wooden Entrance Door',
    'Geometric Glass-Grill Entrance Door',
    'Carved Metal-Accent Entrance Door',
    'Modern Geometric Designer Door',
    'Beige Vertical-Grille Entrance Door',
    'Fluted Panel Modern Entrance Door',
    'Geometric Fluted Wooden Door',
    'Premium Fluted Wooden Entrance Door',
  ],

  study: studyCatalog.map((d) => d.name),

 'mandir': [
  'Wall Mounted Mandir',
  'Floor Standing Mandir',
  'Corner Mandir',
  'Open Shelf Mandir',
  'Modern Premium Mandir',
  'Wooden Carved Mandir',
  'Marble Mandir',
  'Contemporary Premium Mandir',
],
};

/* =========================================================
   LIVING ROOM SUB OPTIONS
   ========================================================= */

export const livingRoomSubOptions = {
  'Fluted Panel': [
    'Natural Oak',
    'Mocha Brown',
    'Pecan Brown',
    'Marble White',
    'Black',
    'White',
    'Dark Grey',
    'Light Grey',
  ],

  'Wooden Panel': [
    'Natural Oak',
    'Teak',
    'Walnut',
    'Wenge',
    'Coffee',
    'White Oak',
    'Grey Wood',
  ],

  'Marble + Fluted Panel': [
    'Fluted Centre + Marble Sides',
    'Marble Centre + Fluted Sides',
    '50/50 Marble + Fluted',
    'Marble Strips + Fluted',
    'Marble Border + Fluted',
    'Vertical Marble + Fluted',
  ],

  'Plain Panel': [
    'White',
    'Light Grey',
    'Dark Grey',
    'Beige',
    'Warm White',
    'Wood Finish',
  ],

  'Designer Panel': [
    'Geometric Pattern',
    'Modern Lines',
    'Arch Pattern',
    'Wave Pattern',
    'Luxury Pattern',
    'Custom Pattern',
  ],
};

/* =========================================================
   LIVING ROOM MAIN IMAGES
   ========================================================= */

const livingRoomImages = {
  'Fluted Panel':
    '/assets/projects/interior-by-choice/living-room/fluted-panel.webp',

  'Wooden Panel':
    '/assets/projects/interior-by-choice/living-room/wooden-panel.webp',

  'Marble + Fluted Panel':
    '/assets/projects/interior-by-choice/living-room/marble-and-fluted-panel.webp',

  'Plain Panel':
    '/assets/projects/interior-by-choice/living-room/plain-panel.webp',

  'Designer Panel':
    '/assets/projects/interior-by-choice/living-room/designer-panel.webp',
};



/* =========================================================
   MANDIR IMAGES
   ========================================================= */

export const mandirImages = {
  'Wall Mounted Mandir':
    '/assets/projects/interior-by-choice/mandir/wall-mounted-mandir.webp',

  'Floor Standing Mandir':
    '/assets/projects/interior-by-choice/mandir/floor-standing-mandir.webp',

  'Corner Mandir':
    '/assets/projects/interior-by-choice/mandir/corner-mandir.webp',

  'Open Shelf Mandir':
    '/assets/projects/interior-by-choice/mandir/open-shelf-mandir.webp',

  'Modern Premium Mandir':
    '/assets/projects/interior-by-choice/mandir/modern-premium-mandir.webp',

  'Wooden Carved Mandir':
    '/assets/projects/interior-by-choice/mandir/wooden-carved-mandir.webp',

  'Marble Mandir':
    '/assets/projects/interior-by-choice/mandir/marble-mandir.webp',

  'Contemporary Premium Mandir':
    '/assets/projects/interior-by-choice/mandir/contemporary-premium-mandir.webp',
};



/* =========================================================
   MANDIR DESCRIPTIONS
   ========================================================= */

export const mandirDescriptions = {
  'Wall Mounted Mandir':
    'Compact design, ideal for small spaces.',

  'Floor Standing Mandir':
    'Classic and clean look with storage.',

  'Corner Mandir':
    'Space-saving design for compact homes.',

  'Open Shelf Mandir':
    'Minimal style with open shelves.',

  'Modern Premium Mandir':
    'Marble finish, LED lighting, premium look.',

  'Wooden Carved Mandir':
    'Traditional design with intricate detailing.',

  'Marble Mandir':
    'Premium finish, elegant and durable.',

  'Contemporary Premium Mandir':
    'Stylish, modern and space efficient.',
};


export const mandirGroups = {
  basic: [
    'Wall Mounted Mandir',
    'Floor Standing Mandir',
    'Corner Mandir',
    'Open Shelf Mandir',
  ],

  premium: [
    'Modern Premium Mandir',
    'Wooden Carved Mandir',
    'Marble Mandir',
    'Contemporary Premium Mandir',
  ],
};

/* =========================================================
   LIVING ROOM COLOUR IMAGES
   ========================================================= */

export const livingRoomColorImages = {
  'Fluted Panel': {
    'Natural Oak':
      '/assets/projects/interior-by-choice/living-room/fluted-panel/natural-oak.webp',

    'Mocha Brown':
      '/assets/projects/interior-by-choice/living-room/fluted-panel/mocha-brown.webp',

    'Pecan Brown':
      '/assets/projects/interior-by-choice/living-room/fluted-panel/pecan-brown.webp',

    'Marble White':
      '/assets/projects/interior-by-choice/living-room/fluted-panel/marble-white.webp',

    Black:
      '/assets/projects/interior-by-choice/living-room/fluted-panel/black.webp',

    White:
      '/assets/projects/interior-by-choice/living-room/fluted-panel/white.webp',

    'Dark Grey':
      '/assets/projects/interior-by-choice/living-room/fluted-panel/dark-grey.webp',

    'Light Grey':
      '/assets/projects/interior-by-choice/living-room/fluted-panel/light-grey.webp',
  },

  'Wooden Panel': {
    'Natural Oak':
      '/assets/projects/interior-by-choice/living-room/wooden-panel/natural-oak.webp',

    Teak:
      '/assets/projects/interior-by-choice/living-room/wooden-panel/teak.webp',

    Walnut:
      '/assets/projects/interior-by-choice/living-room/wooden-panel/walnut.webp',

    Wenge:
      '/assets/projects/interior-by-choice/living-room/wooden-panel/wenge.webp',

    Coffee:
      '/assets/projects/interior-by-choice/living-room/wooden-panel/coffee.webp',

    'White Oak':
      '/assets/projects/interior-by-choice/living-room/wooden-panel/white-oak.webp',

    'Grey Wood':
      '/assets/projects/interior-by-choice/living-room/wooden-panel/grey-wood.webp',
  },

  'Marble + Fluted Panel': {
    'Fluted Centre + Marble Sides':
      '/assets/projects/interior-by-choice/living-room/marble-and-fluted-panel/fluted-centre-marble-sides.webp',

    'Marble Centre + Fluted Sides':
      '/assets/projects/interior-by-choice/living-room/marble-and-fluted-panel/marble-centre-fluted-sides.webp',

    '50/50 Marble + Fluted':
      '/assets/projects/interior-by-choice/living-room/marble-and-fluted-panel/50-50-marble-fluted.webp',

    'Marble Strips + Fluted':
      '/assets/projects/interior-by-choice/living-room/marble-and-fluted-panel/marble-strips-fluted.webp',

    'Marble Border + Fluted':
      '/assets/projects/interior-by-choice/living-room/marble-and-fluted-panel/marble-border-fluted.webp',

    'Vertical Marble + Fluted':
      '/assets/projects/interior-by-choice/living-room/marble-and-fluted-panel/vertical-marble-fluted.webp',
  },

  'Plain Panel': {
    White:
      '/assets/projects/interior-by-choice/living-room/plain-panel/white.webp',

    'Light Grey':
      '/assets/projects/interior-by-choice/living-room/plain-panel/light-grey.webp',

    'Dark Grey':
      '/assets/projects/interior-by-choice/living-room/plain-panel/dark-grey.webp',

    Beige:
      '/assets/projects/interior-by-choice/living-room/plain-panel/beige.webp',

    'Warm White':
      '/assets/projects/interior-by-choice/living-room/plain-panel/warm-white.webp',

    'Wood Finish':
      '/assets/projects/interior-by-choice/living-room/plain-panel/wood-finish.webp',
  },

  'Designer Panel': {
    'Geometric Pattern':
      '/assets/projects/interior-by-choice/living-room/designer-panel/geometric-pattern.webp',

    'Modern Lines':
      '/assets/projects/interior-by-choice/living-room/designer-panel/modern-lines.webp',

    'Arch Pattern':
      '/assets/projects/interior-by-choice/living-room/designer-panel/arch-pattern.webp',

    'Wave Pattern':
      '/assets/projects/interior-by-choice/living-room/designer-panel/wave-pattern.webp',

    'Luxury Pattern':
      '/assets/projects/interior-by-choice/living-room/designer-panel/luxury-pattern.webp',

    'Custom Pattern':
      '/assets/projects/interior-by-choice/living-room/designer-panel/custom-pattern.webp',
  },
};

/* =========================================================
   LIVING ROOM DETAILS / FEATURES
   ========================================================= */

export const livingRoomDescriptions = {
  'Fluted Panel':
    'Modern vertical lines for a stylish and elegant living room wall.',

  'Wooden Panel':
    'Warm wood finish for a rich and timeless look. Perfect for living room walls.',

  'Marble + Fluted Panel':
    'Marble with fluted panels for a premium and elegant living room look.',

  'Plain Panel':
    'Simple and clean wall design for a calm, modern living room.',

  'Designer Panel':
    'Unique patterns for a modern statement wall in your living room.',
};

export const livingRoomFeatures = [
  {
    icon: 'sparkles',
    label: 'Elegant',
    sublabel: 'Look',
  },

  {
    icon: 'settings',
    label: 'Easy to',
    sublabel: 'Maintain',
  },

  {
    icon: 'shield',
    label: 'Durable',
    sublabel: 'Material',
  },

  {
    icon: 'home',
    label: 'Suitable for',
    sublabel: 'Mumbai Homes',
  },
];

/* =========================================================
   LIVING ROOM GALLERY IMAGES
   ========================================================= */

export const livingRoomGalleryImages = {
  'Fluted Panel': [
    '/assets/projects/interior-by-choice/living-room/fluted-panel.webp',
  ],

  'Wooden Panel': [
    '/assets/projects/interior-by-choice/living-room/wooden-panel.webp',
  ],

  'Marble + Fluted Panel': [
    '/assets/projects/interior-by-choice/living-room/marble-and-fluted-panel.webp',
  ],

  'Plain Panel': [
    '/assets/projects/interior-by-choice/living-room/plain-panel.webp',
  ],

  'Designer Panel': [
    '/assets/projects/interior-by-choice/living-room/designer-panel.webp',
  ],
};

/* =========================================================
   DESIGN PRESETS
   ========================================================= */

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

  'entrance': {
    features: [
      'premium-wood',
      'designer-panel',
      'durable-hardware',
      'installation',
    ],

    materialDetails: {
      Finish: 'Premium wood finish',
      Design: 'Custom designer panel',
      Hardware: 'Durable door hardware',
      Lighting: 'LED lighting optional',
      Installation: 'Installation and finishing included',
    },
  },

  'study': {
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

  'mandir': {
    features: [
      'easy-clean',
      'warranty',
    ],

    materialDetails: {
      'Panel Type':
        'MDF / Veneer / Marble-finish Panel',
      Thickness: '8 mm / 12 mm',
      Finish: 'Matte / Woodgrain',
      'Installation Time': '2–3 Days',
    },
  },
};

/* =========================================================
   HELPERS
   ========================================================= */

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');


    /*
 * TV WALL IMAGE MAP
 * -----------------------------------------
 * One photo per design, in the same order as the
 * TV wall names in subDesignNames.
 */

const tvWallImageMap = [
  '/assets/projects/interior-by-choice/tv-wall/1.webp',
  '/assets/projects/interior-by-choice/tv-wall/2.webp',
  '/assets/projects/interior-by-choice/tv-wall/3.webp',
  '/assets/projects/interior-by-choice/tv-wall/4.webp',
  '/assets/projects/interior-by-choice/tv-wall/5.webp',
  '/assets/projects/interior-by-choice/tv-wall/6.webp',
  '/assets/projects/interior-by-choice/tv-wall/7.webp',
  '/assets/projects/interior-by-choice/tv-wall/8.webp',
  '/assets/projects/interior-by-choice/tv-wall/9.webp',
  '/assets/projects/interior-by-choice/tv-wall/10.webp',
  '/assets/projects/interior-by-choice/tv-wall/11.webp',
  '/assets/projects/interior-by-choice/tv-wall/12.webp',
  '/assets/projects/interior-by-choice/tv-wall/13.webp',
  '/assets/projects/interior-by-choice/tv-wall/14.webp',
  '/assets/projects/interior-by-choice/tv-wall/15.webp',
  '/assets/projects/interior-by-choice/tv-wall/16.webp',
  '/assets/projects/interior-by-choice/tv-wall/17.webp',
  '/assets/projects/interior-by-choice/tv-wall/18.webp',
  '/assets/projects/interior-by-choice/tv-wall/19.webp',
  '/assets/projects/interior-by-choice/tv-wall/20.webp',
  '/assets/projects/interior-by-choice/tv-wall/21.webp',
  '/assets/projects/interior-by-choice/tv-wall/22.webp',
  '/assets/projects/interior-by-choice/tv-wall/23.webp',
  '/assets/projects/interior-by-choice/tv-wall/24.webp',
  '/assets/projects/interior-by-choice/tv-wall/25.webp',
  '/assets/projects/interior-by-choice/tv-wall/26.webp',
  '/assets/projects/interior-by-choice/tv-wall/27.webp',
  '/assets/projects/interior-by-choice/tv-wall/28.webp',
];

const tvEstimatedPrices = [
  // 1–28 : PDF मधले exact prices
  '₹65,000 – ₹1,05,000',
  '₹55,000 – ₹95,000',
  '₹60,000 – ₹1,00,000',
  '₹40,000 – ₹75,000',
  '₹50,000 – ₹90,000',
  '₹40,000 – ₹70,000',
  '₹45,000 – ₹80,000',
  '₹45,000 – ₹85,000',
  '₹40,000 – ₹75,000',
  '₹40,000 – ₹70,000',
  '₹32,000 – ₹55,000',
  '₹38,000 – ₹65,000',
  '₹42,000 – ₹72,000',
  '₹55,000 – ₹95,000',
  '₹45,000 – ₹85,000',
  '₹35,000 – ₹60,000',
  '₹28,000 – ₹55,000',
  '₹32,000 – ₹58,000',
  '₹45,000 – ₹85,000',
  '₹55,000 – ₹95,000',
  '₹35,000 – ₹60,000',
  '₹32,000 – ₹58,000',
  '₹38,000 – ₹70,000',
  '₹35,000 – ₹60,000',
  '₹28,000 – ₹50,000',
  '₹25,000 – ₹45,000',
  '₹30,000 – ₹55,000',
  '₹25,000 – ₹45,000',

  // 29–50 : Estimated prices
  '₹40,000 – ₹70,000',
  '₹45,000 – ₹75,000',
  '₹32,000 – ₹55,000',
  '₹35,000 – ₹60,000',
  '₹40,000 – ₹65,000',
  '₹38,000 – ₹65,000',
  '₹45,000 – ₹80,000',
  '₹35,000 – ₹60,000',
  '₹30,000 – ₹50,000',
  '₹40,000 – ₹70,000',
  '₹45,000 – ₹75,000',
  '₹35,000 – ₹60,000',
  '₹50,000 – ₹85,000',
  '₹35,000 – ₹60,000',
  '₹40,000 – ₹70,000',
  '₹45,000 – ₹80,000',
  '₹38,000 – ₹65,000',
  '₹30,000 – ₹55,000',
  '₹40,000 – ₹70,000',
  '₹45,000 – ₹75,000',
  '₹35,000 – ₹60,000',
  '₹40,000 – ₹70,000',
];

const mandirEstimatedPrices = [
  '₹8,000 – ₹18,000',   // Wall Mounted Mandir
  '₹8,000 – ₹18,000',   // Floor Standing Mandir
  '₹8,000 – ₹18,000',   // Corner Mandir
  '₹8,000 – ₹18,000',   // Open Shelf Mandir
  '₹25,000 – ₹75,000',  // Modern Premium Mandir
  '₹25,000 – ₹75,000',  // Wooden Carved Mandir
  '₹25,000 – ₹75,000',  // Marble Mandir
  '₹25,000 – ₹75,000',  // Contemporary Premium Mandir
];

const basePrices = {
  'tv-wall': 699,
  'bed-back-wall': 799,
  'living-room': 749,
  'entrance': 649,
  'study': 849,
  'mandir' : 899,
};

const taglines = {
  'tv-wall':
    'Clean lines. Timeless look.',

  'bed-back-wall':
    'Calm colours, restful room.',

  'living-room':
    'Soft tones, easy to live in.',

  'entrance':
    'A welcome that sets the tone.',

  'study':
    'A focused, functional workspace.',

  'mandir':
    'A peaceful, beautifully finished pooja space.',
};

const entranceDoorDetails = [
  {
    pdfPage: 1,
    priceRange: '₹70,000 – ₹1,60,000',
    tagline: 'A perfect blend of tradition, culture and modern elegance.',
    description: 'A premium wooden entrance with intricate Warli art, clean lines and a high-quality finish.',
  },
  {
    pdfPage: 2,
    priceRange: '₹70,000 – ₹1,50,000',
    tagline: 'Modern design with a luxurious finish.',
    description: 'A contemporary wooden door with a patterned panel, LED lighting and premium hardware.',
  },
  {
    pdfPage: 3,
    priceRange: '₹65,000 – ₹1,40,000',
    tagline: 'Traditional artistry meets modern elegance.',
    description: 'An elegant wooden entrance with a carved mandala panel and a refined premium finish.',
  },
  {
    pdfPage: 4,
    priceRange: '₹70,000 – ₹1,50,000',
    tagline: 'Traditional craftsmanship with a timeless arch.',
    description: 'An arched wooden entrance featuring a cane and jali panel with warm lighting.',
  },
  {
    pdfPage: 5,
    priceRange: '₹60,000 – ₹1,20,000',
    tagline: 'Modern design with timeless elegance.',
    description: 'A glass-and-grill entrance with an openable mesh panel and contemporary hardware.',
  },
  {
    pdfPage: 6,
    priceRange: '₹55,000 – ₹1,20,000',
    tagline: 'Warm wood with a distinctive jali detail.',
    description: 'A rich wooden finish paired with a decorative jali panel, clean lines and a statement handle.',
  },
  {
    pdfPage: 7,
    priceRange: '₹60,000 – ₹1,25,000',
    tagline: 'Modern design with natural wood warmth.',
    description: 'A wooden entrance with vertical grooves, a modern cut-out detail and clean contemporary lines.',
  },
  {
    pdfPage: 8,
    priceRange: '₹55,000 – ₹1,20,000',
    tagline: 'A contemporary geometric statement.',
    description: 'A stylish wooden panel door with geometric detailing and refined modern hardware.',
  },
  {
    pdfPage: 9,
    priceRange: '₹50,000 – ₹1,10,000',
    tagline: 'A sleek arch with a warm wooden finish.',
    description: 'A modern wooden door with an arched ribbed panel and a minimal, polished look.',
  },
  {
    pdfPage: 10,
    priceRange: '₹60,000 – ₹1,20,000',
    tagline: 'Modern detailing for a welcoming entrance.',
    description: 'A wooden entrance with panel detailing, mesh inserts, clean lines and contemporary hardware.',
  },
  {
    pdfPage: 11,
    priceRange: '₹55,000 – ₹1,15,000',
    tagline: 'Bright, clean lines with vertical glass inlays.',
    description: 'A modern wooden door with vertical glass inlays, a clean finish and contemporary hardware.',
  },
  {
    pdfPage: 12,
    priceRange: '₹50,000 – ₹1,10,000',
    tagline: 'A bold diagonal design with glass accents.',
    description: 'A warm wooden entrance with diagonal panel detailing, glass inserts and modern hardware.',
  },
  {
    pdfPage: 13,
    priceRange: '₹45,000 – ₹1,00,000',
    tagline: 'Modern geometry with an understated finish.',
    description: 'A wooden entrance with a geometric panel design, clean lines and a warm finish.',
  },
  {
    pdfPage: 14,
    priceRange: '₹60,000 – ₹1,25,000',
    tagline: 'A striking geometric pattern in natural wood.',
    description: 'A contemporary wooden door with a distinctive hexagon panel and elegant detailing.',
  },
  {
    pdfPage: 15,
    priceRange: '₹50,000 – ₹1,00,000',
    tagline: 'An elegant arch with glass and grill details.',
    description: 'A sleek wooden entrance with an arched glass-grill panel and a timeless finish.',
  },
  {
    pdfPage: 16,
    priceRange: '₹55,000 – ₹1,10,000',
    tagline: 'Traditional patterns meet modern metalwork.',
    description: 'A wooden entrance with an intricately designed metal panel and contemporary hardware.',
  },
  {
    pdfPage: 18,
    priceRange: '₹45,000 – ₹95,000',
    tagline: 'A contemporary grill design with clean lines.',
    description: 'A modern wooden entrance with a geometric grill panel and a warm, understated finish.',
  },
  {
    pdfPage: 19,
    priceRange: '₹50,000 – ₹1,00,000',
    tagline: 'Vertical slats and glass create a bright welcome.',
    description: 'A natural wood-finish entrance with a vertical slat glass panel and modern hardware.',
  },
  {
    pdfPage: 21,
    priceRange: '₹50,000 – ₹1,20,000',
    tagline: 'A carved leaf detail with a natural finish.',
    description: 'A wooden entrance featuring a beautifully carved leaf pattern and clean panel detailing.',
  },
  {
    pdfPage: 22,
    priceRange: '₹60,000 – ₹1,25,000',
    tagline: 'Contemporary curves meet vertical wood slats.',
    description: 'A sleek wooden entrance with vertical slat detailing, a curved design and modern hardware.',
  },
  {
    pdfPage: 23,
    priceRange: '₹55,000 – ₹1,10,000',
    tagline: 'Geometric glass and grill details, in a warm finish.',
    description: 'A modern wooden door with geometric glass-grill detailing and a secure, refined finish.',
  },
  {
    pdfPage: 24,
    priceRange: '₹65,000 – ₹1,40,000',
    tagline: 'Detailed carving with contemporary metal accents.',
    description: 'A designer entrance combining carved details, metal accents and a vertical glass grill.',
  },
  {
    pdfPage: 25,
    priceRange: '₹40,000 – ₹85,000',
    tagline: 'Contemporary geometry with a matte finish.',
    description: 'A geometric inlay door with a rich matte finish and modern smart hardware.',
  },
  {
    pdfPage: 26,
    priceRange: '₹45,000 – ₹95,000',
    tagline: 'Premium aesthetics with a soft beige finish.',
    description: 'A wood-toned designer door with a vertical grille and contemporary hardware.',
  },
  {
    pdfPage: 27,
    priceRange: '₹60,000 – ₹1,20,000',
    tagline: 'Fluted panels and modern metalwork.',
    description: 'A contemporary entrance with vertical fluted panels, a wooden handle and a stylish metal grill.',
  },
  {
    pdfPage: 28,
    priceRange: '₹40,000 – ₹85,000',
    tagline: 'Geometric detailing on a modern fluted door.',
    description: 'A modern wooden door with vertical fluted panels and geometric design details.',
  },
  {
    pdfPage: 29,
    priceRange: '₹55,000 – ₹1,20,000',
    tagline: 'A premium finish with added character and durability.',
    description: 'A wooden entrance with vertical fluted panels, geometric detailing and a warm finish.',
  },
];

const bedBackWallDetails = [
  {
    priceRange: '₹45,000 – ₹75,000',
    description: 'Soft neutral panels and warm lighting create a calm, minimal bedroom backdrop.',
  },
  {
    priceRange: '₹50,000 – ₹85,000',
    description: 'Rich wood panelling brings classic warmth and a timeless finish to the bedroom.',
  },
  {
    priceRange: '₹60,000 – ₹1,00,000',
    description: 'Upholstered geometric panels and balanced bedside lighting create a refined hotel-inspired look.',
  },
  {
    priceRange: '₹50,000 – ₹85,000',
    description: 'Warm beige panels and soft lighting bring a relaxed, welcoming feel to the room.',
  },
  {
    priceRange: '₹65,000 – ₹1,05,000',
    description: 'A fluted headboard wall adds texture and a distinctive architectural detail.',
  },
  {
    priceRange: '₹55,000 – ₹95,000',
    description: 'A bold walnut feature wall pairs natural wood grain with warm ambient lighting.',
  },
  {
    priceRange: '₹50,000 – ₹85,000',
    description: 'An ivory arched feature wall and subtle lighting create a light, elegant bedroom.',
  },
  {
    priceRange: '₹55,000 – ₹90,000',
    description: 'Earthy green tones and natural textures give the bedroom a calm, grounded character.',
  },
  {
    priceRange: '₹60,000 – ₹1,00,000',
    description: 'Clean geometric panels in layered neutral tones create a contemporary focal wall.',
  },
  {
    priceRange: '₹70,000 – ₹1,20,000',
    description: 'Soft upholstered panels and blush-toned accents create a plush, luxurious headboard wall.',
  },
];

/* =========================================================
   TV WALL — PDF DESIGN DETAILS
   ========================================================= */

export const tvWallDetails = [  {
    description:
      'A modern and luxurious TV unit with vertical wooden slat panels, a premium marble-look feature panel and warm LED lighting designed to elevate your living space.',

    included: [
      'Vertical Slat Wall Panels',
      'Marble-Look Feature Panel',
      'Floating TV Cabinet with Storage',
      'Premium Finishing',
      'LED Profile Lighting',
      'Installation & Workmanship',
    ],

    exclusions:
      'Television, decor accessories, plants, curtains, electrical points/wiring and other loose items are not included.',
  },

  {
    description:
      'A modern and elegant TV unit with vertical wood slat panels, ambient LED lighting and sleek floating cabinet detailing designed to create a warm and sophisticated living space.',

    included: [
      'Vertical Slat Wall Panels',
      'Feature Wall Finish',
      'Wall Sconces (2 Nos.)',
      'Floating TV Cabinet with Storage',
      'LED Profile Lighting',
      'Installation & Workmanship',
    ],

    exclusions:
      'Television, soundbar, decor accessories, plants, curtains and electrical points/wiring are not included.',
  },

  {
    description:
      'A refined living-room TV unit combining warm walnut fluted detailing, illuminated display shelves, a marble feature panel and a sleek floating storage console.',

    included: [
      'Vertical Walnut Fluted Panels',
      'Marble-Look TV Back Panel',
      'Illuminated Display Shelves',
      'Wall-Mounted TV Setup',
      'Floating Storage Console',
      'Installation & Workmanship',
    ],

    exclusions:
      'Television, decor accessories, plants, loose electrical appliances and electrical rewiring are not included.',
  },

  {
    description:
      'A modern floating TV unit with a sleek wall-mounted cabinet and LED-lit floating shelves, designed to bring warmth, style and functionality to your living space.',

    included: [
      'Floating Wall Shelf with LED Light',
      'LED Profile Lighting',
      'Floating TV Cabinet',
      'Wall-Mounted TV Setup',
      'Premium Finishing',
      'Installation & Workmanship',
    ],

    exclusions:
      'Television, decor accessories, plants, curtains and electrical points/wiring are not included.',
  },

  {
    description:
      'A contemporary and elegant TV unit featuring vertical wooden slat panels, floating shelves and a sleek floating cabinet, designed to bring warmth, texture and functionality.',

    included: [
      'Vertical Slat Wall Panels',
      'TV Back Wall Finish',
      'Floating Shelves',
      'Floating TV Cabinet with Storage',
      'Premium Finishing',
      'Installation & Workmanship',
    ],

    exclusions:
      'Television, decor accessories, plants, curtains and electrical points/wiring are not included.',
  },

  {
    description:
      'A modern and elegant TV unit with vertical walnut slat panels, warm wall sconces and a sleek floating cabinet designed to create a stylish and minimal look.',

    included: [
      'Vertical Slat Feature Wall',
      'TV Back Wall Finish',
      'Wall Sconces (2 Nos.)',
      'Floating TV Cabinet with Storage',
      'Premium Finishing',
      'Installation & Workmanship',
    ],

    exclusions:
      'Television, decor accessories, plants, curtains and electrical points/wiring are not included.',
  },

  {
    description:
      'A contemporary TV unit blending natural vertical fluted wood detailing with a muted sage-green wall panel and sleek floating console, designed for a calm and functional living space.',

    included: [
      'Vertical Fluted Wood Panel',
      'Sage Green Wall Panel',
      'Wall-Mounted TV Setup',
      'Four-Door Storage Console',
      'Premium Finishing',
      'Installation & Workmanship',
    ],

    exclusions:
      'Television, decor accessories, plants, curtains and electrical points/wiring are not included unless specifically quoted.',
  },

  {
    description:
      'A modern and elegant TV unit featuring vertical fluted panels and a sleek floating cabinet in a soft sage-green finish, designed for a contemporary living space.',

    included: [
      'Vertical Fluted Wood Panel',
      'TV Back Panel Finish',
      'Floating TV Cabinet',
      'LED Profile Lighting',
      'Premium Finishing',
      'Installation & Workmanship',
    ],

    exclusions:
      'Television, decor accessories, plants, curtains and electrical points/wiring are not included.',
  },

  {
    description:
      'A sleek and contemporary TV unit featuring vertical fluted panels and a minimal floating cabinet, designed to bring elegance and functionality to your living space.',

    included: [
      'Vertical Fluted Wood Panel',
      'TV Back Panel Finish',
      'Floating TV Cabinet',
      'LED Profile Lighting',
      'Premium Finishing',
      'Installation & Workmanship',
    ],

    exclusions:
      'Television, decor accessories, plants, curtains and electrical points/wiring are not included.',
  },

  {
    description:
      'A refined contemporary TV wall combining a textured feature finish, warm wood slat detailing and integrated ambient lighting for a sophisticated living-room look.',

    included: [
      'Textured Feature Wall',
      'Vertical Wood Slat Panel',
      'Floating TV Console',
      'Integrated LED Lighting',
      'Wall-Mounted TV Setup',
      'Installation & Finishing',
    ],

    exclusions:
      'Television, decor accessories, plants, curtains and electrical points/wiring are not included unless specifically quoted.',
  },

  {
    description:
      'A sleek and modern floating TV unit with a bold charcoal backdrop, vertical walnut slat panel, floating display shelf and premium contemporary detailing.',

    included: [
      'Charcoal TV Back Panel',
      'Vertical Walnut Slat Panel',
      'Floating Display Shelf',
      'Floating TV Console',
      'Open Storage Niche',
      'Installation & Finishing',
    ],

    exclusions:
      'Television, decor accessories, plants and electrical points/wiring are not included unless specifically quoted.',
  },

  {
    description:
      'A clean contemporary media wall combining warm wood finishes, a floating console, open display and integrated ambient lighting.',

    included: [
      'Vertical Slat Feature Panel',
      'Floating Display Shelf',
      'Wall-Mounted TV Setup',
      'Floating TV Console',
      'Integrated LED Lighting',
      'Installation & Finishing',
    ],

    exclusions:
      'Television, decor items, accessories and electrical points/wiring are not included unless specifically quoted.',
  },

  {
    description:
      'A refined contemporary TV wall combining walnut slat detailing, a textured statement panel, floating storage console and integrated ambient lighting.',

    included: [
      'Walnut Slat Feature Panel',
      'Textured Wall Finish',
      'Floating TV Cabinet',
      'Integrated LED Lighting',
      'TV Mounting & Finish',
      'Installation & Finishing',
    ],

    exclusions:
      'Television, gaming devices, accessories, decor items and electrical points/wiring are not included unless specifically quoted.',
  },

  {
    description:
      'A refined contemporary media wall combining warm wood panels, a sleek floating console, integrated ambient lighting and a linear fireplace feature.',

    included: [
      'Wood Panel Feature Wall',
      'Floating TV Cabinet',
      'Integrated LED Lighting',
      'Linear Fireplace Feature',
      'TV Mounting & Finish',
      'Installation & Finishing',
    ],

    exclusions:
      'Television, decor accessories, electrical points/wiring and loose items are not included unless specifically quoted.',
  },

  {
    description:
      'A luxurious contemporary TV unit with vertical wooden fluted panels, marble finish, warm LED lighting and a floating console designed for an elegant living space.',

    included: [
      'Fluted Wood Feature Wall',
      'Marble Finish',
      'Floating TV Cabinet',
      'LED Profile Lighting',
      'Stylish Shelves',
      'Installation & Workmanship',
    ],

    exclusions:
      'Television, decor accessories, plants, curtains and electrical points/wiring are not included.',
  },

  {
    description:
      'A modern and elegant TV unit design featuring a full-height warm wood slat feature wall, a TV wall-mounted panel and a floating cabinet.',

    included: [
      'Fluted Feature Wall',
      'TV Back Panel & Finish',
      'Floating TV Cabinet',
      'Premium Wood Finish',
      'Installation & Finishing',
      'Design Consultation',
    ],

    exclusions:
      'Television, soundbar/audio equipment, decor accessories and electrical points/wiring are not included unless specifically quoted.',
  },

  {
    description:
      'A clean and modern TV unit design with a premium marble-finish panel, warm LED lighting and a floating wooden cabinet for a minimal contemporary look.',

    included: [
      'Marble Finish TV Panel',
      'Wooden Accent Panel',
      'Floating TV Cabinet',
      'LED Profile Lighting',
      'Installation & Finishing',
      'Consultation Support',
    ],

    exclusions:
      'Television, decor items, accessories and electrical points/wiring are not included.',
  },

  {
    description:
      'A warm and sophisticated TV unit featuring a vertical wooden fluted panel, sleek wall-mounted cabinet and minimal, modern aesthetic perfect for contemporary homes.',

    included: [
      'Fluted Feature Wall',
      'Floating TV Cabinet',
      'TV Back Panel & Wall Finish',
      'Styling Guidance',
      'Installation & Finishing',
      'Consultation Support',
    ],

    exclusions:
      'Television, decor items, accessories and electrical points/wiring are not included.',
  },

  {
    description:
      'A premium and elegant TV unit featuring a marble-finish back panel with warm LED lighting, vertical wood panels and a floating cabinet that creates a sophisticated timeless look.',

    included: [
      'Fluted Feature Wall',
      'TV Back Panel & Wall Finish',
      'Floating TV Cabinet',
      'LED Profile Lighting',
      'Premium Finish & Materials',
      'Installation & Finishing',
    ],

    exclusions:
      'Television, decor items, accessories and electrical points/wiring are not included.',
  },

  {
    description:
      'A refined contemporary media wall combining warm wood panels, a sleek floating console, integrated ambient lighting and a linear fireplace feature.',

    included: [
      'Wood Panel Feature Wall',
      'Floating TV Cabinet',
      'Integrated LED Lighting',
      'Linear Fireplace Feature',
      'TV Mounting & Finish',
      'Installation & Finishing',
    ],

    exclusions:
      'Television, decor accessories, electrical points/wiring and loose items are not included unless specifically quoted.',
  },

  {
    description:
      'A modern and elegant TV unit design featuring a full-height warm wood slat feature wall, a TV wall-mounted panel and a floating cabinet.',

    included: [
      'Fluted Feature Wall',
      'TV Back Panel & Finish',
      'Floating TV Cabinet',
      'Premium Wood Finish',
      'Installation & Finishing',
      'Design Consultation',
    ],

    exclusions:
      'Television, soundbar/audio equipment, decor accessories and electrical points/wiring are not included unless specifically quoted.',
  },

  {
    description:
      'A sophisticated TV unit design featuring full-height wooden fluted panels and a floating wooden cabinet with open storage, creating a warm and modern look.',

    included: [
      'Fluted Feature Wall',
      'TV Back Panel & Wall Finish',
      'Floating TV Cabinet',
      'Premium Materials',
      'Installation & Finishing',
      'Consultation Support',
    ],

    exclusions:
      'Television, decor items, accessories and electrical points/wiring are not included.',
  },

  {
    description:
      'A stylish and contemporary TV unit design combining a combination of wood fluted panels and a premium marble-finish panel, paired with a floating cabinet.',

    included: [
      'Fluted Feature Panel',
      'Marble Finish Panel',
      'Floating TV Cabinet',
      'Integrated LED Lighting',
      'Premium Materials',
      'Installation & Finishing',
    ],

    exclusions:
      'Television, decor items, accessories and electrical points/wiring are not included.',
  },

  {
    description:
      'A modern and elegant full-height fluted feature wall with a sleek wall-mounted cabinet, floating storage and premium detailing for contemporary homes.',

    included: [
      'Fluted Feature Wall',
      'TV Back Panel & Wall Finish',
      'Floating TV Cabinet',
      'Wall Display',
      'Premium Finish & Materials',
      'Installation & Finishing',
    ],

    exclusions:
      'Television, decor items, accessories and electrical points/wiring are not included.',
  },

  {
    description:
      'A sleek and contemporary TV unit featuring a vertical fluted wood panel and a floating cabinet in a rich matte finish, creating a minimal yet elegant design.',

    included: [
      'Fluted Feature Wall',
      'Floating TV Cabinet',
      'Premium Matte Finish',
      'Installation & Finishing',
      'Styling Guidance',
      'Consultation Support',
    ],

    exclusions:
      'Television, decor items, accessories and electrical points/wiring are not included.',
  },

  {
    description:
      'A stylish and space-efficient TV unit featuring elegant vertical fluted panels, open shelving and a sleek floating cabinet, finished in a warm wood tone.',

    included: [
      'Fluted Wall Panels',
      'Open Shelves',
      'Floating TV Cabinet',
      'Premium Materials',
      'LED Profile Lighting',
      'Installation & Finishing',
    ],

    exclusions:
      'Television, decor items, accessories and electrical points/wiring are not included.',
  },

  {
    description:
      'A sleek and contemporary TV unit featuring a full-height fluted wood wall panel with a floating TV cabinet, creating a deep and premium modern look.',

    included: [
      'Fluted / Slatted Feature Wall',
      'TV Back Panel & Wall Finish',
      'Floating TV Cabinet',
      'Premium Wood Finish',
      'Installation & Finishing',
      'Design Consultation',
    ],

    exclusions:
      'Television, accessories, decor items and electrical points/wiring are not included unless specifically quoted.',
  },

  {
    description:
      'A perfect blend of minimal design and warm aesthetics. This modern TV unit features a sleek floating cabinet with a wood-accented top, small matte shutters and clean fluted wall panels.',

    included: [
      'Fluted Feature Wall',
      'LED Profile Lighting',
      'Floating TV Cabinet',
      'Premium Finish',
      'Styling Guidance',
      'Installation & Finishing',
    ],

    exclusions:
      'Television, accessories, decor items and electrical points/wiring are not included unless specifically quoted.',
  },
];



/* =========================================================
   TV WALL — "WHAT'S INCLUDED" CARDS (icon + image + description)
   ---------------------------------------------------------
   Your tvWallDetails[].included lists are plain strings. This
   turns each string into { title, icon, desc, image } using the
   same wording as the PDF. To change one item for one design,
   put an object in the list instead of a string, e.g.
   { title: 'Wall Sconces (2 Nos.)', desc: 'Modern wall lights as per design' }
   ========================================================= */

const INCLUDED_IMG_DIR = '/assets/projects/interior-by-choice/tv-wall/included';

const includedRules = [
  { test: /consult|guidance|styling|customis/i, key: 'consult', icon: 'consult',
    desc: 'Guidance on dimensions, material selection and customisation' },
  { test: /sconce/i, key: 'sconce', icon: 'sconce',
    desc: 'Modern wall lights as per design' },
  { test: /install/i, key: 'install', icon: 'install',
    desc: 'Complete on-site installation' },
  { test: /tv (set ?up|mount)|wall-mounted tv/i, key: 'tv-mount', icon: 'tv',
    desc: 'TV mounting on panel (in installation scope)' },
  { test: /shelf|shelves|niche|display/i, key: 'shelf', icon: 'shelf',
    desc: 'Sturdy wooden shelves as per design' },
  { test: /led|lighting/i, key: 'led', icon: 'led',
    desc: 'Warm ambient lighting as per design' },
  { test: /marble/i, key: 'marble', icon: 'marble',
    desc: 'High-quality laminate/veneer with premium finish' },
  { test: /fireplace/i, key: 'fireplace', icon: 'fire',
    desc: 'Elegant glass-enclosed fireplace unit' },
  { test: /cabinet|console|storage/i, key: 'cabinet', icon: 'cabinet',
    desc: 'Spacious drawers and open shelf as per design' },
  { test: /premium|material/i, key: 'premium-finish', icon: 'sparkle',
    desc: 'Clean edges and professional finish' },
  { test: /slat|fluted|wood panel|wooden/i, key: 'slat', icon: 'slat',
    desc: 'Premium wooden slat panels as per design' },
];

const includedFallback = {
  key: 'wall-finish',
  icon: 'finish',
  desc: 'High-quality laminate/paint finish',
};

export const getIncludedItems = (list = []) =>
  list.map((entry) => {
    const base = typeof entry === 'string' ? { title: entry } : entry;
    const rule =
      includedRules.find((r) => r.test.test(base.title)) || includedFallback;

    return {
      title: base.title,
      icon: base.icon || rule.icon,
      desc: base.desc || rule.desc,
      image: base.image || `${INCLUDED_IMG_DIR}/${rule.key}.webp`,
      // Set only when a design supplies its own photo (e.g. the Study designs).
      customImage: base.image || null,
    };
  });

/* =========================================================
   INTERIOR DESIGNS
   ========================================================= */

export const interiorDesigns =
  interiorSpaces.flatMap((space) =>
    subDesignNames[space.slug].map(
      (name, index) => {
        const preset =
          designPresets[space.slug];

        const priceSteps = [
          0,
          50,
          100,
          150,
          200,
        ];

        const pricePerSqft =
          basePrices[space.slug] +
          priceSteps[
            index % priceSteps.length
          ];



const dedicatedImage =
  space.slug === 'study'
    ? studyCatalog[index].images.front
    : space.slug === 'tv-wall'
      ? tvWallImageMap[index]
      : space.slug === 'living-room'
        ? livingRoomImages[name]
        : space.slug === 'mandir'
          ? mandirImages[name]
          : `/assets/projects/interior-by-choice/${space.slug}/${slugify(
              name
            )}.webp`;


        const entranceDetails =
          space.slug === 'entrance'
            ? entranceDoorDetails[index]
            : null;
        const bedBackWallDetail =
          space.slug === 'bed-back-wall'
            ? bedBackWallDetails[index]
            : null;

        return {
  // TV wall and Study have repeated names, so their slugs carry the index.
  slug:
    space.slug === 'tv-wall' || space.slug === 'study'
      ? `${slugify(name)}-${index + 1}`
      : slugify(name),

  spaceSlug: space.slug,

  name,

  tagline:
    entranceDetails?.tagline ||
    (space.slug === 'study'
      ? studyCatalog[index].tagline
      : taglines[space.slug]),

  pricePerSqft,

  estimatedPrice:
    space.slug === 'study'
      ? studyCatalog[index].price
      : space.slug === 'tv-wall'
        ? tvEstimatedPrices[index]
        : space.slug === 'mandir'
          ? mandirEstimatedPrices[index]
          : null,

          // The list, the design page and the booking pop-up all read
          // this, so study, TV wall and mandir show their estimate everywhere.
          priceRange:
            entranceDetails?.priceRange ||
            bedBackWallDetail?.priceRange ||
            (space.slug === 'study'
              ? studyCatalog[index].price
              : space.slug === 'tv-wall'
                ? tvEstimatedPrices[index]
                : space.slug === 'mandir'
                  ? mandirEstimatedPrices[index]
                  : undefined),

  description:
    space.slug === 'tv-wall'
      ? tvWallDetails[index]?.description
      : space.slug === 'study'
        ? studyCatalog[index].description
        : entranceDetails?.description ||
          bedBackWallDetail?.description,

  tvDetails:
  space.slug === 'tv-wall'
    ? tvWallDetails[index]
    : null,

studyDetails:
  space.slug === 'study'
    ? {
        included: studyCatalog[index].included,
        exclusions: studyCatalog[index].exclusions,
      }
    : null,

  image: entranceDetails
    ? `/assets/projects/interior-by-choice/entrance/door-${String(
        entranceDetails.pdfPage
      ).padStart(2, '0')}.webp`
    : bedBackWallDetail
      ? `/assets/projects/interior-by-choice/bed-back-wall/design-${String(
          index + 1
        ).padStart(2, '0')}.webp`
      : dedicatedImage,

  galleryImages:
    space.slug === 'study'
      ? studyCatalog[index].images
      : null,

  fallbackImage:
    space.image,

  colours:
    space.slug === 'entrance'
      ? []
      : [
          '#efe9e2',
          '#d8c9b0',
          '#6b4a34',
          '#2e2e2e',
        ],

  features:
    preset.features,

  materialDetails:
    preset.materialDetails,
};
      }
    )
  );

/* TV WALL — colour options (first = no tint, shows the original image) */
export const tvWallColours = [
  { name: 'Original', hex: null },
  { name: 'Natural Oak', hex: '#d7b083' },
  { name: 'Walnut', hex: '#75411f' },
  { name: 'Wenge', hex: '#2b211b' },
  { name: 'White Oak', hex: '#ead7bc' },
  { name: 'Sage Green', hex: '#9caf88' },
  { name: 'Charcoal', hex: '#3a3a3a' },
];

/*
 * Optional real colour photos. Leave empty to use the tint preview.
 * Key = design slug, then colour name, e.g.
 * 'marble-frame-tv-unit-1': { Walnut: '/assets/.../1-walnut.png' }
 */
export const tvWallColourImages = {};


/* =========================================================
   GET SPACE
   ========================================================= */

export const getSpaceBySlug =
  (slug) =>
    interiorSpaces.find(
      (space) =>
        space.slug === slug
    );

/* =========================================================
   GET DESIGNS BY SPACE
   ========================================================= */

export const getDesignsBySpace =
  (spaceSlug) =>
    interiorDesigns.filter(
      (design) =>
        design.spaceSlug ===
        spaceSlug
    );

/* =========================================================
   GET SINGLE DESIGN
   ========================================================= */

export const getDesignBySlug =
  (spaceSlug, designSlug) =>
    interiorDesigns.find(
      (design) =>
        design.spaceSlug ===
          spaceSlug &&
        design.slug ===
          designSlug
    );

/* =========================================================
   HOME VISIT FEE
   ========================================================= */

export const HOME_VISIT_FEE = 99;
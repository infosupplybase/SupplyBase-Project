/**
 * SUPPLYBASE — OTHER SERVICES
 * ---------------------------
 * The category list shown at /services/other-services: everything outside
 * the seven main services, reactivated on request after being scoped out
 * earlier. Each tile opens the existing generic site-visit wizard at its
 * own slug — these five categories kept their full question sets in the
 * database the whole time; only their `active` flag changed.
 */
export const otherServiceTiles = [
  {
    slug: 'architectural-design',
    name: 'Architectural & Design',
    blurb: '2D drawings and 3D architectural visualisation',
    icon: 'building',
    imaege: '/assets/services/architectural-design.png',
  },
  {
    slug: 'civil-construction',
    name: 'Civil Construction',
    blurb: 'New construction, RCC work, brickwork and plaster',
    icon: 'crane',
    image: '/assets/services/civil-construction.png',
  },
  {
    slug: 'furniture',
    name: 'Furniture Work',
    blurb: 'Modular kitchens, wardrobes, TV units and beds',
    icon: 'wardrobe',
    image: '/assets/services/furniture.png',
  },
  {
    slug: 'fabrication',
    name: 'Fabrication',
    blurb: 'MS and SS gates, railings, grills and staircases',
    icon: 'welding',
    image: '/assets/services/fabrication.png',
  },
  {
    slug: 'finishing',
    name: 'Finishing Work',
    blurb: 'Flooring, marble and granite, tiling and touch-up',
    icon: 'trowel',
    image: '/assets/services/finishing.png',
  },
];

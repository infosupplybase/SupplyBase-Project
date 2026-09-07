/**
 * SUPPLYBASE PROJECTS — PROJECTS DATA
 * -----------------------------------
 * ⚠️  SAMPLE CONTENT: the entries below are placeholders showing the structure and layout.
 *     Replace the names, locations, descriptions and images with your real completed projects
 *     before the website goes live.
 *
 * To add a project: copy an object, change the values, drop the photos into
 * /public/assets/projects/ and it will appear on the home page, the projects page,
 * the matching filter, and get its own page at /projects/<slug>.
 *
 * category must be one of the ids in projectCategories below.
 * servicesProvided uses the slug values from services.js — they render as links.
 */

export const projectCategories = [
  { id: 'all', label: 'ALL' },
  { id: 'residential', label: 'RESIDENTIAL' },
  { id: 'commercial', label: 'COMMERCIAL' },
  { id: 'interior', label: 'INTERIOR' },
  { id: 'civil', label: 'CIVIL' },
  { id: 'finishing', label: 'FINISHING' },
];

export const projects = [
  {
    slug: 'luxury-bungalow-residence',
    name: 'Luxury Bungalow Residence',
    category: 'residential',
    categoryLabel: 'RESIDENTIAL',
    location: 'Mumbai, Maharashtra',
    year: '2025',
    area: '3,200 sq.ft.',
    duration: '11 months',
    scopeLabel: 'Design + Construction + Interior',
    image: '/assets/projects/luxury-bungalow.jpeg',
    gallery: ['/assets/projects/luxury-bungalow.jpeg', '/assets/projects/hero-house.jpeg'],
    summary: 'A four-bedroom bungalow taken from first sketch to fully furnished handover.',
    description:
      'A private residence delivered end to end — architectural planning and 3D visualisation, full RCC structure, and a complete interior fit-out. The client dealt with one team throughout, and the house was handed over furnished and ready to move into.',
    scope: [
      'Architectural planning, elevation design and 3D exterior views',
      'Complete RCC structure, blockwork and plastering',
      'Concealed electrical and plumbing installation',
      'Gypsum false ceiling with cove and profile lighting',
      'Modular kitchen, wardrobes and custom furniture',
      'Flooring, painting and final finishing',
    ],
    servicesProvided: ['architectural-design', 'civil-construction', 'interior-design'],
    featured: true,
  },
  {
    slug: 'modern-apartment-interior',
    name: 'Modern Apartment Interior',
    category: 'interior',
    categoryLabel: 'INTERIOR',
    location: 'Thane, Maharashtra',
    year: '2025',
    area: '1,150 sq.ft.',
    duration: '55 days',
    scopeLabel: 'Turnkey Interior',
    image: '/assets/projects/modern-interior.jpeg',
    gallery: ['/assets/projects/modern-interior.jpeg'],
    summary: 'A 3BHK apartment fitted out in under two months, design to installation.',
    description:
      'A turnkey interior for a young family — warm wood tones, a layered lighting scheme and storage designed into every wall. Furniture was produced in workshop while the ceiling, electrical and painting ran on site, which kept the whole fit-out to a 55-day programme.',
    scope: [
      '3D interior design for every room',
      'Modular kitchen with tall units and accessories',
      'Sliding wardrobes and bedroom storage',
      'TV unit and living room feature panelling',
      'False ceiling with cove and spot lighting',
      'Complete interior painting',
    ],
    servicesProvided: ['interior-design', 'furniture', 'pop-false-ceiling', 'electrical', 'painting'],
    featured: true,
  },
  {
    slug: 'commercial-complex',
    name: 'Commercial Complex',
    category: 'commercial',
    categoryLabel: 'COMMERCIAL',
    location: 'Navi Mumbai, Maharashtra',
    year: '2024',
    area: '18,000 sq.ft.',
    duration: '16 months',
    scopeLabel: 'Civil + Finishing',
    image: '/assets/projects/commercial-complex.jpeg',
    gallery: ['/assets/projects/commercial-complex.jpeg'],
    summary: 'A multi-floor commercial building delivered structure to finished shell.',
    description:
      'A commercial development covering RCC structure, external facade, common areas and services routing, handed over as finished shells ready for tenant fit-out. Work was sequenced floor by floor so early units could be released ahead of full completion.',
    scope: [
      'Complete RCC framed structure',
      'Blockwork, internal and external plastering',
      'Terrace and external waterproofing',
      'Common area flooring and staircase cladding',
      'Facade painting and external finishing',
      'MS railings, grills and staircase fabrication',
    ],
    servicesProvided: ['civil-construction', 'finishing', 'painting', 'fabrication'],
    featured: true,
  },
  {
    slug: 'ongoing-residential-construction',
    name: 'Residential Construction',
    category: 'civil',
    categoryLabel: 'CIVIL',
    location: 'Kalyan, Maharashtra',
    year: '2026',
    area: '6,400 sq.ft.',
    duration: 'In progress',
    scopeLabel: 'Civil Construction',
    image: '/assets/projects/ongoing-construction.jpeg',
    gallery: ['/assets/projects/ongoing-construction.jpeg'],
    summary: 'A ground-plus-three residential building currently under construction.',
    description:
      'An ongoing residential build executed from foundation upward against approved structural drawings, with stage-wise quality checks at footing, column, slab and masonry stage. Progress is reported to the owner at every completed stage.',
    scope: [
      'Excavation and foundation work',
      'RCC columns, beams and slabs',
      'Brick and block masonry',
      'Internal and external plastering',
      'Concealed conduiting and plumbing lines',
    ],
    servicesProvided: ['civil-construction', 'architectural-design'],
    featured: true,
  },
  {
    slug: 'corporate-office-fitout',
    name: 'Corporate Office Fit-out',
    category: 'commercial',
    categoryLabel: 'COMMERCIAL',
    location: 'Mumbai, Maharashtra',
    year: '2025',
    area: '4,800 sq.ft.',
    duration: '75 days',
    scopeLabel: 'Turnkey Office',
    image: '/assets/projects/office-fitout.jpeg',
    gallery: ['/assets/projects/office-fitout.jpeg'],
    summary: 'An open-plan office delivered against a fixed occupancy deadline.',
    description:
      'A full commercial fit-out — workstations, cabins, meeting rooms and a reception area — delivered under a single turnkey contract. The client had a fixed move-in date, so trades were sequenced tightly and the handover met the deadline.',
    scope: [
      'Space planning and 3D design',
      'Gypsum partitions and glass cabins',
      'False ceiling with linear profile lighting',
      'Complete electrical, data and lighting installation',
      'Workstations, storage and reception desk',
      'Vinyl flooring and painting',
    ],
    servicesProvided: ['interior-design', 'pop-false-ceiling', 'electrical', 'furniture'],
    featured: false,
  },
  {
    slug: 'retail-showroom-interior',
    name: 'Retail Showroom',
    category: 'commercial',
    categoryLabel: 'COMMERCIAL',
    location: 'Thane, Maharashtra',
    year: '2024',
    area: '2,100 sq.ft.',
    duration: '48 days',
    scopeLabel: 'Interior + Finishing',
    image: '/assets/projects/retail-showroom.jpeg',
    gallery: ['/assets/projects/retail-showroom.jpeg'],
    summary: 'A display-led showroom interior built around its lighting scheme.',
    description:
      'A retail showroom where the lighting design drove everything else. Display units, ceiling and electrical were planned together so every product zone is lit correctly, and the shopfront was fabricated and installed by our own team.',
    scope: [
      'Showroom layout and 3D design',
      'Display units and back-lit panelling',
      'Designer ceiling with track and spot lighting',
      'Complete electrical installation',
      'Vitrified flooring and wall cladding',
      'MS shopfront fabrication',
    ],
    servicesProvided: ['interior-design', 'pop-false-ceiling', 'electrical', 'finishing', 'fabrication'],
    featured: false,
  },
  {
    slug: 'villa-renovation',
    name: 'Villa Renovation',
    category: 'residential',
    categoryLabel: 'RESIDENTIAL',
    location: 'Panvel, Maharashtra',
    year: '2025',
    area: '2,600 sq.ft.',
    duration: '4 months',
    scopeLabel: 'Renovation + Interior',
    image: '/assets/projects/villa-renovation.jpeg',
    gallery: ['/assets/projects/villa-renovation.jpeg'],
    summary: 'A dated villa stripped back and rebuilt to a modern specification.',
    description:
      'A full renovation of an older villa — the layout was opened up, services were completely replaced, and the finishes were brought up to current standard. Damp problems in the external walls were traced and treated before any painting was carried out.',
    scope: [
      'Strip-out and structural repair',
      'Layout modification and new masonry',
      'Complete rewiring and replumbing',
      'Bathroom and kitchen renovation',
      'Waterproofing and damp treatment',
      'New flooring, painting and finishing',
    ],
    servicesProvided: ['civil-construction', 'plumbing', 'electrical', 'finishing', 'painting'],
    featured: false,
  },
  {
    slug: 'apartment-painting-finishing',
    name: 'Apartment Painting & Finishing',
    category: 'finishing',
    categoryLabel: 'FINISHING',
    location: 'Mumbai, Maharashtra',
    year: '2026',
    area: '1,400 sq.ft.',
    duration: '21 days',
    scopeLabel: 'Painting + Finishing',
    image: '/assets/projects/painting-finishing.jpeg',
    gallery: ['/assets/projects/painting-finishing.jpeg'],
    summary: 'A repaint and finishing package completed in an occupied flat.',
    description:
      'Interior repainting with texture feature walls, carried out room by room while the family continued living in the flat. Furniture was covered and the site cleaned at the end of every working day.',
    scope: [
      'Crack filling, putty and priming',
      'Premium emulsion interior painting',
      'Texture finish on feature walls',
      'Enamel painting of doors and grills',
      'Damp treatment on external wall',
      'Final touch-up and deep clean',
    ],
    servicesProvided: ['painting', 'finishing'],
    featured: false,
  },
];

/* ---------------------------------------------------------------- helpers */

export const getProjectBySlug = (slug) => projects.find((p) => p.slug === slug);

export const getFeaturedProjects = (limit = 4) =>
  projects.filter((p) => p.featured).slice(0, limit);

export const getProjectsByCategory = (categoryId) =>
  categoryId === 'all' ? projects : projects.filter((p) => p.category === categoryId);

export const getProjectsByService = (serviceSlug, limit = 3) =>
  projects.filter((p) => p.servicesProvided.includes(serviceSlug)).slice(0, limit);

export default projects;

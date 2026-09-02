/**
 * SUPPLYBASE PROJECTS — BOOKING DATA
 * ---------------------------------
 * Everything the booking wizard offers lives here. Add a service, a property
 * type or a time slot in this file and it appears in the flow — no component
 * needs editing.
 *
 * `lane` decides which of the two paths a service belongs to:
 *   'service' — a smaller, well-understood job. Pick a slot, someone turns up.
 *   'project' — interiors, construction, renovation. The visit produces a
 *               quotation, because there is no honest fixed price to show.
 *   'both'    — can go either way; the customer's entry point decides.
 */

export const bookingLanes = {
  service: {
    id: 'SERVICE',
    label: 'BOOK A SERVICE',
    tagline: 'For defined jobs — painting, waterproofing, electrical, plumbing.',
    promise: 'Pick a date and we will confirm a site visit.',
    cta: 'BOOK SITE VISIT',
  },
  project: {
    id: 'PROJECT',
    label: 'START A PROJECT',
    tagline: 'For interiors, construction and full renovations.',
    promise: 'We visit, understand the scope, and send an itemised quotation.',
    cta: 'REQUEST SITE VISIT',
  },
};

export const bookingServices = [
  { slug: 'interior-design', label: 'Interior Design', lane: 'project' },
  { slug: 'modular-kitchen', label: 'Modular Kitchen', lane: 'both' },
  { slug: 'home-renovation', label: 'Home Renovation', lane: 'project' },
  { slug: 'civil-construction', label: 'Civil Work', lane: 'project' },
  { slug: 'waterproofing', label: 'Waterproofing', lane: 'service' },
  { slug: 'painting', label: 'Painting', lane: 'service' },
  { slug: 'electrical', label: 'Electrical', lane: 'service' },
  { slug: 'plumbing', label: 'Plumbing', lane: 'service' },
  { slug: 'construction', label: 'Construction', lane: 'project' },
  { slug: 'architectural-design', label: '3D Architectural Design', lane: 'project' },
  { slug: 'other', label: 'Other', lane: 'both' },
];

export const propertyTypes = [
  '1 BHK',
  '2 BHK',
  '3 BHK',
  '4+ BHK',
  'Office',
  'Shop',
  'Commercial',
  'Building / Society',
  'Other',
];

export const workNatures = ['New construction', 'Renovation', 'Repair / maintenance'];

export const materialOptions = [
  { value: 'SUPPLYBASE', label: 'Supplybase supplies the material' },
  { value: 'CUSTOMER', label: 'I will supply the material' },
  { value: 'UNDECIDED', label: 'Not decided yet' },
];

/**
 * The five visiting windows. These must stay in step with TimeSlot in the
 * backend — the API rejects any value it does not recognise.
 */
export const timeSlots = [
  { value: 'SLOT_10AM', label: '10:00 AM' },
  { value: 'SLOT_12PM', label: '12:00 PM' },
  { value: 'SLOT_2PM', label: '2:00 PM' },
  { value: 'SLOT_4PM', label: '4:00 PM' },
  { value: 'SLOT_6PM', label: '6:00 PM' },
];

/**
 * Extra options for services where the type of work changes the job entirely.
 * A service with no entry here simply skips that question rather than showing
 * an empty dropdown.
 */
export const serviceWorkOptions = {
  waterproofing: [
    'Terrace waterproofing',
    'Podium waterproofing',
    'Bathroom / wet area',
    'Basement / retaining wall',
    'External wall treatment',
    'Water tank',
  ],
  painting: [
    'Interior painting',
    'Exterior painting',
    'Texture / designer finish',
    'Waterproof coating',
    'Wood & metal painting',
    'Repainting',
  ],
  electrical: [
    'Complete new wiring',
    'Additional points',
    'Lighting installation',
    'DB / panel work',
    'Fault finding & repair',
  ],
  plumbing: [
    'Complete new plumbing',
    'Bathroom plumbing',
    'Kitchen plumbing',
    'Drainage',
    'Leak repair',
  ],
  'modular-kitchen': ['New kitchen', 'Replace existing', 'Partial upgrade'],
};

/** Services whose quantity is naturally measured in square feet. */
export const areaRelevant = new Set([
  'waterproofing',
  'painting',
  'interior-design',
  'home-renovation',
  'civil-construction',
  'construction',
  'architectural-design',
  'modular-kitchen',
]);

export const getService = (slug) => bookingServices.find((s) => s.slug === slug);

/** The services offered in one lane. 'both' appears in either. */
export const servicesForLane = (lane) =>
  bookingServices.filter((s) => s.lane === lane || s.lane === 'both');

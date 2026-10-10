/**
 * SERVICE PAGE CONTENT — the plain-language section under each live
 * service's booking cards (ServiceSeoContent.jsx), and the text the build
 * writes into that page's HTML for crawlers and visitors without JavaScript
 * (vite.config.js -> prerenderPages).
 *
 * Every line here describes what the booking flows on the site already
 * offer. Keep it that way: no prices, awards, review counts, guarantees or
 * areas that the business has not confirmed. Service areas come from
 * siteConfig.js's contact.serviceAreas.
 *
 * Search phrases each page is written for (a guide for editors, not text to
 * repeat): painting -> house painters / painting services in Thane & Mumbai;
 * pop-ceiling-design -> POP ceiling, false ceiling, gypsum ceiling contractor;
 * interior-design -> interior designers for homes in Thane & Mumbai;
 * waterproofing -> terrace / bathroom / wall waterproofing.
 */

export const SERVICE_AREAS = ['Mumbai', 'Navi Mumbai', 'Thane', 'Kalyan', 'Panvel', 'Pune'];

const areasText = 'Mumbai, Navi Mumbai, Thane, Kalyan, Panvel and Pune';

/** The booking journey every live service shares. */
const bookingSteps = [
  { title: 'Choose the work', text: 'Pick the service and answer a few questions about your home, so the visit is planned around the real job.' },
  { title: 'Pick a visit time', text: 'Choose an available day and time slot. We visit every day, 9:00 AM to 9:00 PM.' },
  { title: 'Confirm your booking', text: 'Review your details and pay the visiting fee online. The fee is shown before you confirm.' },
  { title: 'Site visit and estimate', text: 'Our team inspects the site, agrees the scope and materials with you, and confirms the final price before any work starts.' },
  { title: 'Work and handover', text: 'One Supplybase team carries out the work, cleans up afterwards and stays your contact for support.' },
];

const visitFaq = {
  q: 'How is the final price decided?',
  a: 'Starting prices in the booking steps depend on what you select. Because every home is different, the final scope and price are confirmed during the site visit, before work begins.',
};

const areasFaq = (service) => ({
  q: `Which areas do you cover for ${service}?`,
  a: `We currently take bookings across ${areasText}. Enter your address while booking and we will confirm the visit for your location.`,
});

export const serviceSeoContent = {
  painting: {
    path: '/services/painting',
    name: 'Painting Services',
    serviceType: 'House painting',
    h1: 'Painting Services in Thane & Mumbai',
    intro:
      'Supplybase paints complete homes, single rooms and a few walls, and handles renovation painting for walls with cracks, dampness or peeling paint. Choose your paint brand, product range and colours while you book, and our painters take care of preparation, painting and clean-up.',
    includesTitle: 'What a painting job includes',
    includes: [
      'Surface preparation, putty and primer before the colour coats',
      'Two coats of your chosen colour',
      'Furniture and floor protection while we work',
      'Repair and crack filling for renovation painting',
      'Optional add-ons such as texture and feature walls',
      'Clean-up after the work and post-service support',
    ],
    types: [
      { name: 'Full home painting', text: 'Every room of your flat or house, planned together.' },
      { name: 'Few walls or one room', text: 'A quick refresh for a bedroom, living room, kitchen or a few walls.' },
      { name: 'Renovation painting', text: 'For old or damaged walls that need repair before painting.' },
    ],
    faqs: [
      { q: 'Which paint brands can I choose?', a: 'The booking steps let you pick a brand, such as Asian Paints or Berger, and a product range. Our team can also suggest suitable options during the site visit.' },
      { q: 'Do I need to move my furniture?', a: 'No. Our painters cover furniture and floors before they start and clean up when the work is finished.' },
      visitFaq,
      areasFaq('painting'),
    ],
    related: ['waterproofing', 'pop-ceiling-design', 'interior-design'],
  },

  'pop-ceiling-design': {
    path: '/services/pop-ceiling-design',
    name: 'POP Ceiling & Design',
    serviceType: 'POP and false ceiling installation',
    h1: 'POP Ceiling & False Ceiling Services in Thane & Mumbai',
    intro:
      'Supplybase designs and installs POP and gypsum false ceilings for a whole home or a single room, along with POP design work, TV walls and repairs to old or cracked ceilings. Choose the ceiling type for each room while you book, and our team confirms the design and measurements on site.',
    includesTitle: 'POP and false ceiling work we do',
    includes: [
      'Flat, double-layer, floating and cove ceilings',
      'POP and gypsum false ceilings',
      'Cornice, moulding and decorative POP design work',
      'POP TV wall designs',
      'Repair and renovation of cracked or damaged ceilings',
    ],
    types: [
      { name: 'Full home POP', text: 'Ceiling work for every room of your home, planned together.' },
      { name: 'Room POP', text: 'A ceiling for one room, such as the living room or a bedroom.' },
    ],
    faqs: [
      { q: 'What is the difference between POP and gypsum false ceilings?', a: 'POP (plaster of Paris) is mixed and shaped on site, which suits detailed designs. Gypsum ceilings use ready-made boards, which are quicker to install and give a smooth, even finish. Our team can suggest which one suits your room during the site visit.' },
      { q: 'Can you add lighting to the ceiling?', a: 'Yes. Cove and floating ceilings are designed around concealed lighting. Tell us what you have in mind and it is included in the estimate.' },
      visitFaq,
      areasFaq('POP and false ceiling work'),
    ],
    related: ['interior-design', 'painting', 'waterproofing'],
  },

  'interior-design': {
    path: '/services/interior-design',
    name: 'Interior Design',
    serviceType: 'Residential interior design',
    h1: 'Interior Design for Homes in Thane & Mumbai',
    intro:
      'Supplybase designs and builds complete home interiors for 1 BHK, 2 BHK and 3 BHK flats and villas. Pick a package and a design style, customise it, and book a consultation; one team then handles design, materials and execution through to handover.',
    includesTitle: 'What our interior projects cover',
    includes: [
      'Design and execution by one team',
      'Modular kitchens',
      'Wardrobes and storage',
      'False ceiling and lighting',
      'Painting and finishes',
      'Project management from start to handover',
    ],
    types: [
      { name: '1 BHK interiors', text: 'Space-smart designs for compact homes.' },
      { name: '2 BHK and 3 BHK interiors', text: 'Complete interiors for family homes.' },
      { name: 'Villa interiors', text: 'Interiors planned for larger, independent homes.' },
    ],
    faqs: [
      { q: 'Can I choose my own design style?', a: 'Yes. You can pick a style such as modern, classic, contemporary, minimal or Scandinavian, and customise colours and finishes before your consultation.' },
      { q: 'What is the difference between Interior Design and Interior by Choice?', a: 'Interior Design is a complete, customised project for your home. Interior by Choice lets you browse ready-made designs room by room and book a home visit for the one you like.' },
      visitFaq,
      areasFaq('interior design'),
    ],
    related: ['pop-ceiling-design', 'painting', 'interior-by-choice'],
  },

  waterproofing: {
    path: '/services/waterproofing',
    name: 'Waterproofing Services',
    serviceType: 'Waterproofing',
    h1: 'Waterproofing Services in Thane & Mumbai',
    intro:
      'Supplybase waterproofs terraces, bathrooms, interior and exterior walls, basements and water tanks to stop leaks and dampness. Choose the area while you book, and our team inspects the source of the leak before recommending a treatment.',
    includesTitle: 'Waterproofing we do',
    includes: [
      'Terrace waterproofing against leaks, heat and monsoon rain',
      'Bathroom and bathroom floor waterproofing',
      'Interior wall dampness and seepage treatment',
      'Exterior wall waterproofing against rainwater and cracks',
      'Basement and parking area waterproofing',
      'Overhead and underground water tank waterproofing',
    ],
    types: [],
    faqs: [
      { q: 'When is the best time to waterproof?', a: 'Before the monsoon is ideal, because surfaces need to be dry for most treatments. If you already have a leak, book a visit and our team will advise what can be done now.' },
      { q: 'Do you find the cause of the leak first?', a: 'Yes. The site visit is used to trace where water is coming in, so the treatment fixes the source rather than just the stain.' },
      visitFaq,
      areasFaq('waterproofing'),
    ],
    related: ['painting', 'pop-ceiling-design', 'interior-design'],
  },
};

/** Names and addresses for the "Related services" links. */
export const relatedServiceLinks = {
  painting: { label: 'Painting services', path: '/services/painting' },
  'pop-ceiling-design': { label: 'POP and false ceilings', path: '/services/pop-ceiling-design' },
  'interior-design': { label: 'Interior design', path: '/services/interior-design' },
  waterproofing: { label: 'Waterproofing', path: '/services/waterproofing' },
  'interior-by-choice': { label: 'Interior by Choice designs', path: '/interior-by-choice' },
};

export { bookingSteps };

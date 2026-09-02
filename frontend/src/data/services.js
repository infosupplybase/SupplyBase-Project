/**
 * SUPPLYBASE PROJECTS — SERVICES DATA
 * ----------------------------------
 * Every service page on the website is generated from this file.
 * To add a new service: copy one object, change the values, and it automatically appears in
 * the home page grid, the services page, the header mega menu and the footer,
 * and gets its own page at /services/<slug>.
 *
 * megaMenuGroup: DESIGN | CONSTRUCTION | FINISHING | MEP | SPECIALIZED
 */

export const megaMenuGroups = ['DESIGN', 'CONSTRUCTION', 'FINISHING', 'MEP', 'SPECIALIZED'];

/**
 * The four services shown on the home page. Everything else stays one click
 * away behind "View all services". Reorder or swap these slugs and the home
 * page follows — no component needs editing.
 */
export const featuredServiceSlugs = ['painting', 'plumbing', 'pop-false-ceiling', 'furniture'];

export const services = [
  /* ------------------------------------------------------------------ 01 */
  {
    slug: 'architectural-design',
    number: '01',
    name: 'Architectural & Design',
    shortName: 'Architectural & Design',
    icon: 'building',
    megaMenuGroup: 'DESIGN',
    tagline: 'Plan it properly before you build it.',
    cardText: 'Complete architectural planning, 2D drawings and photo-real 3D visualisation.',
    summary:
      'Every good project starts on paper. We prepare the architectural plan, the working drawings your site team actually builds from, and 3D exterior and interior views so you can see the finished building before construction starts. Design is where mistakes are cheap — we make sure they happen here and not on site.',
    heroImage: '/assets/services/architectural-design.svg',
    gallery: ['/assets/hero-house.svg', '/assets/services/architectural-design.svg'],
    subServices: [
      { name: 'Architectural Planning', text: 'Space planning, site analysis and layout development suited to your plot and budget.' },
      { name: '2D Floor Plans', text: 'Dimensioned floor plans showing every room, wall, door and window position.' },
      { name: '3D Architectural Design', text: 'Photo-realistic 3D models so you can walk through the design before it is built.' },
      { name: '3D Exterior Design', text: 'Exterior views with materials, textures, landscaping and lighting.' },
      { name: '3D Interior Design', text: 'Room-by-room 3D interior views with furniture, finishes and colour schemes.' },
      { name: 'Elevation Design', text: 'Front, side and rear elevations that give the building its character.' },
      { name: 'Structural Drawings', text: 'Column, beam, slab and foundation drawings prepared for safe execution.' },
      { name: 'Working Drawings', text: 'Detailed construction drawings your site team can build directly from.' },
    ],
    highlights: [
      'Design, drawings and execution handled by the same company — nothing gets lost between architect and contractor',
      'Photo-real 3D views before construction, so there are no surprises at handover',
      'Drawings prepared with buildability and budget in mind, not just aesthetics',
      'Unlimited coordination between design and site team throughout the project',
    ],
    process: [
      { title: 'Requirement Study', text: 'We understand your plot, family or business needs, budget and timeline.' },
      { title: 'Concept & 2D Plan', text: 'Layout options are prepared and refined with you until the plan is right.' },
      { title: '3D Visualisation', text: 'Exterior and interior 3D views are produced from the approved plan.' },
      { title: 'Working Drawings', text: 'Structural and construction drawings are issued for execution.' },
    ],
    faqs: [
      { q: 'Can you design only, without doing the construction?', a: 'Yes. Design is offered as a standalone service, though most clients continue with us for execution because it keeps everything under one accountable team.' },
      { q: 'How long does the design stage take?', a: 'A typical residential design runs two to four weeks from requirement study to working drawings, depending on the size of the project and how quickly approvals come back.' },
      { q: 'Do you provide 3D views before I commit to construction?', a: 'Yes. 3D exterior and interior views are part of the design package so you can see and approve the result before building starts.' },
    ],
  },

  /* ------------------------------------------------------------------ 02 */
  {
    slug: 'civil-construction',
    number: '02',
    name: 'Civil Construction',
    shortName: 'Civil Construction',
    icon: 'crane',
    megaMenuGroup: 'CONSTRUCTION',
    tagline: 'Structure built to last.',
    cardText: 'New construction, RCC work, brickwork, plaster, flooring and waterproofing.',
    summary:
      'The structure is the part of a building nobody sees and everybody depends on. We take on new construction from foundation to finished shell — RCC framing, blockwork, plastering, flooring, tiling and waterproofing — with supervised workmanship and standard-grade materials at every stage.',
    heroImage: '/assets/services/civil-construction.svg',
    gallery: ['/assets/services/civil-construction.svg', '/assets/projects/ongoing-construction.svg'],
    subServices: [
      { name: 'New Construction', text: 'Complete construction from foundation to structure for homes and commercial buildings.' },
      { name: 'RCC Work', text: 'Footings, columns, beams and slabs executed to structural drawings.' },
      { name: 'Brickwork', text: 'Brick and block masonry in line, level and plumb.' },
      { name: 'Plaster Work', text: 'Internal and external plastering with a true, crack-resistant finish.' },
      { name: 'Flooring', text: 'Base preparation and laying of tile, marble, granite and other flooring.' },
      { name: 'Tiling', text: 'Wall and floor tiling for bathrooms, kitchens, balconies and common areas.' },
      { name: 'Waterproofing', text: 'Terrace, bathroom, tank and basement waterproofing treatments.' },
      { name: 'Repair & Renovation', text: 'Structural repairs, extensions and full renovation of existing buildings.' },
    ],
    highlights: [
      'Material and labour supplied together under one rate',
      'Stage-wise quality checks — foundation, structure, masonry, plaster and finishing',
      'Site supervision by experienced engineers and foremen',
      'Clear schedules with progress reported to you at every stage',
    ],
    process: [
      { title: 'Site Survey & Estimate', text: 'We visit the site, measure and issue an itemised estimate.' },
      { title: 'Layout & Foundation', text: 'Setting out, excavation and foundation work as per structural drawings.' },
      { title: 'Structure & Masonry', text: 'RCC framing, blockwork and plastering carried out in sequence.' },
      { title: 'Finishing Handover', text: 'Flooring, waterproofing and surface preparation ready for finishing trades.' },
    ],
    faqs: [
      { q: 'Do you supply material as well as labour?', a: 'Yes. Most clients choose our labour + material package, where we procure everything and quote one rate. Labour-only contracts are also possible if you prefer to buy the material.' },
      { q: 'Do you take renovation work or only new construction?', a: 'Both. We handle renovations, extensions and structural repairs as well as new builds.' },
      { q: 'How do you handle payments?', a: 'Payments are linked to completed stages of work, agreed in writing before the project starts.' },
    ],
  },

  /* ------------------------------------------------------------------ 03 */
  {
    slug: 'interior-design',
    number: '03',
    name: 'Interior Design',
    shortName: 'Interior Design',
    icon: 'sofa',
    megaMenuGroup: 'DESIGN',
    tagline: 'Interiors designed, built and installed.',
    cardText: 'Residential and commercial interiors, modular kitchens, wardrobes and turnkey fit-outs.',
    summary:
      'We design interiors and then actually build them — the same team draws the 3D view, makes the furniture, does the ceiling, the electrical and the painting. Residential homes, offices, showrooms and complete turnkey interior fit-outs delivered ready to move into.',
    heroImage: '/assets/services/interior-design.svg',
    gallery: ['/assets/projects/modern-interior.svg', '/assets/services/interior-design.svg'],
    subServices: [
      { name: 'Residential Interior', text: 'Full home interiors — living, dining, bedrooms, kitchen and balconies.' },
      { name: 'Commercial Interior', text: 'Showrooms, retail spaces, clinics and hospitality interiors.' },
      { name: 'Modular Kitchen', text: 'Made-to-measure modular kitchens with quality hardware and finishes.' },
      { name: 'Wardrobe', text: 'Sliding and openable wardrobes built to your room dimensions.' },
      { name: 'Living Room', text: 'TV units, feature walls, false ceiling, lighting and seating layouts.' },
      { name: 'Bedroom', text: 'Beds, storage, headboard panelling, wardrobes and lighting.' },
      { name: 'Office Interior', text: 'Workstations, cabins, reception areas, meeting rooms and storage.' },
      { name: 'Turnkey Interior', text: 'Design to installation, including civil, electrical, ceiling and painting work.' },
    ],
    highlights: [
      '3D interior views approved before any material is cut',
      'In-house furniture work — no third-party carpenter coordination',
      'Ceiling, electrical, painting and furniture scheduled as one job',
      'Fixed quotation with a clear material specification',
    ],
    process: [
      { title: 'Site Measurement', text: 'Accurate measurement of every room and existing service point.' },
      { title: '3D Design & Selection', text: 'Layouts, 3D views and finish selection finalised with you.' },
      { title: 'Production & Site Work', text: 'Furniture production runs in parallel with ceiling, electrical and painting.' },
      { title: 'Installation & Handover', text: 'Installation, snag list, deep clean and handover.' },
    ],
    faqs: [
      { q: 'How long does a full home interior take?', a: 'A 2BHK turnkey interior typically takes 45 to 60 days from design approval, depending on the scope and material availability.' },
      { q: 'Can I choose my own materials and brands?', a: 'Yes. We work to a written material specification and you can upgrade or change any item before production starts.' },
      { q: 'Do you handle the electrical and false ceiling too?', a: 'Yes — those are our own services, so the whole fit-out is delivered by one team on one schedule.' },
    ],
  },

  /* ------------------------------------------------------------------ 04 */
  {
    slug: 'painting',
    number: '04',
    name: 'Painting Work',
    shortName: 'Painting Work',
    icon: 'roller',
    megaMenuGroup: 'FINISHING',
    tagline: 'A finish that holds up.',
    cardText: 'Interior, exterior, texture and waterproof painting for homes and commercial spaces.',
    summary:
      'Paint is judged on preparation, not on the brand of the tin. We putty, sand, prime and then paint — interior and exterior, texture finishes, waterproof coatings, and wood and metal painting — with proper surface treatment and clean masking so the result lasts.',
    heroImage: '/assets/services/painting.svg',
    gallery: ['/assets/services/painting.svg'],
    subServices: [
      { name: 'Interior Painting', text: 'Emulsion and premium interior finishes with full surface preparation.' },
      { name: 'Exterior Painting', text: 'Weather-resistant exterior coatings for facades and compound walls.' },
      { name: 'Texture Painting', text: 'Feature-wall textures, metallic and designer finishes.' },
      { name: 'Waterproof Paint', text: 'Waterproof and anti-damp coatings for problem walls and terraces.' },
      { name: 'Wood & Metal Painting', text: 'Enamel, PU and Duco finishes for doors, grills, railings and furniture.' },
      { name: 'Repainting', text: 'Repainting of occupied homes and offices with minimal disruption.' },
      { name: 'Commercial Painting', text: 'Offices, showrooms, societies and industrial units.' },
    ],
    highlights: [
      'Proper putty, sanding and priming before the first coat',
      'Furniture covered and floors masked — the site is left clean daily',
      'Branded paints with the shade and product written into the quotation',
      'Damp and crack treatment carried out before painting, not painted over',
    ],
    process: [
      { title: 'Surface Inspection', text: 'Cracks, damp patches and old loose paint are identified first.' },
      { title: 'Preparation', text: 'Scraping, crack filling, putty, sanding and priming.' },
      { title: 'Painting', text: 'Coats applied as per the agreed product and shade schedule.' },
      { title: 'Cleaning & Check', text: 'Masking removed, site cleaned and finish inspected with you.' },
    ],
    faqs: [
      { q: 'Can you paint while we are living in the house?', a: 'Yes. We work room by room, cover your furniture and clean up at the end of each day.' },
      { q: 'Which paint brands do you use?', a: 'We use standard branded paints and write the exact product and shade into the quotation so there is no substitution.' },
      { q: 'Do you fix damp walls before painting?', a: 'Yes. Painting over damp is a waste of money — the source is treated and waterproofed first.' },
    ],
  },

  /* ------------------------------------------------------------------ 05 */
  {
    slug: 'pop-false-ceiling',
    number: '05',
    name: 'POP & False Ceiling',
    shortName: 'POP & False Ceiling',
    icon: 'ceiling',
    megaMenuGroup: 'FINISHING',
    tagline: 'Ceilings that carry the lighting design.',
    cardText: 'POP, gypsum and designer false ceilings with cove and LED lighting.',
    summary:
      'A false ceiling does more than hide wiring — it sets the lighting and the proportion of the room. We execute POP and gypsum ceilings, designer profiles, wall moulding, cornice and partition work, with the LED cove and light points planned into the design from the start.',
    heroImage: '/assets/services/pop-false-ceiling.svg',
    gallery: ['/assets/services/pop-false-ceiling.svg', '/assets/projects/modern-interior.svg'],
    subServices: [
      { name: 'POP Ceiling', text: 'Traditional plaster of Paris ceilings with a smooth, paint-ready finish.' },
      { name: 'Gypsum Ceiling', text: 'Gypsum board ceilings on GI framing — fast, clean and stable.' },
      { name: 'False Ceiling', text: 'Full and peripheral false ceilings for homes, offices and showrooms.' },
      { name: 'Designer Ceiling', text: 'Multi-level, curved and feature ceiling designs.' },
      { name: 'Wall Moulding', text: 'Panelling and moulding detail for feature walls.' },
      { name: 'Cornice', text: 'Classic and contemporary cornice profiles.' },
      { name: 'Partition Work', text: 'Gypsum and glass partitions for offices and rooms.' },
      { name: 'LED Cove & Lighting', text: 'Cove lighting, spot and profile lighting planned into the ceiling design.' },
    ],
    highlights: [
      'Ceiling and electrical planned together so light points land where they should',
      'GI framing at correct spacing — no sagging over time',
      'Clean, sharp edges and level surfaces ready for paint',
      'Access provision kept for AC drains, wiring and fittings',
    ],
    process: [
      { title: 'Design & Light Plan', text: 'Ceiling design finalised along with the lighting layout.' },
      { title: 'Framing', text: 'GI channel framing set out to level.' },
      { title: 'Boarding & Finishing', text: 'Boarding, jointing, taping and finishing to a paint-ready surface.' },
      { title: 'Lighting & Handover', text: 'Light fittings installed, tested and handed over.' },
    ],
    faqs: [
      { q: 'POP or gypsum — which should I choose?', a: 'Gypsum is faster, cleaner to install and more dimensionally stable; POP allows more curved and custom detail. We recommend based on your design and timeline.' },
      { q: 'Will the ceiling reduce my room height?', a: 'A peripheral ceiling usually costs about four to six inches at the edges and none in the centre, so the room still feels open.' },
      { q: 'Do you supply the lights as well?', a: 'Yes, lights can be included in the quotation or you can supply your own fittings for us to install.' },
    ],
  },

  /* ------------------------------------------------------------------ 06 */
  {
    slug: 'electrical',
    number: '06',
    name: 'Electrical Work',
    shortName: 'Electrical Work',
    icon: 'bolt',
    megaMenuGroup: 'MEP',
    tagline: 'Safe wiring, planned properly.',
    cardText: 'Complete wiring, DB and panel work, lighting, switches and commercial electrical.',
    summary:
      'Electrical work is a safety job first and a convenience job second. We carry out complete concealed wiring, new installations, DB and panel work, lighting circuits and switch points — planned around how you will actually use the space, and executed with proper earthing and protection.',
    heroImage: '/assets/services/electrical.svg',
    gallery: ['/assets/services/electrical.svg'],
    subServices: [
      { name: 'Complete Wiring', text: 'Full concealed wiring for new homes, offices and shops.' },
      { name: 'New Installation', text: 'New points, circuits and load planning for renovations and extensions.' },
      { name: 'Lighting', text: 'Lighting circuits, cove lighting, spots, profiles and outdoor lighting.' },
      { name: 'Switches & Sockets', text: 'Switch and socket points positioned to your furniture layout.' },
      { name: 'DB & Panel Work', text: 'Distribution boards, MCB and RCCB protection, and panel wiring.' },
      { name: 'Ceiling Lighting', text: 'Light points coordinated with the false ceiling design.' },
      { name: 'Commercial Electrical', text: 'Offices, showrooms, restaurants and small industrial units.' },
    ],
    highlights: [
      'Point layout planned against your furniture plan, not guessed',
      'ISI-marked wire and branded switchgear specified in writing',
      'Proper earthing, MCB and RCCB protection on every circuit',
      'Coordinated with our own ceiling, furniture and painting teams',
    ],
    process: [
      { title: 'Load & Point Planning', text: 'Points, circuits and load requirement worked out with you.' },
      { title: 'Conduiting', text: 'Concealed conduits and boxes laid before plaster.' },
      { title: 'Wiring & DB', text: 'Wire pulling, DB installation and circuit termination.' },
      { title: 'Fitting & Testing', text: 'Switches, sockets and fittings installed, tested and handed over.' },
    ],
    faqs: [
      { q: 'Can you rewire an old flat?', a: 'Yes. Rewiring an occupied flat is normally done room by room with chasing, conduiting and making good included.' },
      { q: 'Do you handle the meter and load application?', a: 'We prepare the internal installation and can guide you through the utility application, though the connection is issued by the supply company.' },
      { q: 'Is the wiring done to a proper plan?', a: 'Yes — you get a point layout drawing showing every switch, socket and light position before conduiting starts.' },
    ],
  },

  /* ------------------------------------------------------------------ 07 */
  {
    slug: 'plumbing',
    number: '07',
    name: 'Plumbing Work',
    shortName: 'Plumbing Work',
    icon: 'tap',
    megaMenuGroup: 'MEP',
    tagline: 'Lines laid right the first time.',
    cardText: 'New plumbing, bathroom and kitchen lines, drainage and sanitary installation.',
    summary:
      'Plumbing problems are expensive because they are hidden. We lay new water lines and drainage with correct slopes, pressure-test before concealing, and install sanitary ware and fittings cleanly — for new construction, bathroom renovation and kitchen work.',
    heroImage: '/assets/services/plumbing.svg',
    gallery: ['/assets/services/plumbing.svg'],
    subServices: [
      { name: 'New Plumbing', text: 'Complete water supply and drainage systems for new buildings.' },
      { name: 'Bathroom Plumbing', text: 'Bathroom lines, concealed valves, shower and WC connections.' },
      { name: 'Kitchen Plumbing', text: 'Sink, purifier, dishwasher and washing machine points.' },
      { name: 'Water Lines', text: 'CPVC and PPR supply lines, tank connections and pump lines.' },
      { name: 'Drainage', text: 'Waste and soil lines laid to correct fall with proper venting.' },
      { name: 'Sanitary Installation', text: 'WC, basin, shower, mixer and accessory installation.' },
      { name: 'Repair & Maintenance', text: 'Leak tracing, blockage clearing and fitting replacement.' },
    ],
    highlights: [
      'Every concealed line pressure-tested before it is covered',
      'Branded CPVC pipe and fittings specified in the quotation',
      'Drainage laid to correct slope — no standing water or slow drains',
      'Sanitary ware installed level, sealed and cleaned',
    ],
    process: [
      { title: 'Layout Planning', text: 'Fixture positions and line routing agreed before work starts.' },
      { title: 'Line Laying', text: 'Supply and drainage lines installed and supported.' },
      { title: 'Pressure Testing', text: 'Lines tested and inspected before concealing or tiling.' },
      { title: 'Fixture Installation', text: 'Sanitary ware and fittings installed and checked for leaks.' },
    ],
    faqs: [
      { q: 'Can you renovate one bathroom without disturbing the rest of the flat?', a: 'Yes. Single-bathroom renovations are common work for us and normally take one to two weeks including tiling.' },
      { q: 'Do you supply the sanitary ware?', a: 'We can supply it as part of the package or install fittings that you have purchased yourself.' },
      { q: 'Do you give any assurance on concealed work?', a: 'Concealed lines are pressure-tested in front of you before covering, and workmanship terms are written into the quotation.' },
    ],
  },

  /* ------------------------------------------------------------------ 08 */
  {
    slug: 'furniture',
    number: '08',
    name: 'Furniture Work',
    shortName: 'Furniture Work',
    icon: 'wardrobe',
    megaMenuGroup: 'SPECIALIZED',
    tagline: 'Built to your dimensions.',
    cardText: 'Modular kitchens, wardrobes, TV units, beds and custom office furniture.',
    summary:
      'Ready-made furniture rarely fits an Indian floor plan. We make furniture to your exact dimensions — modular kitchens, wardrobes, TV units, beds, storage and office furniture — in plywood or MDF with branded hardware and the finish written into the quotation.',
    heroImage: '/assets/services/furniture.svg',
    gallery: ['/assets/services/furniture.svg', '/assets/projects/modern-interior.svg'],
    subServices: [
      { name: 'Modular Furniture', text: 'Factory-finished modular units assembled on site.' },
      { name: 'Modular Kitchen', text: 'Base and wall units, tall units, accessories and counters.' },
      { name: 'Wardrobes', text: 'Sliding and openable wardrobes with internal storage planning.' },
      { name: 'TV Units', text: 'TV panelling, storage and feature wall units.' },
      { name: 'Beds', text: 'Beds with hydraulic or box storage and headboard detailing.' },
      { name: 'Office Furniture', text: 'Workstations, reception desks, cabins and storage.' },
      { name: 'Custom Furniture', text: 'Study tables, crockery units, shoe racks, bars and pooja units.' },
    ],
    highlights: [
      'Made to your site measurements — no wasted gaps or fillers',
      'Branded hinges, channels and locks specified by name',
      'Material grade — plywood, MDF, laminate or acrylic — agreed upfront',
      'Made in workshop, installed on site with minimal dust and disruption',
    ],
    process: [
      { title: 'Measurement & Design', text: 'Site measurement and 3D views of each unit.' },
      { title: 'Material Selection', text: 'Core material, laminate, hardware and finish selected and quoted.' },
      { title: 'Production', text: 'Units manufactured in workshop with machine-cut accuracy.' },
      { title: 'Installation', text: 'On-site assembly, alignment, hardware fitting and cleaning.' },
    ],
    faqs: [
      { q: 'Plywood or MDF — what do you recommend?', a: 'Marine or BWP plywood for kitchens, wardrobes and anything near water; MDF is fine for low-moisture decorative units. We will tell you where each makes sense.' },
      { q: 'Is the furniture made on site or in a workshop?', a: 'Mostly in the workshop, which gives cleaner cuts and far less dust in your home. On-site work is limited to assembly and fitting.' },
      { q: 'Can you match furniture to an existing design?', a: 'Yes — send us photos or samples and we will match the finish as closely as the material allows.' },
    ],
  },

  /* ------------------------------------------------------------------ 09 */
  {
    slug: 'fabrication',
    number: '09',
    name: 'Fabrication',
    shortName: 'Fabrication',
    icon: 'welding',
    megaMenuGroup: 'SPECIALIZED',
    tagline: 'Steel work, measured and made.',
    cardText: 'MS and SS fabrication — gates, railings, grills, staircases, sheds and structures.',
    summary:
      'Mild steel and stainless steel fabrication made to site measurement — main gates, balcony and staircase railings, window grills, spiral and straight staircases, roofing sheds and structural steel work, finished with proper primer and paint so it survives the weather.',
    heroImage: '/assets/services/fabrication.svg',
    gallery: ['/assets/services/fabrication.svg'],
    subServices: [
      { name: 'MS Fabrication', text: 'Mild steel gates, frames, grills and structural members.' },
      { name: 'SS Fabrication', text: 'Stainless steel railings, handrails and decorative work.' },
      { name: 'Gates', text: 'Main gates, sliding gates and wicket gates.' },
      { name: 'Railings', text: 'Balcony, terrace and staircase railings in MS, SS and glass.' },
      { name: 'Grills', text: 'Window and safety grills in standard and designer profiles.' },
      { name: 'Staircase', text: 'Straight, L-shaped and spiral steel staircases.' },
      { name: 'Shed & Roofing', text: 'Parking sheds, terrace sheds and industrial roofing.' },
      { name: 'Structural Fabrication', text: 'Mezzanine floors, platforms, trusses and support structures.' },
    ],
    highlights: [
      'Fabricated to measured site dimensions, not standard sizes',
      'Proper welding, grinding and finishing at every joint',
      'Red-oxide primer and enamel or PU finish for weather protection',
      'Safety-critical heights and spacings kept to code',
    ],
    process: [
      { title: 'Site Measurement', text: 'Openings and levels measured and design agreed.' },
      { title: 'Section Selection', text: 'Steel sections and gauge selected for the load and span.' },
      { title: 'Fabrication', text: 'Cutting, welding, grinding and priming in workshop.' },
      { title: 'Installation & Finish', text: 'Fixed on site, aligned, and finish-painted.' },
    ],
    faqs: [
      { q: 'Do you do glass and steel railings?', a: 'Yes — SS with toughened glass, MS with glass, and full steel designs are all available.' },
      { q: 'How long does a main gate take?', a: 'Typically seven to ten days from measurement to installation, depending on the design and finish.' },
      { q: 'What protects the steel from rusting?', a: 'Surfaces are ground clean, treated with red-oxide primer and then finished with enamel or PU paint.' },
    ],
  },

  /* ------------------------------------------------------------------ 10 */
  {
    slug: 'finishing',
    number: '10',
    name: 'Finishing Work',
    shortName: 'Finishing Work',
    icon: 'trowel',
    megaMenuGroup: 'FINISHING',
    tagline: 'The details people actually notice.',
    cardText: 'Flooring, marble and granite, tile work, doors, windows and final touch-up.',
    summary:
      'Finishing is what a client sees on handover day. Flooring and tile work, marble and granite, wall finishes, doors and windows, sanitary fixtures and a proper final touch-up — done carefully, because this is the stage that decides whether the whole project looks well built.',
    heroImage: '/assets/services/finishing.svg',
    gallery: ['/assets/services/finishing.svg'],
    subServices: [
      { name: 'Flooring', text: 'Vitrified, ceramic, wooden and vinyl flooring with proper levelling.' },
      { name: 'Wall Finishing', text: 'Putty, texture, cladding and decorative wall treatments.' },
      { name: 'Tile Work', text: 'Bathroom, kitchen, balcony and facade tiling with clean joints.' },
      { name: 'Marble & Granite', text: 'Flooring, counters, sills, steps and staircase cladding.' },
      { name: 'Doors & Windows', text: 'Door frames, shutters, hardware and aluminium or UPVC windows.' },
      { name: 'Sanitary Fixtures', text: 'Final fixing of sanitary ware, mixers and bathroom accessories.' },
      { name: 'Final Touch-up', text: 'Snag list, corrections, deep clean and handover-ready finish.' },
    ],
    highlights: [
      'Levels and slopes checked before laying, not after',
      'Consistent joint width and clean grouting throughout',
      'Material lots checked for shade variation before installation',
      'Full snag list closed with you before handover',
    ],
    process: [
      { title: 'Surface Preparation', text: 'Base levelling, cleaning and slope setting.' },
      { title: 'Material Layout', text: 'Dry layout to fix joint lines and minimise cuts.' },
      { title: 'Installation', text: 'Laying, fixing, grouting and curing.' },
      { title: 'Snag & Handover', text: 'Joint inspection, touch-up, deep clean and handover.' },
    ],
    faqs: [
      { q: 'Can you do finishing work if another contractor built the structure?', a: 'Yes. We regularly take on finishing packages on structures built by others after inspecting the site.' },
      { q: 'Do you supply the tiles and marble?', a: 'Either way — we can procure to your selection or install material you have already bought.' },
      { q: 'What is included in the final touch-up?', a: 'A joint snag inspection, correction of every listed item, and a full deep clean so the space is ready to use.' },
    ],
  },
];

/* ---------------------------------------------------------------- helpers */

export const getServiceBySlug = (slug) => services.find((s) => s.slug === slug);

/* Kept in featuredServiceSlugs order, not in services[] order, so the list
   above controls which service leads. A slug that no longer exists is
   dropped rather than rendering a hole. */
export const getFeaturedServices = () =>
  featuredServiceSlugs.map(getServiceBySlug).filter(Boolean);

export const getServicesByGroup = () =>
  megaMenuGroups.map((group) => ({
    group,
    items: services.filter((s) => s.megaMenuGroup === group),
  }));

export default services;

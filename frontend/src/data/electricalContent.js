/**
 * SUPPLYBASE — ELECTRICAL SERVICES CATALOGUE
 * ------------------------------------------
 * The sub-services shown under each electrician category. Modeled on the
 * plumbing catalogue so the two flows use identical components.
 *
 * `value` is the cart slug — must be unique across the whole catalogue.
 * `price` is in rupees (ServiceRow multiplies by 100 for unitPricePaise).
 */

export const electricalGroups = [
  {
    slug: 'home-electrical-services',
    name: 'Home',
    image: '/assets/services/electrician/Home1.jpg',
    fromPrice: null,
    blurb: 'On-site quote',
    note: 'Final pricing after inspection',
    items: [
      {
        value: 'elec-home-inspection',
        label: 'Home Electrical Inspection',
        hint: 'Full check of wiring, points, load and safety.',
        price: 499,
      },
      {
        value: 'elec-home-repair-visit',
        label: 'Repair Visit',
        hint: 'Diagnose and fix common electrical faults.',
        price: 299,
      },
    ],
  },
  {
    slug: 'fan-installation',
    name: 'Fan',
    image: '/assets/services/electrician/FAN.jpg',
    fromPrice: 199,
    blurb: 'From ₹199',
    note: '(Actual pricing)',
    items: [
      {
        value: 'elec-fan-ceiling',
        label: 'Ceiling Fan Installation',
        hint: 'Mounting, wiring and balancing of a ceiling fan.',
        price: 199,
      },
      {
        value: 'elec-fan-exhaust',
        label: 'Exhaust Fan Installation',
        hint: 'Bathroom or kitchen exhaust fan fitting.',
        price: 249,
      },
      {
        value: 'elec-fan-regulator',
        label: 'Fan Regulator Installation',
        hint: 'Step or electronic regulator fitting.',
        price: 149,
      },
      {
        value: 'elec-fan-repair',
        label: 'Fan Repair / Service',
        hint: 'Cleaning, bearing check, capacitor replacement.',
        price: 299,
      },
    ],
  },
  {
    slug: 'light-installation',
    name: 'Light',
    image: '/assets/services/electrician/LIGHT.jpg',
    fromPrice: 149,
    blurb: 'From ₹149',
    note: '(Actual pricing)',
    items: [
      {
        value: 'elec-light-led-panel',
        label: 'LED Panel Light',
        hint: 'Ceiling LED panel or recessed fitting.',
        price: 149,
      },
      {
        value: 'elec-light-chandelier',
        label: 'Chandelier Installation',
        hint: 'Heavy decorative fitting, ceiling anchor.',
        price: 499,
      },
      {
        value: 'elec-light-wall',
        label: 'Wall Light',
        hint: 'Wall-mounted sconce or bracket light.',
        price: 149,
      },
      {
        value: 'elec-light-tube',
        label: 'Tube Light',
        hint: 'Batten or tube light fitting.',
        price: 129,
      },
    ],
  },
  {
    slug: 'switch-socket-installation',
    name: 'Switch & Socket',
    image: '/assets/services/electrician/HOME.jpg',
    fromPrice: 149,
    blurb: 'From ₹149',
    note: '(Actual pricing)',
    items: [
      {
        value: 'elec-switch-modular',
        label: 'Modular Switch Board',
        hint: 'Install or replace a modular switch plate.',
        price: 149,
      },
      {
        value: 'elec-socket-3pin',
        label: '3-Pin Socket',
        hint: 'Install or replace a 3-pin socket point.',
        price: 199,
      },
      {
        value: 'elec-socket-6a',
        label: '6A / 16A Socket',
        hint: 'New socket point with wiring from existing line.',
        price: 249,
      },
    ],
  },
  {
    slug: 'wiring-rewiring-services',
    name: 'Wiring',
    image: '/assets/services/electrician/WIRE.jpg',
    fromPrice: null,
    blurb: 'On-site quote',
    note: 'Final pricing after inspection',
    items: [
      {
        value: 'elec-wiring-point',
        label: 'New Wiring Point',
        hint: 'Single point wiring from existing DB.',
        price: 599,
      },
      {
        value: 'elec-wiring-concealed',
        label: 'Concealed Wiring (per room)',
        hint: 'Chasing, conduiting, wiring for one room.',
        price: 2499,
      },
      {
        value: 'elec-wiring-full-flat',
        label: 'Full Flat Rewiring',
        hint: 'Complete concealed rewiring — priced on inspection.',
        price: 0,
      },
    ],
  },
  
  {
    slug: 'mcb-db-installation',
    name: 'MCB & DB',
    image: '/assets/services/electrician/DCBjpg.jpg',
    fromPrice: null,
    blurb: 'On-site quote',
    note: 'Final pricing after inspection',
    items: [
      {
        value: 'elec-mcb-single',
        label: 'Single MCB Installation',
        hint: 'Install or replace an MCB on the DB.',
        price: 349,
      },
      {
        value: 'elec-mcb-rccb',
        label: 'RCCB / ELCB Installation',
        hint: 'Install an RCCB or ELCB for circuit protection.',
        price: 599,
      },
      {
        value: 'elec-mcb-db-new',
        label: 'New Distribution Board',
        hint: 'New DB with wiring and labelling — priced on inspection.',
        price: 0,
      },
    ],
  },
  {
    slug: 'appliance-installation-services',
    name: 'Appliance',
    image: '/assets/services/electrician/APPLICACE.jpg',
    fromPrice: 299,
    blurb: 'From ₹299',
    note: '(Actual pricing)',
    items: [
      {
        value: 'elec-app-geyser',
        label: 'Geyser / Water Heater',
        hint: 'Installation and connection of a geyser.',
        price: 399,
      },
      {
        value: 'elec-app-chimney',
        label: 'Chimney Installation',
        hint: 'Wall mounting and ducting of a kitchen chimney.',
        price: 599,
      },
      {
        value: 'elec-app-ac-point',
        label: 'AC Power Point',
        hint: 'Dedicated 16A point for a split AC.',
        price: 599,
      },
    ],
  },
];

/** Look up a group by its slug. */
export const getElectricalGroup = (slug) =>
  electricalGroups.find((g) => g.slug === slug);
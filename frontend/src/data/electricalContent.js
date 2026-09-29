/**
 * SUPPLYBASE — ELECTRICAL SERVICES CATALOGUE
 * ------------------------------------------
 * Updated with individual images for every electrical sub-service.
 *
 * `value` is the cart slug — must be unique across the whole catalogue.
 * `price` is in rupees (ServiceRow multiplies by 100 for unitPricePaise).
 */

export const electricalGroups = [
  // 1. FAN SERVICES
  {
    slug: 'fan-services',
    name: 'Fan Services',
    image: '/assets/services/electrician/group-fan.webp',
    fromPrice: 79,
    blurb: 'From ₹79',
    note: '(Actual pricing)',
    items: [
      {
        value: 'elec-fan-ceiling-install',
        label: 'Ceiling Fan Installation',
        hint: 'Mounting, wiring and balancing of a ceiling fan.',
        price: 149,
        image: '/assets/services/electrician/01-ceiling-fan-installation.webp',
      },
      {
        value: 'elec-fan-ceiling-replace',
        label: 'Ceiling Fan Replacement',
        hint: 'Remove old fan and install a new one.',
        price: 199,
        image: '/assets/services/electrician/02-ceiling-fan-replacement.webp',
      },
      {
        value: 'elec-fan-bldc-install',
        label: 'BLDC / Smart Fan Installation',
        hint: 'Installation of energy-efficient BLDC fans.',
        price: 249,
        image: '/assets/services/electrician/03-bldc-smart-fan-installation.webp',
      },
      {
        value: 'elec-fan-decorative-install',
        label: 'Decorative Fan Installation',
        hint: 'Installation of fancy or designer ceiling fans.',
        price: 299,
        image: '/assets/services/electrician/04-decorative-fan-installation.webp',
      },
      {
        value: 'elec-fan-wall-install',
        label: 'Wall Fan Installation',
        hint: 'Wall mounting and wiring for wall fans.',
        price: 149,
        image: '/assets/services/electrician/05-wall-fan-installation.webp',
      },
      {
        value: 'elec-fan-exhaust-install',
        label: 'Exhaust Fan Installation',
        hint: 'Bathroom or kitchen exhaust fan fitting.',
        price: 199,
        image: '/assets/services/electrician/06-exhaust-fan-installation.webp',
      },
      {
        value: 'elec-fan-repair',
        label: 'Fan Repair (Noise / Slow Speed)',
        hint: 'Diagnosis and repair for noisy or slow fans.',
        price: 199,
        image: '/assets/services/electrician/07-fan-repair.webp',
      },
      {
        value: 'elec-fan-regulator-install',
        label: 'Fan Regulator Installation',
        hint: 'Step or electronic regulator fitting.',
        price: 99,
        image: '/assets/services/electrician/08-fan-regulator.webp',
      },
    ],
  },

  // 2. LIGHT SERVICES
  {
    slug: 'light-services',
    name: 'Light Services',
    image: '/assets/services/electrician/group-light.webp',
    fromPrice: 79,
    blurb: 'From ₹79',
    note: '(Actual pricing)',
    items: [
      {
        value: 'elec-light-bulb-holder',
        label: 'Bulb & Holder Installation',
        hint: 'Installation of a new bulb holder and bulb.',
        price: 79,
        image: '/assets/services/electrician/01-bulb-holder-installation.webp',
      },
      {
        value: 'elec-light-tube',
        label: 'Tube Light Installation',
        hint: 'Batten or tube light fitting.',
        price: 129,
        image: '/assets/services/electrician/02-tube-light-installation.webp',
      },
      {
        value: 'elec-light-led-panel',
        label: 'LED Panel Installation',
        hint: 'Ceiling LED panel or recessed fitting.',
        price: 149,
        image: '/assets/services/electrician/03-led-panel-installation.webp',
      },
      {
        value: 'elec-light-hanging',
        label: 'Hanging Light Installation',
        hint: 'Pendant or hanging light fitting.',
        price: 299,
        image: '/assets/services/electrician/04-hanging-light-installation.webp',
      },
      {
        value: 'elec-light-wall',
        label: 'Wall Light Installation',
        hint: 'Wall-mounted sconce or bracket light.',
        price: 149,
        image: '/assets/services/electrician/05-wall-light-installation.webp',
      },
      {
        value: 'elec-light-chandelier',
        label: 'Chandelier Installation',
        hint: 'Heavy decorative fitting, ceiling anchor.',
        price: 299,
        image: '/assets/services/electrician/06-chandelier-installation.webp',
      },
      {
        value: 'elec-light-strip',
        label: 'LED Strip / Profile Light Installation',
        hint: 'Installation of LED strip or profile lighting.',
        price: 299,
        image: '/assets/services/electrician/07-led-strip-profile-light.webp',
      },
      {
        value: 'elec-light-outdoor',
        label: 'Outdoor Light Installation',
        hint: 'Weatherproof outdoor lighting installation.',
        price: 199,
        image: '/assets/services/electrician/08-outdoor-light-installation.webp',
      },
    ],
  },

  // 3. SWITCH & SOCKET SERVICES
  {
    slug: 'switch-socket-services',
    name: 'Switch & Socket Services',
    image: '/assets/services/electrician/group-switch.webp',
    fromPrice: 79,
    blurb: 'From ₹79',
    note: '(Actual pricing)',
    items: [
      {
        value: 'elec-switch-replace',
        label: 'Switch Replacement',
        hint: 'Replace a faulty or old switch.',
        price: 79,
        image: '/assets/services/electrician/01-switch-replacement.webp',
      },
      {
        value: 'elec-socket-replace',
        label: 'Socket Replacement',
        hint: 'Replace a faulty or old socket.',
        price: 99,
        image: '/assets/services/electrician/02-socket-replacement.webp',
      },
      {
        value: 'elec-socket-16a',
        label: '16A / 20A Power Socket',
        hint: 'Install or replace a high-power socket.',
        price: 149,
        image: '/assets/services/electrician/03-16a-20a-power-socket.webp',
      },
      {
        value: 'elec-switchboard-replace',
        label: 'Switchboard Replacement',
        hint: 'Replace the entire switchboard plate.',
        price: 299,
        image: '/assets/services/electrician/04-switchboard-replacement.webp',
      },
      {
        value: 'elec-fan-regulator-replace',
        label: 'Fan Regulator Replacement',
        hint: 'Replace a faulty fan regulator.',
        price: 99,
        image: '/assets/services/electrician/05-fan-regulator-replacement.webp',
      },
      {
        value: 'elec-ac-switch-socket',
        label: 'AC Switch / Socket Installation',
        hint: 'Dedicated switch and socket for AC.',
        price: 249,
        image: '/assets/services/electrician/06-ac-switch-socket-installation.webp',
      },
      {
        value: 'elec-new-point',
        label: 'New Electrical Point',
        hint: 'Create a new electrical point from existing wiring.',
        price: 299,
        image: '/assets/services/electrician/07-new-electrical-point.webp',
      },
      {
        value: 'elec-plug-top',
        label: 'Plug Top Replacement',
        hint: 'Replace a damaged 3-pin plug top.',
        price: 99,
        image: '/assets/services/electrician/08-plug-top-replacement.webp',
      },
    ],
  },

  // 4. WIRING & ELECTRICAL REPAIR
  {
    slug: 'wiring-electrical-repair',
    name: 'Wiring & Electrical Repair',
    image: '/assets/services/electrician/group-wire.webp',
    fromPrice: 149,
    blurb: 'From ₹149',
    note: '(Actual pricing)',
    items: [
      {
        value: 'elec-wiring-external',
        label: 'External Wiring (with clips)',
        hint: 'External wiring with clips per 5 meters.',
        price: 149,
        image: '/assets/services/electrician/01-external-wiring.webp',
      },
      {
        value: 'elec-wiring-pvc',
        label: 'PVC Casing Wiring',
        hint: 'PVC casing wiring per 5 meters.',
        price: 249,
        image: '/assets/services/electrician/02-pvc-casing-wiring.webp',
      },
      {
        value: 'elec-wiring-new-point',
        label: 'New Electrical Point',
        hint: 'Single point wiring from existing DB.',
        price: 299,
        image: '/assets/services/electrician/03-new-electrical-point.webp',
      },
      {
        value: 'elec-repair-short-circuit',
        label: 'Short-Circuit Troubleshooting',
        hint: 'Diagnose and fix short circuits.',
        price: 299,
        image: '/assets/services/electrician/04-short-circuit-troubleshooting.webp',
      },
      {
        value: 'elec-repair-power-failure',
        label: 'Power Failure Diagnosis',
        hint: 'Diagnose and fix power failure issues.',
        price: 249,
        image: '/assets/services/electrician/05-power-failure-diagnosis.webp',
      },
      {
        value: 'elec-repair-loose-connection',
        label: 'Loose Connection Repair',
        hint: 'Fix loose wiring connections.',
        price: 199,
        image: '/assets/services/electrician/06-loose-connection-repair.webp',
      },
      {
        value: 'elec-inspection-internal',
        label: 'Internal Wiring Inspection',
        hint: 'Inspection of internal wiring for safety.',
        price: 0,
        image: '/assets/services/electrician/07-internal-wiring-inspection.webp',
      },
      {
        value: 'elec-inspection-full-home',
        label: 'Full Home Rewiring Site Inspection',
        hint: 'Inspection for full home rewiring.',
        price: 0,
        image: '/assets/services/electrician/08-full-home-rewiring.webp',
      },
    ],
  },

  // 5. MCB, DB & INVERTER
  {
    slug: 'mcb-db-inverter',
    name: 'MCB, DB & Inverter',
    image: '/assets/services/electrician/group-mcd.webp',
    fromPrice: 199,
    blurb: 'From ₹199',
    note: '(Actual pricing)',
    items: [
      {
        value: 'elec-mcb-replace',
        label: 'MCB Replacement',
        hint: 'Replace a faulty MCB.',
        price: 199,
        image: '/assets/services/electrician/01-mcb-replacement.webp',
      },
      {
        value: 'elec-fuse-replace',
        label: 'Fuse Replacement',
        hint: 'Replace a blown fuse.',
        price: 149,
        image: '/assets/services/electrician/02-fuse-replacement.webp',
      },
      {
        value: 'elec-db-box-install',
        label: 'DB Box Installation',
        hint: 'Install a new distribution board box.',
        price: 499,
        image: '/assets/services/electrician/03-db-box-installation.webp',
      },
      {
        value: 'elec-db-inspection',
        label: 'DB Inspection & Repair',
        hint: 'Inspect and repair distribution board issues.',
        price: 299,
        image: '/assets/services/electrician/04-db-inspection-repair.webp',
      },
      {
        value: 'elec-inverter-install',
        label: 'Inverter Installation',
        hint: 'Installation of a home inverter.',
        price: 399,
        image: '/assets/services/electrician/05-inverter-installation.webp',
      },
      {
        value: 'elec-inverter-battery',
        label: 'Inverter Battery Connection',
        hint: 'Connect inverter to battery.',
        price: 299,
        image: '/assets/services/electrician/06-inverter-battery-connection.webp',
      },
      {
        value: 'elec-inverter-repair',
        label: 'Inverter Repair',
        hint: 'Repair a faulty inverter.',
        price: 299,
        image: '/assets/services/electrician/07-inverter-repair.webp',
      },
      {
        value: 'elec-stabilizer-install',
        label: 'Voltage Stabiliser Installation',
        hint: 'Install a voltage stabiliser.',
        price: 199,
        image: '/assets/services/electrician/08-voltage-stabiliser-installation.webp',
      },
    ],
  },

  // 6. APPLIANCE INSTALLATION
  {
    slug: 'appliance-installation',
    name: 'Appliance Installation',
    image: '/assets/services/electrician/group-appli.webp',
    fromPrice: 199,
    blurb: 'From ₹199',
    note: '(Actual pricing)',
    items: [
      {
        value: 'elec-app-geyser-install',
        label: 'Geyser Installation',
        hint: 'Installation and connection of a geyser.',
        price: 399,
        image: '/assets/services/electrician/01-geyser-installation.webp',
      },
      {
        value: 'elec-app-geyser-replace',
        label: 'Geyser Replacement',
        hint: 'Remove old geyser and install a new one.',
        price: 499,
        image: '/assets/services/electrician/02-geyser-replacement.webp',
      },
      {
        value: 'elec-app-exhaust-install',
        label: 'Exhaust Fan Installation',
        hint: 'Bathroom or kitchen exhaust fan fitting.',
        price: 199,
        image: '/assets/services/electrician/03-exhaust-fan-installation.webp',
      },
      {
        value: 'elec-app-chimney-install',
        label: 'Kitchen Chimney Connection',
        hint: 'Wall mounting and ducting of a kitchen chimney.',
        price: 299,
        image: '/assets/services/electrician/04-kitchen-chimney-connection.webp',
      },
      {
        value: 'elec-app-tv-install',
        label: 'TV Wall Mounting',
        hint: 'Wall mounting of a television.',
        price: 499,
        image: '/assets/services/electrician/05-tv-wall-mounting.webp',
      },
      {
        value: 'elec-app-soundbar-install',
        label: 'Soundbar Installation',
        hint: 'Installation of a soundbar.',
        price: 299,
        image: '/assets/services/electrician/06-soundbar-installation.webp',
      },
      {
        value: 'elec-app-washing-machine',
        label: 'Washing Machine Connection',
        hint: 'Connect washing machine to power and water.',
        price: 199,
        image: '/assets/services/electrician/07-washing-machine-connection.webp',
      },
      {
        value: 'elec-app-other',
        label: 'Other Appliances Installation',
        hint: 'Installation of other electrical appliances.',
        price: 299,
        image: '/assets/services/electrician/08-other-appliances-installation.webp',
      },
    ],
  },

  // 7. CONSULTATION & CUSTOM WORK
  // {
  //   slug: 'consultation-custom-work',
  //   name: 'Consultation & Custom Work',
  //   image: '/assets/services/electrician/Home1.jpg',
  //   fromPrice: null,
  //   blurb: 'On-site quote',
  //   note: 'Final pricing after inspection',
  //   items: [
  //     {
  //       value: 'elec-consult-inspection',
  //       label: 'Professional Inspection & Diagnosis',
  //       hint: 'Full inspection and diagnosis of electrical issues.',
  //       price: 499,
  //       image: '/assets/services/electrician/01_Professional_Inspection_Diagnosis.png',
  //     },
  //     {
  //       value: 'elec-consult-quotation',
  //       label: 'Detailed Quotation',
  //       hint: 'Get a detailed quotation for custom work.',
  //       price: 0,
  //       image: '/assets/services/electrician/02_Detailed_Quotation.png',
  //     },
  //     {
  //       value: 'elec-consult-visit',
  //       label: 'Electrician Visit for Inspection',
  //       hint: 'Visit fee for inspection (adjustable against final bill).',
  //       price: 99,
  //       image: '/assets/services/electrician/03_Electrician_Visit_Inspection.png',
  //     },
    // ],
  // },
];

/** Look up a group by its slug. */
export const getElectricalGroup = (slug) =>
  electricalGroups.find((g) => g.slug === slug);
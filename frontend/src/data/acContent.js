export const acTypes = [
  { value: 'split', label: 'Split AC' },
  { value: 'window', label: 'Window AC' },
  { value: 'inverter', label: 'Inverter AC' },
  { value: 'cassette', label: 'Cassette AC' },
  { value: 'ductable', label: 'Ductable AC' },
  { value: 'concealed', label: 'Concealed AC' },
];

export const acCapacities = [
  { value: '1-ton', label: '1 Ton' },
  { value: '1-5-ton', label: '1.5 Ton' },
  { value: '2-ton', label: '2 Ton' },
];

// R32 is visible in the reference dropdown.
// Other dropdown choices need confirmation.
export const acRefrigerants = [
  { value: 'r32', label: 'R32' },
];

export const acCategories = [
  {
    slug: 'regular',
    label: 'Regular AC Services',
    hint: 'Cleaning, check-up and maintenance',
  },
  {
    slug: 'repair',
    label: 'AC Repair',
    hint: 'Help with cooling, leakage, noise and other problems',
  },
  {
    slug: 'installation',
    label: 'AC Installation',
    hint: 'New AC installation with testing',
  },
  {
    slug: 'uninstallation',
    label: 'AC Uninstallation',
    hint: 'Safe dismantling and handling',
  },
  {
    slug: 'gas-charging',
    label: 'Gas Charging',
    hint: 'AC gas check and refilling',
  },
  {
    slug: 'amc',
    label: 'Annual Maintenance (AMC)',
    hint: 'Scheduled maintenance throughout the year',
  },
];

// Reference starting prices in rupees.
// These are display data; the backend must validate booking prices.
export const acServicesByCategory = {
  regular: [
    {
      value: 'general-service',
      label: 'AC General Service',
      hint: 'Basic cleaning and check-up',
      price: 499,
    },
    {
      value: 'jet-service',
      label: 'AC Jet Service',
      hint: 'High pressure cleaning',
      price: 699,
    },
    {
      value: 'deep-cleaning',
      label: 'AC Deep Cleaning',
      hint: 'Complete indoor and outdoor cleaning',
      price: 899,
    },
    {
      value: 'filter-cleaning',
      label: 'AC Filter Cleaning',
      hint: 'Filter and airflow cleaning',
      price: 299,
    },
    {
      value: 'cooling-check',
      label: 'AC Cooling Check',
      hint: 'Performance and cooling check',
      price: 299,
    },
    {
      value: 'water-leakage-check',
      label: 'Water Leakage Check',
      hint: 'Leakage detection and fix',
      price: 299,
    },
    {
      value: 'drain-pipe-cleaning',
      label: 'AC Drain Pipe Cleaning',
      hint: 'Drain line cleaning and check',
      price: 299,
    },
    {
      value: 'outdoor-unit-cleaning',
      label: 'Outdoor Unit Cleaning',
      hint: 'Outdoor unit cleaning and check',
      price: 399,
    },
  ],

  repair: [
    {
      value: 'not-cooling',
      label: 'AC Not Cooling',
      hint: 'Cooling issues and low airflow',
      price: 249,
      inspection: true,
    },
    {
      value: 'water-leakage',
      label: 'Water Leakage',
      hint: 'Water leakage problems',
      price: 249,
      inspection: true,
    },
    {
      value: 'not-starting',
      label: 'AC Not Starting',
      hint: 'Power and starting issues',
      price: 249,
      inspection: true,
    },
    {
      value: 'unusual-noise',
      label: 'Unusual Noise',
      hint: 'Abnormal sound or vibration',
      price: 249,
      inspection: true,
    },
    {
      value: 'bad-smell',
      label: 'Bad Smell',
      hint: 'Cleaning and repair for fresh air',
      price: 249,
      inspection: true,
    },
    {
      value: 'electrical-fault',
      label: 'Electrical Fault',
      hint: 'PCB, sensor, capacitor and other electrical issues',
      price: 349,
      inspection: true,
    },
  ],

  installation: [
    {
      value: 'ac-installation',
      label: 'AC Installation',
      hint: 'The reference shows Split AC installation from this price',
      price: 1499,
      referenceAcType: 'split',
    },
  ],

  uninstallation: [
    {
      value: 'ac-uninstallation',
      label: 'AC Uninstallation',
      hint: 'Safe dismantling and handling',
      price: 499,
    },
  ],

  'gas-charging': [
    {
      value: 'gas-charging',
      label: 'AC Gas Charging',
      hint: 'Gas level check and refrigerant charging',
      price: 1499,
    },
  ],

  amc: [
    {
      value: 'amc-2-services',
      label: '2 Service AMC',
      hint: 'Every 6 months',
      price: 1499,
      visits: 2,
    },
    {
      value: 'amc-3-services',
      label: '3 Service AMC',
      hint: 'Every 4 months',
      price: 1999,
      visits: 3,
    },
    {
      value: 'amc-4-services',
      label: '4 Service AMC',
      hint: 'Every 3 months',
      price: 2499,
      visits: 4,
    },
  ],
};

export const acAddonsByCategory = {
  regular: [
    { value: 'gas-check', label: 'Gas Check', price: 299 },
    { value: 'stand-check', label: 'Outdoor Stand Check', price: 199 },
    { value: 'anti-rust', label: 'Anti-Rust Coating', price: 299 },
  ],

  repair: [],

  installation: [
    {
      value: 'extended-copper-pipe',
      label: 'Extended Copper Pipe',
      price: 199,
      unit: 'ft',
    },
    {
      value: 'outdoor-stand',
      label: 'Outdoor Stand (Heavy Duty)',
      price: 499,
    },
    {
      value: 'stabilizer-installation',
      label: 'Stabilizer Installation',
      price: 299,
    },
    {
      value: 'mcb-installation',
      label: 'MCB / Isolator Installation',
      price: 249,
    },
    {
      value: 'core-cutting',
      label: 'Core Cutting',
      price: 399,
      unit: 'hole',
    },
    {
      value: 'drain-extension',
      label: 'Drain Pipe Extension',
      price: 99,
      unit: 'ft',
    },
  ],

  uninstallation: [
    {
      value: 'outdoor-dismantling',
      label: 'Outdoor Unit Dismantling (separate location)',
      price: 299,
    },
    {
      value: 'pipe-packing',
      label: 'Copper Pipe Care & Packing',
      price: 199,
    },
    {
      value: 'safe-transport',
      label: 'Safe Transport (within same building)',
      price: 199,
    },
    {
      value: 'stand-removal',
      label: 'Outdoor Stand Removal',
      price: 149,
    },
    {
      value: 'gas-recovery',
      label: 'Gas Recovery (if required)',
      price: 299,
    },
  ],

  'gas-charging': [
    {
      value: 'leakage-detection',
      label: 'Leakage Detection (Soap Test)',
      price: 199,
    },
    {
      value: 'copper-pipe-repair',
      label: 'Copper Pipe Repair (if required)',
      price: 299,
    },
    {
      value: 'vacuum-pressure-test',
      label: 'Vacuuming & Pressure Test',
      price: 199,
    },
  ],

  amc: [],
};
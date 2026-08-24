/**
 * SUPPLYBASE PROJECTS — SITE CONFIGURATION
 * ----------------------------------------
 * Single source of truth for brand text, contact details, statistics and social links.
 * Edit values here and they update everywhere on the website.
 */

export const company = {
  name: 'Supplybase Projects',
  nameUpper: 'SUPPLYBASE PROJECTS',
  tagline: 'ONE PARTNER. COMPLETE PROJECT.',
  statement: 'DESIGN. BUILD. DELIVER.',
  model: 'LABOUR + MATERIAL + MANAGEMENT',
  shortIntro:
    'From 3D architectural design to construction and finishing — we provide labour, materials and complete project execution under one roof.',
  longIntro:
    'Supplybase Projects is a construction, architectural design, interior design and turnkey project execution company. We handle labour, material and project management so our clients deal with one partner from the first drawing to the final handover.',
};

/**
 * OFFICIAL CONTACT DETAILS — used by every call, email and WhatsApp button on the site.
 */
export const contact = {
  phoneDisplay: '+91 77095 88422',
  phoneRaw: '917709588422', // country code + number, digits only (used for tel: and WhatsApp)
  email: 'info.supplybase@gmail.com',
  addressLines: ['Mumbai, Maharashtra', 'India'],
  serviceAreas: ['Mumbai', 'Navi Mumbai', 'Thane', 'Kalyan', 'Panvel', 'Pune'],
  workingHours: 'Monday – Saturday, 9:00 AM – 7:00 PM',
};

/**
 * SOCIAL LINKS — leave a url empty ('') to hide that icon from the footer.
 */
export const social = [
  { id: 'facebook', label: 'Facebook', url: '' },
  { id: 'instagram', label: 'Instagram', url: '' },
  { id: 'linkedin', label: 'LinkedIn', url: '' },
  { id: 'youtube', label: 'YouTube', url: '' },
];

/**
 * COMPANY STATISTICS — edit these numbers as the business grows.
 */
export const stats = [
  { value: '100+', label: 'Projects Completed' },
  { value: '30+', label: 'Skilled Professionals' },
  { value: '10+', label: 'Years of Experience' },
  { value: '100%', label: 'Client Satisfaction' },
];

/**
 * HERO TRUST BAR — the five promises shown directly under the hero.
 */
export const trustPoints = [
  { icon: 'partners', title: 'ONE PARTNER', text: 'For Everything' },
  { icon: 'shield', title: 'QUALITY', text: 'You Can Trust' },
  { icon: 'team', title: 'EXPERIENCED TEAM', text: 'Professional Experts' },
  { icon: 'clock', title: 'ON TIME', text: 'Project Delivery' },
  { icon: 'home-check', title: 'COMPLETE SOLUTION', text: 'End-to-End Service' },
];

/**
 * HOW IT WORKS — the four-step delivery process.
 */
export const processSteps = [
  {
    number: '01',
    icon: 'chat',
    title: 'CONSULTATION',
    text: 'Share your requirements with our experts and we assess the site, scope and budget.',
  },
  {
    number: '02',
    icon: 'blueprint',
    title: 'PLANNING & DESIGN',
    text: 'We plan, design and visualise your project in 2D drawings and 3D views before work begins.',
  },
  {
    number: '03',
    icon: 'helmet',
    title: 'EXECUTION',
    text: 'Our team executes the work with supervised quality control, on schedule and on budget.',
  },
  {
    number: '04',
    icon: 'handover',
    title: 'HANDOVER',
    text: 'We complete the finishing, clean the site and hand over a project ready to use.',
  },
];

/**
 * DIFFERENTIATORS — the reasons to choose us, shown on the home page and the
 * About page. (There is no longer a separate Why Us page.)
 */
export const whyUsPoints = [
  {
    icon: 'partners',
    title: 'One Partner For Everything',
    text: 'Design, civil work, interiors, electrical, plumbing and finishing handled by a single accountable team — no coordinating five different contractors.',
  },
  {
    icon: 'package',
    title: 'Labour + Material Supplied',
    text: 'We arrange skilled labour and quality materials together, so you get one clear rate instead of chasing suppliers yourself.',
  },
  {
    icon: 'blueprint',
    title: 'Design Before You Build',
    text: '2D plans, 3D exterior and 3D interior views let you see the finished result before the first brick is laid.',
  },
  {
    icon: 'shield',
    title: 'Quality You Can Trust',
    text: 'Supervised workmanship, standard materials and stage-wise checks on every project we take on.',
  },
  {
    icon: 'clock',
    title: 'On-Time Delivery',
    text: 'Clear timelines agreed at the start and a schedule that our site team is held to.',
  },
  {
    icon: 'rupee',
    title: 'Transparent Pricing',
    text: 'Itemised quotations with no hidden charges, so you always know what you are paying for.',
  },
];

/**
 * PRIMARY NAVIGATION.
 */
export const mainNav = [
  { label: 'HOME', path: '/' },
  { label: 'SERVICES', path: '/services', hasMegaMenu: true },
  { label: 'PROJECTS', path: '/projects' },
  { label: 'MATERIALS', path: '/materials' },
  { label: 'ABOUT US', path: '/about' },
  { label: 'CONTACT US', path: '/contact' },
];

/**
 * FOOTER QUICK LINKS.
 */
export const quickLinks = [
  { label: 'Home', path: '/' },
  { label: 'Services', path: '/services' },
  { label: 'Projects', path: '/projects' },
  { label: 'Materials', path: '/materials' },
  { label: 'About Us', path: '/about' },
  { label: 'Contact Us', path: '/contact' },
  { label: 'Get a Quote', path: '/quote' },
  { label: 'Login', path: '/login' },
];

/**
 * PROJECT TYPES + BUDGET RANGES used by the quote form dropdowns.
 */
export const projectTypes = [
  'Residential — New Construction',
  'Residential — Interior',
  'Residential — Renovation',
  'Commercial / Office',
  'Retail / Showroom',
  'Industrial / Warehouse',
  'Other',
];

export const budgetRanges = [
  'Under ₹5 Lakh',
  '₹5 Lakh – ₹15 Lakh',
  '₹15 Lakh – ₹30 Lakh',
  '₹30 Lakh – ₹50 Lakh',
  '₹50 Lakh – ₹1 Crore',
  'Above ₹1 Crore',
  'Not decided yet',
];

export default { company, contact, social, stats, trustPoints, processSteps, whyUsPoints, mainNav, quickLinks, projectTypes, budgetRanges };

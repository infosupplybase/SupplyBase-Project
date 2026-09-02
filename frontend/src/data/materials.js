/**
 * SUPPLYBASE PROJECTS — MATERIALS & BRANDS
 * ----------------------------------------
 * The brands you buy and supply, grouped by type of work.
 *
 * TO ADD A BRAND: copy a line, change the name. That's it.
 *
 * TO SHOW A BRAND'S LOGO INSTEAD OF ITS NAME:
 *   1. Put the logo image in  public/assets/brands/
 *   2. Add  logo: '/assets/brands/filename.png'  to that brand's line
 * Without a logo it shows the brand name in a clean card, which looks fine.
 *
 * ⚠️  IMPORTANT — please read:
 * Company logos belong to those companies. Only put a logo here if you are
 * allowed to use it (for example, you are an authorised dealer, or they have
 * given you permission in writing). Brand NAMES in plain text, describing what
 * you buy and install, are normal and safe.
 */

export const materialGroups = [
  {
    id: 'painting',
    title: 'Painting Materials',
    icon: 'roller',
    brands: [{ name: 'Asian Paints' }, { name: 'Berger Paints' }, { name: 'Nerolac' }],
  },
  {
    id: 'waterproofing',
    title: 'Waterproofing Materials',
    icon: 'droplet',
    brands: [{ name: 'Dr. Fixit' }, { name: 'Sika' }, { name: 'Berger' }],
  },
  {
    id: 'plaster-wall',
    title: 'Plaster & Wall Systems',
    icon: 'building',
    brands: [{ name: 'Gyproc (Saint-Gobain)' }, { name: 'JSW Cement' }, { name: 'UltraTech' }],
  },
  {
    id: 'tiles',
    title: 'Tiles, Marble & Granite',
    icon: 'layers',
    brands: [
      { name: 'Kajaria' },
      { name: 'Somany' },
      { name: 'H&R Johnson' },
      { name: 'Nitco' },
      { name: 'Simpolo' },
    ],
  },
  {
    id: 'bricks',
    title: 'Bricks & Blocks',
    icon: 'package',
    brands: [{ name: 'AAC Blocks' }, { name: 'Fly Ash Bricks' }, { name: 'Red Clay Bricks' }],
    note: 'Material types rather than brands — supplied from tested local sources.',
  },
  {
    id: 'electrical',
    title: 'Electrical',
    icon: 'bolt',
    brands: [{ name: 'Polycab' }, { name: 'Finolex' }, { name: 'Havells' }, { name: 'Legrand' }],
  },
  {
    id: 'plumbing',
    title: 'Plumbing',
    icon: 'tap',
    brands: [{ name: 'Astral' }, { name: 'Supreme' }, { name: 'Finolex' }, { name: 'Ashirvad' }],
  },
  {
    id: 'ceiling',
    title: 'POP & False Ceiling',
    icon: 'ceiling',
    brands: [{ name: 'Gyproc (Saint-Gobain)' }, { name: 'Birla White' }, { name: 'USG Boral' }],
  },
  {
    id: 'fabrication',
    title: 'Steel & Fabrication',
    icon: 'welding',
    brands: [{ name: 'Tata Steel' }, { name: 'JSW Steel' }, { name: 'Jindal' }],
  },
  {
    id: 'furniture',
    title: 'Furniture & Interior Materials',
    icon: 'wardrobe',
    brands: [{ name: 'Century Ply' }, { name: 'Greenlam' }, { name: 'Merino' }, { name: 'Hettich' }],
  },
  {
    id: 'sanitary',
    title: 'Sanitary Ware & Fittings',
    icon: 'tap',
    brands: [{ name: 'Jaquar' }, { name: 'Hindware' }, { name: 'Cera' }, { name: 'Parryware' }],
  },
];

/** Shown on the home page as a short strip. Keep it to your best-known names. */
export const featuredBrands = [
  'Asian Paints',
  'Kajaria',
  'Dr. Fixit',
  'Polycab',
  'Astral',
  'Gyproc',
  'Century Ply',
  'Jaquar',
];

export default materialGroups;

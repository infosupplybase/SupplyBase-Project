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
   brands: [
  { name: 'Asian Paints', logo: '/assets/materials/asian-paints.webp' },
  { name: 'Berger Paints', logo: '/assets/materials/berger-paints.webp' },
  { name: 'Nerolac', logo: '/assets/materials/nerolac.webp' },
],
  },
  {
    id: 'waterproofing',
    title: 'Waterproofing Materials',
    icon: 'droplet',
    brands: [
  { name: 'Dr. Fixit', logo: '/assets/materials/dr-fixit.webp' },
  { name: 'Sika', logo: '/assets/materials/sika.webp' },
  { name: 'Berger', logo: '/assets/materials/berger-paints.webp' },
],
  },
  {
    id: 'plaster-wall',
    title: 'Plaster & Wall Systems',
    icon: 'building',
    brands: [{ name: 'Gyproc (Saint-Gobain)',logo: '/assets/materials/gyproc.webp' }, 
      { name: 'JSW Cement', logo: '/assets/materials/jsw-cement.webp' }, 
      { name: 'UltraTech', logo: '/assets/materials/ultratech.webp' }
    ],
  },
  {
    id: 'tiles',
    title: 'Tiles, Marble & Granite',
    icon: 'layers',
    brands: [
      { name: 'Kajaria',logo: '/assets/materials/kajaria.webp' },
      { name: 'Somany',logo: '/assets/materials/somany.webp' },
      { name: 'H&R Johnson',logo: '/assets/materials/h&r johnson.webp' },
      { name: 'Nitco',logo: '/assets/materials/nitco.webp' },
      { name: 'Simpolo',logo: '/assets/materials/simpolo.webp' },
    ],
  },
  {
    id: 'bricks',
    title: 'Bricks & Blocks',
    icon: 'package',
    brands: [{ name: 'AAC Blocks',logo: '/assets/materials/acc blocks.webp' },
       { name: 'Fly Ash Bricks',logo: '/assets/materials/fly ash bricks.webp' }, 
       { name: 'Red Clay Bricks' ,logo: '/assets/materials/red clay bricks.webp'}],
    note: 'Material types rather than brands — supplied from tested local sources.',
  },
  {
    id: 'electrical',
    title: 'Electrical',
    icon: 'bolt',
    brands: [{ name: 'Polycab',logo: '/assets/materials/polycab.webp' },
       { name: 'Finolex',logo: '/assets/materials/finolex.webp' },
       { name: 'Havells',logo: '/assets/materials/havells.webp' }, 
       { name: 'Legrand',logo: '/assets/materials/legrand.webp' }],
  },
  {
    id: 'plumbing',
    title: 'Plumbing',
    icon: 'tap',
    brands: [{ name: 'Astral', logo: '/assets/materials/astral-pipes.webp' }, 
      { name: 'Supreme',logo: '/assets/materials/supreme.webp' },
      { name: 'Finolex',logo: '/assets/materials/finolex.webp' }, 
      { name: 'Ashirvad',logo: '/assets/materials/ashirvad.webp' }],
  },
  {
    id: 'ceiling',
    title: 'POP & False Ceiling',
    icon: 'ceiling',
    brands: [{ name: 'Gyproc (Saint-Gobain)',logo: '/assets/materials/gyproc.webp' }, 
      { name: 'Birla White',logo: '/assets/materials/birla white.webp' },
       { name: 'USG Boral',logo: '/assets/materials/usg boral.webp' }],
  },
  {
    id: 'fabrication',
    title: 'Steel & Fabrication',
    icon: 'welding',
    brands: [{ name: 'Tata Steel',logo: '/assets/materials/tata steel.webp' },
       { name: 'JSW Steel',logo: '/assets/materials/jsw steel.webp' },
        { name: 'Jindal',logo: '/assets/materials/jindal.webp' }],
  },
  {
    id: 'furniture',
    title: 'Furniture & Interior Materials',
    icon: 'wardrobe',
    brands: [{ name: 'Century Ply',logo: '/assets/materials/century-ply.webp' },
       { name: 'Greenlam',logo: '/assets/materials/greenlam.webp' },
        { name: 'Merino',logo: '/assets/materials/merino.webp' },
         { name: 'Hettich',logo: '/assets/materials/hettich.webp' }],
  },
  {
    id: 'sanitary',
    title: 'Sanitary Ware & Fittings',
    icon: 'tap',
    brands: [{ name: 'Jaquar',logo: '/assets/materials/jaquar.webp' }, 
      { name: 'Hindware',logo: '/assets/materials/hindware.webp' },
       { name: 'Cera',logo: '/assets/materials/cera.webp' },
        { name: 'Parryware' ,logo: '/assets/materials/parryware.webp'}],
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

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
  { name: 'Asian Paints', logo: '/assets/materials/asian-paints.png' },
  { name: 'Berger Paints', logo: '/assets/materials/berger-paints.jpg' },
  { name: 'Nerolac', logo: '/assets/materials/nerolac.png' },
],
  },
  {
    id: 'waterproofing',
    title: 'Waterproofing Materials',
    icon: 'droplet',
    brands: [
  { name: 'Asian Paints', logo: '/assets/materials/dr-fixit.png' },
  { name: 'Berger Paints', logo: '/assets/materials/sika.webp' },
  { name: 'Nerolac', logo: '/assets/materials/berger-paints.jpg' },
],
  },
  {
    id: 'plaster-wall',
    title: 'Plaster & Wall Systems',
    icon: 'building',
    brands: [{ name: 'Gyproc (Saint-Gobain)',logo: '/assets/materials/gyproc.png' }, 
      { name: 'JSW Cement', logo: '/assets/materials/jsw-cement.png' }, 
      { name: 'UltraTech', logo: '/assets/materials/ultratech.png' }
    ],
  },
  {
    id: 'tiles',
    title: 'Tiles, Marble & Granite',
    icon: 'layers',
    brands: [
      { name: 'Kajaria',logo: '/assets/materials/kajaria.png' },
      { name: 'Somany',logo: '/assets/materials/somany.jpg' },
      { name: 'H&R Johnson',logo: '/assets/materials/h&r johnson.png' },
      { name: 'Nitco',logo: '/assets/materials/nitco.jpg' },
      { name: 'Simpolo',logo: '/assets/materials/simpolo.jpg' },
    ],
  },
  {
    id: 'bricks',
    title: 'Bricks & Blocks',
    icon: 'package',
    brands: [{ name: 'AAC Blocks',logo: '/assets/materials/acc blocks.jpg' },
       { name: 'Fly Ash Bricks',logo: '/assets/materials/fly ash bricks.jpg' }, 
       { name: 'Red Clay Bricks' ,logo: '/assets/materials/red clay bricks.jpg'}],
    note: 'Material types rather than brands — supplied from tested local sources.',
  },
  {
    id: 'electrical',
    title: 'Electrical',
    icon: 'bolt',
    brands: [{ name: 'Polycab',logo: '/assets/materials/polycab.png' },
       { name: 'Finolex',logo: '/assets/materials/finolex.jpg' },
       { name: 'Havells',logo: '/assets/materials/havells.jpg' }, 
       { name: 'Legrand',logo: '/assets/materials/legrand.jpg' }],
  },
  {
    id: 'plumbing',
    title: 'Plumbing',
    icon: 'tap',
    brands: [{ name: 'Astral', logo: '/assets/materials/astral-pipes.png' }, 
      { name: 'Supreme',logo: '/assets/materials/supreme.jpg' },
      { name: 'Finolex',logo: '/assets/materials/finolex.jpg' }, 
      { name: 'Ashirvad',logo: '/assets/materials/ashirvad.jpg' }],
  },
  {
    id: 'ceiling',
    title: 'POP & False Ceiling',
    icon: 'ceiling',
    brands: [{ name: 'Gyproc (Saint-Gobain)',logo: '/assets/materials/gyproc.png' }, 
      { name: 'Birla White',logo: '/assets/materials/birla white.jpg' },
       { name: 'USG Boral',logo: '/assets/materials/usg boral.jpg' }],
  },
  {
    id: 'fabrication',
    title: 'Steel & Fabrication',
    icon: 'welding',
    brands: [{ name: 'Tata Steel',logo: '/assets/materials/tata steel.jpg' },
       { name: 'JSW Steel',logo: '/assets/materials/jsw steel.jpg' },
        { name: 'Jindal',logo: '/assets/materials/jindal.jpg' }],
  },
  {
    id: 'furniture',
    title: 'Furniture & Interior Materials',
    icon: 'wardrobe',
    brands: [{ name: 'Century Ply',logo: '/assets/materials/century-ply.png' },
       { name: 'Greenlam',logo: '/assets/materials/greenlam.jpg' },
        { name: 'Merino',logo: '/assets/materials/merino.jpg' },
         { name: 'Hettich',logo: '/assets/materials/hettich.jpg' }],
  },
  {
    id: 'sanitary',
    title: 'Sanitary Ware & Fittings',
    icon: 'tap',
    brands: [{ name: 'Jaquar',logo: '/assets/materials/jaquar.png' }, 
      { name: 'Hindware',logo: '/assets/materials/hindware.jpg' },
       { name: 'Cera',logo: '/assets/materials/cera.jpg' },
        { name: 'Parryware' ,logo: '/assets/materials/parryware.jpg'}],
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

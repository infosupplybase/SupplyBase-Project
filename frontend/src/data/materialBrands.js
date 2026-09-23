/**
 * SUPPLYBASE — MATERIAL BRANDS SHOWN ON THE HOME PAGE
 *
 * Seed data for the approved "We supply the material too" section. The shape
 * matches what the admin screen will eventually serve — name, logo, display
 * order, active flag — so switching this file for an API call later is a
 * change of source, not a change of component.
 *
 * This is the shortlist for the home page only. The full catalogue of what
 * Supplybase buys, grouped by trade, stays in materials.js and drives
 * /materials.
 *
 * ⚠️  These are other companies' trademarks. They are shown to say what
 * Supplybase buys and installs, which is normal. If any brand ever objects,
 * delete its line here — the grid reflows on its own.
 */
export const materialBrands = [
  { id: 'asian-paints', name: 'Asian Paints', logo: '/assets/materials/asian-paints.png', order: 1, active: true },
  { id: 'kajaria',      name: 'Kajaria',      logo: '/assets/materials/kajaria.png',      order: 2, active: true },
  { id: 'dr-fixit',     name: 'Dr. Fixit',    logo: '/assets/materials/dr-fixit.png',     order: 3, active: true },
  { id: 'polycab',      name: 'Polycab',      logo: '/assets/materials/polycab.png',      order: 4, active: true },
  { id: 'astral-pipes', name: 'Astral Pipes', logo: '/assets/materials/astral-pipes.png', order: 5, active: true },
  { id: 'gyproc',       name: 'Gyproc',       logo: '/assets/materials/gyproc.png',       order: 6, active: true },
  { id: 'century-ply',  name: 'Century Ply',  logo: '/assets/materials/century-ply.png',  order: 7, active: true },
  { id: 'jaquar',       name: 'Jaquar',       logo: '/assets/materials/jaquar.png',       order: 8, active: true },
];

/** What the section renders: active brands only, in display order. */
export function visibleBrands(brands = materialBrands) {
  return brands.filter((b) => b.active).sort((a, b) => a.order - b.order);
}

export default materialBrands;

/**
 * The service catalogue in the database names each category's photo as a
 * .png under /assets/popular-services/. Those files are kept (the database
 * points at them), and a much lighter .webp of each sits beside it — this
 * swaps in the .webp. Any other path is returned unchanged.
 *
 * Photos replaced later get a new file name (-v2) so browsers that cached
 * the old one for a week fetch the new one.
 */
const WEBP_BESIDE = /^\/assets\/popular-services\/([a-z0-9-]+)\.png$/;
const UPDATED = new Set(['interior-by-choice', 'interior-design', 'painting', 'plumbing', 'pop-ceiling-design']);

export default function optimizedImage(src) {
  const match = src && WEBP_BESIDE.exec(src);
  if (!match) return src;
  return `/assets/popular-services/${match[1]}${UPDATED.has(match[1]) ? '-v2' : ''}.webp`;
}
/**
 * The service catalogue in the database names each category's photo as a
 * .png under /assets/popular-services/. Those files are kept (the database
 * points at them), and a much lighter .webp of each sits beside it — this
 * swaps in the .webp. Any other path is returned unchanged.
 */
const WEBP_BESIDE = /^\/assets\/popular-services\/[a-z0-9-]+\.png$/;

export default function optimizedImage(src) {
  return src && WEBP_BESIDE.test(src) ? src.replace(/\.png$/, '.webp') : src;
}

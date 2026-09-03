/**
 * The architectural line-work behind the statistics.
 *
 * This is the approved artwork, not a drawing of it. An earlier version built
 * the building and crane as inline SVG because no asset existed; the supplied
 * render replaced it.
 *
 * Decorative, so it is hidden from assistive tech and ignores the pointer. It
 * is also not lazy-loaded: it sits behind the cards rather than below them, and
 * a backdrop that fades in after the text has settled is more distracting than
 * one that is simply there. Low fetch priority keeps it behind the hero
 * banners in the queue.
 */
export default function StatsBackdrop() {
  return (
    <img
      className="wss-backdrop"
      src="/assets/stats/construction-backdrop.jpg"
      alt=""
      aria-hidden="true"
      /* lowercase: React 18 does not know the camelCase `fetchPriority` prop
         and silently drops it. */
      fetchpriority="low"
      decoding="async"
      draggable="false"
    />
  );
}

import { useEffect, useRef, useState } from 'react';

/**
 * Counts a statistic up to its final value the first time it is scrolled to.
 *
 * Takes the finished string ("100+", "100%", "10+") and animates only the
 * digits, keeping whatever sits around them. That way the data file stays
 * human-readable — nobody has to split a number from its suffix to change it.
 */
const PARTS = /^(\D*)(\d+)(\D*)$/;

export default function CountUp({ value, duration = 1400 }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(value);

  const match = PARTS.exec(value);

  useEffect(() => {
    const node = ref.current;
    // No digits to animate, no observer, or the visitor has asked for less
    // motion: show the final value and never touch it again.
    const still =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!match || !node || still || typeof IntersectionObserver === 'undefined') {
      setShown(value);
      return undefined;
    }

    const [, before, digits, after] = match;
    const target = Number(digits);

    let frame = 0;
    let safety = 0;
    let start = 0;

    const step = (now) => {
      if (!start) start = now;
      const t = Math.min((now - start) / duration, 1);
      // Ease out: the number arrives quickly and settles, rather than
      // crawling at a constant rate.
      const eased = 1 - (1 - t) ** 3;
      setShown(`${before}${Math.round(target * eased)}${after}`);
      if (t < 1) frame = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          // Zeroed here and not on mount. If this never runs — the card is
          // never scrolled to — the real figure is what stays on screen.
          setShown(`${before}0${after}`);
          frame = requestAnimationFrame(step);
          // requestAnimationFrame is paused in a backgrounded tab and in some
          // embedded webviews, and a statistic frozen at 0 is worse than one
          // that never animated. This lands the true value either way.
          safety = setTimeout(() => setShown(value), duration + 400);
        });
      },
      // A quarter of a 280px card is ~70px, reachable on any viewport. A
      // higher threshold can never be met on a short screen, which would
      // leave the counter unfired.
      { threshold: 0.25 }
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(safety);
    };
  }, [value, duration, match]);

  /* aria-label carries the real figure so a screen reader announces "100+"
     once, not every intermediate number as the count runs. */
  return (
    <span ref={ref} aria-label={value}>
      <span aria-hidden="true">{shown}</span>
    </span>
  );
}

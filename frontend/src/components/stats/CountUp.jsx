'use client';

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
  // Survives the effect being torn down and re-run — by StrictMode's double
  // mount in development, or by a prop change — so a finished count is never
  // replayed and never falls back to zero.
  const done = useRef(false);

  useEffect(() => {
    const node = ref.current;

    /*
     * Parsed inside the effect, not outside it.
     *
     * A regex match is a fresh array on every render. Held in a variable in
     * the component body and listed as a dependency, it made the effect
     * re-run after every frame: the cleanup cancelled the animation and the
     * fallback timer, the new observer saw the card still on screen, and the
     * number was set straight back to zero. The counters sat at 0+ forever
     * and re-rendered continuously doing it.
     */
    const match = PARTS.exec(value);

    // No digits to animate, no observer, the count already ran, or the
    // visitor has asked for less motion: show the final value and stop.
    const still =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!match || !node || still || done.current || typeof IntersectionObserver === 'undefined') {
      setShown(value);
      return undefined;
    }

    const [, before, digits, after] = match;
    const target = Number(digits);

    let frame = 0;
    let fallback = 0;
    let start = 0;

    const finish = () => {
      done.current = true;
      setShown(value);
    };

    const step = (now) => {
      if (!start) start = now;
      const t = Math.min((now - start) / duration, 1);
      if (t >= 1) {
        finish();
        return;
      }
      // Ease out: the number arrives quickly and settles, rather than
      // crawling at a constant rate.
      const eased = 1 - (1 - t) ** 3;
      setShown(`${before}${Math.round(target * eased)}${after}`);
      frame = requestAnimationFrame(step);
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
          fallback = setTimeout(finish, duration + 400);
        });
      },
      // A quarter of a 270px card is ~68px, reachable on any viewport. A
      // higher threshold can never be met on a short screen, which would
      // leave the counter unfired.
      { threshold: 0.25 }
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(fallback);
    };
    // `value` and `duration` only. Anything derived from them is computed
    // above; see the note on the regex match.
  }, [value, duration]);

  /* aria-label carries the real figure so a screen reader announces "100+"
     once, not every intermediate number as the count runs. */
  return (
    <span ref={ref} aria-label={value}>
      <span aria-hidden="true">{shown}</span>
    </span>
  );
}

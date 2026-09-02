'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Handles scrolling on every page change.
 *
 * - Plain link (no #)      -> jump to the top of the new page
 * - Link with # (anchor)   -> scroll down to that section and highlight it
 *
 * Next's next/navigation has no hook for the URL fragment (it never reaches
 * the server, so the router doesn't track it) — read window.location.hash
 * directly instead, same as the old react-router version read useLocation().hash.
 *
 * Note: getElementById is used rather than querySelector because several ids
 * start with a number (e.g. "2d-floor-plans"), which querySelector rejects.
 */
export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    const hash = window.location.hash;

    if (hash) {
      const id = decodeURIComponent(hash.slice(1));

      // the target may render a moment after the route changes, so retry briefly
      let tries = 0;
      const findAndScroll = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          el.classList.add('is-highlighted');
          window.setTimeout(() => el.classList.remove('is-highlighted'), 2400);
          return;
        }
        if (tries < 10) {
          tries += 1;
          window.setTimeout(findAndScroll, 60);
        }
      };
      findAndScroll();
      return;
    }

    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return null;
}

import { lazy } from 'react';

const RELOAD_FLAG = 'sb.chunkReload';

/**
 * React.lazy for a page or big component, loaded only when first needed.
 *
 * After a new version of the site is deployed, a browser tab that was left
 * open still points at the old file names, and loading one of them fails.
 * The first time that happens the page reloads itself once to pick up the new
 * version; if it fails again the error is passed on as usual.
 */
export default function lazyPage(factory) {
  return lazy(async () => {
    try {
      const mod = await factory();
      try {
        sessionStorage.removeItem(RELOAD_FLAG);
      } catch {
        /* storage unavailable - nothing to clear */
      }
      return mod;
    } catch (err) {
      let alreadyReloaded = true;
      try {
        alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG) === '1';
        if (!alreadyReloaded) sessionStorage.setItem(RELOAD_FLAG, '1');
      } catch {
        /* storage unavailable - do not risk a reload loop */
      }
      if (!alreadyReloaded) {
        window.location.reload();
        // keep React waiting while the browser reloads
        return new Promise(() => {});
      }
      throw err;
    }
  });
}

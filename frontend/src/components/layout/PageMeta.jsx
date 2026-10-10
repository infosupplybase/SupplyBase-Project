import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { resolveMeta, SITE_URL } from '../../data/seo';

/** Finds a <meta>/<link> in <head> by selector, creating it when missing. */
function headTag(selector, create) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
}

function setMeta(attr, key, content) {
  headTag(`meta[${attr}="${key}"]`, () => {
    const m = document.createElement('meta');
    m.setAttribute(attr, key);
    return m;
  }).setAttribute('content', content);
}

/**
 * Keeps the tab title, description, canonical address and robots flag in step
 * with the page being shown. The site is a single-page app, so without this
 * every address would carry the home page's title and canonical link.
 * Renders nothing.
 */
export default function PageMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = resolveMeta(pathname);

    document.title = meta.title;
    setMeta('name', 'description', meta.description);

    headTag('link[rel="canonical"]', () => {
      const l = document.createElement('link');
      l.setAttribute('rel', 'canonical');
      return l;
    }).setAttribute('href', meta.canonical || SITE_URL + '/');

    setMeta('property', 'og:title', meta.title);
    setMeta('property', 'og:description', meta.description);
    setMeta('property', 'og:url', meta.canonical || SITE_URL + '/');
    setMeta('name', 'twitter:title', meta.title);
    setMeta('name', 'twitter:description', meta.description);
    const image = SITE_URL + (meta.image || '/assets/brand/logo-full.jpg');
    setMeta('property', 'og:image', image);
    setMeta('name', 'twitter:image', image);

    const robots = document.head.querySelector('meta[name="robots"]');
    if (meta.noindex) {
      setMeta('name', 'robots', 'noindex, follow');
    } else if (robots) {
      robots.remove();
    }
  }, [pathname]);

  return null;
}

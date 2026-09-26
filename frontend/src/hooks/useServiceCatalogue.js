import { useEffect, useState } from 'react';
import api, { friendlyError } from '../lib/api';

/**
 * The list of top-level services, from the live catalogue
 * (GET /api/catalogue/services) — the one source of truth for what we offer.
 *
 * Every place that lists services (home tiles, /services, footer, mobile
 * menu, quote form) reads it through this hook, so they always show the same
 * services in the same order. The request is made once per page load and
 * shared: components that mount at the same time, or later, reuse it instead
 * of each firing their own.
 *
 * `fallback` is what to show until the catalogue arrives (or if it can't be
 * reached) — pass the static list for navigation that must never be empty,
 * omit it for sections that should show a loading state instead.
 */
let cached = null;
let inflight = null;

function load() {
  if (cached) return Promise.resolve(cached);

  if (!inflight) {
    inflight = api
      .services()
      .then((list) => {
        cached = list.filter((service) => service.active !== false);
        return cached;
      })
      .finally(() => {
        // Clear on failure too, so a later mount retries instead of
        // being stuck on a rejected promise.
        inflight = null;
      });
  }

  return inflight;
}

export default function useServiceCatalogue(fallback = null) {
  const [services, setServices] = useState(cached);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cached) {
      setServices(cached);
      return undefined;
    }

    let cancelled = false;

    load()
      .then((list) => {
        if (!cancelled) setServices(list);
      })
      .catch((err) => {
        if (!cancelled) setError(friendlyError(err));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    services: services || fallback,
    loading: !services && !error,
    error,
  };
}

/**
 * Where a top-level service lives. Interior by Choice has its own browse-
 * then-book page; every other service is at /services/<slug>.
 */
export function serviceRoute(slug) {
  return slug === 'interior-by-choice' ? '/interior-by-choice' : `/services/${slug}`;
}

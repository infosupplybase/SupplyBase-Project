import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * A filter kept in the URL (?status=CONFIRMED) instead of component state, so
 * a filtered list can be linked to from the dashboard, bookmarked, shared with
 * a colleague, and survives a page refresh. Setting it to '' removes it.
 * Changing a filter also drops ?page, which would otherwise point past the
 * end of the new, shorter list.
 */
export default function useQueryParam(name, fallback = '') {
  const [params, setParams] = useSearchParams();
  const value = params.get(name) ?? fallback;

  const setValue = useCallback(
    (next) => {
      setParams(
        (current) => {
          const updated = new URLSearchParams(current);
          if (next === '' || next == null) updated.delete(name);
          else updated.set(name, next);
          if (name !== 'page') updated.delete('page');
          return updated;
        },
        { replace: true }
      );
    },
    [name, setParams]
  );

  return [value, setValue];
}

/** The same, for a 0-based page number. */
export function usePageParam() {
  const [raw, setRaw] = useQueryParam('page', '');
  const page = Math.max(0, Number.parseInt(raw, 10) || 0);
  const setPage = useCallback((next) => setRaw(next > 0 ? String(next) : ''), [setRaw]);
  return [page, setPage];
}

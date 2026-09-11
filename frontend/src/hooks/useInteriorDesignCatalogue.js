import { useEffect, useState } from 'react';
import api, { friendlyError } from '../lib/api';

/**
 * Fetches the interior-design category's live form once
 * (GET /api/catalogue/services/interior-design/form) — only the category's
 * own fields (visitFeeDisplay) are used; the catalogue itself
 * (projects/packages/styles) lives in interiorDesignContent.js, same split
 * as Waterproofing/POP Ceiling.
 */
export default function useInteriorDesignCatalogue() {
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .serviceForm('interior-design')
      .then((result) => {
        if (!cancelled) setCategory(result.category);
      })
      .catch((err) => {
        if (!cancelled) setError(friendlyError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { category, loading, error };
}

import { useEffect, useMemo, useState } from 'react';
import api, { friendlyError } from '../lib/api';

/**
 * Fetches the pop-ceiling-design category's live form once
 * (GET /api/catalogue/services/pop-ceiling-design/form) and exposes it by
 * question key — same pattern as usePaintingCatalogue, without the
 * tier/colour grouping helpers POP doesn't need. Names, hints (including
 * the add-ons' "₹X / sq. ft." rate text) and option lists all come from
 * here — see V16's migration comment on why no option carries a numeric
 * price_paise.
 */
export default function usePopCeilingCatalogue() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .serviceForm('pop-ceiling-design')
      .then((result) => {
        if (!cancelled) setForm(result);
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

  const byKey = useMemo(() => {
    const map = new Map();
    (form?.questions || []).forEach((q) => map.set(q.key, q));
    return map;
  }, [form]);

  const optionsFor = (questionKey) => byKey.get(questionKey)?.options || [];

  return {
    category: form?.category,
    loading,
    error,
    optionsFor,
  };
}

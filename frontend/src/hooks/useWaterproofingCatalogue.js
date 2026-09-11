import { useEffect, useMemo, useState } from 'react';
import api, { friendlyError } from '../lib/api';

/**
 * Fetches the waterproofing category's live form once
 * (GET /api/catalogue/services/waterproofing/form) and exposes it by
 * question key, plus rate rows grouped by brand (option.group) — same
 * pattern as usePaintingCatalogue's colour-tab grouping. See V17's
 * migration comment on why every rate row's price is null (text-only
 * ranges, no measured area to compute a real total from).
 */
export default function useWaterproofingCatalogue() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .serviceForm('waterproofing')
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

  /** Rate rows for a question key, grouped by option.group (a brand label,
      or Overhead Tank/Underground Sump for the water tank flow). */
  const ratesByGroup = (questionKey) => {
    const byGroup = new Map();
    optionsFor(questionKey).forEach((opt) => {
      const group = opt.group || 'Dr. Fixit';
      if (!byGroup.has(group)) byGroup.set(group, []);
      byGroup.get(group).push(opt);
    });
    return byGroup;
  };

  return {
    category: form?.category,
    loading,
    error,
    optionsFor,
    ratesByGroup,
  };
}

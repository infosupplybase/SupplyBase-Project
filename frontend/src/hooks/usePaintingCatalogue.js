import { useEffect, useMemo, useState } from 'react';
import api, { friendlyError } from '../lib/api';

/**
 * Fetches the painting category's live form once
 * (GET /api/catalogue/services/painting/form) and exposes it by question
 * key, plus grouped-by-tab colour swatches. Every flow's PaintingFlow page
 * reads from this one hook — names, descriptions and prices all come from
 * here, nothing is duplicated into frontend data files (see V15 migration).
 */
export default function usePaintingCatalogue() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .serviceForm('painting')
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

  /** Product options for a question key, grouped by tier (option_group). */
  const productsByTier = (questionKey) => {
    const byTier = new Map();
    optionsFor(questionKey).forEach((opt) => {
      const tier = opt.group || 'Premium';
      if (!byTier.has(tier)) byTier.set(tier, []);
      byTier.get(tier).push(opt);
    });
    return byTier;
  };

  /** Colour options for a question key, grouped by tab (option_group), each
      carrying its preview hex from option.hint (see V15's colour rows). */
  const coloursByTab = (questionKey) => {
    const byTab = new Map();
    optionsFor(questionKey).forEach((opt) => {
      const tab = opt.group || 'Popular';
      if (!byTab.has(tab)) byTab.set(tab, []);
      byTab.get(tab).push({ ...opt, hex: opt.hint || '#E5E5E5' });
    });
    return byTab;
  };

  return {
    category: form?.category,
    loading,
    error,
    optionsFor,
    productsByTier,
    coloursByTab,
  };
}

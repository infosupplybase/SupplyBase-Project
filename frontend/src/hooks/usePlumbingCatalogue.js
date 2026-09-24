import { useEffect, useMemo, useState } from 'react';
import api, { friendlyError } from '../lib/api';
import { plumbingTabs, PLUMBING_ITEM_HOME } from '../data/plumbingContent';

/**
 * Shows each service once. Items are matched on their name (so "Health
 * Faucet Installation" is caught even where it carries a different catalogue
 * value on another tab); of the repeats, the one under its designated home
 * tab (PLUMBING_ITEM_HOME) is kept, otherwise the first. Order is preserved.
 */
export function dedupeItems(options) {
  const chosen = new Map();
  const isAtHome = (opt) => PLUMBING_ITEM_HOME[opt.value] === opt.group;

  options.forEach((opt) => {
    const key = opt.label.trim().toLowerCase();
    const current = chosen.get(key);
    if (!current || (isAtHome(opt) && !isAtHome(current))) {
      chosen.set(key, opt);
    }
  });

  return options.filter((opt) => chosen.get(opt.label.trim().toLowerCase()) === opt);
}

/**
 * Fetches the plumbing category's live form (GET /api/catalogue/services/plumbing/form)
 * once and reshapes its two question groups — 'cart_item' (grouped by tab)
 * and 'consultation_type' — into what the plumbing pages actually need.
 * Names, descriptions and prices all come from here; nothing is duplicated
 * into frontend data files, so the catalogue stays the single source of truth.
 */
export default function usePlumbingCatalogue() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .serviceForm('plumbing')
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

  const tabs = useMemo(() => {
    const cartQuestion = form?.questions.find((q) => q.key === 'cart_item');
    const byGroup = new Map();
    dedupeItems(cartQuestion?.options || []).forEach((opt) => {
      const group = opt.group || 'Other';
      if (!byGroup.has(group)) byGroup.set(group, []);
      byGroup.get(group).push(opt);
    });
    return plumbingTabs.map((tab) => {
      const items = byGroup.get(tab.group) || [];
      return {
        ...tab,
        items,
        fromPrice: items.length ? Math.min(...items.map((i) => i.price)) : null,
      };
    });
  }, [form]);

  const consultationTypes = useMemo(() => {
    const q = form?.questions.find((q2) => q2.key === 'consultation_type');
    return q?.options || [];
  }, [form]);

  const getTab = (slug) => tabs.find((t) => t.slug === slug);
  const findItem = (itemSlug) => {
    for (const tab of tabs) {
      const found = tab.items.find((i) => i.value === itemSlug);
      if (found) return { ...found, group: tab.group };
    }
    return null;
  };

  return {
    category: form?.category,
    tabs,
    consultationTypes,
    getTab,
    findItem,
    loading,
    error,
  };
}

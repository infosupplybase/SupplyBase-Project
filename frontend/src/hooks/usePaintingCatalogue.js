import { useEffect, useMemo, useState } from 'react';
import api, { friendlyError } from '../lib/api';

let cachedForm = null;
let pendingRequest = null;

function loadPaintingForm() {
  if (cachedForm) {
    return Promise.resolve(cachedForm);
  }

  if (!pendingRequest) {
    pendingRequest = api.serviceForm('painting')
      .then((result) => {
        cachedForm = result;
        return result;
      })
      .finally(() => {
        pendingRequest = null;
      });
  }

  return pendingRequest;
}

export default function usePaintingCatalogue() {
  const [form, setForm] = useState(() => cachedForm);
  const [loading, setLoading] = useState(() => !cachedForm);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    loadPaintingForm()
      .then((result) => {
        if (cancelled) return;
        setForm(result);
        setError('');
      })
      .catch((err) => {
        if (!cancelled) {
          setError(friendlyError(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const byKey = useMemo(() => {
    const map = new Map();

    (form?.questions || []).forEach((question) => {
      map.set(question.key, question);
    });

    return map;
  }, [form]);

  const optionsFor = (questionKey) =>
    byKey.get(questionKey)?.options || [];

  const productsByTier = (questionKey) => {
    const byTier = new Map();
    // Each product question has its own server-side options, so a product
    // picked for Full Home must not be offered under Few Walls.
    const options = optionsFor(questionKey);

    const seen = new Set();

    options.forEach((option) => {
      if (seen.has(option.value)) return;
      seen.add(option.value);

      const tier = option.group || 'Premium';

      if (!byTier.has(tier)) {
        byTier.set(tier, []);
      }

      byTier.get(tier).push(option);
    });

    return byTier;
  };

  const coloursByTab = (questionKey) => {
    const byTab = new Map();

    optionsFor(questionKey).forEach((option) => {
      const tab = option.group || 'Popular';

      if (!byTab.has(tab)) {
        byTab.set(tab, []);
      }

      byTab.get(tab).push({
        ...option,
        hex: option.hint || '#E5E5E5',
      });
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
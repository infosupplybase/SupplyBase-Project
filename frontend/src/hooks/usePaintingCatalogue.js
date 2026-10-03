import { useEffect, useMemo, useState } from 'react';
import api, { friendlyError } from '../lib/api';

let cachedForm = null;
let pendingRequest = null;

function loadPaintingForm() {
  if (cachedForm) return Promise.resolve(cachedForm);

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
    (form?.questions || []).forEach((question) => {
      map.set(question.key, question);
    });
    return map;
  }, [form]);

  const priceIndex = useMemo(() => {
    const map = new Map();

    (form?.productPrices || []).forEach((entry) => {
      const key = JSON.stringify([
        entry.flowKey,
        entry.paintingType,
        entry.brand,
        entry.homeType,
        entry.productValue,
      ]);

      map.set(key, entry.price);
    });

    return map;
  }, [form]);

  const optionsFor = (questionKey) =>
    byKey.get(questionKey)?.options || [];

  const productsByTier = (questionKey, selections = {}) => {
    const byTier = new Map();
    const sharedQuestions = [
      'full_home_product',
      'few_walls_product',
    ];

    // Full Home now has its own registered Economy and Premium products.
    const options = optionsFor(questionKey);

    const seen = new Set();

    options.forEach((option) => {
      const productBrand = option.value.startsWith('berger-')
        ? 'berger'
        : 'asian-paints';

      if (
        sharedQuestions.includes(questionKey) &&
        selections.paint_brand !== productBrand
      ) {
        return;
      }

      if (seen.has(option.value)) return;
      seen.add(option.value);

      let price = option.price;

      if (sharedQuestions.includes(questionKey)) {
        const fewWalls = questionKey === 'few_walls_product';
        const ceiling = fewWalls &&
          selections.few_walls_area === 'ceiling-paint';

        const key = JSON.stringify([
          questionKey,
          fewWalls ? (ceiling ? 'ceiling-painting' : 'wall-painting') : selections.full_home_painting_type,
          selections.paint_brand,
          fewWalls ? (ceiling ? selections.few_walls_ceiling_type : selections.few_walls_area) : selections.home_type,
          option.value,
        ]);

        price = priceIndex.get(key) ?? null;
      }

      const tier = option.group || 'Premium';
      if (!byTier.has(tier)) byTier.set(tier, []);

      byTier.get(tier).push({
        ...option,
        price,
      });
    });

    return byTier;
  };

  const coloursByTab = (questionKey) => {
    const byTab = new Map();

    optionsFor(questionKey).forEach((option) => {
      const tab = option.group || 'Popular';
      if (!byTab.has(tab)) byTab.set(tab, []);

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
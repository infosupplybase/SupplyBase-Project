import { useEffect, useMemo, useState } from 'react';
import api, { friendlyError } from '../lib/api';

let cachedCatalogue = null;
let pendingRequest = null;

function loadPopCeilingCatalogue() {
  if (cachedCatalogue) {
    return Promise.resolve(cachedCatalogue);
  }

  if (!pendingRequest) {
    const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

    pendingRequest = Promise.all([
      api.serviceForm('pop-ceiling-design'),
      fetch(
        `${baseUrl}/api/catalogue/services/pop-ceiling-design/starting-prices`
      ).then(async (response) => {
        if (!response.ok) {
          throw new Error('Unable to load POP starting prices. Please try again.');
        }
        const prices = await response.json();
        if (!Array.isArray(prices)) {
          throw new Error('Unexpected POP pricing response.');
        }
        return prices;
      }),
    ])
      .then(([form, prices]) => {
        cachedCatalogue = { form, prices };
        return cachedCatalogue;
      })
      .finally(() => {
        pendingRequest = null;
      });
  }

  return pendingRequest;
}

export default function usePopCeilingCatalogue() {
  const [catalogue, setCatalogue] = useState(() => cachedCatalogue);
  const [loading, setLoading] = useState(() => !cachedCatalogue);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    loadPopCeilingCatalogue()
      .then((result) => {
        if (!cancelled) {
          setCatalogue(result);
          setError('');
        }
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
    (catalogue?.form?.questions || []).forEach((question) => {
      map.set(question.key, question);
    });
    return map;
  }, [catalogue]);

  const pricesBySelection = useMemo(() => {
    const map = new Map();
    (catalogue?.prices || []).forEach((row) => {
      map.set(`${row.homeType}:${row.ceilingType}`, row.pricePaise);
    });
    return map;
  }, [catalogue]);

  const optionsFor = (questionKey) =>
    byKey.get(questionKey)?.options || [];

  const startingPriceFor = (homeType, ceilingType) =>
    pricesBySelection.get(`${homeType}:${ceilingType}`) ??
    pricesBySelection.get(`${homeType}:*`) ??
    null;

  return {
    category: catalogue?.form?.category,
    loading,
    error,
    optionsFor,
    startingPriceFor,
  };
}

import { useEffect, useMemo, useState } from 'react';
import api, { friendlyError } from '../lib/api';

let cachedForm = null;
let pendingRequest = null;

function loadPopCeilingForm() {
  if (cachedForm) {
    return Promise.resolve(cachedForm);
  }

  if (!pendingRequest) {
    pendingRequest = api
      .serviceForm('pop-ceiling-design')
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

export default function usePopCeilingCatalogue() {
  const [form, setForm] = useState(() => cachedForm);
  const [loading, setLoading] = useState(() => !cachedForm);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    loadPopCeilingForm()
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

  return {
    category: form?.category,
    loading,
    error,
    optionsFor,
  };
}
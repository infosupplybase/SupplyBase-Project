import { useCallback, useEffect, useState } from 'react';

/**
 * The customer's saved visit addresses ("Home", "Site - Palava"), kept in
 * this browser so the next booking is one tap. Each entry:
 * { id, label, address, latitude, longitude, city, pincode }.
 */
const STORAGE_KEY = 'sb.savedAddresses';
const CHANGED = 'supplybase:saved-addresses-changed';
export const MAX_SAVED_ADDRESSES = 10;

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((a) => a && a.id && a.address && a.latitude != null && a.longitude != null)
      : [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Storage disabled/private browsing: the list lasts for this visit only.
  }
  window.dispatchEvent(new Event(CHANGED));
}

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** Same point (to ~1 m), so a saved entry can be matched to the current pin. */
export const samePlace = (a, b) =>
  Boolean(a && b) &&
  Math.abs(Number(a.latitude) - Number(b.latitude)) < 1e-5 &&
  Math.abs(Number(a.longitude) - Number(b.longitude)) < 1e-5;

export function useSavedAddresses() {
  const [list, setList] = useState(read);

  useEffect(() => {
    const sync = () => setList(read());
    window.addEventListener(CHANGED, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGED, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  /** Adds (no id) or updates (id) an entry; returns the stored entry. */
  const save = useCallback((entry) => {
    const current = read();
    const stored = { ...entry, id: entry.id || newId() };
    const next = entry.id && current.some((a) => a.id === entry.id)
      ? current.map((a) => (a.id === entry.id ? stored : a))
      : [stored, ...current].slice(0, MAX_SAVED_ADDRESSES);
    write(next);
    setList(next);
    return stored;
  }, []);

  const remove = useCallback((id) => {
    const next = read().filter((a) => a.id !== id);
    write(next);
    setList(next);
  }, []);

  return { addresses: list, save, remove };
}

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * The customer's saved visit addresses ("Home", "Site - Palava"), kept in
 * this browser so the next booking is one tap. Each entry:
 * { id, label, address, latitude, longitude, city, pincode }.
 *
 * A signed-in customer's list is kept under their own user id, so another
 * account on the same browser never sees it. Addresses saved before signing
 * in (the guest list) move into the account on the next sign-in, and the
 * guest list is cleared on sign-out.
 */
const GUEST_KEY = 'sb.savedAddresses';
const CHANGED = 'supplybase:saved-addresses-changed';
export const MAX_SAVED_ADDRESSES = 10;

const keyFor = (userId) => (userId ? `${GUEST_KEY}.${userId}` : GUEST_KEY);

function read(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((a) => a && a.id && a.address && a.latitude != null && a.longitude != null)
      : [];
  } catch {
    return [];
  }
}

function write(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // Storage disabled/private browsing: the list lasts for this visit only.
  }
  window.dispatchEvent(new Event(CHANGED));
}

/** Forgets the guest list; called on sign-out. */
export function clearGuestAddresses() {
  try {
    localStorage.removeItem(GUEST_KEY);
  } catch {
    // Storage disabled.
  }
  window.dispatchEvent(new Event(CHANGED));
}

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** Same point (to ~1 m), so a saved entry can be matched to the current pin. */
export const samePlace = (a, b) =>
  Boolean(a && b) &&
  Math.abs(Number(a.latitude) - Number(b.latitude)) < 1e-5 &&
  Math.abs(Number(a.longitude) - Number(b.longitude)) < 1e-5;

/** Moves the guest list into the account's list, skipping places it already has. */
function adoptGuestList(key) {
  const guest = read(GUEST_KEY);
  if (guest.length === 0) return;
  const own = read(key);
  const extra = guest.filter((g) => !own.some((a) => samePlace(a, g)));
  write(key, [...own, ...extra].slice(0, MAX_SAVED_ADDRESSES));
  try {
    localStorage.removeItem(GUEST_KEY);
  } catch {
    // Storage disabled.
  }
}

export class SavedAddressesFullError extends Error {
  constructor() {
    super(
      `You can keep up to ${MAX_SAVED_ADDRESSES} addresses. Delete one you no longer use to add this one.`
    );
  }
}

export function useSavedAddresses() {
  const { user, loading } = useAuth();
  const key = keyFor(user?.id);
  const [list, setList] = useState(() => read(key));

  useEffect(() => {
    if (user?.id) adoptGuestList(key);
    const sync = () => setList(read(key));
    sync();
    window.addEventListener(CHANGED, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGED, sync);
      window.removeEventListener('storage', sync);
    };
  }, [key, user?.id]);

  /**
   * Adds (no id) or updates (id) an entry; returns the stored entry. Saving a
   * place that is already in the list updates that entry instead of adding a
   * second one. Throws SavedAddressesFullError when a new place would make
   * more than MAX_SAVED_ADDRESSES.
   */
  const save = useCallback(
    (entry) => {
      const current = read(key);
      const editing = entry.id && current.some((a) => a.id === entry.id);
      const twin = current.find((a) => a.id !== entry.id && samePlace(a, entry));

      if (editing) {
        const stored = { ...entry };
        // Moving an entry onto another saved place merges the two.
        const next = current
          .filter((a) => a.id !== twin?.id)
          .map((a) => (a.id === entry.id ? stored : a));
        write(key, next);
        setList(next);
        return stored;
      }

      if (twin) {
        const stored = { ...twin, ...entry, id: twin.id };
        const next = [stored, ...current.filter((a) => a.id !== twin.id)];
        write(key, next);
        setList(next);
        return stored;
      }

      if (current.length >= MAX_SAVED_ADDRESSES) throw new SavedAddressesFullError();
      const stored = { ...entry, id: newId() };
      const next = [stored, ...current];
      write(key, next);
      setList(next);
      return stored;
    },
    [key]
  );

  const remove = useCallback(
    (id) => {
      const next = read(key).filter((a) => a.id !== id);
      write(key, next);
      setList(next);
    },
    [key]
  );

  // While sign-in is still being checked the account's list isn't known yet.
  return { addresses: loading ? [] : list, save, remove };
}

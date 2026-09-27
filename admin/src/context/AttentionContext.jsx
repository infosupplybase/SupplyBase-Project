import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../lib/api';

/**
 * How many things are waiting on staff right now — the numbers on the sidebar
 * badges and the dashboard's "Needs your attention" cards.
 *
 * There is no summary endpoint, so each number is the `totalElements` of a
 * one-row page of that filtered list (or the partner counts endpoint). It is
 * refreshed when staff move between pages (at most every 20 seconds) and
 * straight after a save, via `refresh()`.
 */
const AttentionContext = createContext({ counts: null, refresh: () => {} });

const total = (page) => (page ? page.totalElements : 0);

async function fetchCounts() {
  const [newEnquiries, paymentPending, requested, confirmed, assignmentPending, partners] =
    await Promise.all([
      api.admin.enquiries.list({ status: 'NEW', size: 1 }),
      api.admin.bookings.list({ status: 'PAYMENT_PENDING', size: 1 }),
      api.admin.bookings.list({ status: 'BOOKING_REQUESTED', size: 1 }),
      api.admin.bookings.list({ status: 'CONFIRMED', size: 1 }),
      api.admin.bookings.list({ status: 'ASSIGNMENT_PENDING', size: 1 }),
      api.admin.partners.counts(),
    ]);

  const toConfirm = total(paymentPending) + total(requested);
  const needPartner = total(confirmed) + total(assignmentPending);

  return {
    newEnquiries: total(newEnquiries),
    paymentPending: total(paymentPending),
    requested: total(requested),
    toConfirm,
    confirmed: total(confirmed),
    assignmentPending: total(assignmentPending),
    needPartner,
    pendingPartners: partners.PENDING || 0,
    partnerCounts: partners,
    bookingsNeedingAction: toConfirm + needPartner,
    checkedAt: Date.now(),
  };
}

export function AttentionProvider({ children }) {
  const [counts, setCounts] = useState(null);
  const location = useLocation();
  const lastFetch = useRef(0);
  const inFlight = useRef(null);

  const refresh = useCallback(() => {
    if (inFlight.current) return inFlight.current;
    inFlight.current = fetchCounts()
      .then((c) => {
        lastFetch.current = Date.now();
        setCounts(c);
        return c;
      })
      .catch(() => null) // a badge failing to load must never break a page
      .finally(() => {
        inFlight.current = null;
      });
    return inFlight.current;
  }, []);

  useEffect(() => {
    if (Date.now() - lastFetch.current > 20000) refresh();
  }, [location.pathname, refresh]);

  const value = useMemo(() => ({ counts, refresh }), [counts, refresh]);
  return <AttentionContext.Provider value={value}>{children}</AttentionContext.Provider>;
}

export const useAttention = () => useContext(AttentionContext);

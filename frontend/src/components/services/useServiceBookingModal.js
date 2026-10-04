import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Opens the "Book a service" modal, shared by every page that lets someone
 * pick a service and book it: the Services page's own grid and the
 * homepage's Popular Services tiles both render this component so the
 * booking flow is identical (same catalogue, same steps) no matter which
 * page you started from.
 *
 * Usage: const booking = useServiceBookingModal(); ... onClick={() =>
 * booking.open(service)} ... {booking.service && <ServiceBookingModal
 * key={booking.openToken} service={booking.service} onClose={booking.close}
 * />}
 *
 * Which screen the booking is on lives in the browser's history (see
 * hooks/useHistoryState): opening it and every screen inside it are history
 * entries, so the browser's Back button goes back one screen (and closes the
 * booking from its first screen) and a refresh reopens it where it was.
 * `key={booking.openToken}` still remounts the modal fresh for each new
 * booking, so a half-finished sub-flow never leaks into the next one.
 */
export function useServiceBookingModal() {
  const location = useLocation();
  const navigate = useNavigate();
  const entry = (location.state && location.state.bookingModal) || null;

  return {
    service: entry ? entry.service : null,
    // Stable for as long as this booking is open (every screen inside it
    // shares the entry it was opened from), new for the next one.
    openToken: entry ? entry.base : 0,
    open: (nextService) => {
      const base = (window.history.state && window.history.state.idx) || 0;
      const usr = (window.history.state && window.history.state.usr) || {};
      const { pathname, search, hash } = window.location;
      // A history entry of its own: Back closes the booking instead of
      // leaving the page, and a refresh reopens it where it was.
      navigate(
        { pathname, search, hash },
        { state: { ...stripBooking(usr), bookingModal: { service: nextService, base }, __formPush: true } }
      );
    },
    close: () => {
      const idx = window.history.state && window.history.state.idx;
      const base = entry && entry.base;
      if (typeof idx === 'number' && typeof base === 'number' && idx > base) {
        // Unwind every screen of this booking in one go, back to the page
        // as it was before it opened.
        navigate(base - idx);
      } else {
        const usr = (window.history.state && window.history.state.usr) || {};
        const { pathname, search, hash } = window.location;
        navigate({ pathname, search, hash }, { replace: true, state: stripBooking(usr) });
      }
    },
  };
}

/** The history state with this booking's screens and forms removed. */
function stripBooking(usr) {
  const out = {};
  Object.keys(usr).forEach((k) => {
    if (k !== 'bookingModal' && k !== '__formPush' && !k.startsWith('bm:') && !k.startsWith('f:')) out[k] = usr[k];
  });
  return out;
}

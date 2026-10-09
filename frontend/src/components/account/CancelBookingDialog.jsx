import { useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon';
import api, { friendlyError } from '../../lib/api';
import { formatRupees } from '../../lib/money';

const MAX_REASON = 250;

/**
 * "Cancel this booking?" — the confirm step before a customer cancels their
 * own booking, with an optional reason. Same look and keyboard handling as
 * ConfirmLogoutDialog (centred card, bottom sheet on phones, Esc or backdrop
 * tap closes). Focus starts on "Keep booking" so a stray Enter cancels nothing.
 *
 * Calls the API itself and hands the updated booking to onCancelled.
 */
export default function CancelBookingDialog({ booking, onCancelled, onClose }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const keepRef = useRef(null);
  const dialogRef = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  const busyRef = useRef(busy);
  busyRef.current = busy;

  const open = Boolean(booking);

  useEffect(() => {
    if (!open) return undefined;
    setReason('');
    setError('');
    const previous = document.activeElement;
    keepRef.current?.focus();
    const lock = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (event) => {
      if (event.key === 'Escape' && !busyRef.current) close.current();
      if (event.key === 'Tab' && dialogRef.current) {
        const items = dialogRef.current.querySelectorAll('textarea, button:not([disabled])');
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = lock;
      const target = previous && previous.isConnected ? previous : document.body;
      if (target && target.focus) target.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      const updated = await api.cancelBooking(booking.id, reason);
      onCancelled(updated);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="confirm-logout-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        ref={dialogRef}
        className="confirm-logout-dialog cancel-booking-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cancel-booking-title"
        aria-describedby="cancel-booking-body"
      >
        <span className="confirm-logout-icon cancel-booking-icon" aria-hidden="true">
          <Icon name="close" size={26} />
        </span>
        <h2 id="cancel-booking-title">Cancel booking?</h2>
        <p id="cancel-booking-body">
          {booking.serviceLabel || 'This booking'}
          {booking.bookingNumber ? ` (${booking.bookingNumber})` : ''} will be cancelled and your visit
          slot released. This cannot be undone.
          {booking.paidAt && (
            <>
              {' '}
              You paid {formatRupees(booking.visitFeePaise / 100)} online; our team will refund it to your
              original payment method.
            </>
          )}
        </p>

        <div className="field cancel-booking-reason">
          <label htmlFor="cancel-booking-reason">Reason (optional)</label>
          <textarea
            id="cancel-booking-reason"
            rows={3}
            maxLength={MAX_REASON}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Plans changed, booked by mistake"
            disabled={busy}
          />
        </div>

        {error && (
          <p role="alert" className="field-error cancel-booking-error">
            {error}
          </p>
        )}

        <div className="confirm-logout-actions">
          <button ref={keepRef} type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>
            Keep booking
          </button>
          <button type="button" className="btn btn-primary cancel-booking-confirm" onClick={confirm} disabled={busy}>
            {busy ? 'Cancelling…' : 'Yes, cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}

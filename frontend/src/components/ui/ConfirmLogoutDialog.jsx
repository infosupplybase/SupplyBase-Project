import { useEffect, useRef } from 'react';
import Icon from './Icon';

/**
 * "Are you sure you want to log out?" — a branded confirmation dialog that
 * replaces a bare `window.confirm()`. Centred card on desktop, bottom sheet
 * on phones. Esc or backdrop tap cancels; focus starts on Cancel so an
 * accidental Enter-tap does not sign the user out.
 */
export default function ConfirmLogoutDialog({ open, onConfirm, onCancel }) {
  const cancelRef = useRef(null);
  const dialogRef = useRef(null);
  const cancel = useRef(onCancel);
  cancel.current = onCancel;

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    cancelRef.current?.focus();
    const lock = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (event) => {
      if (event.key === 'Escape') cancel.current();
      if (event.key === 'Tab' && dialogRef.current) {
        const items = dialogRef.current.querySelectorAll('button:not([disabled])');
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

  return (
    <div
      className="confirm-logout-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        ref={dialogRef}
        className="confirm-logout-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-logout-title"
        aria-describedby="confirm-logout-body"
      >
        <span className="confirm-logout-icon" aria-hidden="true">
          <Icon name="log-out" size={26} />
        </span>
        <h2 id="confirm-logout-title">Log out?</h2>
        <p id="confirm-logout-body">
          Are you sure you want to log out of your account?
        </p>
        <div className="confirm-logout-actions">
          <button ref={cancelRef} type="button" className="btn btn-outline" onClick={onCancel}>
            No, stay
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm}>
            Yes, log out
          </button>
        </div>
      </div>
    </div>
  );
}

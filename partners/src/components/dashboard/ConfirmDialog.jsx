import { useEffect, useRef } from 'react';
import Icon from '../ui/Icon';

/**
 * "Are you sure?" before a step that cannot be taken back, in place of the
 * browser's confirm() box — which on a phone is small, unbranded and easy to
 * tap through. A centred card on a wide screen, a bottom sheet on a phone.
 *
 * Esc or a tap outside cancels; focus starts on Cancel so an accidental Enter
 * does not confirm, and returns to where it was when the dialog closes.
 */
export default function ConfirmDialog({ open, title, children, confirmLabel, busy, onConfirm, onCancel }) {
  const cancelRef = useRef(null);
  const dialogRef = useRef(null);
  // Held in a ref so a new onCancel each render does not re-run the effect
  // (which would move focus back to Cancel while the partner is using it).
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
      // Keep Tab inside the dialog.
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
      // The button that opened it may be gone (the job moved to Finished).
      const target = previous && previous.isConnected ? previous : document.getElementById('pp-main');
      if (target && target.focus) target.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="pp-dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div
        ref={dialogRef}
        className="pp-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="pp-dialog-title"
        aria-describedby="pp-dialog-body"
      >
        <span className="pp-dialog-icon" aria-hidden="true">
          <Icon name="check-circle" size={26} />
        </span>
        <h2 id="pp-dialog-title">{title}</h2>
        <div id="pp-dialog-body" className="pp-dialog-body">
          {children}
        </div>
        <div className="pp-dialog-actions">
          <button ref={cancelRef} type="button" className="btn btn-outline" onClick={onCancel} disabled={busy}>
            Not yet
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={busy}>
            {busy ? 'Saving…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

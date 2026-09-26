import { useEffect } from 'react';
import Icon from '../ui/Icon';

// Shared across every Drawer instance, since AdminCatalogue stacks a second
// drawer on top of the first — body scroll should only unlock once neither
// is open, not as soon as the top one closes.
let openDrawerCount = 0;

/**
 * Slide-over panel for viewing/editing one row without leaving the list.
 * Closes on Escape or a click on the backdrop, like any dialog is expected to.
 */
export default function Drawer({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Without this, the page behind a full-screen mobile drawer still
  // scrolls with it — disorienting on a touch device.
  useEffect(() => {
    if (!open) return undefined;
    openDrawerCount += 1;
    document.body.style.overflow = 'hidden';
    return () => {
      openDrawerCount = Math.max(0, openDrawerCount - 1);
      if (openDrawerCount === 0) document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="admin-drawer-backdrop" onClick={onClose}>
      <div
        className="admin-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="admin-drawer-head">
          <h3>{title}</h3>
          <button type="button" className="admin-drawer-close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="admin-drawer-body">{children}</div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon';

/**
 * There is no notifications backend yet (no entity, no endpoint, no unread
 * count anywhere in the API) — see the project inventory this was built
 * against. Rather than fake an unread dot, this opens an honest empty state
 * and connects for real the moment that feature exists.
 */
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="notif-bell" ref={ref}>
      <button
        type="button"
        className="notif-bell-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Notifications"
      >
        <Icon name="bell" size={19} />
      </button>

      {open && (
        <div className="notif-panel" role="dialog" aria-label="Notifications">
          <h4>Notifications</h4>
          <p>You have no notifications yet. Updates about your bookings will appear here.</p>
        </div>
      )}
    </div>
  );
}

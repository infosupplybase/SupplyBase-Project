import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Icon from './ui/Icon';

// How often the unread dot refreshes while the tab is open.
const UNREAD_POLL_MS = 60_000;

/**
 * The partner's notifications ("New booking assigned", "Booking cancelled").
 * Tapping one marks it read and scrolls to "Your jobs" on the dashboard.
 */
export default function NotificationBell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const result = await api.unreadNotificationCount();
        if (active) setUnread(Number(result?.count ?? 0));
      } catch {
        // The dot is a hint; a failed refresh keeps the last count.
      }
    };
    refresh();
    const id = window.setInterval(refresh, UNREAD_POLL_MS);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      active = false;
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    setLoading(true);
    setError('');
    api
      .notifications()
      .then((result) => {
        if (!active) return;
        const list = Array.isArray(result) ? result : [];
        setItems(list);
        setUnread(list.filter((n) => !n.read).length);
      })
      .catch((err) => active && setError(err.message || 'Could not load notifications.'))
      .finally(() => active && setLoading(false));

    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      active = false;
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const showJobs = () => {
    const scroll = () =>
      document.getElementById('pp-jobs-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (location.pathname === '/') scroll();
    else {
      navigate('/');
      window.setTimeout(scroll, 300);
    }
  };

  const openItem = async (item) => {
    setOpen(false);
    if (item.relatedBookingId) showJobs();
    if (item.read) return;
    try {
      await api.markNotificationRead(item.id);
      setItems((list) => list.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
      setUnread((count) => Math.max(0, count - 1));
    } catch {
      // Still unread; it will show as new next time.
    }
  };

  return (
    <div className="pp-bell" ref={ref}>
      <button
        type="button"
        className="pp-bell-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
      >
        <Icon name="bell" size={19} />
        {unread > 0 && <span className="pp-bell-dot" aria-hidden="true" />}
      </button>

      {open && (
        <div className="pp-bell-panel" role="dialog" aria-label="Notifications">
          <h4>Notifications</h4>
          {loading && <p>Loading notifications...</p>}
          {!loading && error && <p role="alert">{error}</p>}
          {!loading && !error && items.length === 0 && (
            <p>No notifications yet. New jobs and changes to your jobs will appear here.</p>
          )}
          {!loading && !error && items.length > 0 && (
            <div className="pp-bell-list">
              {items.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`pp-bell-item ${item.read ? 'is-read' : 'is-unread'}`}
                  onClick={() => openItem(item)}
                >
                  <strong>{item.title}</strong>
                  <span>{item.message}</span>
                  {!item.read && <em>New</em>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

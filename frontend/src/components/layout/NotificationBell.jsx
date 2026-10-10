import { useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

// How often the unread dot refreshes while a signed-in tab is open.
const UNREAD_POLL_MS = 60_000;

/**
 * Booking updates for the signed-in account. Visitors who are not signed in
 * see the empty state and never call the API.
 */
export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }
    let active = true;
    const loadUnreadCount = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const result = await api.getUnreadNotificationCount();
        if (active) setUnreadCount(Number(result?.count ?? 0));
      } catch {
        // The dot is a hint; a failed refresh just keeps the last count.
      }
    };
    loadUnreadCount();
    const intervalId = window.setInterval(loadUnreadCount, UNREAD_POLL_MS);
    document.addEventListener('visibilitychange', loadUnreadCount);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', loadUnreadCount);
    };
  }, [user]);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;

    if (user) {
      setLoading(true);
      setError('');
      api
        .getNotifications()
        .then((result) => {
          if (!active) return;
          const list = Array.isArray(result) ? result : [];
          setNotifications(list);
          setUnreadCount(list.filter((item) => !item.read).length);
        })
        .catch((err) => {
          if (active) setError(err.message || 'Could not load notifications.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }

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
  }, [open, user]);

  const markRead = async (notification) => {
    if (notification.read) return;
    try {
      await api.markNotificationAsRead(notification.id);
      setNotifications((items) =>
        items.map((item) => (item.id === notification.id ? { ...item, read: true } : item))
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err) {
      setError(err.message || 'Could not update notification.');
    }
  };

  return (
    <div className="notif-bell" ref={ref}>
      <button
        type="button"
        className="notif-bell-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      >
        <Icon name="bell" size={19} />
        {unreadCount > 0 && <span className="notif-badge" aria-hidden="true" />}
      </button>

      {open && (
        <div className="notif-panel" role="dialog" aria-label="Notifications">
          <h4>Notifications</h4>

          {loading && <p className="notif-loading">Loading notifications...</p>}

          {!loading && error && (
            <p className="notif-error" role="alert">{error}</p>
          )}

          {!loading && !error && notifications.length === 0 && (
            <p>You have no notifications yet. Updates about your bookings will appear here.</p>
          )}

          {!loading && !error && notifications.length > 0 && (
            <div className="notif-list">
              {notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  className={`notif-item ${notification.read ? 'is-read' : 'is-unread'}`}
                  onClick={() => markRead(notification)}
                >
                  <span className="notif-item-title">{notification.title}</span>
                  <span className="notif-item-message">{notification.message}</span>
                  {!notification.read && <span className="notif-item-status">New</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

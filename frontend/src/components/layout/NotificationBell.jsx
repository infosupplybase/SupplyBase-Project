
import { useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon';
import api from '../../lib/api';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef(null);

 
useEffect(() => {
  let active = true;

  const loadUnreadCount = async () => {
    try {
      const result = await api.getUnreadNotificationCount();

      if (active) {
        setUnreadCount(Number(result?.count ?? 0));
      }
    } catch (err) {
      console.error('Could not refresh unread notifications:', err);
    }
  };

  // Load count immediately
  loadUnreadCount();

  // Automatically refresh without reloading the page
  const intervalId = window.setInterval(loadUnreadCount, 5000);

  // Refresh when returning to the browser tab
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      loadUnreadCount();
    }
  };

  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    active = false;
    window.clearInterval(intervalId);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}, []);

  useEffect(() => {
    if (!open) return undefined;

    let active = true;

    const loadNotifications = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await api.getNotifications();
        if (!active) return;

        setNotifications(Array.isArray(result) ? result : []);
        setUnreadCount(
          Array.isArray(result)
            ? result.filter((item) => !item.read).length
            : 0
        );
      } catch (err) {
        if (active) {
          setError(err.message || 'Could not load notifications.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadNotifications();

    const onDocClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);

    return () => {
      active = false;
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleNotificationClick = async (notification) => {
    if (notification.read) return;

    try {
      await api.markNotificationAsRead(notification.id);

      setNotifications((items) =>
        items.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item
        )
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
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : 'Notifications'
        }
      >
        <Icon name="bell" size={19} />
       
{unreadCount > 0 && (
  <span
    className="notif-badge"
    aria-label={`${unreadCount} unread notifications`}
  />
)}

      </button>

      {open && (
        <div className="notif-panel" role="dialog" aria-label="Notifications">
          <h4>Notifications</h4>

          {loading && <p>Loading notifications...</p>}

          {!loading && error && (
            <p role="alert">{error}</p>
          )}

          {!loading && !error && notifications.length === 0 && (
            <p>
              You have no notifications yet. Updates about your bookings
              will appear here.
            </p>
          )}

          {!loading && !error && notifications.length > 0 && (
            <div className="notif-list">
              {notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  className={`notif-item ${
                    notification.read ? 'is-read' : 'is-unread'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <span className="notif-item-title">
                    {notification.title}
                  </span>
                  <span className="notif-item-message">
                    {notification.message}
                  </span>
                  {!notification.read && (
                    <span className="notif-item-status">New</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

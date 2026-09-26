import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import Icon from '../ui/Icon';

/**
 * Short confirmations after a save ("Booking updated"), so a change never
 * happens silently. Announced to screen readers through a polite live region.
 */
const ToastContext = createContext({ notify: () => {} });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const notify = useCallback(
    (message, tone = 'success') => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { id, message, tone }]);
      setTimeout(() => dismiss(id), 3500);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="admin-toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`admin-toast admin-toast-${t.tone}`}>
            <Icon name={t.tone === 'error' ? 'alert' : 'check-circle'} size={18} />
            <span>{t.message}</span>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              <Icon name="close" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

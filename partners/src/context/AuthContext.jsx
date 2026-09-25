import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api, {
  REFRESH_KEY,
  SESSION_EXPIRED_EVENT,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isRemembered,
  storeTokens,
} from '../lib/api';

/**
 * Keeps track of who is signed in, for the partners app only.
 *
 * Trimmed from the customer site's AuthContext: no Google sign-in, and the
 * only way to create an account here is applying as a partner. Identity is
 * owned by the API: on load we ask /api/auth/me rather than decoding the
 * stored token, so an approval, suspension or disabled account is seen as it
 * is now, not as it was when the token was issued.
 *
 * Session safety, because partners often work from a phone that is shared or
 * left lying on a site:
 *  - a sign-in lasts until the browser closes unless the partner chose "keep
 *    me signed in on this device" (see storeTokens in lib/api.js);
 *  - without that choice, 30 minutes with no taps or keys signs them out;
 *  - when the server stops accepting the session, or they sign out in another
 *    tab, this tab signs out too and the sign-in page says why.
 */

/** Minutes of no activity before a not-remembered session is closed. */
export const IDLE_MINUTES = 30;

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'wheel'];

const AuthContext = createContext({
  user: null,
  loading: true,
  remembered: false,
  notice: '',
  clearNotice: () => {},
  login: async () => {},
  applyAsPartner: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(getAccessToken() || getRefreshToken()));
  const [remembered, setRemembered] = useState(isRemembered);
  // Why the partner was signed out without asking — shown once on the sign-in page.
  const [notice, setNotice] = useState('');
  const lastActivity = useRef(Date.now());
  const userRef = useRef(null);
  userRef.current = user;

  useEffect(() => {
    if (!getAccessToken() && !getRefreshToken()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    api
      .me()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        // The token is gone or rejected — including after a failed refresh.
        clearTokens();
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const adopt = useCallback((auth, remember) => {
    storeTokens(auth, remember);
    setRemembered(Boolean(remember));
    setNotice('');
    lastActivity.current = Date.now();
    setUser(auth.user);
    return auth.user;
  }, []);

  /** Re-reads /api/auth/me — approval changes the role, so "check status" needs it. */
  const refreshUser = useCallback(async () => {
    const me = await api.me();
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async (reason = '') => {
    const refreshToken = getRefreshToken();
    // Clear locally first: if the network call fails the person is still
    // signed out here, which is the half that matters to them.
    clearTokens();
    setUser(null);
    setNotice(reason);
    if (refreshToken) {
      try {
        // Revokes the refresh token on the server, so a copy of it is useless.
        await api.logout(refreshToken);
      } catch {
        /* already signed out locally */
      }
    }
  }, []);

  // The API refused this session (expired, revoked, account disabled).
  useEffect(() => {
    const onExpired = () => {
      if (userRef.current) setNotice('Your session has ended. Please sign in again.');
      setUser(null);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  // Signed out (or in as someone else) in another tab of a remembered session.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== REFRESH_KEY && event.key !== null) return;
      if (!getRefreshToken()) {
        clearTokens();
        if (userRef.current) setNotice('You signed out in another tab.');
        setUser(null);
      } else if (event.newValue && event.oldValue && event.newValue !== event.oldValue) {
        // A refresh or a new sign-in elsewhere: make sure this tab shows the right person.
        api.me().then(setUser).catch(() => {});
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Idle sign-out, only for sessions the partner did not ask to keep.
  useEffect(() => {
    if (!user || remembered) return undefined;

    const touch = () => {
      lastActivity.current = Date.now();
    };
    const check = () => {
      if (Date.now() - lastActivity.current > IDLE_MINUTES * 60 * 1000) {
        logout(`You were signed out after ${IDLE_MINUTES} minutes without activity, to keep your account safe.`);
      }
    };
    // A phone that slept for an hour wakes up with timers late: check on return too.
    const onVisible = () => {
      if (!document.hidden) check();
    };

    touch();
    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, touch, { passive: true }));
    document.addEventListener('visibilitychange', onVisible);
    const timer = window.setInterval(check, 30 * 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, touch));
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
    };
  }, [user, remembered, logout]);

  const clearNotice = useCallback(() => setNotice(''), []);

  const value = useMemo(
    () => ({
      user,
      loading,
      remembered,
      notice,
      clearNotice,
      login: async (identifier, password, remember = false) =>
        adopt(await api.login(identifier.trim(), password), remember),
      /** Creates the login and the PENDING application together, and signs in for this browser session. */
      applyAsPartner: async (form) => adopt(await api.apply(form), false),
      logout,
      refreshUser,
    }),
    [user, loading, remembered, notice, clearNotice, adopt, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export { friendlyError } from '../lib/api';

export default AuthContext;

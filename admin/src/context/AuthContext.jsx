'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { clearTokens, getAccessToken, getRefreshToken, storeTokens } from '../lib/api';

/**
 * Keeps track of who is signed in, for the admin app only.
 *
 * Trimmed from the main site's AuthContext: no register, no Google sign-in —
 * staff accounts are promoted by hand in the database, never self-registered.
 * Identity is still owned by the API: on load we ask /api/auth/me rather than
 * decoding the stored token, so a revoked or demoted account is caught here.
 */
const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Always starts true, not `Boolean(getAccessToken())` — see the frontend
  // app's AuthContext for why: reading localStorage in a lazy initializer
  // disagrees with Next's server pre-render pass and triggers a hydration
  // mismatch whenever a token already exists in the browser.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getAccessToken()) {
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

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    clearTokens();
    setUser(null);
    if (refreshToken) {
      try {
        await api.logout(refreshToken);
      } catch {
        /* already signed out locally */
      }
    }
  }, []);

  const login = useCallback(async (identifier, password) => {
    const auth = await api.login(identifier.trim(), password);
    storeTokens(auth);
    setUser(auth.user);
    return auth.user;
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export { friendlyError } from '../lib/api';

export default AuthContext;

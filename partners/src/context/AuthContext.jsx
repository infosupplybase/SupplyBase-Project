import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { clearTokens, getAccessToken, getRefreshToken, storeTokens } from '../lib/api';

/**
 * Keeps track of who is signed in, for the partners app only.
 *
 * Trimmed from the customer site's AuthContext: no Google sign-in, and the
 * only way to create an account here is applying as a partner. Identity is
 * owned by the API: on load we ask /api/auth/me rather than decoding the
 * stored token, so an approval, suspension or disabled account is seen as it
 * is now, not as it was when the token was issued.
 */
const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  applyAsPartner: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(getAccessToken()));

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

  const adopt = useCallback((auth) => {
    storeTokens(auth);
    setUser(auth.user);
    return auth.user;
  }, []);

  /** Re-reads /api/auth/me — approval changes the role, so "check status" needs it. */
  const refreshUser = useCallback(async () => {
    const me = await api.me();
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    // Clear locally first: if the network call fails the person is still
    // signed out here, which is the half that matters to them.
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

  const value = useMemo(
    () => ({
      user,
      loading,
      login: async (identifier, password) => adopt(await api.login(identifier.trim(), password)),
      /** Creates the login and the PENDING application together, and signs in. */
      applyAsPartner: async (form) => adopt(await api.apply(form)),
      logout,
      refreshUser,
    }),
    [user, loading, adopt, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export { friendlyError } from '../lib/api';

export default AuthContext;

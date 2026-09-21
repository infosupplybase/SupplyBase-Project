import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { clearTokens, getAccessToken, getRefreshToken, storeTokens } from '../lib/api';

/**
 * Keeps track of who is signed in, everywhere on the site.
 *
 * Identity is owned by the Supplybase API, not by the browser. On load we ask
 * /api/auth/me rather than decoding the stored token: the token says what was
 * true when it was issued, and the server says what is true now — which is
 * what matters if an account has been disabled or a role changed since.
 */
const AuthContext = createContext({
  user: null,
  loading: true,
  configured: true,
  googleEnabled: false,
  login: async () => {},
  loginWithGoogle: async () => {},
  register: async () => {},
  applyAsPartner: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getAccessToken()));

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
        // Drop it rather than leaving the app in a half-signed-in state.
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

  /** Re-fetches /api/auth/me — used after a profile edit so the name shown
      in the header and bottom nav updates without a full page reload. */
  const refreshUser = useCallback(async () => {
    const me = await api.me();
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    // Clear locally first. If the network call fails the person is still
    // signed out here, which is the half that matters to them; the server
    // token expires on its own.
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
      // The API needs no client-side keys, so unlike the old Firebase setup
      // there is no "not configured yet" state for password sign-in.
      configured: true,
      googleEnabled: Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID),
      login: async (identifier, password) => adopt(await api.login(identifier.trim(), password)),
      loginWithGoogle: async (credential) => adopt(await api.loginWithGoogle(credential)),
      register: async (name, email, password, phone) =>
        adopt(await api.register(name.trim(), email.trim(), password, phone)),
      /** A partner application: same sign-in as register(), plus the PENDING application. */
      applyAsPartner: async (form) => adopt(await api.partnerApply(form)),
      logout,
      refreshUser,
    }),
    [user, loading, adopt, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Re-exported so pages keep importing their error formatter from one place. */
export { friendlyError } from '../lib/api';

export default AuthContext;

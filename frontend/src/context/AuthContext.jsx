'use client';

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
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Always starts true, not `Boolean(getAccessToken())`. getAccessToken()
  // returns null during Next's server pre-render (no window there) but can
  // return a real value on the browser's very first render if a token is
  // already in localStorage — that mismatch between what the server sent
  // and what the client's first render produces is exactly what triggers a
  // hydration error. Starting fixed at `true` matches the server every time;
  // the effect below still resolves it to `false` on the very next tick for
  // a signed-out visitor, so nothing waits noticeably longer than before.
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
      googleEnabled: Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID),
      login: async (identifier, password) => adopt(await api.login(identifier.trim(), password)),
      loginWithGoogle: async (credential) => adopt(await api.loginWithGoogle(credential)),
      register: async (name, email, password, phone) =>
        adopt(await api.register(name.trim(), email.trim(), password, phone)),
      logout,
    }),
    [user, loading, adopt, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Re-exported so pages keep importing their error formatter from one place. */
export { friendlyError } from '../lib/api';

export default AuthContext;

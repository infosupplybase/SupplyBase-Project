import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, isConfigured } from '../lib/firebase';

/**
 * Keeps track of who is signed in, everywhere on the site.
 * Wrap the app in <AuthProvider> (already done in main.jsx) and then use
 * `const { user, login, logout } = useAuth();` inside any component.
 */
const AuthContext = createContext({
  user: null,
  loading: false,
  configured: false,
  login: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
});

/** Turns Firebase's error codes into sentences a normal person can understand. */
export const friendlyError = (error) => {
  const code = (error && error.code) || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address does not look right.';
    case 'auth/user-disabled':
      return 'This account has been switched off. Please contact us.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Wrong email or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'No internet connection. Please check your network and try again.';
    case 'auth/missing-password':
      return 'Please enter your password.';
    default:
      return (error && error.message) || 'Something went wrong. Please try again.';
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isConfigured);

  useEffect(() => {
    if (!isConfigured) return undefined;
    return onAuthStateChanged(auth, (current) => {
      setUser(current);
      setLoading(false);
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      configured: isConfigured,
      login: (email, password) => signInWithEmailAndPassword(auth, email.trim(), password),
      logout: () => signOut(auth),
      resetPassword: (email) => sendPasswordResetEmail(auth, email.trim()),
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export default AuthContext;

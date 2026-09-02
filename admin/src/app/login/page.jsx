'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '../../components/ui/Icon';
import { useAuth, friendlyError } from '../../context/AuthContext';

/**
 * Standalone sign-in for the admin app. Deliberately minimal compared to the
 * main site's Login page — no register tab, no Google button: staff accounts
 * are promoted by hand in the database, never self-registered, and this app
 * has no way to share the main site's React context across origins.
 */
export default function AdminLoginPage() {
  const { user, login, loading } = useAuth();
  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [loading, user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please enter your email or phone number, and your password.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const signedIn = await login(identifier, password);
      if (signedIn.role !== 'ADMIN') {
        setError('This account is not an administrator.');
        setBusy(false);
        return;
      }
      router.replace('/');
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  };

  return (
    <div className="admin-login-screen">
      <div className="admin-login-card">
        <img src="/assets/brand/logo.png" alt="Supplybase Projects logo" />
        <h1>ADMIN SIGN IN</h1>
        <p>Staff access only.</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="admin-identifier">Email or phone number</label>
            <input
              id="admin-identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@example.com or 98765 43210"
              autoComplete="username"
            />
          </div>

          <div className="field" style={{ marginBottom: 20 }}>
            <label htmlFor="admin-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ paddingRight: 46 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 0,
                  color: 'var(--grey-500)',
                  padding: 6,
                  display: 'flex',
                }}
              >
                <Icon name="eye" size={19} />
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="alert alert-error">
              <Icon name="info" size={18} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn btn-dark btn-block btn-lg" disabled={busy}>
            <Icon name="lock" size={17} />
            {busy ? 'SIGNING IN…' : 'SIGN IN'}
          </button>
        </form>
      </div>
    </div>
  );
}

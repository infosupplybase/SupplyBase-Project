import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import { useAuth, friendlyError } from '../context/AuthContext';

/**
 * Standalone sign-in for the admin app. Deliberately minimal compared to the
 * main site's Login page — no register tab, no Google button: staff accounts
 * are promoted by hand, never self-registered.
 */
export default function Login() {
  const { user, login, logout, loading } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = 'Sign in · Supplybase Admin';
  }, []);

  // Already signed in as an admin (e.g. a returning tab) — straight in.
  useEffect(() => {
    if (!loading && user && user.role === 'ADMIN') navigate('/', { replace: true });
  }, [loading, user, navigate]);

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
        // A customer or partner account: sign it straight back out, so the
        // error below stays on screen instead of the guard bouncing the page.
        await logout();
        setError('This account is not an administrator. Use a staff account to sign in here.');
        setBusy(false);
        return;
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  };

  return (
    <div className="admin-login-screen">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <img src="/assets/brand/logo.png" alt="Supplybase" />
        </div>
        <h1>ADMIN CONSOLE</h1>
        <p>Sign in with your staff account to manage bookings, partners and payments.</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="admin-identifier">Email or phone number</label>
            <input
              id="admin-identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@supplybase.co.in or 98765 43210"
              autoComplete="username"
              autoFocus
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
                style={{ paddingRight: 48 }}
              />
              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                <Icon name="eye" size={19} />
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="alert alert-error">
              <Icon name="alert" size={18} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>
            <Icon name="lock" size={17} />
            {busy ? 'SIGNING IN…' : 'SIGN IN'}
          </button>
        </form>

        <p className="admin-login-foot">Staff access only. Customers and partners sign in on their own sites.</p>
      </div>
    </div>
  );
}

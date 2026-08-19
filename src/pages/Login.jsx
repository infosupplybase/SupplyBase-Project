import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import { company, contact } from '../data/siteConfig';
import { telHref } from '../lib/contact';
import { useAuth, friendlyError } from '../context/AuthContext';

/**
 * Login page — real sign-in, handled by Firebase.
 *
 * Accounts are created by you in the Firebase console (Authentication -> Users -> Add user).
 * There is deliberately no public "sign up" here: this is a client portal, not an open website.
 *
 * If the Firebase keys have not been added yet, the page says so instead of pretending to work.
 * See README.md -> "Setting up login".
 */
export default function Login() {
  const { user, login, resetPassword, configured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const goTo = (location.state && location.state.from) || '/dashboard';

  // already signed in? go straight through
  useEffect(() => {
    if (user) navigate(goTo, { replace: true });
  }, [user, goTo, navigate]);

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setError('');
    setNotice('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (!configured) {
      setError('Login has not been set up yet. See README.md, section "Setting up login".');
      return;
    }
    if (!form.email.trim() || !form.password) {
      setError('Please enter your email and password.');
      return;
    }

    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate(goTo, { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (!configured) {
      setError('Login has not been set up yet. See README.md, section "Setting up login".');
      return;
    }
    if (!form.email.trim()) {
      setError('Type your email address first, then press "Forgot password?".');
      return;
    }

    try {
      await resetPassword(form.email);
      setNotice(`We have sent a password reset link to ${form.email.trim()}. Check your inbox.`);
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  return (
    <div className="login-page">
      <div className="login-visual">
        <img src="/assets/hero-house.svg" alt="" />
        <div className="login-visual-text">
          <span className="eyebrow">{company.statement}</span>
          <h2>
            ONE PARTNER.
            <br />
            <span className="gold">COMPLETE PROJECT.</span>
          </h2>
          <p>Track your project, view drawings and approvals, and stay updated at every stage.</p>
        </div>
      </div>

      <div className="login-form-side">
        <div className="login-box">
          <Link to="/" className="login-logo">
            <img src="/assets/brand/logo.png" alt={`${company.name} logo`} />
          </Link>

          <h2 style={{ fontSize: '1.9rem', marginBottom: 6 }}>Sign In</h2>
          <p style={{ color: 'var(--grey-600)', marginBottom: 24 }}>
            Access your project dashboard.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="field" style={{ marginBottom: 16 }}>
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="you@example.com"
                autoComplete="username"
              />
            </div>

            <div className="field">
              <label htmlFor="login-password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
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

            <div className="login-meta">
              <label className="checkbox-row">
                <input type="checkbox" defaultChecked />
                Keep me signed in
              </label>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  background: 'none',
                  border: 0,
                  padding: 0,
                  color: 'var(--gold-dark)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                }}
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <div
                role="alert"
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  padding: '12px 14px',
                  marginBottom: 16,
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(209,67,67,.08)',
                  border: '1px solid rgba(209,67,67,.35)',
                  color: '#a92f2f',
                  fontSize: '0.9rem',
                }}
              >
                <Icon name="info" size={18} />
                <span>{error}</span>
              </div>
            )}

            {notice && (
              <div
                role="status"
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  padding: '12px 14px',
                  marginBottom: 16,
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(37,211,102,.1)',
                  border: '1px solid rgba(37,211,102,.4)',
                  color: '#16794a',
                  fontSize: '0.9rem',
                }}
              >
                <Icon name="check-circle" size={18} />
                <span>{notice}</span>
              </div>
            )}

            <button type="submit" className="btn btn-dark btn-block btn-lg" disabled={busy}>
              <Icon name="lock" size={17} />
              {busy ? 'SIGNING IN…' : 'SIGN IN'}
            </button>
          </form>

          {!configured && (
            <div className="form-note">
              <Icon name="info" size={18} />
              <span>
                Login is not switched on yet. Add your Firebase keys to a <code>.env</code> file —
                the steps are in <code>README.md</code> under &ldquo;Setting up login&rdquo;. It takes
                about 20 minutes and costs nothing.
              </span>
            </div>
          )}

          <p style={{ marginTop: 26, fontSize: '0.9rem', color: 'var(--grey-600)' }}>
            No account yet? Accounts are created by our team — call{' '}
            <a href={telHref} style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>
              {contact.phoneDisplay}
            </a>{' '}
            or{' '}
            <Link to="/quote" style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>
              request a quote
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

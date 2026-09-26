import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import { COMPANY_NAME, SITE_URL } from '../config';
import { IDLE_MINUTES, useAuth, friendlyError } from '../context/AuthContext';
import api from '../lib/api';

/**
 * /login — where Supplybase's professionals sign in.
 *
 * It is the same account system as the customer login (same API, same
 * accounts); what differs is where it leads. Signing in always lands on the
 * dashboard, which shows the right thing for the account: an application that
 * is still being reviewed, a rejection or suspension with its reason, or —
 * once approved — the jobs assigned to them. Being a partner is decided by an
 * admin, never by which login page someone used, so a customer who signs in
 * here simply sees that they have no partner application.
 *
 * No Google button on purpose: a partner needs a password we can reset, and an
 * approved professional's account should not hang off a personal Google login
 * they might lose.
 */
export default function Login() {
  const { user, login, notice: signedOutNotice, clearNotice } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  // already signed in? go straight through
  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (!identifier.trim() || !password) {
      setError('Please enter your email or phone number, and your password.');
      return;
    }

    setBusy(true);
    try {
      await login(identifier, password, remember);
      clearNotice();
      navigate('/', { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  /**
   * The API answers the same whether or not the account exists, so the message
   * says "if" — it must not confirm that an account is there.
   */
  const handleForgot = async () => {
    setError('');
    setNotice('');
    if (!identifier.trim()) {
      setError('Type your email or phone number above first, then choose "Forgot password?".');
      return;
    }
    setBusy(true);
    try {
      await api.forgotPassword(identifier.trim());
      setNotice('If that account exists, we have sent a link to reset the password.');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-glow" aria-hidden="true" />

      <div className="auth-card-wrap">
        <div className="auth-card">
          <a href={SITE_URL} className="auth-logo">
            <img src="/assets/brand/logo.png" alt={`${COMPANY_NAME} logo`} />
          </a>

          <h1 className="auth-heading">
            Partner <span className="auth-accent">Login</span>
          </h1>
          <p className="auth-intro">
            For Supplybase professionals. Sign in to check your application and see your jobs.
          </p>

          <form onSubmit={handleSubmit} noValidate className="auth-form">
            <div className="field auth-field">
              <label htmlFor="partner-identifier">Email or phone number</label>
              <div className="auth-input-wrap">
                <Icon name="user" size={17} className="auth-input-icon" />
                <input
                  id="partner-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setError('');
                  }}
                  placeholder="name@domain.com or 98765 43210"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="field auth-field">
              <label htmlFor="partner-password">Password</label>
              <div className="auth-input-wrap">
                <Icon name="lock" size={17} className="auth-input-icon" />
                <input
                  id="partner-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-input-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} />
                </button>
              </div>
            </div>

            <div className="login-meta">
              <label className="checkbox-row">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Keep me signed in on this device
              </label>
              <button
                type="button"
                className="auth-inline-link auth-forgot"
                onClick={handleForgot}
                disabled={busy}
              >
                Forgot password?
              </button>
            </div>

            <p className="partner-auth-note">
              {remember
                ? 'Only tick this on your own phone. You will stay signed in until you sign out.'
                : `For your safety you are signed out when you close the browser, or after ${IDLE_MINUTES} minutes without activity.`}
            </p>

            {signedOutNotice && !error && (
              <div role="status" className="alert alert-warning">
                <Icon name="lock" size={18} />
                <span>{signedOutNotice}</span>
              </div>
            )}

            {error && (
              <div role="alert" className="alert alert-error">
                <Icon name="info" size={18} />
                <span>{error}</span>
              </div>
            )}

            {notice && (
              <div role="status" className="alert alert-success">
                <Icon name="check-circle" size={18} />
                <span>{notice}</span>
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={busy}>
              {busy ? 'Please wait…' : 'Sign In'}
              {!busy && <Icon name="arrow-right" size={18} />}
            </button>
          </form>

          <p className="auth-switch">
            New to Supplybase Partners? <Link to="/join">Apply to join</Link>
          </p>
          <p className="auth-switch">
            Looking to book a service? <a href={`${SITE_URL}/login`}>Customer login</a>
          </p>
        </div>
      </div>
    </div>
  );
}

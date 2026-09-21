import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import { company } from '../data/siteConfig';
import { useAuth, friendlyError } from '../context/AuthContext';
import api from '../lib/api';

/**
 * /partner/login — where SupplyBase's professionals sign in.
 *
 * It is the same account system as the customer login (same API, same
 * tokens); what differs is where it leads. Signing in here always lands on
 * /partner, which shows the right thing for the account: an application
 * that is still being reviewed, a rejection or suspension with its reason,
 * or — once approved — the jobs assigned to them. Being a partner is decided
 * by an admin, never by which login page someone used, so a customer who
 * signs in here simply sees that they have no partner application.
 *
 * No Google button on purpose: a partner needs a password we can reset, and
 * an approved professional's account should not hang off a personal Google
 * login they might lose.
 */
export default function PartnerLogin() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  // Only ever go back to somewhere inside the partner area.
  const from = location.state && location.state.from;
  const goTo = from && from.startsWith('/partner') ? from : '/partner';

  // already signed in? go straight through
  useEffect(() => {
    if (user) navigate(goTo, { replace: true });
  }, [user, goTo, navigate]);

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
      await login(identifier, password);
      navigate(goTo, { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  /**
   * The API answers the same whether or not the account exists, so the
   * message says "if" — it must not confirm that an account is there.
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

  const handleClose = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate('/');
  };

  // Escape closes it, like the customer login
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="auth-screen">
      <div className="auth-glow" aria-hidden="true" />

      <div className="auth-card-wrap">
        <div className="auth-card">
          <button type="button" className="auth-close" onClick={handleClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>

          <Link to="/" className="auth-logo">
            <img src="/assets/brand/logo.png" alt={`${company.name} logo`} />
          </Link>

          <h1 className="auth-heading">
            Partner <span className="auth-accent">Login</span>
          </h1>
          <p className="auth-intro">
            For SupplyBase professionals. Sign in to check your application and see your jobs.
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
              <span />
              <button
                type="button"
                className="auth-inline-link auth-forgot"
                onClick={handleForgot}
                disabled={busy}
              >
                Forgot password?
              </button>
            </div>

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
            New to SupplyBase Partners? <Link to="/partner/join">Apply to join</Link>
          </p>
          <p className="auth-switch">
            Looking to book a service? <Link to="/login">Customer login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

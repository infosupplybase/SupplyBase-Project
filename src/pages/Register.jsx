import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import { company, contact } from '../data/siteConfig';
import { telHref } from '../lib/contact';
import { useAuth, friendlyError } from '../context/AuthContext';

/**
 * Register page — creates a client portal account, handled by Firebase.
 *
 * NOTE: this is a public sign-up. Anyone who completes this form can reach
 * /dashboard. If you would rather create accounts yourself (Firebase console ->
 * Authentication -> Users -> Add user), remove the /register route in App.jsx
 * and the "Create one" link on the login page — nothing else depends on this file.
 *
 * If the Firebase keys have not been added yet, the page says so instead of
 * pretending to work. See README.md -> "Setting up login".
 */
const emptyForm = { name: '', email: '', password: '', confirm: '' };

export default function Register() {
  const { user, register, configured } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // already signed in? no reason to be here
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: undefined }));
    setError('');
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Please enter your name';
    if (!form.email.trim()) next.email = 'Please enter your email address';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = 'Please enter a valid email address';
    if (!form.password) next.password = 'Please choose a password';
    else if (form.password.length < 6) next.password = 'Use at least six characters';
    if (form.confirm !== form.password) next.confirm = 'Both passwords must match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!configured) {
      setError('Sign-up has not been set up yet. See README.md, section "Setting up login".');
      return;
    }
    if (!validate()) {
      const firstError = document.querySelector('.field.error input');
      if (firstError) firstError.focus();
      return;
    }
    if (!accepted) {
      setError('Please accept the terms and privacy policy to continue.');
      return;
    }

    setBusy(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-visual">
        <img src="/assets/projects/luxury-bungalow.svg" alt="" />
        <div className="login-visual-text">
          <span className="eyebrow">{company.statement}</span>
          <h2>
            START YOUR
            <br />
            <span className="gold">PROJECT WITH US.</span>
          </h2>
          <p>
            Create an account to track your project, view drawings and approvals, and stay updated
            at every stage.
          </p>
        </div>
      </div>

      <div className="login-form-side">
        <div className="login-box">
          <Link to="/" className="login-logo">
            <img src="/assets/brand/logo.png" alt={`${company.name} logo`} />
          </Link>

          <h2 style={{ fontSize: '1.9rem', marginBottom: 6 }}>Create Account</h2>
          <p style={{ color: 'var(--grey-600)', marginBottom: 24 }}>
            It takes a minute. You will land straight on your project dashboard.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className={`field ${errors.name ? 'error' : ''}`} style={{ marginBottom: 16 }}>
              <label htmlFor="reg-name">
                Full Name <span className="req">*</span>
              </label>
              <input
                id="reg-name"
                type="text"
                value={form.name}
                onChange={update('name')}
                placeholder="Your name"
                autoComplete="name"
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className={`field ${errors.email ? 'error' : ''}`} style={{ marginBottom: 16 }}>
              <label htmlFor="reg-email">
                Email Address <span className="req">*</span>
              </label>
              <input
                id="reg-email"
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className={`field ${errors.password ? 'error' : ''}`} style={{ marginBottom: 16 }}>
              <label htmlFor="reg-password">
                Password <span className="req">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  placeholder="At least six characters"
                  autoComplete="new-password"
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
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className={`field ${errors.confirm ? 'error' : ''}`}>
              <label htmlFor="reg-confirm">
                Confirm Password <span className="req">*</span>
              </label>
              <input
                id="reg-confirm"
                type={showPassword ? 'text' : 'password'}
                value={form.confirm}
                onChange={update('confirm')}
                placeholder="Type it once more"
                autoComplete="new-password"
              />
              {errors.confirm && <span className="field-error">{errors.confirm}</span>}
            </div>

            <div className="login-meta">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                />
                <span>
                  I accept the{' '}
                  <Link to="/terms" style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>
                    terms
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy-policy" style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>
                    privacy policy
                  </Link>
                </span>
              </label>
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

            <button type="submit" className="btn btn-dark btn-block btn-lg" disabled={busy}>
              <Icon name="user" size={17} />
              {busy ? 'CREATING ACCOUNT…' : 'CREATE ACCOUNT'}
            </button>
          </form>

          {!configured && (
            <div className="form-note">
              <Icon name="info" size={18} />
              <span>
                Sign-up is not switched on yet. Add your Firebase keys to a <code>.env</code> file —
                the steps are in <code>README.md</code> under &ldquo;Setting up login&rdquo;. It takes
                about 20 minutes and costs nothing.
              </span>
            </div>
          )}

          <p style={{ marginTop: 26, fontSize: '0.9rem', color: 'var(--grey-600)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>
              Sign in
            </Link>
            . Prefer to talk to a person? Call{' '}
            <a href={telHref} style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>
              {contact.phoneDisplay}
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import { company } from '../data/siteConfig';
import { useAuth, friendlyError } from '../context/AuthContext';

/**
 * Account page — sign in and create account, on one screen.
 *
 * Both /login and /register render this component; the tab that opens is taken
 * from the URL, so each mode is still directly linkable and the back button
 * behaves. Switching tabs is a normal navigation between those two paths.
 *
 * NOTE: creating an account is public — anyone who completes the form can reach
 * /dashboard. To go back to invite-only (accounts made by hand in the Firebase
 * console), drop the /register route in App.jsx and the CREATE ACCOUNT tab
 * below; the sign-in half needs no other change.
 *
 * If the Firebase keys have not been added yet, the page says so instead of
 * pretending to work. See README.md -> "Setting up login".
 */
const emptyForm = { name: '', email: '', password: '', confirm: '' };

export default function Login() {
  const { user, login, register, resetPassword, configured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const mode = location.pathname === '/register' ? 'register' : 'login';
  const isRegister = mode === 'register';

  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const goTo = (location.state && location.state.from) || '/dashboard';

  // already signed in? go straight through
  useEffect(() => {
    if (user) navigate(goTo, { replace: true });
  }, [user, goTo, navigate]);

  // messages from one tab must not linger on the other
  useEffect(() => {
    setErrors({});
    setError('');
    setNotice('');
  }, [mode]);

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: undefined }));
    setError('');
    setNotice('');
  };

  /** Field-level checks for the create-account tab. */
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

  const notConfigured = () => {
    setError(
      `${isRegister ? 'Sign-up' : 'Login'} has not been set up yet. See README.md, section "Setting up login".`
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (!configured) return notConfigured();

    if (isRegister) {
      if (!validate()) {
        const firstError = document.querySelector('.field.error input');
        if (firstError) firstError.focus();
        return;
      }
      if (!accepted) {
        setError('Please accept the terms and privacy policy to continue.');
        return;
      }
    } else if (!form.email.trim() || !form.password) {
      setError('Please enter your email and password.');
      return;
    }

    setBusy(true);
    try {
      if (isRegister) await register(form.name, form.email, form.password);
      else await login(form.email, form.password);
      navigate(goTo, { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  /**
   * Closing the panel returns the visitor wherever they came from. On a direct
   * hit (a bookmark, a pasted link) there is nothing to go back to, so the home
   * page is used instead — React Router marks that first entry with key
   * 'default'.
   */
  const handleClose = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate('/');
  };

  // Escape closes it, the way any dialog is expected to behave
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (!configured) return notConfigured();
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
    <div className="auth-screen">
      <img
        src={isRegister ? '/assets/projects/luxury-bungalow.svg' : '/assets/hero-house.svg'}
        alt=""
      />

      <div className="auth-modal" role="dialog" aria-modal="true" aria-label="Account">
        <button type="button" className="auth-close" onClick={handleClose} aria-label="Close">
          <Icon name="close" size={20} />
        </button>

        <Link to="/" className="auth-logo">
          <img src="/assets/brand/logo.png" alt={`${company.name} logo`} />
        </Link>

        <div className="auth-tabs" role="tablist">
          <Link
            to="/login"
            role="tab"
            aria-selected={!isRegister}
            className={`auth-tab ${!isRegister ? 'active' : ''}`}
          >
            Sign In
          </Link>
          <Link
            to="/register"
            role="tab"
            aria-selected={isRegister}
            className={`auth-tab ${isRegister ? 'active' : ''}`}
          >
            Create Account
          </Link>
        </div>

        <h2>{isRegister ? 'Create Account' : 'Sign In'}</h2>
        <p className="auth-intro">
          {isRegister
            ? 'It takes a minute. You will land straight on your project dashboard.'
            : 'Access your project dashboard.'}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {isRegister && (
            <div className={`field ${errors.name ? 'error' : ''}`} style={{ marginBottom: 16 }}>
              <label htmlFor="auth-name">
                Full Name <span className="req">*</span>
              </label>
              <input
                id="auth-name"
                type="text"
                value={form.name}
                onChange={update('name')}
                placeholder="Your name"
                autoComplete="name"
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
          )}

          <div className={`field ${errors.email ? 'error' : ''}`} style={{ marginBottom: 16 }}>
            <label htmlFor="auth-email">
              Email Address {isRegister && <span className="req">*</span>}
            </label>
            <input
              id="auth-email"
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="you@example.com"
              autoComplete={isRegister ? 'email' : 'username'}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className={`field ${errors.password ? 'error' : ''}`}>
            <label htmlFor="auth-password">
              Password {isRegister && <span className="req">*</span>}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={update('password')}
                placeholder={isRegister ? 'At least six characters' : '••••••••'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
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

          {isRegister && (
            <div className={`field ${errors.confirm ? 'error' : ''}`} style={{ marginTop: 16 }}>
              <label htmlFor="auth-confirm">
                Confirm Password <span className="req">*</span>
              </label>
              <input
                id="auth-confirm"
                type={showPassword ? 'text' : 'password'}
                value={form.confirm}
                onChange={update('confirm')}
                placeholder="Type it once more"
                autoComplete="new-password"
              />
              {errors.confirm && <span className="field-error">{errors.confirm}</span>}
            </div>
          )}

          <div className="login-meta">
            {isRegister ? (
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                />
                <span>
                  I accept the{' '}
                  <Link to="/terms" style={{ color: 'var(--gold-deep)', fontWeight: 600 }}>
                    terms
                  </Link>{' '}
                  and{' '}
                  <Link
                    to="/privacy-policy"
                    style={{ color: 'var(--gold-deep)', fontWeight: 600 }}
                  >
                    privacy policy
                  </Link>
                </span>
              </label>
            ) : (
              <>
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
                    color: 'var(--gold-deep)',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                  }}
                >
                  Forgot password?
                </button>
              </>
            )}
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

          <button type="submit" className="btn btn-dark btn-block btn-lg" disabled={busy}>
            <Icon name={isRegister ? 'user' : 'lock'} size={17} />
            {busy
              ? isRegister
                ? 'CREATING ACCOUNT…'
                : 'SIGNING IN…'
              : isRegister
                ? 'CREATE ACCOUNT'
                : 'SIGN IN'}
          </button>
        </form>
      </div>
    </div>
  );
}

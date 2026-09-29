import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import GoogleButton from './GoogleButton';
import { contact } from '../../data/siteConfig';
import { useAuth, friendlyError } from '../../context/AuthContext';
import { isValidPhone } from '../../lib/bookingDetails';

/**
 * Sign in / create account — the form itself, shared by the account page
 * (/login, /register) and the booking's last step (LoginGate).
 *
 * Sign-in runs against the Supplybase API. Two routes in:
 *   - email or phone and password, checked by the backend against a BCrypt hash
 *   - Google, which returns an ID token the backend verifies before trusting
 *
 * Both end the same way: the API issues our own access and refresh tokens, so
 * everything downstream sees one kind of session regardless of how it started.
 * `onDone(user)` runs once signed in.
 *
 * `prefill` ({ name, email, phone }) starts the create-account form with what
 * a customer already typed into a booking, so they do not type it twice.
 *
 * Phone number stays in the create-account form: the API requires it
 * (register() takes phone as a positional arg and a person can sign in with
 * it later) so dropping the field would silently break account creation.
 */
export default function AuthPanel({ mode, onModeChange, onDone, prefill, heading, intro }) {
  const { login, register, loginWithGoogle, googleEnabled } = useAuth();
  const isRegister = mode === 'register';

  const [form, setForm] = useState(() => ({
    name: prefill?.name || '',
    email: prefill?.email || '',
    phone: prefill?.phone || '',
    identifier: prefill?.email || prefill?.phone || '',
    password: '',
    confirm: '',
  }));
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

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
    if (!form.phone.trim()) next.phone = 'Please enter your phone number';
    else if (!isValidPhone(form.phone)) next.phone = 'Enter a 10-digit mobile number';
    if (!form.password) next.password = 'Please choose a password';
    // 8 because the API enforces 8 — a laxer rule here would only produce a
    // server-side rejection after the person had already pressed the button.
    else if (form.password.length < 8) next.password = 'Use at least eight characters';
    if (form.confirm !== form.password) next.confirm = 'Both passwords must match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // A sign-in form shown over a booking form must not submit that one too.
    e.stopPropagation();
    setError('');
    setNotice('');

    if (isRegister) {
      if (!validate()) {
        const firstError = e.currentTarget.querySelector('.field.error input');
        if (firstError) firstError.focus();
        return;
      }
      if (!accepted) {
        setError('Please accept the terms and privacy policy to continue.');
        return;
      }
    } else if (!form.identifier.trim() || !form.password) {
      setError('Please enter your email or phone number, and your password.');
      return;
    }

    setBusy(true);
    try {
      const user = isRegister
        ? await register(form.name, form.email, form.password, form.phone)
        : await login(form.identifier, form.password);
      onDone?.(user);
    } catch (err) {
      // The API validates the same fields again and can reject things the
      // browser cannot know about — an email already taken, for one. Put those
      // back on the fields they belong to instead of in one banner.
      if (err && err.fieldErrors) setErrors(err.fieldErrors);
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  /** Google hands back an ID token; the backend decides whether to trust it. */
  const handleGoogle = async (credential) => {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      onDone?.(await loginWithGoogle(credential));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  /**
   * There is no self-service reset yet — the API has no endpoint for it, and
   * saying "check your inbox" when no email is sent would be worse than
   * saying nothing. Point at a person instead until that flow is built.
   */
  const handleReset = (e) => {
    e.preventDefault();
    setError('');
    setNotice(
      `Call us on ${contact.phoneDisplay} and we will reset it for you. ` +
        'Self-service password reset is coming.'
    );
  };

  return (
    <>
      <h1 className="auth-heading">
        {heading ||
          (isRegister ? (
            <>
              Create <span className="auth-accent">Account</span>
            </>
          ) : (
            <>
              Welcome <span className="auth-accent">Back</span>
            </>
          ))}
      </h1>
      <p className="auth-intro">
        {intro ||
          (isRegister
            ? 'Join us today to access your secure workspace.'
            : 'Enter your credentials to access your secure account.')}
      </p>

      <form onSubmit={handleSubmit} noValidate className="auth-form">
        {isRegister && (
          <div className={`field auth-field ${errors.name ? 'error' : ''}`}>
            <label htmlFor="auth-name">
              Full Name <span className="req">*</span>
            </label>
            <div className="auth-input-wrap">
              <Icon name="user" size={17} className="auth-input-icon" />
              <input
                id="auth-name"
                type="text"
                value={form.name}
                onChange={update('name')}
                placeholder="Alex Johnson"
                autoComplete="name"
              />
            </div>
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>
        )}

        {isRegister ? (
          <>
            <div className={`field auth-field ${errors.email ? 'error' : ''}`}>
              <label htmlFor="auth-email">
                Email Address <span className="req">*</span>
              </label>
              <div className="auth-input-wrap">
                <Icon name="mail" size={17} className="auth-input-icon" />
                <input
                  id="auth-email"
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  placeholder="name@domain.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className={`field auth-field ${errors.phone ? 'error' : ''}`}>
              <label htmlFor="auth-phone">
                Phone Number <span className="req">*</span>
              </label>
              <div className="auth-input-wrap">
                <Icon name="phone" size={17} className="auth-input-icon" />
                <input
                  id="auth-phone"
                  type="tel"
                  value={form.phone}
                  onChange={update('phone')}
                  placeholder="98765 43210"
                  autoComplete="tel"
                  inputMode="numeric"
                />
              </div>
              {errors.phone ? (
                <span className="field-error">{errors.phone}</span>
              ) : (
                <span className="field-hint">You can sign in with this number too.</span>
              )}
            </div>
          </>
        ) : (
          /* One field for both. Which it is comes from what was typed, not
             from a toggle someone has to set correctly first. */
          <div className={`field auth-field ${errors.identifier ? 'error' : ''}`}>
            <label htmlFor="auth-identifier">Email or Phone Number</label>
            <div className="auth-input-wrap">
              <Icon name="mail" size={17} className="auth-input-icon" />
              <input
                id="auth-identifier"
                type="text"
                value={form.identifier}
                onChange={update('identifier')}
                placeholder="name@domain.com or 98765 43210"
                autoComplete="username"
              />
            </div>
            {errors.identifier && <span className="field-error">{errors.identifier}</span>}
          </div>
        )}

        <div className={isRegister ? 'auth-row-2' : ''}>
          <div className={`field auth-field ${errors.password ? 'error' : ''}`}>
            <label htmlFor="auth-password">
              Password {isRegister && <span className="req">*</span>}
            </label>
            <div className="auth-input-wrap">
              <Icon name="lock" size={17} className="auth-input-icon" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={update('password')}
                placeholder={isRegister ? 'At least eight characters' : '••••••••'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
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
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          {isRegister && (
            <div className={`field auth-field ${errors.confirm ? 'error' : ''}`}>
              <label htmlFor="auth-confirm">
                Confirm Password <span className="req">*</span>
              </label>
              <div className="auth-input-wrap">
                <Icon name="lock" size={17} className="auth-input-icon" />
                <input
                  id="auth-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={update('confirm')}
                  placeholder="Type it once more"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-input-toggle"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showConfirm ? 'eye-off' : 'eye'} size={18} />
                </button>
              </div>
              {errors.confirm && <span className="field-error">{errors.confirm}</span>}
            </div>
          )}
        </div>

        <div className="login-meta">
          {isRegister ? (
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <span>
                I agree to the{' '}
                <Link to="/terms" className="auth-inline-link" target="_blank">
                  Terms
                </Link>{' '}
                &amp;{' '}
                <Link to="/privacy-policy" className="auth-inline-link" target="_blank">
                  Privacy Policy
                </Link>
              </span>
            </label>
          ) : (
            <>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <button
                type="button"
                className="auth-inline-link auth-forgot"
                onClick={handleReset}
                title={`Call ${contact.phoneDisplay}`}
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

        <button type="submit" className="auth-submit" disabled={busy}>
          {busy
            ? isRegister
              ? 'Creating Account…'
              : 'Signing In…'
            : isRegister
              ? 'Create Account'
              : 'Sign In'}
          {!busy && <Icon name="arrow-right" size={18} />}
        </button>

        {googleEnabled && (
          <>
            <div className="auth-divider">
              <span>{isRegister ? 'or sign up with' : 'or continue with'}</span>
            </div>
            <GoogleButton
              onCredential={handleGoogle}
              text={isRegister ? 'signup_with' : 'signin_with'}
              onError={() => setError('Google sign-in did not complete. Please try again.')}
            />
          </>
        )}
      </form>

      <p className="auth-switch">
        {isRegister ? 'Already have an account? ' : "Don't have an account? "}
        <button
          type="button"
          className="auth-switch-link"
          onClick={() => onModeChange(isRegister ? 'login' : 'register')}
        >
          {isRegister ? 'Sign In' : 'Sign Up'}
        </button>
      </p>
    </>
  );
}

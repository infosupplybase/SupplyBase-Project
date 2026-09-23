import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import GoogleButton from '../components/auth/GoogleButton';
import { company, contact } from '../data/siteConfig';
import { useAuth, friendlyError } from '../context/AuthContext';

/**
 * Account page — sign in and create account, on one screen.
 *
 * Both /login and /register render this component; the tab that opens is taken
 * from the URL, so each mode is still directly linkable and the back button
 * behaves. Switching tabs is a normal navigation between those two paths.
 *
 * Sign-in runs against the Supplybase API. Two routes in:
 *   - email and password, checked by the backend against a BCrypt hash
 *   - Google, which returns an ID token the backend verifies before trusting
 *
 * Both end the same way: the API issues our own access and refresh tokens, so
 * everything downstream sees one kind of session regardless of how it started.
 *
 * NOTE: creating an account is public — anyone who completes the form can reach
 * /dashboard. To go back to invite-only, drop the /register route in App.jsx
 * and the "Sign Up" link below; the sign-in half needs no other change.
 *
 * Phone number stays in the create-account form even though the reference
 * design this was restyled from does not show one: the API requires it
 * (register() takes phone as a positional arg and a person can sign in with
 * it later) so dropping the field would silently break account creation.
 */
const emptyForm = { name: '', email: '', phone: '', identifier: '', password: '', confirm: '' };

/** Ten digits after the +91 and the spaces are taken out. */
const isValidPhone = (value) => /^[6-9]\d{9}$/.test(String(value).replace(/\D/g, '').replace(/^91/, '').replace(/^0/, ''));

export default function Login() {
  const { user, login, register, loginWithGoogle, googleEnabled } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const mode = location.pathname === '/register' ? 'register' : 'login';
  const isRegister = mode === 'register';

  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
    setError('');
    setNotice('');

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
    } else if (!form.identifier.trim() || !form.password) {
      setError('Please enter your email or phone number, and your password.');
      return;
    }

    setBusy(true);
    try {
      if (isRegister) await register(form.name, form.email, form.password, form.phone);
      else await login(form.identifier, form.password);
      navigate(goTo, { replace: true });
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
      await loginWithGoogle(credential);
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
            {isRegister ? (
              <>
                Create <span className="auth-accent">Account</span>
              </>
            ) : (
              <>
                Welcome <span className="auth-accent">Back</span>
              </>
            )}
          </h1>
          <p className="auth-intro">
            {isRegister
              ? 'Join us today to access your secure workspace.'
              : 'Enter your credentials to access your secure account.'}
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
                <label htmlFor="auth-identifier">Email Address</label>
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
                    <Link to="/terms" className="auth-inline-link">
                      Terms
                    </Link>{' '}
                    &amp;{' '}
                    <Link to="/privacy-policy" className="auth-inline-link">
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
            {isRegister ? (
              <>
                Already have an account? <Link to="/login">Sign In</Link>
              </>
            ) : (
              <>
                Don&apos;t have an account? <Link to="/register">Sign Up</Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

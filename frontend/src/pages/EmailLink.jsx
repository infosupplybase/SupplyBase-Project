import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import api from '../lib/api';
import { company, contact } from '../data/siteConfig';
import { useAuth, friendlyError } from '../context/AuthContext';

/**
 * The two pages the API's emails link to:
 *   /reset-password?token=…  choose a new password (AuthService.forgotPassword)
 *   /verify-email?token=…    confirm the address (AuthService.sendVerificationEmail)
 * Both sit outside the main layout, on the same full-screen card as /login.
 */
function EmailLinkCard({ children }) {
  return (
    <div className="auth-screen">
      <div className="auth-glow" aria-hidden="true" />
      <div className="auth-card-wrap !bg-black/55 backdrop-blur-sm border border-yellow-400/20 shadow-xl">
        <div className="auth-card auth-compact">
          <Link to="/" className="auth-logo">
            <img src="/assets/brand/logo.webp" alt={`${company.name} logo`} />
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}

function Alert({ kind, children }) {
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`alert alert-${kind}`}>
      <Icon name={kind === 'error' ? 'info' : 'check-circle'} size={18} />
      <span>{children}</span>
    </div>
  );
}

/** BCrypt's limit is 72 bytes, so "é" counts twice (the API checks the same way). */
const tooLongForBcrypt = (value) => new TextEncoder().encode(value).length > 72;

/**
 * "Send me a new link" right where an expired reset link lands, so the
 * customer does not have to find Forgot password on the sign-in page.
 */
function RequestNewResetLink() {
  const [identifier, setIdentifier] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Type the email or phone number you sign in with');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await api.forgotPassword(identifier.trim());
      setSent(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <Alert kind="success">
        If that matches an account, a new reset link is on its way to its email address. It works for one hour.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="auth-form">
      <div className={`field auth-field ${error ? 'error' : ''}`}>
        <label htmlFor="reset-new-link">Email or Phone Number</label>
        <div className="auth-input-wrap">
          <Icon name="user" size={17} className="auth-input-icon" />
          <input
            id="reset-new-link"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@example.com or 98765 43210"
            autoComplete="username"
          />
        </div>
        {error && <span className="field-error">{error}</span>}
      </div>
      <button type="submit" className="auth-submit" disabled={busy}>
        {busy ? 'Sending…' : 'Send Me a New Link'}
        {!busy && <Icon name="arrow-right" size={18} />}
      </button>
    </form>
  );
}

const MISSING_LINK = `This link is incomplete. Open the link from the email again, or call us on ${contact.phoneDisplay}.`;

export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  // The link itself was refused (used, expired or wrong), as opposed to a
  // password the API did not accept: offer a fresh link instead of the form.
  const [linkDead, setLinkDead] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const next = {};
    // 8 and 72 are the API's own limits (ResetPasswordRequest).
    if (password.length < 8) next.password = 'Use at least eight characters';
    else if (tooLongForBcrypt(password)) next.password = 'That password is too long. Use fewer characters, or fewer accented letters and symbols';
    if (confirm !== password) next.confirm = 'Both passwords must match';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      if (err && err.fieldErrors) setErrors(err.fieldErrors);
      else if (err?.status === 400) setLinkDead(true);
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <EmailLinkCard>
      <h1 className="auth-heading">
        Reset <span className="auth-accent">Password</span>
      </h1>
      {!token ? (
        <>
          <Alert kind="error">{MISSING_LINK}</Alert>
          <RequestNewResetLink />
        </>
      ) : linkDead ? (
        <>
          <Alert kind="error">{error}</Alert>
          <RequestNewResetLink />
        </>
      ) : done ? (
        <>
          <Alert kind="success">Your password has been changed. Sign in with the new one.</Alert>
          <Link to="/login" className="auth-submit">
            Sign In
            <Icon name="arrow-right" size={18} />
          </Link>
        </>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="auth-form">
          <div className={`field auth-field ${errors.password || errors.newPassword ? 'error' : ''}`}>
            <label htmlFor="reset-password">New Password</label>
            <div className="auth-input-wrap">
              <Icon name="lock" size={17} className="auth-input-icon" />
              <input
                id="reset-password"
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least eight characters"
                autoComplete="new-password"
                autoFocus
              />
              <button
                type="button"
                className="auth-input-toggle"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? 'Hide password' : 'Show password'}
              >
                <Icon name={show ? 'eye-off' : 'eye'} size={18} />
              </button>
            </div>
            {(errors.password || errors.newPassword) && (
              <span className="field-error">{errors.password || errors.newPassword}</span>
            )}
          </div>

          <div className={`field auth-field ${errors.confirm ? 'error' : ''}`}>
            <label htmlFor="reset-confirm">Confirm New Password</label>
            <div className="auth-input-wrap">
              <Icon name="lock" size={17} className="auth-input-icon" />
              <input
                id="reset-confirm"
                type={show ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Type it once more"
                autoComplete="new-password"
              />
            </div>
            {errors.confirm && <span className="field-error">{errors.confirm}</span>}
          </div>

          {error && <Alert kind="error">{error}</Alert>}

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save New Password'}
            {!busy && <Icon name="arrow-right" size={18} />}
          </button>
        </form>
      )}
    </EmailLinkCard>
  );
}

export function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const { user, refreshUser } = useAuth();
  const [state, setState] = useState(token ? 'working' : 'missing');
  const [error, setError] = useState('');
  // A token works once: React's development double-run must not send it twice.
  const sent = useRef(false);

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;
    api
      .verifyEmail(token)
      .then(() => setState('done'))
      .catch((err) => {
        setError(friendlyError(err));
        setState('failed');
      });
  }, [token]);

  // A signed-in customer's profile should show the address as verified now.
  useEffect(() => {
    if (state === 'done' && user) refreshUser().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <EmailLinkCard>
      <h1 className="auth-heading">
        Verify <span className="auth-accent">Email</span>
      </h1>
      {state === 'missing' && <Alert kind="error">{MISSING_LINK}</Alert>}
      {state === 'working' && <p className="auth-intro">Checking your link…</p>}
      {state === 'failed' && (
        <Alert kind="error">
          {error} You can send a new link from your profile.
        </Alert>
      )}
      {state === 'done' && <Alert kind="success">Thank you. Your email address is verified.</Alert>}
      {state !== 'working' && (
        <Link to={user ? '/dashboard/profile' : '/login'} className="auth-submit">
          {user ? 'Go to My Profile' : 'Sign In'}
          <Icon name="arrow-right" size={18} />
        </Link>
      )}
    </EmailLinkCard>
  );
}

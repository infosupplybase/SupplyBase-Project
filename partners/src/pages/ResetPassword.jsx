import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, friendlyError } from '../lib/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('This reset link is invalid or has expired.');
      return;
    }

    if (password.length < 8 || password.length > 72) {
      setError('Password must be between 8 and 72 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);

    try {
      await api.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="partner-reset-page">
      <div className="partner-reset-card">

        <div className="partner-reset-logo">
  <img
    src="/assets/brand/logo.webp"
    alt="SupplyBase logo"
  />
</div>

        {!success ? (
          <>
            <h1>
              Reset <span>Your Password</span>
            </h1>

            <p className="partner-reset-subtitle">
              Create a new password for your SupplyBase Partners account.
            </p>

            <form onSubmit={handleSubmit} className="partner-reset-form">

              <div className="partner-reset-field">
                <label htmlFor="new-password">
                  New Password
                </label>

                <input
                  id="new-password"
                  type="password"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                  autoComplete="new-password"
                />
              </div>

              <div className="partner-reset-field">
                <label htmlFor="confirm-password">
                  Confirm Password
                </label>

                <input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={busy}
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div className="partner-reset-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="partner-reset-button"
                disabled={busy}
              >
                {busy ? 'Resetting...' : 'Reset Password'}
                {!busy && <span>→</span>}
              </button>

            </form>

            <Link to="/login" className="partner-reset-back">
              ← Back to Partner Login
            </Link>
          </>
        ) : (
          <div className="partner-reset-success">

            <div className="partner-reset-success-icon">
              ✓
            </div>

            <h1>
              Password <span>Reset Successfully</span>
            </h1>

            <p>
              Your SupplyBase Partners password has been changed successfully.
            </p>

            <Link to="/login" className="partner-reset-button">
              Sign In
              <span>→</span>
            </Link>

          </div>
        )}

      </div>
    </div>
  );
}
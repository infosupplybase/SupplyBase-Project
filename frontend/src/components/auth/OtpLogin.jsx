import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import { useAuth, friendlyError } from '../../context/AuthContext';
import { isValidPhone } from '../../lib/bookingDetails';
import api from '../../lib/api';

const RESEND_SECONDS = 30;

/**
 * Login with OTP: mobile number -> 6-digit code by SMS (2Factor) -> signed in.
 *
 * A number with no account yet gets one more step, name and email, and the
 * same code then creates the account. `onDone(user)` runs once signed in;
 * `onBack` returns to the password form.
 */
export default function OtpLogin({ prefillPhone = '', onDone, onBack }) {
  const { loginWithOtp } = useAuth();
  const [step, setStep] = useState('phone'); // phone | code | details
  const [phone, setPhone] = useState(prefillPhone);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [wait, setWait] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const codeRef = useRef(null);

  useEffect(() => {
    if (wait <= 0) return undefined;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus();
  }, [step]);

  const sendCode = async () => {
    setError('');
    setNotice('');
    if (!isValidPhone(phone)) {
      setError('Enter a 10-digit mobile number.');
      return;
    }
    setBusy(true);
    try {
      await api.sendOtp(phone);
      setStep('code');
      setCode('');
      setWait(RESEND_SECONDS);
      setNotice('We have sent a 6-digit code by SMS. It is valid for 5 minutes.');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (details) => {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const result = await loginWithOtp(phone, code, details?.name, details?.email);
      if (result && result.needsDetails) {
        setStep('details');
        return;
      }
      onDone?.(result);
    } catch (err) {
      setError(friendlyError(err));
      // An expired or used-up code cannot be retried; go back to asking for one.
      if (/expired|ask for a new one/i.test(friendlyError(err))) {
        setStep('code');
        setCode('');
        setWait(0);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Shown over a booking form; must not submit that one too.
    e.stopPropagation();
    if (step === 'phone') {
      sendCode();
    } else if (step === 'code') {
      if (!/^\d{6}$/.test(code)) {
        setError('Enter the 6-digit code from the SMS.');
        return;
      }
      verify();
    } else {
      if (!name.trim()) return setError('Please enter your name.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
        return setError('Please enter a valid email address.');
      if (!accepted) return setError('Please accept the terms and privacy policy to continue.');
      verify({ name: name.trim(), email: email.trim() });
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="auth-form auth-otp">
      {step === 'phone' && (
        <div className="field auth-field">
          <label htmlFor="otp-phone">Mobile Number</label>
          <div className="auth-input-wrap">
            <Icon name="phone" size={17} className="auth-input-icon" />
            <input
              id="otp-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError('');
              }}
              autoFocus
            />
          </div>
        </div>
      )}

      {step !== 'phone' && (
        <p className="auth-otp-sent">
          Code sent to <strong>{phone}</strong>{' '}
          <button
            type="button"
            className="auth-inline-link"
            onClick={() => {
              setStep('phone');
              setError('');
              setNotice('');
            }}
          >
            Change
          </button>
        </p>
      )}

      {step === 'code' && (
        <div className="field auth-field">
          <label htmlFor="otp-code">Enter OTP</label>
          <div className="auth-input-wrap">
            <Icon name="lock" size={17} className="auth-input-icon" />
            <input
              id="otp-code"
              ref={codeRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="6-digit code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                setError('');
              }}
            />
          </div>
          <div className="login-meta">
            <span />
            <button
              type="button"
              className="auth-inline-link auth-forgot"
              onClick={sendCode}
              disabled={busy || wait > 0}
            >
              {wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}
            </button>
          </div>
        </div>
      )}

      {step === 'details' && (
        <>
          <p className="auth-otp-sent">Number verified. Tell us a little about you to create your account.</p>
          <div className="field auth-field">
            <label htmlFor="otp-name">
              Full Name <span className="req">*</span>
            </label>
            <div className="auth-input-wrap">
              <Icon name="user" size={17} className="auth-input-icon" />
              <input
                id="otp-name"
                type="text"
                autoComplete="name"
                placeholder="Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="field auth-field">
            <label htmlFor="otp-email">
              Email Address <span className="req">*</span>
            </label>
            <div className="auth-input-wrap">
              <Icon name="mail" size={17} className="auth-input-icon" />
              <input
                id="otp-email"
                type="email"
                autoComplete="email"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <label className="checkbox-row">
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
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
        </>
      )}

      {error && (
        <div role="alert" className="alert alert-error">
          <Icon name="info" size={18} />
          <span>{error}</span>
        </div>
      )}
      {notice && !error && (
        <div role="status" className="alert alert-success">
          <Icon name="check-circle" size={18} />
          <span>{notice}</span>
        </div>
      )}

      <button type="submit" className="auth-submit" disabled={busy}>
        {busy
          ? 'Please wait…'
          : step === 'phone'
            ? 'Send OTP'
            : step === 'code'
              ? 'Verify & Sign In'
              : 'Create Account'}
        {!busy && <Icon name="arrow-right" size={18} />}
      </button>

      <button type="button" className="auth-otp-btn" onClick={onBack} disabled={busy}>
        <Icon name="lock" size={17} />
        Use password instead
      </button>
    </form>
  );
}

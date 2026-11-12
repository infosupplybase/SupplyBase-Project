import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import { useAuth, friendlyError } from '../../context/AuthContext';
import { isValidPhone } from '../../lib/bookingDetails';
import api from '../../lib/api';

const RESEND_SECONDS = 30;

/**
 * Login with OTP: Name + Mobile -> Send OTP -> 6-digit code by SMS (2Factor)
 * -> Verify OTP -> signed in.
 *
 * The same form logs in and signs up: a number that already has an account
 * signs into it (the name typed is not used), a new number gets an account
 * with that name. No email or password needed.
 * `onDone(user)` runs once signed in; `onBack` opens the password form.
 */
export default function OtpLogin({ prefillName = '', prefillPhone = '', onDone, onBack }) {
  const { loginWithOtp } = useAuth();
  const [step, setStep] = useState('phone'); // phone | code
  const [name, setName] = useState(prefillName);
  const [phone, setPhone] = useState(prefillPhone);
  const [code, setCode] = useState('');
  const [wait, setWait] = useState(0);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
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

  const clearMessages = () => {
    setError('');
    setNotice('');
  };

  const sendCode = async () => {
    clearMessages();
    const next = {};
    if (!name.trim()) next.name = 'Please enter your name';
    if (!isValidPhone(phone)) next.phone = 'Enter a 10-digit mobile number';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await api.sendOtp(phone);
      setStep('code');
      setCode('');
      setWait(RESEND_SECONDS);
      setNotice('OTP sent by SMS. It is valid for 5 minutes.');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    clearMessages();
    if (!/^\d{6}$/.test(code)) {
      setErrors({ code: 'Enter the 6-digit OTP from the SMS' });
      return;
    }
    setBusy(true);
    try {
      const result = await loginWithOtp(phone, code, name.trim());
      if (result && result.needsDetails) {
        // Only if the name went missing on the way; ask again.
        setStep('phone');
        setErrors({ name: 'Please enter your name' });
        return;
      }
      onDone?.(result);
    } catch (err) {
      const message = friendlyError(err);
      setError(message);
      // An expired or used-up code cannot be retried; let them ask for a new one.
      if (/expired|ask for a new one/i.test(message)) {
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
    if (step === 'phone') sendCode();
    else verify();
  };

  const locked = step === 'code';

  return (
    <form onSubmit={handleSubmit} noValidate className="auth-form auth-otp">
      <div className={`field auth-field ${errors.name ? 'error' : ''}`}>
        <label htmlFor="otp-name">
          Name <span className="req">*</span>
        </label>
        <div className="auth-input-wrap">
          <Icon name="user" size={17} className="auth-input-icon" />
          <input
            id="otp-name"
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            maxLength={120}
            value={name}
            readOnly={locked}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((x) => ({ ...x, name: undefined }));
            }}
          />
        </div>
        {errors.name && <span className="field-error">{errors.name}</span>}
      </div>

      <div className={`field auth-field ${errors.phone ? 'error' : ''}`}>
        <label htmlFor="otp-phone">
          Mobile Number <span className="req">*</span>
        </label>
        <div className="auth-input-wrap">
          <Icon name="phone" size={17} className="auth-input-icon" />
          <input
            id="otp-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="98765 43210"
            value={phone}
            readOnly={locked}
            onChange={(e) => {
              setPhone(e.target.value);
              setErrors((x) => ({ ...x, phone: undefined }));
            }}
          />
          {locked && (
            <button
              type="button"
              className="auth-inline-link auth-otp-change"
              onClick={() => {
                setStep('phone');
                setCode('');
                clearMessages();
              }}
            >
              Change
            </button>
          )}
        </div>
        {errors.phone && <span className="field-error">{errors.phone}</span>}
      </div>

      {locked && (
        <div className={`field auth-field ${errors.code ? 'error' : ''}`}>
          <label htmlFor="otp-code">
            Enter OTP <span className="req">*</span>
          </label>
          <div className="auth-input-wrap">
            <Icon name="lock" size={17} className="auth-input-icon" />
            <input
              id="otp-code"
              ref={codeRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="6-digit OTP"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                setErrors((x) => ({ ...x, code: undefined }));
              }}
            />
          </div>
          {errors.code && <span className="field-error">{errors.code}</span>}
          <div className="login-meta">
            <span />
            <button
              type="button"
              className="auth-inline-link auth-forgot"
              onClick={sendCode}
              disabled={busy || wait > 0}
            >
              {wait > 0 ? `Resend OTP in ${wait}s` : 'Resend OTP'}
            </button>
          </div>
        </div>
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
        {busy ? 'Please wait…' : locked ? 'Verify OTP & Login' : 'Send OTP'}
        {!busy && <Icon name="arrow-right" size={18} />}
      </button>

      <p className="auth-otp-terms">
        By continuing you agree to our{' '}
        <Link to="/terms" className="auth-inline-link" target="_blank">
          Terms
        </Link>{' '}
        &amp;{' '}
        <Link to="/privacy-policy" className="auth-inline-link" target="_blank">
          Privacy Policy
        </Link>
        .
      </p>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <button type="button" className="auth-otp-btn" onClick={onBack} disabled={busy}>
        <Icon name="mail" size={17} />
        Login with email &amp; password
      </button>
    </form>
  );
}

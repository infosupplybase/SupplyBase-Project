import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import { COMPANY_NAME, SITE_URL } from '../config';
import { useAuth, friendlyError } from '../context/AuthContext';
import api from '../lib/api';

/**
 * /join — a professional applying to work with Supplybase.
 *
 * One form creates the login and the application together. The person is
 * signed in straight away and lands on the dashboard, which tells them their
 * application is being reviewed. Nothing here grants any access to jobs:
 * only an admin approving the application does that, so the form has no
 * "role" of any kind to fill in or tamper with.
 *
 * The trade list comes from the live service catalogue, so it always matches
 * what customers can book (and what the API will accept).
 */
const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirm: '',
  primaryTrade: '',
  experienceYears: '',
  city: '',
  serviceAreas: '',
  languages: '',
};

/** Ten digits after the +91 and the spaces are taken out. */
const isValidPhone = (value) =>
  /^[6-9]\d{9}$/.test(String(value).replace(/\D/g, '').replace(/^91/, '').replace(/^0/, ''));

/**
 * One field of the dark card: label, icon, input, error.
 *
 * Declared out here rather than inside PartnerJoin on purpose: a component
 * defined during render is a brand-new component type every render, so React
 * would throw the input away and rebuild it on each keystroke, dropping focus.
 */
function Field({ id, label, icon, required, hint, error, children }) {
  return (
    <div className={`field auth-field ${error ? 'error' : ''}`}>
      <label htmlFor={`pj-${id}`}>
        {label} {required && <span className="req">*</span>}
      </label>
      <div className="auth-input-wrap">
        <Icon name={icon} size={17} className="auth-input-icon" />
        {children}
      </div>
      {error ? <span className="field-error">{error}</span> : hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

export default function Join() {
  const { user, applyAsPartner } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [trades, setTrades] = useState(null);
  const [tradesError, setTradesError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // already signed in? the dashboard explains what that means for them
  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    let cancelled = false;
    api
      .services()
      .then((list) => {
        if (cancelled) return;
        setTrades(list.filter((c) => !c.parentSlug && c.active !== false));
      })
      .catch((err) => {
        if (!cancelled) setTradesError(friendlyError(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: undefined }));
    setError('');
  };

  /** Field-level checks; the API repeats them and can add its own (email taken). */
  const validate = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = 'Please enter your name';
    if (!form.email.trim()) next.email = 'Please enter your email address';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = 'Please enter a valid email address';
    if (!form.phone.trim()) next.phone = 'Please enter your phone number';
    else if (!isValidPhone(form.phone)) next.phone = 'Enter a 10-digit mobile number';
    if (!form.password) next.password = 'Please choose a password';
    else if (form.password.length < 8) next.password = 'Use at least eight characters';
    if (form.confirm !== form.password) next.confirm = 'Both passwords must match';
    if (!form.primaryTrade) next.primaryTrade = 'Please choose the work you do';
    const years = Number(form.experienceYears);
    if (form.experienceYears === '') next.experienceYears = 'Please enter your years of experience';
    else if (!Number.isInteger(years) || years < 0 || years > 60)
      next.experienceYears = 'Enter a whole number from 0 to 60';
    if (!form.city.trim()) next.city = 'Please enter your city';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) {
      const first = document.querySelector('.field.error input, .field.error select');
      if (first) first.focus();
      return;
    }
    if (!accepted) {
      setError('Please accept the terms and privacy policy to continue.');
      return;
    }

    setBusy(true);
    try {
      await applyAsPartner(form);
      navigate('/', { replace: true });
    } catch (err) {
      // The API can reject what the browser cannot know (an email already in
      // use) — put those back on the fields they belong to.
      if (err && err.fieldErrors) setErrors(err.fieldErrors);
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-glow" aria-hidden="true" />

      <div className="auth-card-wrap">
        <div className="auth-card auth-card-tall">
          <a href={SITE_URL} className="auth-logo">
            <img src="/assets/brand/logo.png" alt={`${COMPANY_NAME} logo`} />
          </a>

          <h1 className="auth-heading">
            Join as a <span className="auth-accent">Partner</span>
          </h1>
          <p className="auth-intro">
            Tell us about your work. We review every application by hand, and you can sign in to
            check on yours at any time.
          </p>

          <form onSubmit={handleSubmit} noValidate className="auth-form">
            <Field id="fullName" error={errors.fullName} label="Full Name" icon="user" required>
              <input
                id="pj-fullName"
                type="text"
                value={form.fullName}
                onChange={update('fullName')}
                placeholder="Ravi Kumar"
                autoComplete="name"
              />
            </Field>

            <Field id="phone" error={errors.phone} label="Mobile Number" icon="phone" required hint="You can sign in with this number too.">
              <input
                id="pj-phone"
                type="tel"
                value={form.phone}
                onChange={update('phone')}
                placeholder="98765 43210"
                autoComplete="tel"
                inputMode="numeric"
              />
            </Field>

            <Field id="email" error={errors.email} label="Email Address" icon="mail" required>
              <input
                id="pj-email"
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="name@domain.com"
                autoComplete="email"
              />
            </Field>

            <Field id="primaryTrade" error={errors.primaryTrade} label="What work do you do?" icon="wrench" required>
              <select
                id="pj-primaryTrade"
                value={form.primaryTrade}
                onChange={update('primaryTrade')}
                disabled={!trades}
              >
                <option value="">
                  {trades ? 'Choose your main trade' : tradesError ? 'Could not load trades' : 'Loading…'}
                </option>
                {(trades || []).map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.name}
                  </option>
                ))}
              </select>
              <Icon name="chevron-down" size={16} className="auth-select-caret" />
            </Field>
            {tradesError && (
              <div role="alert" className="alert alert-error">
                <Icon name="info" size={18} />
                <span>{tradesError}</span>
              </div>
            )}

            <div className="auth-row-2">
              <Field id="experienceYears" error={errors.experienceYears} label="Years of Experience" icon="award" required>
                <input
                  id="pj-experienceYears"
                  type="number"
                  min="0"
                  max="60"
                  inputMode="numeric"
                  value={form.experienceYears}
                  onChange={update('experienceYears')}
                  placeholder="5"
                />
              </Field>

              <Field id="city" error={errors.city} label="City" icon="map-pin" required>
                <input
                  id="pj-city"
                  type="text"
                  value={form.city}
                  onChange={update('city')}
                  placeholder="Thane"
                  autoComplete="address-level2"
                />
              </Field>
            </div>

            <Field id="serviceAreas" error={errors.serviceAreas} label="Areas You Work In" icon="map-pin" hint="Optional — localities you can travel to.">
              <input
                id="pj-serviceAreas"
                type="text"
                value={form.serviceAreas}
                onChange={update('serviceAreas')}
                placeholder="Thane West, Kalyan"
              />
            </Field>

            <Field id="languages" error={errors.languages} label="Languages You Speak" icon="chat" hint="Optional.">
              <input
                id="pj-languages"
                type="text"
                value={form.languages}
                onChange={update('languages')}
                placeholder="Hindi, Marathi"
              />
            </Field>

            <div className="auth-row-2">
              <Field id="password" error={errors.password} label="Password" icon="lock" required>
                <input
                  id="pj-password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  placeholder="At least eight characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-input-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} />
                </button>
              </Field>

              <Field id="confirm" error={errors.confirm} label="Confirm Password" icon="lock" required>
                <input
                  id="pj-confirm"
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={update('confirm')}
                  placeholder="Type it once more"
                  autoComplete="new-password"
                />
              </Field>
            </div>

            <div className="login-meta">
              <label className="checkbox-row">
                <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
                <span>
                  I agree to the{' '}
                  <a href={`${SITE_URL}/terms`} target="_blank" rel="noreferrer" className="auth-inline-link">
                    Terms
                  </a>{' '}
                  &amp;{' '}
                  <a href={`${SITE_URL}/privacy-policy`} target="_blank" rel="noreferrer" className="auth-inline-link">
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>

            <p className="partner-auth-note">
              Applying does not guarantee work. Jobs appear on your dashboard only after our team has
              approved your application.
            </p>

            {error && (
              <div role="alert" className="alert alert-error">
                <Icon name="info" size={18} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={busy}>
              {busy ? 'Sending Application…' : 'Submit Application'}
              {!busy && <Icon name="arrow-right" size={18} />}
            </button>
          </form>

          <p className="auth-switch">
            Already applied? <Link to="/login">Partner Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

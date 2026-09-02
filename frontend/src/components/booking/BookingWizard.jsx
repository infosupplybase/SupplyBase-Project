'use client';

import { useMemo, useState } from 'react';
import Icon from '../ui/Icon';
import api, { friendlyError } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { budgetRanges, contact } from '../../data/siteConfig';
import {
  areaRelevant,
  bookingLanes,
  materialOptions,
  propertyTypes,
  serviceWorkOptions,
  servicesForLane,
  timeSlots,
  workNatures,
} from '../../data/booking';

/**
 * BookingWizard — the site-visit request, one question at a time.
 *
 * Five steps rather than one long form. A single page asking for service,
 * property, area, budget, date and address at once is where people give up;
 * five short screens with visible progress is the same information without
 * the wall.
 *
 * Only the last step can submit. Every earlier step validates before it will
 * advance, so nobody reaches the end and is then sent back to fix something
 * they filled in four screens ago.
 */
const STEPS = ['Service', 'Property', 'Your work', 'Appointment', 'Contact'];

const emptyForm = {
  serviceSlug: '',
  propertyType: '',
  areaSqft: '',
  workNature: '',
  workOption: '',
  workDetail: '',
  materialSupplier: '',
  budgetRange: '',
  preferredDate: '',
  preferredSlot: '',
  name: '',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  location: '',
  hasAttachments: false,
};

/** Ten digits once the +91, spaces and brackets are stripped. */
const isValidPhone = (value) =>
  /^[6-9]\d{9}$/.test(
    String(value || '')
      .replace(/\D/g, '')
      .replace(/^91/, '')
      .replace(/^0/, '')
  );

/** Tomorrow, as yyyy-mm-dd. The API refuses dates that are not in the future. */
const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
};

export default function BookingWizard({ lane = 'service', onLaneChange }) {
  const { user } = useAuth();
  const config = bookingLanes[lane];

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    // A signed-in client should not retype what we already know about them.
    name: user ? user.fullName || '' : '',
    phone: user ? user.phone || '' : '',
    email: user ? user.email || '' : '',
  }));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const services = useMemo(() => servicesForLane(lane), [lane]);
  const selected = services.find((s) => s.slug === form.serviceSlug);
  const workOptions = serviceWorkOptions[form.serviceSlug] || [];
  const showArea = form.serviceSlug && areaRelevant.has(form.serviceSlug);

  const update = (field) => (value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    setError('');
  };

  const fromInput = (field) => (e) => update(field)(e.target.value);

  /** What must be true before a given step will let you past it. */
  const validateStep = (index) => {
    const next = {};
    if (index === 0 && !form.serviceSlug) next.serviceSlug = 'Please choose a service';
    if (index === 1 && !form.propertyType) next.propertyType = 'Please choose a property type';
    if (index === 2) {
      if (showArea && form.areaSqft && Number(form.areaSqft) <= 0) {
        next.areaSqft = 'Area must be more than zero';
      }
      if (!form.location.trim()) next.location = 'Please tell us the area or city';
    }
    if (index === 4) {
      if (!form.name.trim()) next.name = 'Please enter your name';
      if (!form.phone.trim()) next.phone = 'Please enter your mobile number';
      else if (!isValidPhone(form.phone)) next.phone = 'Enter a 10-digit mobile number';
      if (form.whatsapp.trim() && !isValidPhone(form.whatsapp)) {
        next.whatsapp = 'Enter a 10-digit number, or leave it blank';
      }
      if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        next.email = 'That email address does not look right';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setBusy(true);
    setError('');
    try {
      const result = await api.createBooking({
        bookingType: config.id,
        serviceSlug: form.serviceSlug,
        serviceLabel: selected ? selected.label : form.serviceSlug,
        propertyType: form.propertyType || null,
        areaSqft: form.areaSqft ? Number(form.areaSqft) : null,
        workNature: form.workNature || null,
        workOption: form.workOption || null,
        workDetail: form.workDetail || null,
        materialSupplier: form.materialSupplier || null,
        budgetRange: form.budgetRange || null,
        preferredDate: form.preferredDate || null,
        preferredSlot: form.preferredSlot || null,
        name: form.name,
        phone: form.phone,
        whatsapp: form.whatsapp || null,
        email: form.email || null,
        address: form.address || null,
        location: form.location || null,
        hasAttachments: form.hasAttachments,
      });
      setReceipt(result);
    } catch (err) {
      if (err && err.fieldErrors) setErrors(err.fieldErrors);
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------------------------------------------ done */

  if (receipt) {
    return (
      <div className="booking-done">
        <div className="booking-done-icon">
          <Icon name="check-circle" size={40} strokeWidth={1.5} />
        </div>
        <h2>YOUR SITE VISIT HAS BEEN REQUESTED</h2>
        <p className="booking-ref">{receipt.reference}</p>
        <p>{receipt.message}</p>

        {receipt.sendAttachments && (
          <div className="alert alert-info" style={{ textAlign: 'left', marginTop: 20 }}>
            <Icon name="info" size={18} />
            <span>
              Send your photos and floor plan to <strong>{contact.phoneDisplay}</strong> on
              WhatsApp, quoting <strong>{receipt.reference}</strong>. It helps us come prepared.
            </span>
          </div>
        )}

        <div className="btn-row" style={{ justifyContent: 'center', marginTop: 26 }}>
          <a
            href={`https://wa.me/${contact.phoneRaw}?text=${encodeURIComponent(
              `Hello Supplybase Projects, this is about my booking ${receipt.reference}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp"
          >
            <Icon name="whatsapp" size={17} />
            MESSAGE US ON WHATSAPP
          </a>
          <a href={`tel:+${contact.phoneRaw}`} className="btn btn-ghost">
            <Icon name="phone" size={17} />
            {contact.phoneDisplay}
          </a>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------------- steps */

  return (
    <div className="booking">
      {/* lane switch — the two paths promise different things, so the choice
          stays visible rather than being buried on the previous page */}
      <div className="booking-lanes" role="tablist" aria-label="Booking type">
        {Object.entries(bookingLanes).map(([key, value]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={lane === key}
            className={`booking-lane ${lane === key ? 'active' : ''}`}
            onClick={() => {
              if (key !== lane) {
                onLaneChange(key);
                // The service lists differ, so a service chosen in the other
                // lane may not exist here. Clearing beats a silent mismatch.
                setForm((f) => ({ ...f, serviceSlug: '', workOption: '' }));
                setStep(0);
              }
            }}
          >
            <strong>{value.label}</strong>
            <span>{value.tagline}</span>
          </button>
        ))}
      </div>

      <ol className="booking-steps">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`booking-step ${i === step ? 'current' : ''} ${i < step ? 'done' : ''}`}
          >
            <span className="booking-step-num">{i < step ? <Icon name="check" size={14} /> : i + 1}</span>
            <span className="booking-step-label">{label}</span>
          </li>
        ))}
      </ol>

      <form onSubmit={handleSubmit} noValidate>
        {/* ---------------------------------------------- 1. service */}
        {step === 0 && (
          <fieldset className="booking-panel">
            <legend>Which service do you need?</legend>
            <div className="choice-grid">
              {services.map((service) => (
                <button
                  key={service.slug}
                  type="button"
                  className={`choice ${form.serviceSlug === service.slug ? 'active' : ''}`}
                  onClick={() => update('serviceSlug')(service.slug)}
                >
                  {service.label}
                </button>
              ))}
            </div>
            {errors.serviceSlug && <span className="field-error">{errors.serviceSlug}</span>}
          </fieldset>
        )}

        {/* --------------------------------------------- 2. property */}
        {step === 1 && (
          <fieldset className="booking-panel">
            <legend>What kind of property is it?</legend>
            <div className="choice-grid">
              {propertyTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`choice ${form.propertyType === type ? 'active' : ''}`}
                  onClick={() => update('propertyType')(type)}
                >
                  {type}
                </button>
              ))}
            </div>
            {errors.propertyType && <span className="field-error">{errors.propertyType}</span>}
          </fieldset>
        )}

        {/* ------------------------------------------------- 3. work */}
        {step === 2 && (
          <fieldset className="booking-panel">
            <legend>Tell us about the work</legend>

            <div className="form-grid">
              {showArea && (
                <div className={`field ${errors.areaSqft ? 'error' : ''}`}>
                  <label htmlFor="bk-area">Area (sq. ft.)</label>
                  <input
                    id="bk-area"
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={form.areaSqft}
                    onChange={fromInput('areaSqft')}
                    placeholder="e.g. 1200"
                  />
                  {errors.areaSqft && <span className="field-error">{errors.areaSqft}</span>}
                </div>
              )}

              <div className={`field ${errors.location ? 'error' : ''}`}>
                <label htmlFor="bk-location">
                  Area / City <span className="req">*</span>
                </label>
                <input
                  id="bk-location"
                  type="text"
                  value={form.location}
                  onChange={fromInput('location')}
                  placeholder="e.g. Thane West"
                />
                {errors.location && <span className="field-error">{errors.location}</span>}
              </div>

              <div className="field">
                <label htmlFor="bk-nature">Nature of work</label>
                <select id="bk-nature" value={form.workNature} onChange={fromInput('workNature')}>
                  <option value="">Select…</option>
                  {workNatures.map((nature) => (
                    <option key={nature} value={nature}>
                      {nature}
                    </option>
                  ))}
                </select>
              </div>

              {workOptions.length > 0 && (
                <div className="field">
                  <label htmlFor="bk-option">Type of {selected ? selected.label.toLowerCase() : 'work'}</label>
                  <select id="bk-option" value={form.workOption} onChange={fromInput('workOption')}>
                    <option value="">Select…</option>
                    {workOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="field">
                <label htmlFor="bk-material">Material</label>
                <select
                  id="bk-material"
                  value={form.materialSupplier}
                  onChange={fromInput('materialSupplier')}
                >
                  <option value="">Select…</option>
                  {materialOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="bk-budget">Approximate budget</label>
                <select id="bk-budget" value={form.budgetRange} onChange={fromInput('budgetRange')}>
                  <option value="">Select…</option>
                  {budgetRanges.map((band) => (
                    <option key={band} value={band}>
                      {band}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field" style={{ marginTop: 16 }}>
              <label htmlFor="bk-detail">Anything else we should know?</label>
              <textarea
                id="bk-detail"
                rows={4}
                value={form.workDetail}
                onChange={fromInput('workDetail')}
                placeholder="Describe the work, any problems you are seeing, or your timeline."
              />
            </div>

            {/* Uploads are collected on WhatsApp for now. Asking here records
                that they exist, so the team knows to chase them. */}
            <label className="checkbox-row" style={{ marginTop: 14 }}>
              <input
                type="checkbox"
                checked={form.hasAttachments}
                onChange={(e) => update('hasAttachments')(e.target.checked)}
              />
              <span>I have photos, a video or a floor plan to share</span>
            </label>
            {form.hasAttachments && (
              <p className="field-hint" style={{ marginTop: 6 }}>
                We will ask for them on WhatsApp right after you book.
              </p>
            )}
          </fieldset>
        )}

        {/* ------------------------------------------ 4. appointment */}
        {step === 3 && (
          <fieldset className="booking-panel">
            <legend>When suits you?</legend>
            <p className="field-hint" style={{ marginBottom: 16 }}>
              This is a preference, not a fixed appointment — we will confirm the exact time with
              you. Leave it blank and we will suggest a time.
            </p>

            <div className="field" style={{ maxWidth: 280 }}>
              <label htmlFor="bk-date">Preferred date</label>
              <input
                id="bk-date"
                type="date"
                min={tomorrow()}
                value={form.preferredDate}
                onChange={fromInput('preferredDate')}
              />
            </div>

            <p className="booking-slot-label">Preferred time</p>
            <div className="choice-grid slots">
              {timeSlots.map((slot) => (
                <button
                  key={slot.value}
                  type="button"
                  className={`choice ${form.preferredSlot === slot.value ? 'active' : ''}`}
                  onClick={() =>
                    update('preferredSlot')(form.preferredSlot === slot.value ? '' : slot.value)
                  }
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {/* --------------------------------------------- 5. contact */}
        {step === 4 && (
          <fieldset className="booking-panel">
            <legend>How do we reach you?</legend>
            <div className="form-grid">
              <div className={`field ${errors.name ? 'error' : ''}`}>
                <label htmlFor="bk-name">
                  Name <span className="req">*</span>
                </label>
                <input id="bk-name" type="text" value={form.name} onChange={fromInput('name')} />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>

              <div className={`field ${errors.phone ? 'error' : ''}`}>
                <label htmlFor="bk-phone">
                  Mobile <span className="req">*</span>
                </label>
                <input
                  id="bk-phone"
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={fromInput('phone')}
                  placeholder="98765 43210"
                />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>

              <div className={`field ${errors.whatsapp ? 'error' : ''}`}>
                <label htmlFor="bk-whatsapp">WhatsApp</label>
                <input
                  id="bk-whatsapp"
                  type="tel"
                  inputMode="numeric"
                  value={form.whatsapp}
                  onChange={fromInput('whatsapp')}
                  placeholder="Same as mobile"
                />
                {errors.whatsapp ? (
                  <span className="field-error">{errors.whatsapp}</span>
                ) : (
                  <span className="field-hint">Leave blank if it is the same number.</span>
                )}
              </div>

              <div className={`field ${errors.email ? 'error' : ''}`}>
                <label htmlFor="bk-email">Email</label>
                <input
                  id="bk-email"
                  type="email"
                  value={form.email}
                  onChange={fromInput('email')}
                  placeholder="you@example.com"
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>
            </div>

            <div className="field" style={{ marginTop: 16 }}>
              <label htmlFor="bk-address">Project address</label>
              <textarea
                id="bk-address"
                rows={3}
                value={form.address}
                onChange={fromInput('address')}
                placeholder="Flat / building, street, landmark"
              />
            </div>

            <p className="field-hint" style={{ marginTop: 14 }}>
              {config.promise}
            </p>
          </fieldset>
        )}

        {error && (
          <div role="alert" className="alert alert-error" style={{ marginTop: 18 }}>
            <Icon name="info" size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="booking-nav">
          {step > 0 ? (
            <button type="button" className="btn btn-ghost" onClick={goBack}>
              BACK
            </button>
          ) : (
            <span />
          )}

          {step < STEPS.length - 1 ? (
            <button type="button" className="btn btn-primary" onClick={goNext}>
              CONTINUE
              <Icon name="arrow-right" size={17} />
            </button>
          ) : (
            <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
              {busy ? 'SENDING…' : config.cta}
              <Icon name="arrow-right" size={18} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

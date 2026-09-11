import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import SlotPicker from '../components/booking/SlotPicker';
import api, { friendlyError } from '../lib/api';
import { useLocationContext } from '../context/LocationContext';
import { getSpaceBySlug, getDesignBySlug, HOME_VISIT_FEE } from '../data/interiorCatalog';

const STEPS = ['Details', 'Schedule', 'Confirm'];
const CATEGORY_SLUG = 'interior-by-choice';

/** Ten digits once the +91, spaces and brackets are stripped — same rule the
    site-visit wizard uses, so a phone number valid there is valid here. */
const isValidPhone = (value) =>
  /^[6-9]\d{9}$/.test(String(value || '').replace(/\D/g, '').replace(/^91/, '').replace(/^0/, ''));

/**
 * /interior-by-choice/book and /interior-by-choice/:spaceSlug/:designSlug/book
 *
 * The paid home-visit booking flow from the mockup: Details -> Schedule ->
 * Confirm. Books against the real `interior-by-choice` catalogue category —
 * a real POST /api/bookings, real slot availability from the backend, and a
 * real booking number on confirmation. (This used to fabricate a client-side
 * reference and never call the API — fixed as part of the seven-category
 * catalogue rework, since InteriorBooking now has a real category to book
 * against.)
 */
export default function InteriorBooking({
  modal = false,
  spaceSlug: propSpaceSlug,
  designSlug: propDesignSlug,
  onBack,
  onStepChange,
}) {
  const params = useParams();

const spaceSlug = propSpaceSlug || params.spaceSlug;
const designSlug = propDesignSlug || params.designSlug;
  const { location } = useLocationContext();
  const space = spaceSlug ? getSpaceBySlug(spaceSlug) : null;
  const design = spaceSlug && designSlug ? getDesignBySlug(spaceSlug, designSlug) : null;

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' });
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
  if (modal && onStepChange) {
    onStepChange();
  }
}, [step, receipt, modal, onStepChange]);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validateDetails = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Enter your name';
    if (!isValidPhone(form.phone)) next.phone = 'Enter a valid 10-digit mobile number';
    if (!form.address.trim()) next.address = 'Enter your address';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goToSchedule = () => {
    if (validateDetails()) setStep(1);
  };

  const submit = async () => {
    if (!date || !time) {
      setErrors((e) => ({ ...e, slot: 'Pick a date and a time' }));
      return;
    }

    const selectedLabel = design ? `${space.name} – ${design.name}` : space ? space.name : 'Not selected from the catalogue';
    const notesParts = [`Selected design: ${selectedLabel}.`];
    if (form.notes.trim()) notesParts.push(form.notes.trim());

    setBusy(true);
    setError('');
    try {
      const result = await api.createBooking({
        serviceSlug: CATEGORY_SLUG,
        answers: [{ key: 'notes', value: notesParts.join(' ').slice(0, 400), label: 'Selected design and requirements' }],
        preferredDate: date,
        preferredTime: time,
        name: form.name.trim(),
        phone: form.phone,
        address: form.address.trim(),
        city: location,
      });
      setReceipt(result);
setStep(2);

if (modal) {
  onStepChange?.();
} else {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
    } catch (err) {
      if (err && err.fieldErrors) setErrors(err.fieldErrors);
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
     {!modal && (  <PageHero
        eyebrow="INTERIOR BY CHOICE"
        title="Book a Home Visit"
        breadcrumbs={[{ label: 'Interior by Choice', to: '/interior-by-choice' }, { label: 'Book a Home Visit' }]}
      />)}

<section
  className={
    modal
      ? 'ibc-booking-modal w-full'
      : 'ibc-section'
  }
>
  <div
    className={
      modal
        ? 'w-full max-sm:mx-auto max-sm:max-w-[360px]'
        : 'container container-narrow'
    }
  >
          {step < 2 && (
            <ol className="ibc-steps">
              {STEPS.map((label, i) => (
                <li key={label} className={`ibc-step ${i === step ? 'current' : ''} ${i < step ? 'done' : ''}`}>
                  <span className="ibc-step-num">{i < step ? <Icon name="check" size={14} /> : i + 1}</span>
                  <span>{label}</span>
                </li>
              ))}
            </ol>
          )}

          {(space || design) && step < 2 && (
            <div className="ibc-selected-service">
              <img src={(design || space).image} alt={(design || space).name} />
              <div>
                <span className="ibc-selected-label">Selected Service</span>
                <strong>{design ? `${space.name} – ${design.name}` : space.name}</strong>
                {design && <span className="ibc-selected-price">₹{HOME_VISIT_FEE} (Visit Charge)</span>}
              </div>
              {modal ? (
  <button
    type="button"
    onClick={onBack}
    className="ibc-selected-change"
  >
    Change
  </button>
) : (
  <Link
    to={`/interior-by-choice${spaceSlug ? `/${spaceSlug}` : ''}`}
  >
    Change
  </Link>
)}
            </div>
          )}

          {step === 0 && (
            <div className="ibc-form-panel">
              <h3>Your Details</h3>
              <div className={`field ${errors.name ? 'error' : ''}`}>
                <label>Full Name <span className="req">*</span></label>
                <input type="text" placeholder="Your name" value={form.name} onChange={setField('name')} />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>
              <div className={`field ${errors.phone ? 'error' : ''}`}>
                <label>Phone Number <span className="req">*</span></label>
                <input type="tel" placeholder="+91" value={form.phone} onChange={setField('phone')} />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>
              <div className={`field ${errors.address ? 'error' : ''}`}>
                <label>Full Address <span className="req">*</span></label>
                <input type="text" placeholder="Enter your complete address" value={form.address} onChange={setField('address')} />
                {errors.address && <span className="field-error">{errors.address}</span>}
              </div>
              <p className="field-hint" style={{ marginTop: -8, marginBottom: 16 }}>
                Service area: <strong>{location}</strong>
              </p>
              <div className="field">
                <label>Any specific requirements? (Optional)</label>
                <textarea rows={3} value={form.notes} onChange={setField('notes')} />
              </div>
              <button type="button" className="btn btn-primary ibc-form-submit" onClick={goToSchedule}>
                Continue
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="ibc-form-panel">
              <SlotPicker
                serviceSlug={CATEGORY_SLUG}
                date={date}
                time={time}
                onPick={(d, t) => {
                  setDate(d);
                  setTime(t);
                  setErrors((e) => ({ ...e, slot: undefined }));
                }}
                error={errors.slot}
              />

              {error && (
                <div role="alert" className="alert alert-error" style={{ marginTop: 16 }}>
                  <Icon name="info" size={18} />
                  <span>{error}</span>
                </div>
              )}

              <button type="button" className="btn btn-primary ibc-form-submit" onClick={submit} disabled={busy}>
                {busy ? 'Booking…' : `Confirm Booking · ₹${HOME_VISIT_FEE}`}
              </button>
              <p className="ibc-secure-note">
                <Icon name="lock" size={14} />
                No advance payment — pay the visit fee to our team on the day
              </p>
            </div>
          )}

          {step === 2 && receipt && (
            <div className="ibc-confirm-panel pb-6">
              <span className="ibc-confirm-icon">
                <Icon name="check" size={30} />
              </span>
              <h2>Booking Confirmed!</h2>
              <p>Our expert will visit your home.</p>

              <div className="ibc-confirm-details">
                <div>
                  <span>Booking ID</span>
                  <strong>{receipt.bookingNumber}</strong>
                </div>
                <div>
                  <span>Date</span>
                  <strong>{receipt.date}</strong>
                </div>
                <div>
                  <span>Time Slot</span>
                  <strong>{receipt.time}</strong>
                </div>
                <div>
                  <span>Address</span>
                  <strong>{form.address}</strong>
                </div>
                <div>
                  <span>Visit Fee</span>
                  <strong>{receipt.visitFeeDisplay} (Visit Charge)</strong>
                </div>
              </div>

              <div className="ibc-confirm-note">
                <Icon name="helmet" size={26} />
                <p>
                  Our expert will measure your space, understand your choice, suggest designs and give you a final
                  quotation. <strong>{receipt.visitFeeDisplay} will be adjusted in your final project cost!</strong>
                </p>
              </div>

              <Link
  to="/dashboard"
  className="btn btn-dark ibc-form-submit"
>
  View Booking
</Link>

<Link
  to="/"
  className="btn btn-ghost ibc-form-submit mb-2"
>
  Back to Home
</Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

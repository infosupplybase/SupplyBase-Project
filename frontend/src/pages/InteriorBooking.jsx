import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import { timeSlots } from '../data/booking';
import { getSpaceBySlug, getDesignBySlug, HOME_VISIT_FEE } from '../data/interiorCatalog';

const STEPS = ['Details', 'Schedule', 'Confirm'];

/** Ten digits once the +91, spaces and brackets are stripped — same rule the
    site-visit wizard uses, so a phone number valid there is valid here. */
const isValidPhone = (value) =>
  /^[6-9]\d{9}$/.test(String(value || '').replace(/\D/g, '').replace(/^91/, '').replace(/^0/, ''));

function nextFourDays() {
  const labels = [];
  for (let i = 0; i < 4; i += 1) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' });
    const day = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    labels.push({ value: d.toISOString().slice(0, 10), label, day });
  }
  return labels;
}

/** A short, obviously-not-a-real-transaction reference for the placeholder
    confirmation screen — no payment gateway is wired up yet. */
function makeReference() {
  return `SB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

/**
 * /interior-by-choice/book and /interior-by-choice/:spaceSlug/:designSlug/book
 *
 * The paid home-visit booking flow from the mockup: Details -> Schedule ->
 * Confirm. No payment gateway is connected yet (per plan, that follows once
 * one is chosen) — "Proceed to Pay" here just moves to the confirmation step
 * with a placeholder reference, it does not charge anything.
 */
export default function InteriorBooking() {
  const { spaceSlug, designSlug } = useParams();
  const space = spaceSlug ? getSpaceBySlug(spaceSlug) : null;
  const design = spaceSlug && designSlug ? getDesignBySlug(spaceSlug, designSlug) : null;
  const dateOptions = useMemo(nextFourDays, []);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '', date: dateOptions[1].value, slot: '' });
  const [errors, setErrors] = useState({});
  const [reference, setReference] = useState('');

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

  const proceedToPay = () => {
    if (!form.slot) {
      setErrors((e) => ({ ...e, slot: 'Pick a time slot' }));
      return;
    }
    setReference(makeReference());
    setStep(2);
  };

  const selectedDate = dateOptions.find((d) => d.value === form.date);
  const selectedSlot = timeSlots.find((s) => s.value === form.slot);

  return (
    <>
      <PageHero
        eyebrow="INTERIOR BY CHOICE"
        title="Book a Home Visit"
        breadcrumbs={[{ label: 'Interior by Choice', to: '/interior-by-choice' }, { label: 'Book a Home Visit' }]}
      />

      <section className="ibc-section">
        <div className="container container-narrow">
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
              <Link to={`/interior-by-choice${spaceSlug ? `/${spaceSlug}` : ''}`}>Change</Link>
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
              <h3>Preferred Date</h3>
              <div className="ibc-date-row">
                {dateOptions.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    className={`ibc-date-chip ${form.date === d.value ? 'active' : ''}`}
                    onClick={() => setForm((f) => ({ ...f, date: d.value }))}
                  >
                    <span>{d.label}</span>
                    <span>{d.day}</span>
                  </button>
                ))}
              </div>

              <h3>Preferred Time</h3>
              <div className="choice-grid slots">
                {timeSlots.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    className={`choice ${form.slot === s.value ? 'active' : ''}`}
                    onClick={() => setForm((f) => ({ ...f, slot: s.value }))}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {errors.slot && <span className="field-error">{errors.slot}</span>}

              <button type="button" className="btn btn-primary ibc-form-submit" onClick={proceedToPay}>
                Proceed to Pay ₹{HOME_VISIT_FEE}
              </button>
              <p className="ibc-secure-note">
                <Icon name="lock" size={14} />
                Secure Payment
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="ibc-confirm-panel">
              <span className="ibc-confirm-icon">
                <Icon name="check" size={30} />
              </span>
              <h2>Booking Confirmed!</h2>
              <p>Our expert will visit your home.</p>

              <div className="ibc-confirm-details">
                <div>
                  <span>Reference</span>
                  <strong>{reference}</strong>
                </div>
                <div>
                  <span>Date</span>
                  <strong>{selectedDate.label}, {selectedDate.day}</strong>
                </div>
                <div>
                  <span>Time Slot</span>
                  <strong>{selectedSlot?.label}</strong>
                </div>
                <div>
                  <span>Address</span>
                  <strong>{form.address}</strong>
                </div>
                <div>
                  <span>Amount Paid</span>
                  <strong>₹{HOME_VISIT_FEE} (Visit Charge)</strong>
                </div>
              </div>

              <div className="ibc-confirm-note">
                <Icon name="helmet" size={26} />
                <p>
                  Our expert will measure your space, understand your choice, suggest designs and give you a final
                  quotation. <strong>₹{HOME_VISIT_FEE} will be adjusted in your final project cost!</strong>
                </p>
              </div>

              <Link to="/dashboard" className="btn btn-dark ibc-form-submit">View Booking</Link>
              <Link to="/" className="btn btn-ghost ibc-form-submit">Back to Home</Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

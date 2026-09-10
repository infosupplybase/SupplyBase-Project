import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import SlotPicker from '../components/booking/SlotPicker';
import CustomerDetailsFields from '../components/booking/CustomerDetailsFields';
import usePlumbingCatalogue from '../hooks/usePlumbingCatalogue';
import { useAuth } from '../context/AuthContext';
import api, { friendlyError } from '../lib/api';
import { formatRupees } from '../lib/money';
import { emptyDetails, validateDetails } from '../lib/bookingDetails';
import { contact } from '../data/siteConfig';

const STAGES = ['Schedule', 'Details', 'Confirm'];
const SCHEDULE = 0;
const DETAILS = 1;
const CONFIRM = 2;

/** /services/plumbing/consultation/:typeSlug — books one consultation type
    directly (not through the item cart), submitting a single
    `consultation_type` answer. The ₹99 fee shown here is real: the server
    applies it the same way for any booking carrying this answer. */
export default function PlumbingConsultationBook() {
  const { typeSlug } = useParams();
  const { user } = useAuth();
  const { consultationTypes, loading, error: loadError } = usePlumbingCatalogue();

  const [stage, setStage] = useState(SCHEDULE);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [details, setDetails] = useState(emptyDetails);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const type = consultationTypes.find((t) => t.value === typeSlug);

  useEffect(() => {
    if (user) {
      setDetails((d) => ({
        ...d,
        name: d.name || user.fullName || '',
        phone: d.phone || user.phone || '',
        email: d.email || user.email || '',
      }));
    }
  }, [user]);

  const setDetail = (key) => (e) => {
    setDetails((d) => ({ ...d, [key]: e.target.value }));
    setErrors((err) => ({ ...err, [key]: undefined }));
    setError('');
  };

  if (loading) {
    return (
      <div className="wizard-shell">
        <div className="wizard-container">
          <p style={{ color: 'rgba(255,255,255,.6)' }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (loadError || (!type && !receipt)) {
    return <Navigate to="/services/plumbing/consultation" replace />;
  }

  const goNext = () => {
    setError('');
    if (stage === SCHEDULE) {
      if (!date || !time) {
        setErrors({ slot: 'Please choose a date and a time' });
        return;
      }
    }
    setStage((s) => Math.min(s + 1, CONFIRM));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setError('');
    setStage((s) => Math.max(s - 1, SCHEDULE));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validateDetails(details);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    setError('');
    try {
      const result = await api.createBooking({
        serviceSlug: 'plumbing',
        answers: [{ key: 'consultation_type', value: type.value, label: type.label }],
        preferredDate: date,
        preferredTime: time,
        name: details.name,
        phone: details.phone,
        whatsapp: details.whatsapp || null,
        email: details.email || null,
        address: details.address,
        city: details.city,
        pincode: details.pincode || null,
      });
      setReceipt(result);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err && err.fieldErrors) setErrors(err.fieldErrors);
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  if (receipt) return <ConsultationConfirmation receipt={receipt} details={details} />;

  return (
    <div className="wizard-shell">
      <div className="wizard-container">
        <div className="wizard-top">
          {stage > 0 ? (
            <button type="button" className="wizard-back" onClick={goBack} aria-label="Go back">
              <Icon name="arrow-left" size={20} />
            </button>
          ) : (
            <Link to="/services/plumbing/consultation" className="wizard-back" aria-label="Back to consultations">
              <Icon name="arrow-left" size={20} />
            </Link>
          )}
          <h1 className="wizard-title">{type.label}</h1>
          <a
            href={`https://wa.me/${contact.phoneRaw}?text=${encodeURIComponent(`Hello Supplybase, I need help booking a ${type.label}.`)}`}
            target="_blank" rel="noopener noreferrer" className="wizard-help"
          >
            Need help?
          </a>
        </div>

        <ol className="wizard-steps">
          {STAGES.map((label, i) => (
            <li key={label} className={`wstep ${i === stage ? 'current' : ''} ${i < stage ? 'done' : ''}`}
                aria-current={i === stage ? 'step' : undefined}>
              <span className="wstep-num">{i < stage ? <Icon name="check" size={14} strokeWidth={3} /> : i + 1}</span>
              <span className="wstep-label">{label}</span>
            </li>
          ))}
        </ol>

        <form onSubmit={handleSubmit} noValidate>
          <div className="wizard-card">
            {stage === SCHEDULE && (
              <>
                <div className="wizard-card-head">
                  <h2>Choose Date &amp; Time</h2>
                  <p>{type.hint.split('|')[0]}</p>
                </div>
                <SlotPicker
                  serviceSlug="plumbing"
                  date={date}
                  time={time}
                  onPick={(d, t) => {
                    setDate(d);
                    setTime(t);
                    setErrors((err) => ({ ...err, slot: undefined }));
                  }}
                  error={errors.slot}
                />
              </>
            )}

            {stage === DETAILS && (
              <>
                <div className="wizard-card-head">
                  <h2>Enter Your Details</h2>
                  <p>We will contact you to confirm the appointment.</p>
                </div>
                <CustomerDetailsFields details={details} setDetail={setDetail} errors={errors} idPrefix="pcb" />
              </>
            )}

            {stage === CONFIRM && (
              <div>
                <div className="wizard-card-head">
                  <h2>Booking Summary</h2>
                  <p>Please check everything before you confirm.</p>
                </div>
                <dl className="review-list">
                  <div>
                    <dt>Consultation</dt>
                    <dd>{type.label}</dd>
                  </div>
                  <div>
                    <dt>Visit</dt>
                    <dd>{date} at {time}</dd>
                  </div>
                </dl>
                <div className="fee-panel">
                  <div className="fee-panel-top">
                    <strong>Home Visit Fee</strong>
                    <span className="fee-panel-amount">{formatRupees(type.price)}</span>
                  </div>
                  <p className="fee-small">
                    This is adjusted into your final bill if you proceed with the work after the visit.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div role="alert" className="alert alert-error" style={{ marginTop: 18 }}>
                <Icon name="info" size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className={`wizard-foot ${stage === 0 ? 'single' : ''}`}>
              {stage > 0 && (
                <button type="button" className="btn btn-ghost btn-back" onClick={goBack}>
                  BACK
                </button>
              )}
              {stage === CONFIRM ? (
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'BOOKING…' : 'CONFIRM BOOKING'}
                  <Icon name="arrow-right" size={17} />
                </button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={goNext}>
                  CONTINUE
                  <Icon name="arrow-right" size={17} />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConsultationConfirmation({ receipt, details }) {
  const message = encodeURIComponent(`Hello Supplybase, this is about my booking ${receipt.bookingNumber}.`);
  return (
    <div className="wizard-shell">
      <div className="wizard-container">
        <div className="wizard-card">
          <div className="confirmed">
            <div className="confirmed-tick">
              <Icon name="check" size={38} strokeWidth={3} />
            </div>
            <h2>Your Consultation is Reserved!</h2>
            <p>{receipt.message}</p>

            <dl className="confirmed-panel">
              <div>
                <dt>Booking ID</dt>
                <dd className="booking-id">{receipt.bookingNumber}</dd>
              </div>
              <div>
                <dt>Date &amp; Time</dt>
                <dd>{receipt.date}, {receipt.time}</dd>
              </div>
              <div>
                <dt>Home Visit Fee</dt>
                <dd>{receipt.visitFeeDisplay}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{details.city}</dd>
              </div>
            </dl>

            <Link to="/dashboard" className="btn btn-primary btn-block">
              GO TO DASHBOARD
            </Link>
            <div className="btn-row" style={{ marginTop: 12 }}>
              <a href={`https://wa.me/${contact.phoneRaw}?text=${message}`} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                <Icon name="whatsapp" size={17} />
                CHAT ON WHATSAPP
              </a>
              <Link to="/" className="btn btn-ghost btn-back">
                BACK TO HOME
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

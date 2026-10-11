import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import SlotPicker from '../components/booking/SlotPicker';
import CustomerDetailsFields from '../components/booking/CustomerDetailsFields';
import usePlumbingCatalogue from '../hooks/usePlumbingCatalogue';
import { useAuth } from '../context/AuthContext';
import api, { friendlyError } from '../lib/api';
import { formatRupees } from '../lib/money';
import { composeAddress, emptyDetails, validateDetails } from '../lib/bookingDetails';
import { usePickedLocation } from '../context/LocationContext';
import { useEnsureLogin } from '../components/auth/LoginGate';
import { uploadBookingPhotos } from '../lib/bookingPhotos';
import { contact } from '../data/siteConfig';
import { formatVisit } from '../lib/visitTime';
import { useFormBack, useHistoryState } from '../hooks/useHistoryState';
import ModalFoot from '../components/services/ModalFoot';
import PayBookingButton from '../components/payment/PayBookingButton';

const STAGES = ['Schedule', 'Details', 'Confirm'];
const SCHEDULE = 0;
const DETAILS = 1;
const CONFIRM = 2;

/** /services/plumbing/consultation/:typeSlug — books one consultation type
    directly (not through the item cart), submitting a single
    `consultation_type` answer. The ₹99 fee shown here is real: the server
    applies it the same way for any booking carrying this answer. */
export default function PlumbingConsultationBook({
  modal = false,
  typeSlug: propTypeSlug,
  onBackToConsultations,
  onStepChange,
  onBackToServices,
}) {
  const params = useParams();

  const typeSlug = propTypeSlug || params.typeSlug;
  const { user } = useAuth();
  const { consultationTypes, loading, error: loadError } = usePlumbingCatalogue();

  // This form's step and answers live in the browser's history (see
  // hooks/useHistoryState): a refresh keeps them, Back goes one step back.
  const scope = `f:plb-consult:${typeSlug}`;
  const formBack = useFormBack();
  const [stage, setStage] = useHistoryState(`${scope}:stage`, SCHEDULE, { push: true });
  const [date, setDate] = useHistoryState(`${scope}:date`, '');
  const [time, setTime] = useHistoryState(`${scope}:time`, '');
  const pickedLocation = usePickedLocation();
  const ensureLogin = useEnsureLogin();
  const [details, setDetails] = useHistoryState(`${scope}:details`, emptyDetails);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useHistoryState(`${scope}:receipt`, null);

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
    <div
      className={
        modal
          ? 'wizard-shell !min-h-0 !bg-transparent !pt-0 !pb-0'
          : 'wizard-shell'
      }
    >
      <div
        className={
          modal
            ? 'wizard-container !w-full !max-w-none !px-0 !pt-0'
            : 'wizard-container'
        }
      >
        <p className={modal ? '!text-black/60' : ''}>
          Loading…
        </p>
      </div>
    </div>
  );
}

  if (loadError || (!type && !receipt)) {
  if (modal) return null;

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
    if (stage === DETAILS) {
      const nextErrors = validateDetails(details, pickedLocation);
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;
    }
    setStage((s) => Math.min(s + 1, CONFIRM));

if (modal) {
  onStepChange?.();
} else {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
  };

  const goBack = () => {
  setError('');

  if (stage === SCHEDULE && modal) {
    onBackToConsultations?.();
    return;
  }

  formBack(() => setStage((s) => Math.max(s - 1, SCHEDULE)));

  if (modal) {
    onStepChange?.();
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validateDetails(details, pickedLocation);
    setErrors(nextErrors);
    // The fields are not on the Confirm step: go back to where they are.
    if (Object.keys(nextErrors).length > 0) {
      setStage(DETAILS, { push: false });
      return;
    }
    // Every booking needs an account: ask now, over this form (LoginGate).
    if (!(await ensureLogin(details))) return;

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
        address: composeAddress(details, pickedLocation),
        city: details.city,
        pincode: details.pincode || null,
      });
      setReceipt(result);
      // Photos picked in the details form go to the booking now it exists.
      uploadBookingPhotos('pcb', result.bookingNumber, details.phone);

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

if (receipt) {
  return (
    <ConsultationConfirmation
      receipt={receipt}
      details={details}
      modal={modal}
      onBackToServices={onBackToServices}
      onPaid={() => setReceipt({ ...receipt, paidOnline: true })}
    />
  );
}

  return (
    <div
  className={
    modal
      ? 'wizard-shell !min-h-0 !bg-transparent !pt-0 !pb-0'
      : 'wizard-shell'
  }
>
  <div
    className={
      modal
        ? 'wizard-container !w-full !max-w-none !px-0 !pt-0 !pb-0'
        : 'wizard-container'
    }
  >
        <div className="wizard-top">
          {stage > 0 || modal ? (
  <button
    type="button"
    className="wizard-back"
    onClick={goBack}
    aria-label="Go back"
  >
    <Icon name="arrow-left" size={20} />
  </button>
) : (
  <Link
    to="/services/plumbing/consultation"
    className="wizard-back"
    aria-label="Back to consultations"
  >
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
          <div
  className={
    modal
      ? 'wizard-card sm:!mb-[40px]'
      : 'wizard-card'
  }
>
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
                  <h2>Your Details</h2>
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
                    <dd>{formatVisit(date, time)}</dd>
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

            <ModalFoot
  className={
    modal
      ? 'wizard-foot modal-sticky-foot !flex !w-full !items-center !justify-end !gap-3 !border-0'
      : `wizard-foot ${stage === 0 ? 'single' : ''}`
  }
>
              {(stage > 0 || modal) && (
  <button
    type="button"
    className="btn btn-ghost btn-back !m-0 !w-auto !min-w-[120px] !flex-none !justify-center max-sm:!min-w-[100px]"
    onClick={goBack}
  >
    BACK
  </button>
)}
              {stage === CONFIRM ? (
                <button key="submit" type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'BOOKING…' : 'CONFIRM BOOKING'}
                  <Icon name="arrow-right" size={17} />
                </button>
              ) : (
                <button
  key="continue"
  type="button"
  className="btn btn-primary !w-auto !min-w-[150px] !flex-none !ml-auto !justify-center"
  onClick={goNext}
>
  CONTINUE
  <Icon name="arrow-right" size={17} />
</button>
              )}
            </ModalFoot>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConsultationConfirmation({
  receipt,
  details,
  modal = false,
  onBackToServices,
  onPaid,
}) {
  const message = encodeURIComponent(`Hello Supplybase, this is about my booking ${receipt.bookingNumber}.`);
  return (
    <div
  className={
    modal
      ? 'wizard-shell !min-h-0 !bg-transparent !pt-0 !pb-0'
      : 'wizard-shell'
  }
>
  <div
    className={
      modal
        ? 'wizard-container !min-h-0 !w-full !max-w-none !px-0 !pt-0 !pb-0'
        : 'wizard-container'
    }
  >
        <div className="wizard-card">
          <div className="confirmed">
            <div className="confirmed-tick">
              <Icon name="check" size={38} strokeWidth={3} />
            </div>
            <h2>{receipt.paidOnline ? 'Your Consultation is Confirmed!' : 'Pay to Confirm Your Consultation'}</h2>
            {!receipt.paidOnline && <p>{receipt.message}</p>}

            <dl className="confirmed-panel">
              <div>
                <dt>Booking ID</dt>
                <dd className="booking-id">{receipt.bookingNumber}</dd>
              </div>
              <div>
                <dt>Date &amp; Time</dt>
                <dd>{formatVisit(receipt.date, receipt.time)}</dd>
              </div>
              <div>
                <dt>Visiting Fee</dt>
                <dd>{receipt.visitFeeDisplay}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{details.city}</dd>
              </div>
            </dl>

            <PayBookingButton
              bookingNumber={receipt.bookingNumber}
              amountDisplay={receipt.visitFeeDisplay}
              paid={receipt.paidOnline}
              onPaid={onPaid}
            />

            {!modal && (
  <Link to="/dashboard" className="btn btn-primary btn-block">
    GO TO DASHBOARD
  </Link>
)}
            <div
  className={
    modal
      ? 'btn-row !mt-3 !flex !w-full !flex-wrap !items-center !justify-center !gap-3'
      : 'btn-row'
  }
>
  <a
    href={`https://wa.me/${contact.phoneRaw}?text=${message}`}
    target="_blank"
    rel="noopener noreferrer"
    className={
      modal
        ? 'btn btn-whatsapp !w-auto !min-w-[190px] !justify-center'
        : 'btn btn-whatsapp'
    }
  >
    <Icon name="whatsapp" size={17} />
    CHAT ON WHATSAPP
  </a>

  {modal ? (
  <>
    <button
      type="button"
      className="btn btn-ghost btn-back !w-auto !min-w-[190px] !justify-center max-sm:!w-full"
      onClick={() => onBackToServices?.()}
    >
      BACK TO PLUMBING
    </button>

    <Link
      to="/"
      className="btn btn-ghost btn-back !w-auto !min-w-[190px] !justify-center max-sm:!w-full"
    >
      BACK TO HOME
    </Link>
  </>
) : (
  <Link to="/" className="btn btn-ghost btn-back">
    BACK TO HOME
  </Link>
)}
</div>
          </div>
        </div>
      </div>
    </div>
  );
}

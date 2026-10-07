import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import CustomerDetailsFields from '../components/booking/CustomerDetailsFields';
import SlotPicker from '../components/booking/SlotPicker';
import ModalFoot from '../components/services/ModalFoot';
import useInteriorDesignCatalogue from '../hooks/useInteriorDesignCatalogue';
import { getCategoryBySlug, idPackageTiers } from '../data/interiorDesignContent';
import { composeAddress, emptyDetails, validateDetails } from '../lib/bookingDetails';
import { usePickedLocation } from '../context/LocationContext';
import { useEnsureLogin } from '../components/auth/LoginGate';
import { uploadBookingPhotos } from '../lib/bookingPhotos';
import { useAuth } from '../context/AuthContext';
import api, { friendlyError } from '../lib/api';
import { formatVisit } from '../lib/visitTime';
import { useFormBack, useHistoryState } from '../hooks/useHistoryState';
import PayBookingButton from '../components/payment/PayBookingButton';

const PACKAGE = 0;
const INCLUDED = 1;
const ESTIMATE = 2;
const SLOT = 3;
const DETAILS = 4;

const packageInclusions = {
  standard: [
    'Space planning and furniture layout',
    'Living room TV unit design',
    'Bedroom wardrobe design',
    'Modular kitchen design',
    'Colour and material selection guidance',
    'Basic lighting layout',
    'Design consultation and project coordination',
  ],
  premium: [
    'Detailed space planning and furniture layout',
    'Custom living room TV unit and storage design',
    'Bedroom wardrobes with personalised storage planning',
    'Modular kitchen with accessory planning',
    'False ceiling and decorative lighting design',
    'Wall finishes and feature wall design',
    'Dining area and crockery storage design',
    'Material selection and project coordination',
  ],
};

const packageImages = {
  standard: '/assets/projects/modern-interior.webp',
  premium: '/assets/pop-ceiling/hero/living-room-cove.webp',
};

export default function InteriorDesignFlow({
  modal = false,
  categorySlug: suppliedCategorySlug,
  onBackToCatalogue,
  onStepChange,
}) {
  const params = useParams();
  const categorySlug = suppliedCategorySlug || params.categorySlug;
  const category = getCategoryBySlug(categorySlug);
  const { user } = useAuth();
  const { category: liveCategory, loading, error: catalogueError } =
    useInteriorDesignCatalogue();
  const pickedLocation = usePickedLocation();
  const ensureLogin = useEnsureLogin();
  const formBack = useFormBack();

  const scope = `f:id:simple-v2:${categorySlug}`;
  const [stage, setStage] = useHistoryState(`${scope}:stage`, PACKAGE, { push: true });
  const [tier, setTier] = useHistoryState(`${scope}:tier`, '');
  const [date, setDate] = useHistoryState(`${scope}:date`, '');
  const [time, setTime] = useHistoryState(`${scope}:time`, '');
  const [details, setDetails] = useHistoryState(
    `${scope}:details`,
    user
      ? {
          ...emptyDetails,
          name: user.fullName || '',
          phone: user.phone || '',
          email: user.email || '',
        }
      : { ...emptyDetails }
  );
  const [receipt, setReceipt] = useHistoryState(`${scope}:receipt`, null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);

  const selectedPackage = idPackageTiers.find((item) => item.key === tier);

  if (!category) {
    return modal ? null : <Navigate to="/services/interior-design" replace />;
  }

  const moveTo = (nextStage) => {
    setSubmitError('');
    setStage(nextStage);
    if (modal) onStepChange?.();
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    if (busy) return;
    setSubmitError('');
    if (stage === PACKAGE) {
      if (modal) onBackToCatalogue?.();
      return;
    }
    formBack(() => setStage(Math.max(PACKAGE, stage - 1)));
    if (modal) onStepChange?.();
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setDetail = (key) => (event) => {
    setDetails((previous) => ({ ...previous, [key]: event.target.value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
    setSubmitError('');
  };

  const submitBooking = async (event) => {
    event.preventDefault();
    if (busy || receipt) return;

    if (!selectedPackage) {
      moveTo(PACKAGE);
      return;
    }

    if (!date || !time) {
      setErrors((previous) => ({
        ...previous,
        slot: 'Please choose a date and a time.',
      }));
      moveTo(SLOT);
      return;
    }

    const validation = validateDetails(details, pickedLocation);
    setErrors(validation);
    if (Object.keys(validation).length) return;

    if (!liveCategory || loading || catalogueError) {
      setSubmitError('Service information is unavailable. Please reopen and try again.');
      return;
    }

    if (!(await ensureLogin(details))) return;

    setBusy(true);
    setSubmitError('');
    try {
      const result = await api.createBooking({
        serviceSlug: 'interior-design',
        answers: [{
          key: 'notes',
          value: `Home: ${category.name} · Package: ${selectedPackage.name} · Price will be confirmed during the site visit`,
        }],
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
      uploadBookingPhotos('id', result.bookingNumber, details.phone);
      onStepChange?.();
    } catch (error) {
      if (error?.fieldErrors) setErrors(error.fieldErrors);
      setSubmitError(friendlyError(error));
    } finally {
      setBusy(false);
    }
  };

  const heading = (
    <div className="id-flow-topbar">
      {modal || stage > PACKAGE ? (
        <button
          type="button"
          className="id-flow-back"
          onClick={goBack}
          disabled={busy || Boolean(receipt)}
          aria-label="Go back"
        >
          <Icon name="arrow-left" size={18} />
        </button>
      ) : (
        <Link
          className="id-flow-back"
          to="/services/interior-design"
          aria-label="Back to interior categories"
        >
          <Icon name="arrow-left" size={18} />
        </Link>
      )}
      <h2>{category.name}</h2>
    </div>
  );

  const actions = (next, label = 'CONTINUE', disabled = false) => (
    <ModalFoot className="pnt-step-actions modal-sticky-foot">
      {stage === PACKAGE && !modal ? (
        <Link className="btn btn-ghost" to="/services/interior-design">BACK</Link>
      ) : (
        <button type="button" className="btn btn-ghost" onClick={goBack} disabled={busy}>
          BACK
        </button>
      )}
      <button
        type="button"
        className="btn btn-primary"
        onClick={next}
        disabled={disabled}
      >
        {label} <Icon name="arrow-right" size={17} />
      </button>
    </ModalFoot>
  );

  const summaryRow = (label, value) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      gap: 16, padding: '12px 0', borderBottom: '1px solid #eee',
    }}>
      <span>{label}</span>
      <strong style={{ textAlign: 'right' }}>{value}</strong>
    </div>
  );

  if (receipt) {
    return (
      <section className="pnt-section" style={{ padding: 0 }}>
        {heading}
        <div className="wizard-card">
          <Icon name="check" size={32} />
          <h2>Consultation Request Received</h2>
          <p>Our team will contact you to confirm your appointment.</p>
          {summaryRow('Booking number', receipt.bookingNumber)}
          {summaryRow('Home', category.name)}
          {summaryRow('Package', selectedPackage?.name || tier)}
          {summaryRow('Visit', formatVisit(date, time))}
          <p>Price will be confirmed during the site visit.</p>
          {!receipt.paidOnline && receipt.message && (
            <div className="pnt-fee-note">
              <Icon name="info" size={17} />
              <span>{receipt.message}</span>
            </div>
          )}
          <PayBookingButton
            bookingNumber={receipt.bookingNumber}
            amountDisplay={receipt.visitFeeDisplay}
            paid={receipt.paidOnline}
            onPaid={() => setReceipt({ ...receipt, paidOnline: true })}
          />
        </div>
      </section>
    );
  }

  return (
    <section className={modal ? 'w-full' : 'pnt-section'}>
      <div className={modal ? 'w-full' : 'container container-narrow'}>
        {heading}

        {stage === PACKAGE && (
          <>
            <h3 style={{ margin: '0 0 16px' }}>Choose Your Package</h3>
            <div className="id-package-grid">
              {idPackageTiers.map((item) => (
                <label
                  key={item.key}
                  className={`id-package-card ${tier === item.key ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="interior-package"
                    value={item.key}
                    checked={tier === item.key}
                    onChange={() => setTier(item.key)}
                  />
                  <span className="id-package-photo">
                    <img
                      src={packageImages[item.key]}
                      alt={`${item.name} interior example`}
                      loading="lazy"
                      decoding="async"
                    />
                  </span>
                  <span className="id-package-body">
                    <strong>{item.name}</strong>
                    <span className="id-package-blurb">{item.blurb}</span>
                  </span>
                  {tier === item.key && (
                    <span className="id-package-check">
                      <Icon name="check" size={18} />
                    </span>
                  )}
                </label>
              ))}
            </div>
            {actions(() => moveTo(INCLUDED), 'CONTINUE', !selectedPackage)}
          </>
        )}

        {stage === INCLUDED && (
          <>
            <div className="wizard-card">
              <h3 style={{ margin: '0 0 8px' }}>What’s Included</h3>
              <p style={{ margin: '0 0 18px', color: '#666' }}>
                {selectedPackage?.name} Package
              </p>

              <ul style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'grid',
                gap: 10,
              }}>
                {(packageInclusions[tier] || []).map((point) => (
                  <li
                    key={point}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '12px 14px',
                      border: '1px solid #e9e5db',
                      borderRadius: 10,
                      background: '#fff',
                      lineHeight: 1.5,
                    }}
                  >
                    <span style={{
                      color: '#9a741b',
                      flexShrink: 0,
                      marginTop: 2,
                    }}>
                      <Icon name="check" size={18} />
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <p style={{
                margin: '16px 0 0',
                fontSize: 12,
                color: '#777',
                lineHeight: 1.5,
              }}>
                Indicative scope. Final inclusions, materials and quantities
                will be confirmed during the site visit.
              </p>
            </div>

            {actions(() => moveTo(ESTIMATE), 'VIEW ESTIMATE', !selectedPackage)}
          </>
        )}

        {stage === ESTIMATE && (
          <>
            <div className="id-selection-strip">
              <strong>YOUR SELECTION</strong>
              <span>Interior Design</span>
            </div>

            <div className="id-estimate-card">
              <div className="id-estimate-row">
                <span>Home Type</span>
                <strong>{category.name}</strong>
              </div>

              <div className="id-estimate-row">
                <span>Selected Package</span>
                <div className="id-estimate-value">
                  <strong>{selectedPackage?.name || 'Not selected'}</strong>
                  <button
                    type="button"
                    onClick={() => moveTo(PACKAGE)}
                    className="id-estimate-edit"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <div className="id-estimate-price">
                <span>Estimated Price</span>
                <strong>
                  Price will be confirmed during the site visit
                </strong>
              </div>

              {liveCategory && (
                <div className="id-estimate-fee">
                  <span>Consultation fee</span>
                  <strong>{liveCategory.visitFeeDisplay}</strong>
                </div>
              )}

              {catalogueError && (
                <p role="alert" className="alert alert-error">
                  {catalogueError}
                </p>
              )}
            </div>

            <ModalFoot className="id-estimate-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => moveTo(SLOT)}
                disabled={!selectedPackage || loading || !liveCategory}
              >
                BOOK A HOME VISIT
                <Icon name="arrow-right" size={17} />
              </button>
            </ModalFoot>
          </>
        )}
        {stage === SLOT && (
          <>
            <div className="wizard-card">
              <h3 style={{ marginTop: 0 }}>Choose Date & Time</h3>
              <SlotPicker
                serviceSlug="interior-design"
                date={date}
                time={time}
                onPick={(nextDate, nextTime) => {
                  setDate(nextDate);
                  setTime(nextTime);
                  setErrors((previous) => ({ ...previous, slot: undefined }));
                }}
                error={errors.slot}
              />
            </div>
            {actions(() => moveTo(DETAILS), 'CONTINUE', !date || !time)}
          </>
        )}

        {stage === DETAILS && (
          <form onSubmit={submitBooking} noValidate>
            <div className="wizard-card">
              <h3 style={{ marginTop: 0 }}>Your Details</h3>
              <p>{formatVisit(date, time)}</p>
              <CustomerDetailsFields
                details={details}
                setDetail={setDetail}
                errors={errors}
                idPrefix="id"
              />
              {submitError && (
                <div role="alert" className="alert alert-error" style={{ marginTop: 16 }}>
                  {submitError}
                </div>
              )}
            </div>
            <ModalFoot className="pnt-step-actions modal-sticky-foot">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={goBack}
                disabled={busy}
              >
                BACK
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={busy || loading || !liveCategory}
              >
                {busy ? 'BOOKING…' : 'CONFIRM BOOKING'}
              </button>
            </ModalFoot>
          </form>
        )}
      </div>
    </section>
  );
}

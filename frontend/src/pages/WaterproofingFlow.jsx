import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import { wpStageImages } from '../data/waterproofingStageImages';
import PaintingHero from '../components/painting/PaintingHero';
import BrandPicker from '../components/waterproofing/BrandPicker';
import TerraceSlider from '../components/waterproofing/TerraceSlider';
import RateTable from '../components/waterproofing/RateTable';
import CustomerDetailsFields from '../components/booking/CustomerDetailsFields';
import SlotPicker from '../components/booking/SlotPicker';
import useWaterproofingCatalogue from '../hooks/useWaterproofingCatalogue';
import { wpCatalogueService, wpFlows } from '../data/waterproofingContent';
import { composeAddress, emptyDetails, validateDetails } from '../lib/bookingDetails';
import { usePickedLocation } from '../context/LocationContext';
import { useEnsureLogin } from '../components/auth/LoginGate';
import { uploadBookingPhotos } from '../lib/bookingPhotos';
import { useAuth } from '../context/AuthContext';
import api, { friendlyError } from '../lib/api';
import { contact } from '../data/siteConfig';
import { formatVisit } from '../lib/visitTime';
import { useFormBack, useHistoryState } from '../hooks/useHistoryState';
import ModalFoot from '../components/services/ModalFoot';
import PayBookingButton from '../components/payment/PayBookingButton';

/**
 * One page, six journeys (Terrace / Exterior Wall / Bathroom-Floor /
 * Interior Wall / Water Tank / Basement) — driven by wpFlows[flowSlug]
 * (waterproofingContent.js) and the live catalogue
 * (useWaterproofingCatalogue). Unlike Painting/POP, there is no cart to
 * build: the reference's own screens never let a customer select
 * individual priced items, only a preferred BRAND, so the journey here is
 * Intro -> Work Stages (info) -> Brand (the one real question) -> Rates
 * (info, filtered to the selected brand) -> Benefits (info, flows that
 * have one) -> Details/Schedule/Confirm. See V17's migration comment for
 * why every booking here shows the flat ₹99 fee regardless of brand.
 */
// Each flow's own photo needs a different crop to keep the work in frame.
const HERO_CLASS_BY_FLOW = {
  'exterior-wall': 'pnt-hero-exterior-waterproofing',
  terrace: 'pnt-hero-terrace-waterproofing',
  'water-tank': 'pnt-hero-water-tank-waterproofing',
  basement: 'pnt-hero-basement-waterproofing',
};

export default function WaterproofingFlow({ flowSlug: flowSlugProp, modal = false, onBackToCategories, onStepChange }) {
  const { flowSlug: routeFlowSlug } = useParams();
  const flowSlug = flowSlugProp || routeFlowSlug;
  const flow = wpFlows[flowSlug];
  const { user } = useAuth();
  const { category, loading, error: loadError, optionsFor, ratesByGroup } = useWaterproofingCatalogue();

  // This form's step and answers live in the browser's history (see
  // hooks/useHistoryState): a refresh keeps them, Back goes one step back.
  const scope = `f:wp:${flowSlug}`;
  const formBack = useFormBack();
  const [stage, setStage] = useHistoryState(`${scope}:stage:slots-first`, 0, { push: true });
  const [brand, setBrand] = useHistoryState(`${scope}:brand`, '');
  const pickedLocation = usePickedLocation();
  const ensureLogin = useEnsureLogin();
  const [details, setDetails] = useHistoryState(`${scope}:details`, user
    ? { ...emptyDetails, name: user.fullName || '', phone: user.phone || '', email: user.email || '' }
    : emptyDetails);
  const [date, setDate] = useHistoryState(`${scope}:date`, '');
  const [time, setTime] = useHistoryState(`${scope}:time`, '');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useHistoryState(`${scope}:receipt`, null);

  // STAGES: 0 intro, 1 work stages, 2 brand, 3 rates, [4 benefits], then
  // DETAILS/SCHEDULE/CONFIRM. Computed once per flow since only some flows
  // have a benefits step.
  const hasBenefits = !!flow?.benefits;
  const BRAND = 2;
  const RATES = 3;
  const BENEFITS = 4;
  const SCHEDULE = hasBenefits ? 5 : 4;
  const DETAILS = SCHEDULE + 1;
  const CONFIRM = DETAILS + 1;

  if (!flow) return <Navigate to="/services/waterproofing" replace />;

  const brandOptions = optionsFor('wp_brand');
  const brandLabel = brandOptions.find((o) => o.value === brand)?.label;
  const rateRows = brandLabel ? (ratesByGroup(flow.ratesKey).get(brandLabel) || []) : [];

  const jumpToStep = (i) => {
    setStage(i);
    scrollToTop();
  };

  const scrollToTop = () => {
    if (modal) onStepChange?.();
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goNext = () => {
    setSubmitError('');
    if (stage === BRAND && !brand) {
      setErrors({ wp_brand: 'Please choose a brand' });
      return;
    }
    setErrors({});
    setStage((s) => Math.min(s + 1, CONFIRM));
    scrollToTop();
  };

  const goBack = () => {
    setSubmitError('');
    formBack(() => setStage((s) => Math.max(s - 1, 0)));
    scrollToTop();
  };

  const canLeaveDetails = () => {
    const next = validateDetails(details, pickedLocation);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const setDetail = (key) => (e) => {
    setDetails((d) => ({ ...d, [key]: e.target.value }));
    setErrors((err) => ({ ...err, [key]: undefined }));
    setSubmitError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!canLeaveDetails()) return;
    if (!date || !time) {
      setErrors({ slot: 'Please choose a date and a time' });
      return;
    }
    // Every booking needs an account: ask now, over this form (LoginGate).
    if (!(await ensureLogin(details))) return;

    setBusy(true);
    setSubmitError('');
    try {
      // The service itself, so staff see which job this is (Terrace, Water
      // Tank...), not just the brand.
      const flat = [{
        key: 'service_needed',
        value: wpCatalogueService(flowSlug, flow.title),
        label: flowSlug === 'bathroom-floor' ? 'Bathroom Floor Waterproofing' : flow.title,
      }];
      if (brand) {
        flat.push({ key: 'wp_brand', value: brand, label: brandLabel || brand });
      }

      const result = await api.createBooking({
        serviceSlug: 'waterproofing',
        answers: flat,
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
      uploadBookingPhotos('wp', result.bookingNumber, details.phone);
      setStage(CONFIRM);
      scrollToTop();
    } catch (err) {
      if (err && err.fieldErrors) setErrors(err.fieldErrors);
      setSubmitError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="pnt-section">
        <div className="container container-narrow">
          <p className="question-hint">Loading services…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="pnt-section">
        <div className="container container-narrow">
          <div role="alert" className="alert alert-error">
            <Icon name="info" size={18} />
            <span>{loadError}</span>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------- intro */
  if (stage === 0 && !receipt) {
    return (
      <>
        {modal && (
          <div className="container container-narrow wp-modal-back-row">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onBackToCategories}>
              <Icon name="arrow-left" size={16} /> WATERPROOFING SERVICES
            </button>
          </div>
        )}
        {flowSlug === 'terrace' ? (
          <TerraceSlider title={flow.title} />
        ) : (
          <PaintingHero
            eyebrow=""
            title={flow.slug === 'bathroom-floor' ? 'BATHROOM WATERPROOFING' : flow.title}
            tagline={flow.heroTagline}
            image={flow.intro.image}
            trustPoints={[]}
            className={HERO_CLASS_BY_FLOW[flow.slug] || ''}
          />
        )}
        <section className="pnt-section">
          <div className="container container-narrow">
            <h2 className="pnt-intro-heading">{flow.intro.heading}</h2>
            <p className="pnt-intro-text">{flow.intro.text}</p>

            <ul className="pnt-intro-trust">
              {flow.intro.points.map((t) => (
                <li key={t.label}>
                  <Icon name={t.icon} size={22} />
                  <span>{t.label}</span>
                </li>
              ))}
            </ul>

            <ModalFoot
              className={modal ? 'pnt-step-actions modal-sticky-foot' : undefined}
            >
              <button
                data-wp-intro-action
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => jumpToStep(1)}
              >
                {flow.slug === 'terrace' || flow.slug === 'interior-wall' || flow.slug === 'water-tank'
                  ? 'View Services'
                  : 'Explore Services'}
                <Icon name="arrow-right" size={17} />
              </button>
            </ModalFoot>
          </div>
        </section>
      </>
    );
  }

  /* --------------------------------------------------------- confirmed */
  // Once booked, every step shows the confirmation (Back included), so the
  // same booking cannot be sent twice.
  if (receipt) {
    const message = encodeURIComponent(`Hello Supplybase, this is about my booking ${receipt.bookingNumber}.`);
    return (
      <div className={modal ? 'wizard-shell wp-modal-wizard' : 'wizard-shell'}>
        <div className="wizard-container">
          <div className="wizard-card">
            <div className="confirmed">
              <div className="confirmed-tick">
                <Icon name="check" size={38} strokeWidth={3} />
              </div>
              <h2>Your Site Visit is Confirmed!</h2>
              <p>Our expert will visit your location, inspect the site and provide a detailed quotation.</p>

              <dl className="confirmed-panel">
                <div><dt>Booking ID</dt><dd className="booking-id">{receipt.bookingNumber}</dd></div>
                <div><dt>Date &amp; Time</dt><dd>{formatVisit(receipt.date, receipt.time)}</dd></div>
                <div><dt>Service</dt><dd>{flow.title}</dd></div>
                {brandLabel && <div><dt>Brand</dt><dd>{brandLabel}</dd></div>}
                <div><dt>Location</dt><dd>{details.city}</dd></div>
              </dl>

              {!receipt.paidOnline && (
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
              <p className="question-hint" style={{ marginTop: 10 }}>
                Our team will contact you shortly to confirm the details.
              </p>

              <Link to="/dashboard" className="btn btn-primary btn-block">GO TO DASHBOARD</Link>
              <div className="btn-row" style={{ marginTop: 12 }}>
                <a href={`https://wa.me/${contact.phoneRaw}?text=${message}`} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                  <Icon name="whatsapp" size={17} /> CHAT ON WHATSAPP
                </a>
                <Link to="/services/waterproofing" className="btn btn-ghost btn-back">BACK TO WATERPROOFING</Link>
              </div>
            </div>
          </div>

          {flow.closing && (
            <div className="pnt-closing">
              <span className="pnt-closing-eyebrow">WATERPROOFING BY SUPPLYBASE</span>
              <h2>{flow.closing.heading}</h2>
              <Link to="/services/waterproofing" className="btn btn-primary">
                {flow.closing.cta} <Icon name="arrow-right" size={17} />
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------ details */
  if (stage === DETAILS) {
    return (
      <div className={modal ? 'wizard-shell wp-modal-wizard' : 'wizard-shell'}>
        <div className="wizard-container">
          <FlowTopBar flow={flow} onBack={goBack} />
          <form onSubmit={handleSubmit} noValidate>
            <div className="wizard-card">
              <div className="wizard-card-head">
                <h2>Your Details</h2>
                <p>We will contact you to confirm the appointment.</p>
              </div>
              <CustomerDetailsFields details={details} setDetail={setDetail} errors={errors} idPrefix="wp" />
              {submitError && (
                <div role="alert" className="alert alert-error" style={{ marginTop: 18 }}>
                  <Icon name="info" size={18} /><span>{submitError}</span>
                </div>
              )}
              <ModalFoot className={modal ? 'wizard-foot modal-sticky-foot' : 'wizard-foot'}>
                <button type="button" className="btn btn-ghost btn-back" onClick={goBack}>BACK</button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'BOOKING…' : 'BOOK A SITE VISIT'}
                  <Icon name="arrow-right" size={17} />
                </button>
              </ModalFoot>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------------- schedule */
  if (stage === SCHEDULE) {
    return (
      <div className={modal ? 'wizard-shell wp-modal-wizard' : 'wizard-shell'}>
        <div className="wizard-container">
          <FlowTopBar flow={flow} onBack={goBack} />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!date || !time) {
                setErrors((current) => ({
                  ...current,
                  slot: 'Please choose a date and a time',
                }));
                return;
              }
              goNext();
            }}
            noValidate
          >
            <div className="wizard-card">
              <div className="wizard-card-head">
                <h2>Book a Site Visit</h2>
                <p>Our expert will visit your site, inspect and provide a customised quotation.</p>
              </div>
              <div className="wp-slot-region"><SlotPicker
                serviceSlug="waterproofing"
                date={date}
                time={time}
                onPick={(d, t) => { setDate(d); setTime(t); setErrors((e) => ({ ...e, slot: undefined })); }}
                error={errors.slot}
              /></div>

              <div className="pnt-fee-strip">
                <span>{category ? category.visitFeeDisplay : '₹—'}</span>
                <span>For home inspection — adjusted in final bill if you proceed</span>
              </div>

              {submitError && (
                <div role="alert" className="alert alert-error" style={{ marginTop: 18 }}>
                  <Icon name="info" size={18} /><span>{submitError}</span>
                </div>
              )}
              <ModalFoot className={modal ? 'wizard-foot modal-sticky-foot' : 'wizard-foot'}>
                <button type="button" className="btn btn-ghost btn-back" onClick={goBack}>BACK</button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  CONTINUE <Icon name="arrow-right" size={17} />
                </button>
              </ModalFoot>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------- config step */
  return (
    <div className={modal ? 'pnt-flow-shell wp-modal-flow' : 'pnt-flow-shell wp-page-flow'}>
      <div className="container container-narrow">
        <FlowTopBar flow={flow} onBack={goBack} plain />


        <div className="pnt-step-card">
          {stage === 1 && (
            <>
              <h2 className="pnt-step-title">What We Do</h2>
              <div className="wp-stage-list">
                {flow.stages.map((s) => (
                  <div key={s.title} className="wp-stage-card wp-stage-card--photo">
                    <span className="wp-stage-photo" aria-hidden="true">
                      <img
                        key={wpStageImages[flow.slug]?.[s.title]}
                        src={wpStageImages[flow.slug]?.[s.title]}
                        alt=""
                        width={96}
                        height={76}
                        loading="lazy"
                        decoding="async"
                        onError={(event) => {
                          event.currentTarget.hidden = true;
                          event.currentTarget.nextElementSibling.hidden = false;
                        }}
                      />
                      <span className="wp-stage-photo-fallback" hidden>
                        <Icon name={s.icon} size={24} />
                      </span>
                    </span>
                    <span className="wp-stage-body">
                      <strong>{s.title}</strong>
                      <span>{s.text}</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {stage === BRAND && (
            <>
              <h2 className="pnt-step-title">Select Your Preferred Brand</h2>
              <p className="question-hint" style={{ marginTop: -8, marginBottom: 16 }}>
                We work with trusted brands to ensure long-lasting protection and quality.
              </p>
              <BrandPicker
                options={brandOptions}
                value={brand}
                onSelect={(value) => {
                  setBrand(value);
                  setErrors((current) => ({
                    ...current,
                    wp_brand: undefined,
                  }));
                }}
              />
              {errors.wp_brand && createPortal(
                <div className="wp-validation-popup" role="alert">
                  <Icon name="info" size={20} />
                  <span>{errors.wp_brand}</span>
                  <button
                    type="button"
                    aria-label="Dismiss message"
                    onClick={() => setErrors((current) => ({
                      ...current,
                      wp_brand: undefined,
                    }))}
                  >
                    ×
                  </button>
                </div>,
                document.body
              )}
            </>
          )}

          {stage === RATES && (
            <>
              <h2 className="pnt-step-title">{flow.title} Rates</h2>
              {flow.slug === 'water-tank' && brand === 'dr-fixit' ? (
                <>
                  <RateTable
                    title="Overhead Tank"
                    rows={(ratesByGroup(flow.ratesKey).get('Overhead Tank') || []).filter((r) => r.value.endsWith(brand))}
                  />
                  <RateTable
                    title="Underground Sump"
                    rows={(ratesByGroup(flow.ratesKey).get('Underground Sump') || []).filter((r) => r.value.endsWith(brand))}
                  />
                </>
              ) : (
                <RateTable rows={rateRows} />
              )}
              <p className="wp-rate-note">{flow.feeNote}</p>
            </>
          )}

          {hasBenefits && stage === BENEFITS && (
            <>
              <h2 className="pnt-step-title">{flow.benefits.heading}</h2>
              <div className="pnt-included">
                <ul>
                  {flow.benefits.points.map((p) => (
                    <li key={p}>
                      <Icon name="check" size={14} strokeWidth={3} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <ModalFoot className={modal ? 'pnt-step-actions modal-sticky-foot' : 'pnt-step-actions'}>
            <button type="button" className="btn btn-ghost btn-back" onClick={goBack}>BACK</button>
            <button type="button" className="btn btn-primary" onClick={goNext}>
              Continue <Icon name="arrow-right" size={17} />
            </button>
          </ModalFoot>
        </div>
      </div>
    </div>
  );
}

function FlowTopBar({ flow, onBack, plain }) {
  return (
    <div className={plain ? 'pnt-top' : 'wizard-top'}>
      <button type="button" className={plain ? 'pnt-back' : 'wizard-back'} onClick={onBack} aria-label="Go back">
        <Icon name="arrow-left" size={20} />
      </button>
      <h1 className={plain ? 'pnt-top-title' : 'wizard-title'}>{flow.title}</h1>
      <a
        href={`https://wa.me/${contact.phoneRaw}?text=${encodeURIComponent(`Hello Supplybase, I need help booking ${flow.title}.`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={plain ? 'pnt-help' : 'wizard-help'}
      >
        Need help?
      </a>
    </div>
  );
}

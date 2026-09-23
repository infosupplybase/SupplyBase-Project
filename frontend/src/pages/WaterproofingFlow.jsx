import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import PaintingHero from '../components/painting/PaintingHero';
import BrandPicker from '../components/waterproofing/BrandPicker';
import RateTable from '../components/waterproofing/RateTable';
import CustomerDetailsFields from '../components/booking/CustomerDetailsFields';
import SlotPicker from '../components/booking/SlotPicker';
import useWaterproofingCatalogue from '../hooks/useWaterproofingCatalogue';
import { wpFlows } from '../data/waterproofingContent';
import { emptyDetails, validateDetails } from '../lib/bookingDetails';
import { useAuth } from '../context/AuthContext';
import api, { friendlyError } from '../lib/api';
import { contact } from '../data/siteConfig';

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
export default function WaterproofingFlow() {
  const { flowSlug } = useParams();
  const flow = wpFlows[flowSlug];
  const { user } = useAuth();
  const { category, loading, error: loadError, optionsFor, ratesByGroup } = useWaterproofingCatalogue();

  const [stage, setStage] = useState(0);
  const [brand, setBrand] = useState('');
  const [details, setDetails] = useState(user
    ? { ...emptyDetails, name: user.fullName || '', phone: user.phone || '', email: user.email || '' }
    : emptyDetails);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);

  // STAGES: 0 intro, 1 work stages, 2 brand, 3 rates, [4 benefits], then
  // DETAILS/SCHEDULE/CONFIRM. Computed once per flow since only some flows
  // have a benefits step.
  const hasBenefits = !!flow?.benefits;
  const BRAND = 2;
  const RATES = 3;
  const BENEFITS = 4;
  const DETAILS = hasBenefits ? 5 : 4;
  const SCHEDULE = DETAILS + 1;
  const CONFIRM = SCHEDULE + 1;

  if (!flow) return <Navigate to="/services/waterproofing" replace />;

  const brandOptions = optionsFor('wp_brand');
  const brandLabel = brandOptions.find((o) => o.value === brand)?.label;
  const rateRows = brandLabel ? (ratesByGroup(flow.ratesKey).get(brandLabel) || []) : [];

  const jumpToStep = (i) => {
    setStage(i);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goNext = () => {
    setSubmitError('');
    if (stage === BRAND && !brand) {
      setErrors({ wp_brand: 'Please choose a brand' });
      return;
    }
    setErrors({});
    setStage((s) => Math.min(s + 1, CONFIRM));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setSubmitError('');
    setStage((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const canLeaveDetails = () => {
    const next = validateDetails(details);
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
    if (!date || !time) {
      setErrors({ slot: 'Please choose a date and a time' });
      return;
    }

    setBusy(true);
    setSubmitError('');
    try {
      const flat = [];
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
        address: details.address,
        city: details.city,
        pincode: details.pincode || null,
      });
      setReceipt(result);
      setStage(CONFIRM);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
  if (stage === 0) {
    return (
      <>
        <PaintingHero eyebrow="PROFESSIONAL" title={flow.title} tagline={flow.heroTagline} image={flow.intro.image} trustPoints={[]} />
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

            <button type="button" className="btn btn-primary btn-block" onClick={() => jumpToStep(1)}>
              {flow.slug === 'terrace' || flow.slug === 'interior-wall' || flow.slug === 'water-tank' ? 'View Services' : 'Explore Services'} <Icon name="arrow-right" size={17} />
            </button>
          </div>
        </section>
      </>
    );
  }

  /* --------------------------------------------------------- confirmed */
  if (stage === CONFIRM && receipt) {
    const message = encodeURIComponent(`Hello Supplybase, this is about my booking ${receipt.bookingNumber}.`);
    return (
      <div className="wizard-shell">
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
                <div><dt>Date &amp; Time</dt><dd>{receipt.date}, {receipt.time}</dd></div>
                <div><dt>Service</dt><dd>{flow.title}</dd></div>
                {brandLabel && <div><dt>Brand</dt><dd>{brandLabel}</dd></div>}
                <div><dt>Location</dt><dd>{details.city}</dd></div>
              </dl>

              <div className="pnt-fee-note">
                <Icon name="info" size={17} />
                <span>{receipt.message}</span>
              </div>
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
      <div className="wizard-shell">
        <div className="wizard-container">
          <FlowTopBar flow={flow} onBack={goBack} />
          <form onSubmit={(e) => { e.preventDefault(); if (canLeaveDetails()) goNext(); }} noValidate>
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
              <div className="wizard-foot">
                <button type="button" className="btn btn-ghost btn-back" onClick={goBack}>BACK</button>
                <button type="submit" className="btn btn-primary">CONTINUE <Icon name="arrow-right" size={17} /></button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------------- schedule */
  if (stage === SCHEDULE) {
    return (
      <div className="wizard-shell">
        <div className="wizard-container">
          <FlowTopBar flow={flow} onBack={goBack} />
          <form onSubmit={handleSubmit} noValidate>
            <div className="wizard-card">
              <div className="wizard-card-head">
                <h2>Book a Site Visit</h2>
                <p>Our expert will visit your site, inspect and provide a customised quotation.</p>
              </div>
              <SlotPicker
                serviceSlug="waterproofing"
                date={date}
                time={time}
                onPick={(d, t) => { setDate(d); setTime(t); setErrors((e) => ({ ...e, slot: undefined })); }}
                error={errors.slot}
              />

              <div className="pnt-fee-strip">
                <span>{category ? category.visitFeeDisplay : '₹—'}</span>
                <span>For home inspection — adjusted in final bill if you proceed</span>
              </div>

              {submitError && (
                <div role="alert" className="alert alert-error" style={{ marginTop: 18 }}>
                  <Icon name="info" size={18} /><span>{submitError}</span>
                </div>
              )}
              <div className="wizard-foot">
                <button type="button" className="btn btn-ghost btn-back" onClick={goBack}>BACK</button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'BOOKING…' : 'BOOK A SITE VISIT'} <Icon name="arrow-right" size={17} />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------- config step */
  return (
    <div className="pnt-flow-shell">
      <div className="container container-narrow">
        <FlowTopBar flow={flow} onBack={goBack} plain />
        <ol className="pnt-steps" aria-label="Progress">
          {Array.from({ length: hasBenefits ? 4 : 3 }).map((_, i) => (
            <li key={i} className={`pnt-step ${i + 1 === stage ? 'current' : ''} ${i + 1 < stage ? 'done' : ''}`}>
              <span className="pnt-step-num">
                {i + 1 < stage ? <Icon name="check" size={12} strokeWidth={3} /> : i + 1}
              </span>
              {i < (hasBenefits ? 3 : 2) && <span className="pnt-step-line" aria-hidden="true" />}
            </li>
          ))}
        </ol>

        <div className="pnt-step-card">
          {stage === 1 && (
            <>
              <h2 className="pnt-step-title">What We Do</h2>
              <div className="wp-stage-list">
                {flow.stages.map((s) => (
                  <div key={s.title} className="wp-stage-card">
                    <span className="wp-stage-icon"><Icon name={s.icon} size={22} /></span>
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
              <BrandPicker options={brandOptions} value={brand} onSelect={setBrand} />
              {errors.wp_brand && <span className="field-error">{errors.wp_brand}</span>}
            </>
          )}

          {stage === RATES && (
            <>
              <h2 className="pnt-step-title">{flow.title} Rates</h2>
              {flow.slug === 'water-tank' ? (
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

          <div className="pnt-step-actions">
            <button type="button" className="btn btn-ghost btn-back" onClick={goBack}>BACK</button>
            <button type="button" className="btn btn-primary" onClick={goNext}>
              Continue <Icon name="arrow-right" size={17} />
            </button>
          </div>
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

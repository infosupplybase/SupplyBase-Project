import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import StepIndicator from '../components/painting/StepIndicator';
import OptionCard from '../components/painting/OptionCard';
import BrandPicker from '../components/painting/BrandPicker';
import ProductPicker from '../components/painting/ProductPicker';
import ColourPicker from '../components/painting/ColourPicker';
import AddonList from '../components/painting/AddonList';
import EstimateSummary from '../components/painting/EstimateSummary';
import CustomerDetailsFields from '../components/booking/CustomerDetailsFields';
import SlotPicker from '../components/booking/SlotPicker';
import usePaintingCatalogue from '../hooks/usePaintingCatalogue';
import { paintingFlows } from '../data/paintingContent';
import { composeAddress, emptyDetails, validateDetails } from '../lib/bookingDetails';
import { usePickedLocation } from '../context/LocationContext';
import { useEnsureLogin } from '../components/auth/LoginGate';
import { uploadBookingPhotos } from '../lib/bookingPhotos';
import { formatRupees } from '../lib/money';
import { useAuth } from '../context/AuthContext';
import api, { friendlyError } from '../lib/api';
import { contact } from '../data/siteConfig';
import { formatVisit } from '../lib/visitTime';
import { useFormBack, useHistoryState } from '../hooks/useHistoryState';
import ModalFoot from '../components/services/ModalFoot';

/**
 * One page, three journeys (Full Home / Few Walls / Renovation) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â driven
 * entirely by paintingFlows[flowSlug] (see paintingContent.js) and the live
 * catalogue (usePaintingCatalogue). Stages 1..N are the flow's configured
 * steps (the last of which is always "summary"), starting straight on the
 * first question rather than an intro splash; then Details, Schedule and
 * Confirm, the same three-stage tail ServiceBooking.jsx already uses for
 * every other category.
 */
export default function PaintingFlow({
  modal = false,
  flowSlug: propFlowSlug,
  onBackToCategories,
  onStepChange,
}) {
  const params = useParams();
  const navigate = useNavigate();

  const flowSlug = propFlowSlug || params.flowSlug;
  const flow = paintingFlows[flowSlug];
  const { user } = useAuth();
  const { category, loading, error: loadError, optionsFor, productsByTier, coloursByTab } =
    usePaintingCatalogue();

  // This form's step and answers live in the browser's history (see
  // hooks/useHistoryState): a refresh keeps them, Back goes one step back.
  const scope = `f:paint:${flowSlug}`;
  const formBack = useFormBack();
  const [stage, setStage] = useHistoryState(`${scope}:stage`, 1, { push: true });
  const [answers, setAnswers] = useHistoryState(`${scope}:answers`, {});
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
  const [compareOpen, setCompareOpen] = useState(false);
  const [choiceError, setChoiceError] = useState('');

  useEffect(() => {
    setChoiceError('');
  }, [answers, stage]);

  useEffect(() => {
    if (!choiceError) return;
    const timer = window.setTimeout(() => setChoiceError(''), 4000);
    return () => window.clearTimeout(timer);
  }, [choiceError]);

  const configSteps = useMemo(() => {
    const steps = flow?.steps || [];

    if (
      flowSlug !== 'few-walls' ||
      answers.few_walls_area !== 'ceiling-paint'
    ) {
      return steps;
    }

    return [
      steps[0],
      {
        id: 'ceiling_type',
        type: 'option',
        questionKey: 'few_walls_ceiling_type',
        title: 'Choose Your Ceiling Type',
        showThumb: false,
        icon: 'ceiling',
        required: true,
      },
      ...steps.slice(1),
    ];
  }, [flow, flowSlug, answers.few_walls_area]);
  const DETAILS = 1 + configSteps.length;
  const SCHEDULE = DETAILS + 1;
  const CONFIRM = SCHEDULE + 1;

  const setAnswer = (key) => (value) => {
    setAnswers((a) => {
      const next = { ...a, [key]: value };

      if (key === 'few_walls_area' && value !== a.few_walls_area) {
        delete next.few_walls_ceiling_type;
        delete next.few_walls_product;
      }

      if (
        key === 'few_walls_ceiling_type' &&
        value !== a.few_walls_ceiling_type
      ) {
        delete next.few_walls_product;
      }

      if (key === 'paint_brand' && value !== a.paint_brand) {
        delete next.full_home_product;
        delete next.few_walls_product;
        delete next.renovation_product;
      }

      return next;
    });
    setErrors((e) => ({ ...e, [key]: undefined }));
    setSubmitError('');
  };

  const toggleMulti = (key) => (value) => {
    setAnswers((a) => {
      const list = Array.isArray(a[key]) ? a[key] : [];
      return {
        ...a,
        [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const setDetail = (key) => (e) => {
    setDetails((d) => ({ ...d, [key]: e.target.value }));
    setErrors((err) => ({ ...err, [key]: undefined }));
    setSubmitError('');
  };

  /** Every step's answer, resolved to a label + a client-side estimate
      (display only ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â the server recomputes the real total from the
      catalogue on submit, never trusting this number). */
  const resolved = useMemo(() => {
    if (!flow) return [];
    return configSteps
      .filter((s) => s.type !== 'summary')
      .map((step, i) => {
        if (step.type === 'brand') {
          const opt = optionsFor('paint_brand').find((o) => o.value === answers.paint_brand);
          return { stepIndex: i + 1, label: 'Brand', value: opt?.label, priceRupees: null };
        }
        if (step.type === 'option') {
          const opt = optionsFor(step.questionKey).find((o) => o.value === answers[step.questionKey]);
          return { stepIndex: i + 1, label: step.title.replace(/\?$/, ''), value: opt?.label, priceRupees: opt?.price ?? null };
        }
        if (step.type === 'product') {
          const tiers = productsByTier(step.questionKey, answers);
          const opt = [...tiers.values()].flat().find((o) => o.value === answers[step.questionKey]);
          return { stepIndex: i + 1, label: 'Product', value: opt?.label, priceRupees: opt?.price ?? null };
        }
        if (step.type === 'colour') {
          const tabs = coloursByTab(step.questionKey);
          const opt = [...tabs.values()].flat().find((o) => o.value === answers[step.questionKey]);
          return { stepIndex: i + 1, label: step.title.replace('Choose Your ', ''), value: opt?.label, priceRupees: null };
        }
        if (step.type === 'addon') {
          const chosen = Array.isArray(answers[step.questionKey]) ? answers[step.questionKey] : [];
          const opts = optionsFor(step.questionKey).filter((o) => chosen.includes(o.value));
          const total = opts.reduce((sum, o) => sum + (o.price || 0), 0);
          return {
            stepIndex: i + 1,
            label: step.title.replace(' (optional)', '').replace(' (Optional)', ''),
            value: opts.map((o) => o.label).join(', '),
            priceRupees: opts.length ? total : null,
          };
        }
        return { stepIndex: i + 1, label: step.title, value: '', priceRupees: null };
      });
  }, [flow, configSteps, answers, optionsFor, productsByTier, coloursByTab]);

  const requiresPaintingSiteQuote =
    (flowSlug === 'full-home' &&
      (answers.full_home_painting_type === 'renovation-painting' ||
        (answers.home_type === 'independent-house' &&
          answers.full_home_painting_type === 'unfurnished-home'))) ||
    flowSlug === 'renovation' ||
    (flowSlug === 'few-walls' &&
      answers.few_walls_area === 'multiple-walls');

  const itemsTotalPaise = useMemo(
    () => resolved.reduce((sum, r) => sum + Math.round((r.priceRupees || 0) * 100), 0),
    [resolved]
  );

  if (!flow) {
  if (modal) return null;

  return <Navigate to="/services/painting" replace />;
}

  const jumpToStep = (i) => {
  setStage(i);

  if (modal) {
    onStepChange?.();
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

  const validateStep = (step) => {
    const reject = (key, message) => {
      setErrors({ [key]: message });
      if (modal) setChoiceError(message);
      return false;
    };

    if (step.type === 'option') {
      const options = optionsFor(step.questionKey);

      if (
        step.questionKey === 'few_walls_ceiling_type' &&
        options.length === 0
      ) {
        return reject(
          step.questionKey,
          'Ceiling options are unavailable. Please refresh and try again.'
        );
      }
      const valid = options.some(
        (option) => option.value === answers[step.questionKey]
      );

      if (options.length > 0 && !valid) {
        return reject(
          step.questionKey,
          'Choose an option to continue.'
        );
      }
    }

    if (step.type === 'brand') {
      const valid = optionsFor('paint_brand').some(
        (option) => option.value === answers.paint_brand
      );

      if (!valid) {
        return reject(
          'paint_brand',
          'Choose a paint brand to continue.'
        );
      }
    }

    if (step.type === 'product') {
      const products = [...productsByTier(step.questionKey, answers).values()].flat();

      const valid = products.some(
        (product) => product.value === answers[step.questionKey]
      );

      if (products.length > 0 && !valid) {
        return reject(
          step.questionKey,
          'Choose a paint product to continue.'
        );
      }
    }

    if (step.type === 'addon' && step.required) {
      const chosen = Array.isArray(answers[step.questionKey])
        ? answers[step.questionKey]
        : [];

      const valid = optionsFor(step.questionKey).some(
        (option) => chosen.includes(option.value)
      );

      if (!valid) {
        return reject(
          step.questionKey,
          'Choose at least one service to continue.'
        );
      }
    }

    setErrors({});
    setChoiceError('');
    return true;
  };

  const goNext = () => {
  setSubmitError('');

  const step = configSteps[stage - 1];

  if (step && !validateStep(step)) return;

  setStage((s) => Math.min(s + 1, CONFIRM));

  if (modal) {
    onStepChange?.();
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

  const goBack = () => {
  setSubmitError('');

  if (stage === 1) {
    if (modal) {
      onBackToCategories?.();
    } else {
      navigate('/services/painting');
    }
    return;
  }

  formBack(() => setStage((s) => Math.max(s - 1, 1)));

  if (modal) {
    onStepChange?.();
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

  const canLeaveDetails = () => {
    const next = validateDetails(details, pickedLocation);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return; // duplicate-submit guard
    if (!date || !time) {
      setErrors({ slot: 'Please choose a date and a time' });
      return;
    }
    // Every booking needs an account: ask now, over this form (LoginGate).
    if (!(await ensureLogin(details))) return;

    setBusy(true);
    setSubmitError('');
    try {
      const flat = [];
      configSteps.forEach((step) => {
        if (step.type === 'summary') return;
        if (step.type === 'brand') {
          if (answers.paint_brand) {
            const opt = optionsFor('paint_brand').find((o) => o.value === answers.paint_brand);
            flat.push({ key: 'paint_brand', value: answers.paint_brand, label: opt?.label || answers.paint_brand });
          }
          return;
        }
        if (step.type === 'addon') {
          const chosen = Array.isArray(answers[step.questionKey]) ? answers[step.questionKey] : [];
          chosen.forEach((v) => {
            const opt = optionsFor(step.questionKey).find((o) => o.value === v);
            flat.push({ key: step.questionKey, value: v, label: opt?.label || v });
          });
          return;
        }
        const value = answers[step.questionKey];
        if (value === undefined || value === '' || value === null) return;
        let opt;
        if (step.type === 'product') opt = [...productsByTier(step.questionKey, answers).values()].flat().find((o) => o.value === value);
        else if (step.type === 'colour') opt = [...coloursByTab(step.questionKey).values()].flat().find((o) => o.value === value);
        else opt = optionsFor(step.questionKey).find((o) => o.value === value);
        flat.push({ key: step.questionKey, value, label: opt?.label || value });
      });

      const result = await api.createBooking({
        serviceSlug: 'painting',
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
      uploadBookingPhotos('pnt', result.bookingNumber, details.phone);
setStage(CONFIRM);

if (modal) {
  onStepChange?.();
} else {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
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
          <p className="question-hint" role="status">Loading painting options...</p>
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

  /* --------------------------------------------------------- confirmed */
  // Once booked, every step shows the confirmation (Back included), so the
  // same booking cannot be sent twice.
  if (receipt) {
    const message = encodeURIComponent(`Hello Supplybase, this is about my booking ${receipt.bookingNumber}.`);
    return (
      <div
  className={
    modal
      ? 'wizard-shell pnt-modal-flow !min-h-0 !pb-0'
      : 'wizard-shell'
  }
>
        <div
  className={
    modal
      ? 'wizard-container !min-h-0 !pb-0'
      : 'wizard-container'
  }
>
          <div className="wizard-card">
            <div className="confirmed">
              <div className="confirmed-tick">
                <Icon name="check" size={38} strokeWidth={3} />
              </div>
              <h2>Booking Confirmed!</h2>
              <p>Our expert will visit your home. We&rsquo;ll inspect the walls, suggest the best solution and give you a final quotation.</p>

              <dl className="confirmed-panel">
                <div><dt>Booking ID</dt><dd className="booking-id">{receipt.bookingNumber}</dd></div>
                <div><dt>Date &amp; Time</dt><dd>{formatVisit(receipt.date, receipt.time)}</dd></div>
                <div><dt>Service</dt><dd>{flow.name}</dd></div>
                <div><dt>Location</dt><dd>{details.city}</dd></div>
              </dl>

              <div className="pnt-fee-note">
                <Icon name="info" size={17} />
                <span>{receipt.message}</span>
              </div>

              <Link to="/dashboard" className="btn btn-primary btn-block">GO TO DASHBOARD</Link>
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

  <Link
    to="/services/painting"
    className={
      modal
        ? 'btn btn-ghost btn-back !w-auto !min-w-[190px] !justify-center'
        : 'btn btn-ghost btn-back'
    }
  >
    BACK TO PAINTING
  </Link>
</div>
            </div>
          </div>

          {!modal && flow.closing && (
  <div className="pnt-closing">
    <span className="pnt-closing-eyebrow">
      RENOVATION PAINTING BY SUPPLYBASE
    </span>

    <h2>{flow.closing.heading}</h2>

    <Link to="/services/painting" className="btn btn-primary">
      {flow.closing.cta}
      <Icon name="arrow-right" size={17} />
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
              <CustomerDetailsFields details={details} setDetail={setDetail} errors={errors} idPrefix="pnt" />
              {submitError && (
                <div role="alert" className="alert alert-error" style={{ marginTop: 18 }}>
                  <Icon name="info" size={18} /><span>{submitError}</span>
                </div>
              )}
              <ModalFoot
  className={
    modal
      ? 'wizard-foot modal-sticky-foot !grid !w-full !grid-cols-[84px_minmax(0,1fr)] !items-stretch !gap-3 !border-0 md:!flex md:!items-center md:!justify-end md:!gap-3'
      : 'wizard-foot'
  }
>
                <button
  type="button"
  className={
    modal
  ? 'btn btn-ghost btn-back !w-full !min-w-0 !px-2 md:!w-auto md:!min-w-[90px] md:!flex-none md:!px-4 md:!me-auto'
  : 'btn btn-ghost btn-back'
  }
  onClick={goBack}
>BACK</button>
                <button
  type="submit"
  className={
    modal
  ? 'btn btn-primary !w-full !min-w-0 !px-3 !whitespace-nowrap md:!w-[150px] md:!min-w-[150px] md:!flex-none md:!px-4'
  : 'btn btn-primary'
  }
>CONTINUE <Icon name="arrow-right" size={17} /></button>
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
      <div className="wizard-shell">
        <div className="wizard-container">
          <FlowTopBar flow={flow} onBack={goBack} />
          <form onSubmit={handleSubmit} noValidate>
            <div className="wizard-card">
              <div className="wizard-card-head">
                <h2>Book a Home Visit</h2>
                <p>Our team will visit your site.</p>
              </div>
              <SlotPicker
                serviceSlug="painting"
                date={date}
                time={time}
                onPick={(d, t) => { setDate(d); setTime(t); setErrors((e) => ({ ...e, slot: undefined })); }}
                error={errors.slot}
              />

              <div className="pnt-fee-strip">
                <span>{category ? category.visitFeeDisplay : 'ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â'}</span>
                <span>Adjustable in final bill</span>
              </div>

              {submitError && (
                <div role="alert" className="alert alert-error" style={{ marginTop: 18 }}>
                  <Icon name="info" size={18} /><span>{submitError}</span>
                </div>
              )}
              <ModalFoot
  className={
    modal
      ? 'wizard-foot modal-sticky-foot !grid !w-full !grid-cols-[84px_minmax(0,1fr)] !items-stretch !gap-3 !border-0 md:!flex md:!items-center md:!justify-end md:!gap-3'
      : 'wizard-foot'
  }
>
                <button
  type="button"
  className={
  modal
    ? 'btn btn-ghost btn-back !w-full !min-w-0 !px-2 md:!w-auto md:!min-w-[90px] md:!flex-none md:!px-4 md:!me-auto'
    : 'btn btn-ghost btn-back'
}
  onClick={goBack}
>BACK</button>
                <button
  type="submit"
 className={
  modal
    ? 'btn btn-primary !w-full !min-w-0 !px-3 !whitespace-nowrap md:!w-[190px] md:!min-w-[190px] md:!flex-none md:!px-4'
    : 'btn btn-primary'
}
  disabled={busy}
>
                  {busy ? 'BOOKINGÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦' : 'BOOK NOW'} <Icon name="arrow-right" size={17} />
                </button>
              </ModalFoot>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------- config step */
  const step = configSteps[stage - 1];

  return (
    <div
  className={
    modal
      ? 'pnt-flow-shell pnt-modal-flow'
      : 'pnt-flow-shell'
  }
>
      <div
  className={
    modal
      ? 'container container-narrow !w-full !max-w-none !px-0'
      : 'container container-narrow'
  }
>
        <FlowTopBar flow={flow} onBack={goBack} plain />
        <StepIndicator steps={configSteps} activeIndex={stage - 1} />

        <div
  className={
    modal
      ? 'pnt-step-card !w-full !max-w-none !px-3 sm:!px-5'
      : 'pnt-step-card'
  }
>
          {step.type !== 'summary' && <h2 className="pnt-step-title">{step.title}</h2>}

          {(step.type === 'colour' ||
            (step.type === 'addon' && !step.required)) && (
            <div
              className="painting-optional-note"
              style={{
                marginBottom: 18,
                padding: '12px 14px',
                border: '1px solid #eee3c4',
                borderRadius: 10,
                background: '#fffaf0',
                color: '#5e543e',
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              <strong style={{ display: 'block', marginBottom: 4 }}>
                Optional
              </strong>
              {step.type === 'colour'
                ? 'Have a preferred colour? Select it here. You can also continue without choosing and discuss colours with our team during your home visit.'
                : 'Add extra services if you need them. If you do not need any add-ons, simply click Continue.'}
            </div>
          )}


          {step.type === 'option' && (
            <>
              <div className="pnt-option-list">
                {optionsFor(step.questionKey).map((opt) => (
                  <OptionCard
                    key={opt.value}
                    option={opt}
                    name={step.questionKey}
                    icon={step.showThumb ? undefined : step.icon}
                    checked={answers[step.questionKey] === opt.value}
                    onSelect={setAnswer(step.questionKey)}
                  />
                ))}
              </div>
              {step.id === 'painting_type' && (
                <button type="button" className="pnt-compare-link" onClick={() => setCompareOpen(true)}>
                  <Icon name="layers" size={16} /> Compare Packages <Icon name="chevron-right" size={15} />
                </button>
              )}
              {!modal && errors[step.questionKey] && <span className="field-error">{errors[step.questionKey]}</span>}
            </>
          )}

          {step.type === 'brand' && (
            <>
              <BrandPicker options={optionsFor('paint_brand')} value={answers.paint_brand} onSelect={setAnswer('paint_brand')} />
              {!modal && errors.paint_brand && <span className="field-error">{errors.paint_brand}</span>}
            </>
          )}

          {step.type === 'product' && (
            <>
<ProductPicker
              showAllProducts={step.questionKey === 'few_walls_product'}
              productsByTier={productsByTier(step.questionKey, answers)}
              hidePrices={requiresPaintingSiteQuote}
              brand={answers.paint_brand}
              value={answers[step.questionKey]}
              onSelect={setAnswer(step.questionKey)}
            />
              {flowSlug === 'few-walls' &&
                answers.paint_brand === 'asian-paints' &&
                ['1-wall', '2-walls', 'multiple-walls'].includes(
                  answers.few_walls_area
                ) && (
                  <div
                    className="painting-wall-price-notes"
                    style={{
                      marginTop: 18,
                      padding: '14px 16px',
                      border: '1px solid #ead9aa',
                      borderRadius: 12,
                      background: '#fffaf0',
                      color: '#685527',
                      fontSize: 13,
                      lineHeight: 1.6,
                    }}
                  >
                    <strong>Important notes</strong>
                    <ul
                      style={{
                        margin: '8px 0 0',
                        paddingLeft: 18,
                      }}
                    >
                      <li>
                        Painting prices apply to walls with no damage.
                      </li>
                      <li>
                        Seepage or crack repairs may cost approximately
                        {' '}₹2,499 extra, depending on inspection.
                      </li>
                      <li>
                        Leakage waterproofing may cost approximately
                        {' '}₹2,999 extra, depending on inspection.
                      </li>
                    </ul>
                  </div>
                )}
            </>
          )}

          {step.type === 'colour' && (
            <ColourPicker
              coloursByTab={coloursByTab(step.questionKey)}
              tabSet={flow.colourTabSet}
              value={answers[step.questionKey]}
              onSelect={setAnswer(step.questionKey)}
            />
          )}

          {step.type === 'addon' && (
            <>
              <AddonList
                options={optionsFor(step.questionKey)}
                selected={Array.isArray(answers[step.questionKey]) ? answers[step.questionKey] : []}
                onToggle={toggleMulti(step.questionKey)}
              />
              {!modal && errors[step.questionKey] && <span className="field-error">{errors[step.questionKey]}</span>}
            </>
          )}

          {step.type === 'summary' && (
            <EstimateSummary
              rows={resolved}
              whatsIncluded={flow.whatsIncluded}
              itemsTotalPaise={requiresPaintingSiteQuote ? null : itemsTotalPaise}
              siteVisitQuote={requiresPaintingSiteQuote}
              onEditStep={jumpToStep}
            />
          )}

          <ModalFoot
  className={
    modal
      ? 'pnt-step-actions modal-sticky-foot !grid !w-full !grid-cols-[80px_minmax(0,1fr)] !items-center !gap-2 md:!flex md:!justify-between md:!gap-3'
      : 'pnt-step-actions'
  }
>
            <button type="button" className={
  modal
    ? 'btn btn-ghost btn-back !w-[80px] !min-w-[80px] !px-2 md:!w-auto md:!min-w-0 md:!px-4'
    : 'btn btn-ghost btn-back'
} onClick={goBack}>BACK</button>
            <button type="button" className={
  modal
    ? 'btn btn-primary !w-full !min-w-0 !max-w-full !px-3 !text-[11px] !whitespace-nowrap md:!ml-auto md:!w-[190px] md:!max-w-[190px] md:!flex-none md:!px-4 md:!text-sm'
    : 'btn btn-primary'
} onClick={goNext}>
              {step.type === 'summary' ? 'Book a Home Visit' : 'Continue'} <Icon name="arrow-right" size={17} />
            </button>
          </ModalFoot>
        </div>
      </div>

      {modal && choiceError && createPortal(
        <div
          className="pop-choice-toast painting-choice-toast"
          role="alert"
          style={{
            position: 'fixed',
            top: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: 'min(420px, calc(100vw - 32px))',
            padding: '13px 16px',
            border: '1px solid #e7ca7c',
            borderRadius: 12,
            background: '#fff9e9',
            color: '#78580d',
            boxShadow: '0 8px 28px rgba(0, 0, 0, 0.18)',
          }}
        >
          <Icon name="info" size={20} />
          <span style={{ flex: 1 }}>{choiceError}</span>
          <button
            type="button"
            onClick={() => setChoiceError('')}
            aria-label="Dismiss message"
            style={{
              border: 0,
              background: 'transparent',
              color: 'inherit',
              fontSize: 23,
              cursor: 'pointer',
            }}
          >{'\u00D7'}</button>
        </div>,
        document.body
      )}

      {compareOpen && (
        <div className="pnt-modal-overlay" onClick={() => setCompareOpen(false)}>
          <div className="pnt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pnt-modal-head">
              <h3>Compare Packages</h3>
              <button type="button" onClick={() => setCompareOpen(false)} aria-label="Close">
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="pnt-modal-body pnt-compare-table">
              {optionsFor(step.questionKey).map((opt) => (
                <div key={opt.value} className="pnt-compare-col">
                  <strong>{opt.label}</strong>
                  {opt.price != null && <span className="pnt-option-price">From {formatRupees(opt.price)}</span>}
                  <p>{opt.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FlowTopBar({ flow, onBack, plain }) {
  return (
    <div className={plain ? 'pnt-top' : 'wizard-top'}>
      <button type="button" className={plain ? 'pnt-back' : 'wizard-back'} onClick={onBack} aria-label="Go back">
        <Icon name="arrow-left" size={20} />
      </button>
      <h1 className={plain ? 'pnt-top-title' : 'wizard-title'}>{flow.name}</h1>
      <a
        href={`https://wa.me/${contact.phoneRaw}?text=${encodeURIComponent(`Hello Supplybase, I need help booking ${flow.name}.`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={plain ? 'pnt-help' : 'wizard-help'}
      >
        Need help?
      </a>
    </div>
  );
}

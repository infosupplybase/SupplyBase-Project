import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import PaintingHero from '../components/painting/PaintingHero';
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
import { paintingFlows, WALL_PROBLEMS } from '../data/paintingContent';
import { emptyDetails, validateDetails } from '../lib/bookingDetails';
import { formatRupees } from '../lib/money';
import { useAuth } from '../context/AuthContext';
import api, { friendlyError } from '../lib/api';
import { contact } from '../data/siteConfig';

/**
 * One page, three journeys (Full Home / Few Walls / Renovation) — driven
 * entirely by paintingFlows[flowSlug] (see paintingContent.js) and the live
 * catalogue (usePaintingCatalogue). Stage 0 is the flow's own intro splash;
 * stages 1..N are the flow's configured steps (the last of which is always
 * "summary"); then Details, Schedule and Confirm, the same three-stage tail
 * ServiceBooking.jsx already uses for every other category.
 */
export default function PaintingFlow({
  modal = false,
  flowSlug: propFlowSlug,
  onBackToCategories,
  onStepChange,
}) {
  const params = useParams();

  const flowSlug = propFlowSlug || params.flowSlug;
  const flow = paintingFlows[flowSlug];
  const { user } = useAuth();
  const { category, loading, error: loadError, optionsFor, productsByTier, coloursByTab } =
    usePaintingCatalogue();

  const [stage, setStage] = useState(0);
  const [answers, setAnswers] = useState({});
  const [details, setDetails] = useState(user
    ? { ...emptyDetails, name: user.fullName || '', phone: user.phone || '', email: user.email || '' }
    : emptyDetails);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [compareOpen, setCompareOpen] = useState(false);

  const configSteps = useMemo(() => flow?.steps || [], [flow]);
  const DETAILS = 1 + configSteps.length;
  const SCHEDULE = DETAILS + 1;
  const CONFIRM = SCHEDULE + 1;

  const setAnswer = (key) => (value) => {
    setAnswers((a) => ({ ...a, [key]: value }));
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
      (display only — the server recomputes the real total from the
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
          const tiers = productsByTier(step.questionKey);
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
    if (step.type === 'option') {
      const question = optionsFor(step.questionKey);
      const required = question.length > 0; // catalogue-driven; area/home-type are required in V15
      if (required && !answers[step.questionKey]) {
        setErrors({ [step.questionKey]: 'Please choose an option' });
        return false;
      }
    }
    if (step.type === 'brand' && !answers.paint_brand) {
      setErrors({ paint_brand: 'Please choose a brand' });
      return false;
    }
    if (step.type === 'addon' && step.required) {
      const chosen = Array.isArray(answers[step.questionKey]) ? answers[step.questionKey] : [];
      if (chosen.length === 0) {
        setErrors({ [step.questionKey]: 'Please choose at least one' });
        return false;
      }
    }
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

  if (stage === 0 && modal) {
    onBackToCategories?.();
    return;
  }

  setStage((s) => Math.max(s - 1, 0));

  if (modal) {
    onStepChange?.();
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

  const canLeaveDetails = () => {
    const next = validateDetails(details);
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
        if (step.type === 'product') opt = [...productsByTier(step.questionKey).values()].flat().find((o) => o.value === value);
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
        address: details.address,
        city: details.city,
        pincode: details.pincode || null,
      });
      setReceipt(result);
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
        <PaintingHero eyebrow="PROFESSIONAL" title={flow.name} tagline={flow.heroTagline} image={
          flow.slug === 'renovation' ? undefined : flow.introImage
        } />
        <section
  className={
    modal
      ? 'pnt-section pnt-modal-flow !pb-1 md:!pb-6'
      : 'pnt-section'
  }
>
          <div className="container container-narrow">
            <h2 className="pnt-intro-heading">{flow.introHeading}</h2>
            <p className="pnt-intro-text">{flow.introText}</p>

            <ul className="pnt-intro-trust">
              {flow.introTrustPoints.map((t) => (
                <li key={t.label}>
                  <Icon name={t.icon} size={22} />
                  <span>{t.label}</span>
                </li>
              ))}
            </ul>

            {flow.slug === 'renovation' && (
              <div className="pnt-problems">
                <h3>Common Wall Problems We Solve</h3>
                <div className="pnt-problems-grid">
                  {WALL_PROBLEMS.map((p) => (
                    <div key={p.label} className="pnt-problem-card">
                      <Icon name={p.icon} size={26} />
                      <span>{p.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pnt-included">
              <h3>What&rsquo;s Included?</h3>
              <ul>
                {flow.whatsIncluded.map((item) => (
                  <li key={item}>
                    <Icon name="check" size={14} strokeWidth={3} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <button type="button" className="
  btn
  btn-primary
  !w-full
  md:!w-[250px]
  md:!mx-auto
  md:!flex
" onClick={() => jumpToStep(1)}>
              Get Started <Icon name="arrow-right" size={17} />
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
                <div><dt>Date &amp; Time</dt><dd>{receipt.date}, {receipt.time}</dd></div>
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
              <div
  className={
    modal
      ? 'wizard-foot !static !inset-auto !z-auto !mt-4 !mb-0 !grid !w-full !grid-cols-[84px_minmax(0,1fr)] !items-stretch !gap-3 !border-0 !bg-transparent !p-0 !pb-0 !shadow-none md:!flex md:!items-center md:!justify-end md:!gap-3'
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
                <span>{category ? category.visitFeeDisplay : '₹—'}</span>
                <span>Adjustable in final bill</span>
              </div>

              {submitError && (
                <div role="alert" className="alert alert-error" style={{ marginTop: 18 }}>
                  <Icon name="info" size={18} /><span>{submitError}</span>
                </div>
              )}
              <div
  className={
    modal
      ? 'wizard-foot !static !inset-auto !z-auto !mt-4 !mb-0 !grid !w-full !grid-cols-[84px_minmax(0,1fr)] !items-stretch !gap-3 !border-0 !bg-transparent !p-0 !pb-0 !shadow-none md:!flex md:!items-center md:!justify-end md:!gap-3'
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
                  {busy ? 'BOOKING…' : 'BOOK NOW'} <Icon name="arrow-right" size={17} />
                </button>
              </div>
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
          {step.notSureNote && (
            <p className="question-hint" style={{ marginTop: -8, marginBottom: 16 }}>
              Pick the one that matters most — not sure? Our expert will help you
              identify the best walls during the home visit.
            </p>
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
              {errors[step.questionKey] && <span className="field-error">{errors[step.questionKey]}</span>}
            </>
          )}

          {step.type === 'brand' && (
            <>
              <BrandPicker options={optionsFor('paint_brand')} value={answers.paint_brand} onSelect={setAnswer('paint_brand')} />
              {errors.paint_brand && <span className="field-error">{errors.paint_brand}</span>}
            </>
          )}

          {step.type === 'product' && (
            <ProductPicker
              productsByTier={productsByTier(step.questionKey)}
              brand={answers.paint_brand}
              value={answers[step.questionKey]}
              onSelect={setAnswer(step.questionKey)}
            />
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
              {errors[step.questionKey] && <span className="field-error">{errors[step.questionKey]}</span>}
            </>
          )}

          {step.type === 'summary' && (
            <EstimateSummary
              rows={resolved}
              whatsIncluded={flow.whatsIncluded}
              itemsTotalPaise={itemsTotalPaise}
              onEditStep={jumpToStep}
            />
          )}

          <div
  className={
    modal
      ? 'pnt-step-actions !grid !w-full !grid-cols-[80px_minmax(0,1fr)] !items-center !gap-2 md:!flex md:!justify-between md:!gap-3'
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
          </div>
        </div>
      </div>

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

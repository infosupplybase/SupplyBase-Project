import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import PaintingHero from '../components/painting/PaintingHero';
import StepIndicator from '../components/painting/StepIndicator';
import OptionCard from '../components/painting/OptionCard';
import EstimateSummary from '../components/painting/EstimateSummary';
import AddonList from '../components/pop-ceiling/AddonList';
import CustomerDetailsFields from '../components/booking/CustomerDetailsFields';
import SlotPicker from '../components/booking/SlotPicker';
import usePopCeilingCatalogue from '../hooks/usePopCeilingCatalogue';
import { popFlows, DESIGN_STYLE_ICONS } from '../data/popCeilingContent';
import { emptyDetails, validateDetails } from '../lib/bookingDetails';
import { useAuth } from '../context/AuthContext';
import api, { friendlyError } from '../lib/api';
import { contact } from '../data/siteConfig';

/**
 * One page, two journeys (Full Home / Room) — driven by popFlows[flowSlug]
 * (see popCeilingContent.js) and the live catalogue
 * (usePopCeilingCatalogue), same architecture as PaintingFlow. Stage 0 is
 * the flow's intro; stages 1..N are the flow's configured steps (last is
 * always "summary"); then Details, Schedule and Confirm, reusing the same
 * shared components every other rebuilt category uses.
 *
 * No priced options exist anywhere in this category's new catalogue rows
 * (see V16's migration comment — the reference's add-ons are all a rate
 * PER SQ. FT. with no measured area to multiply by), so unlike
 * PaintingFlow there is no client-side estimate total: itemsTotalPaise is
 * always null, and EstimateSummary already renders "To be confirmed on
 * site visit" whenever that's the case.
 */
export default function PopCeilingFlow() {
  const { flowSlug } = useParams();
  const flow = popFlows[flowSlug];
  const { user } = useAuth();
  const { category, loading, error: loadError, optionsFor } = usePopCeilingCatalogue();

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

  /** Every step's answer resolved to a label for the summary — never a
      price (see the file header note: POP never computes one). */
  const resolved = useMemo(() => {
    if (!flow) return [];
    return configSteps
      .filter((s) => s.type !== 'summary')
      .map((step, i) => {
        if (step.type === 'addon') {
          const chosen = Array.isArray(answers[step.questionKey]) ? answers[step.questionKey] : [];
          const opts = optionsFor(step.questionKey).filter((o) => chosen.includes(o.value));
          return {
            stepIndex: i + 1,
            label: step.title.replace(' (Optional)', '').replace(' (optional)', ''),
            value: opts.map((o) => o.label).join(', '),
          };
        }
        const opt = optionsFor(step.questionKey).find((o) => o.value === answers[step.questionKey]);
        const notesKey = step.notesFor === opt?.value ? notesKeyFor(step) : null;
        const note = notesKey ? answers[notesKey] : null;
        return {
          stepIndex: i + 1,
          label: step.title.replace(/\?$/, ''),
          value: note ? `${opt?.label} — ${note}` : opt?.label,
        };
      });
  }, [flow, configSteps, answers, optionsFor]);

  if (!flow) return <Navigate to="/services/pop-ceiling-design" replace />;

  const jumpToStep = (i) => {
    setStage(i);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateStep = (step) => {
    if ((step.type === 'option' || step.type === 'style') && !answers[step.questionKey]) {
      setErrors({ [step.questionKey]: 'Please choose an option' });
      return false;
    }
    return true;
  };

  const goNext = () => {
    setSubmitError('');
    const step = configSteps[stage - 1];
    if (step && !validateStep(step)) return;
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
      configSteps.forEach((step) => {
        if (step.type === 'summary') return;
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
        const opt = optionsFor(step.questionKey).find((o) => o.value === value);
        flat.push({ key: step.questionKey, value, label: opt?.label || value });

        if (step.notesFor === value) {
          const notesKey = notesKeyFor(step);
          const note = answers[notesKey];
          if (note) flat.push({ key: notesKey, value: note, label: note });
        }
      });

      const result = await api.createBooking({
        serviceSlug: 'pop-ceiling-design',
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
        <PaintingHero
          eyebrow={flow.intro.eyebrow}
          title={flow.title}
          tagline={flow.heroTagline}
          image={flow.intro.image}
          trustPoints={[]}
        />
        <section className="pnt-section">
          <div className="container container-narrow">
            <h2 className="pnt-intro-heading">{flow.intro.heading}</h2>

            <ul className="pnt-intro-trust">
              {flow.intro.points.map((t) => (
                <li key={t.label}>
                  <Icon name={t.icon} size={22} />
                  <span>{t.label}</span>
                </li>
              ))}
            </ul>

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

            <button type="button" className="btn btn-primary btn-block" onClick={() => jumpToStep(1)}>
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
      <div className="wizard-shell">
        <div className="wizard-container">
          <div className="wizard-card">
            <div className="confirmed">
              <div className="confirmed-tick">
                <Icon name="check" size={38} strokeWidth={3} />
              </div>
              <h2>Booking Confirmed!</h2>
              <p>Our expert will visit your home, measure your space and provide a detailed quotation.</p>

              <dl className="confirmed-panel">
                <div><dt>Booking ID</dt><dd className="booking-id">{receipt.bookingNumber}</dd></div>
                <div><dt>Date &amp; Time</dt><dd>{receipt.date}, {receipt.time}</dd></div>
                <div><dt>Service</dt><dd>{flow.title}</dd></div>
                <div><dt>Location</dt><dd>{details.city}</dd></div>
              </dl>

              <div className="pnt-fee-note">
                <Icon name="info" size={17} />
                <span>{receipt.message}</span>
              </div>

              <Link to="/dashboard" className="btn btn-primary btn-block">GO TO DASHBOARD</Link>
              <div className="btn-row" style={{ marginTop: 12 }}>
                <a href={`https://wa.me/${contact.phoneRaw}?text=${message}`} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                  <Icon name="whatsapp" size={17} /> CHAT ON WHATSAPP
                </a>
                <Link to="/services/pop-ceiling-design" className="btn btn-ghost btn-back">BACK TO POP CEILING</Link>
              </div>
            </div>
          </div>
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
              <CustomerDetailsFields details={details} setDetail={setDetail} errors={errors} idPrefix="pce" />
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
                <h2>Book a Home Visit</h2>
                <p>Our team will visit your site to measure and quote.</p>
              </div>
              <SlotPicker
                serviceSlug="pop-ceiling-design"
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
              <div className="wizard-foot">
                <button type="button" className="btn btn-ghost btn-back" onClick={goBack}>BACK</button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'BOOKING…' : 'BOOK HOME VISIT'} <Icon name="arrow-right" size={17} />
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
  const selectedValue = answers[step?.questionKey];
  const showNotes = step?.notesFor && step.notesFor === selectedValue;
  const notesKey = showNotes ? notesKeyFor(step) : null;

  return (
    <div className="pnt-flow-shell">
      <div className="container container-narrow">
        <FlowTopBar flow={flow} onBack={goBack} plain />
        <StepIndicator steps={configSteps} activeIndex={stage - 1} />

        <div className="pnt-step-card">
          {step.type !== 'summary' && <h2 className="pnt-step-title">{step.title}</h2>}

          {(step.type === 'option' || step.type === 'style') && (
            <>
              <div className="pnt-option-list">
                {optionsFor(step.questionKey).map((opt) => (
                  <OptionCard
                    key={opt.value}
                    option={opt}
                    name={step.questionKey}
                    icon={step.type === 'style' ? (DESIGN_STYLE_ICONS[opt.value] || step.icon) : step.icon}
                    checked={answers[step.questionKey] === opt.value}
                    onSelect={setAnswer(step.questionKey)}
                  />
                ))}
              </div>
              {errors[step.questionKey] && <span className="field-error">{errors[step.questionKey]}</span>}

              {showNotes && (
                <div className="field" style={{ marginTop: 16 }}>
                  <label htmlFor={`pce-${notesKey}`}>{step.notesLabel}</label>
                  <textarea
                    id={`pce-${notesKey}`}
                    rows={3}
                    placeholder={step.notesPlaceholder}
                    value={answers[notesKey] || ''}
                    onChange={(e) => setAnswer(notesKey)(e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          {step.type === 'addon' && (
            <AddonList
              options={optionsFor(step.questionKey)}
              selected={Array.isArray(answers[step.questionKey]) ? answers[step.questionKey] : []}
              onToggle={toggleMulti(step.questionKey)}
            />
          )}

          {step.type === 'summary' && (
            <EstimateSummary
              rows={resolved}
              whatsIncluded={flow.whatsIncluded}
              itemsTotalPaise={null}
              onEditStep={jumpToStep}
            />
          )}

          <div className="pnt-step-actions">
            <button type="button" className="btn btn-ghost btn-back" onClick={goBack}>BACK</button>
            <button type="button" className="btn btn-primary" onClick={goNext}>
              {step.type === 'summary' ? 'Book a Home Visit' : 'Continue'} <Icon name="arrow-right" size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Local, non-catalogue answer key for a step's optional free-text
    follow-up (Other Room's description, Custom Design's brief) — matched
    to the real TEXT catalogue rows added in V16 (pop_room_notes /
    pop_design_notes) via each step's own id. */
function notesKeyFor(step) {
  return step.id === 'room_type' ? 'pop_room_notes' : 'pop_design_notes';
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

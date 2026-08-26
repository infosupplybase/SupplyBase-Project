import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import QuestionField from '../components/booking/QuestionField';
import SlotPicker from '../components/booking/SlotPicker';
import api, { friendlyError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { contact } from '../data/siteConfig';

/**
 * One booking page, four services.
 *
 * Nothing about the questions lives here — the page asks the API what to ask
 * (GET /api/catalogue/services/{slug}/form) and renders whatever comes back.
 * Adding an option is a database row, not a release.
 *
 * The five stages are the ones in spec §11. The service questions are
 * paginated inside stage 1 by the step number the catalogue gives them, so a
 * phone shows a handful of choices at a time rather than a six-screen scroll.
 */
const STAGES = ['Select Service', 'Your Details', 'Date & Time', 'Confirm & Pay'];

const emptyDetails = {
  name: '',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  city: '',
  pincode: '',
};

const isValidPhone = (v) =>
  /^[6-9]\d{9}$/.test(String(v || '').replace(/\D/g, '').replace(/^91/, '').replace(/^0/, ''));

export default function ServiceBooking() {
  const { slug } = useParams();
  const { user } = useAuth();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [stage, setStage] = useState(0);
  const [questionStep, setQuestionStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [details, setDetails] = useState(emptyDetails);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    api
      .serviceForm(slug)
      .then((result) => {
        if (cancelled) return;
        setForm(result);
        // Reset everything: switching service mid-flow must not carry answers
        // to questions the new service never asked.
        setStage(0);
        setQuestionStep(0);
        setAnswers({});
        setDate('');
        setTime('');
      })
      .catch((err) => {
        if (!cancelled) setLoadError(friendlyError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Prefill from the signed-in account — nobody should retype what we know.
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

  /** Catalogue questions grouped into the steps the catalogue assigned them. */
  const questionSteps = useMemo(() => {
    if (!form) return [];
    const byStep = new Map();
    form.questions
      // FILE questions are dropped for now: uploads are collected on WhatsApp
      // until the storage backend exists. Rendering a dead upload button would
      // be worse than not showing one.
      .filter((q) => q.inputType !== 'FILE')
      .forEach((q) => {
        if (!byStep.has(q.stepNo)) byStep.set(q.stepNo, []);
        byStep.get(q.stepNo).push(q);
      });
    return [...byStep.entries()].sort((a, b) => a[0] - b[0]).map(([, qs]) => qs);
  }, [form]);

  // `next` may be a value or an updater — QuestionField sends an updater so
  // two taps in one batch cannot overwrite each other.
  const setAnswer = (key) => (next) => {
    setAnswers((a) => ({ ...a, [key]: typeof next === 'function' ? next(a[key]) : next }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setError('');
  };

  const setDetail = (key) => (e) => {
    setDetails((d) => ({ ...d, [key]: e.target.value }));
    setErrors((err) => ({ ...err, [key]: undefined }));
    setError('');
  };

  const validateQuestionStep = (index) => {
    const next = {};
    (questionSteps[index] || []).forEach((q) => {
      if (!q.required) return;
      const value = answers[q.key];
      const empty = Array.isArray(value) ? value.length === 0 : !value;
      if (empty) next[q.key] = 'Please choose an option';
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateDetails = () => {
    const next = {};
    if (!details.name.trim()) next.name = 'Please enter your name';
    if (!details.phone.trim()) next.phone = 'Please enter your mobile number';
    else if (!isValidPhone(details.phone)) next.phone = 'Enter a 10-digit mobile number';
    if (details.whatsapp.trim() && !isValidPhone(details.whatsapp)) {
      next.whatsapp = 'Enter a 10-digit number, or leave it blank';
    }
    if (details.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())) {
      next.email = 'That email address does not look right';
    }
    if (!details.address.trim()) next.address = 'Please enter your address';
    if (!details.city.trim()) next.city = 'Please enter your city';
    if (details.pincode.trim() && !/^[1-9][0-9]{5}$/.test(details.pincode.trim())) {
      next.pincode = 'Enter a 6-digit pincode';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    setError('');
    if (stage === 0) {
      if (!validateQuestionStep(questionStep)) return;
      if (questionStep < questionSteps.length - 1) {
        setQuestionStep((s) => s + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setStage(1);
    } else if (stage === 1) {
      if (!validateDetails()) return;
      setStage(2);
    } else if (stage === 2) {
      if (!date || !time) {
        setErrors({ slot: 'Please choose a date and a time' });
        return;
      }
      setStage(3);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setError('');
    if (stage === 0 && questionStep > 0) setQuestionStep((s) => s - 1);
    else if (stage > 0) {
      setStage((s) => s - 1);
      if (stage - 1 === 0) setQuestionStep(questionSteps.length - 1);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      // Flatten the answers. A MULTI question becomes one row per choice, so
      // the office can filter on "everyone who asked for terrace work".
      const flat = [];
      Object.entries(answers).forEach(([key, value]) => {
        const question = form.questions.find((q) => q.key === key);
        const values = Array.isArray(value) ? value : [value];
        values
          .filter((v) => v !== '' && v !== null && v !== undefined)
          .forEach((v) => {
            const option = (question?.options || []).find((o) => o.value === v);
            flat.push({ key, value: String(v), label: option ? option.label : String(v) });
          });
      });

      const areaAnswer = answers.area_sqft;
      const result = await api.createBooking({
        serviceSlug: slug,
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
        areaSqft: areaAnswer ? Number(areaAnswer) : null,
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

  /* ---------------------------------------------------------- states */

  if (loading) {
    return (
      <section className="section">
        <div className="container container-narrow">
          <p className="question-hint">Loading…</p>
        </div>
      </section>
    );
  }

  if (loadError || !form) {
    return (
      <section className="section">
        <div className="container container-narrow">
          <div role="alert" className="alert alert-error">
            <Icon name="info" size={18} />
            <span>{loadError || 'That service could not be found.'}</span>
          </div>
          <Link to="/services" className="btn btn-ghost" style={{ marginTop: 18 }}>
            SEE ALL SERVICES
          </Link>
        </div>
      </section>
    );
  }

  const { category } = form;

  if (receipt) {
    return <Confirmation receipt={receipt} details={details} />;
  }

  const currentQuestions = questionSteps[questionStep] || [];
  const isLastStage = stage === STAGES.length - 1;

  return (
    <>
      {/* ------------------------------------------------------- hero */}
      <section className="svc-hero" data-service={slug}>
        <div className="container">
          <p className="eyebrow">BOOK A SITE VISIT</p>
          <h1>{category.name.toUpperCase()}</h1>
          <p className="svc-hero-tagline">{category.tagline}</p>
        </div>
      </section>

      {/* ---------------------------------------------------- fee card */}
      <section className="container container-narrow" style={{ marginTop: -34, zIndex: 3, position: 'relative' }}>
        <div className="fee-card">
          <div className="fee-amount">
            <span className="fee-value">{category.visitFeeDisplay.replace('.00', '')}</span>
            <span className="fee-only">Only</span>
          </div>
          <div className="fee-body">
            <h2>Site Visit + Quotation Fee</h2>
            <p>
              The fee includes the site visit, basic measurement and assessment, and your
              quotation.
            </p>
            <ul className="fee-list">
              <li>
                <Icon name="check" size={15} strokeWidth={3} /> Expert visits your property
              </li>
              <li>
                <Icon name="check" size={15} strokeWidth={3} /> Measurement where needed
              </li>
              <li>
                <Icon name="check" size={15} strokeWidth={3} /> Written quotation
              </li>
            </ul>
            <p className="fee-note">
              This is a one-time site visit and quotation fee. <strong>No advance payment is
              required for the actual work.</strong> The final project cost is given after the
              inspection.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ wizard */}
      <section className="section">
        <div className="container container-narrow">
          <ol className="stage-bar">
            {STAGES.map((label, i) => (
              <li
                key={label}
                className={`stage ${i === stage ? 'current' : ''} ${i < stage ? 'done' : ''}`}
              >
                <span className="stage-num">
                  {i < stage ? <Icon name="check" size={13} strokeWidth={3} /> : i + 1}
                </span>
                <span className="stage-label">{label}</span>
              </li>
            ))}
          </ol>

          <form onSubmit={handleSubmit} noValidate>
            {/* ------------------------------------ 1. service questions */}
            {stage === 0 && (
              <div className="wizard-panel">
                {questionSteps.length > 1 && (
                  <p className="wizard-substep">
                    Question set {questionStep + 1} of {questionSteps.length}
                  </p>
                )}
                {currentQuestions.map((question) => (
                  <QuestionField
                    key={question.key}
                    question={question}
                    value={answers[question.key]}
                    onChange={setAnswer(question.key)}
                    error={errors[question.key]}
                  />
                ))}
              </div>
            )}

            {/* ------------------------------------------- 2. details */}
            {stage === 1 && (
              <div className="wizard-panel">
                <h3 className="question-text">Where should we visit?</h3>
                <div className="form-grid">
                  <Field id="bk-name" label="Full name" required value={details.name}
                         onChange={setDetail('name')} error={errors.name} />
                  <Field id="bk-phone" label="Mobile number" required type="tel"
                         value={details.phone} onChange={setDetail('phone')}
                         error={errors.phone} placeholder="98765 43210" />
                  <Field id="bk-whatsapp" label="WhatsApp number" type="tel"
                         value={details.whatsapp} onChange={setDetail('whatsapp')}
                         error={errors.whatsapp} placeholder="Same as mobile"
                         hint="Leave blank if it is the same number." />
                  <Field id="bk-email" label="Email" type="email" value={details.email}
                         onChange={setDetail('email')} error={errors.email}
                         placeholder="you@example.com" hint="Optional." />
                </div>

                <div className="field" style={{ marginTop: 16 }}>
                  <label htmlFor="bk-address">
                    Complete address <span className="req">*</span>
                  </label>
                  <textarea id="bk-address" rows={3} value={details.address}
                            onChange={setDetail('address')}
                            placeholder="Flat / building, street, landmark" />
                  {errors.address && <span className="field-error">{errors.address}</span>}
                </div>

                <div className="form-grid" style={{ marginTop: 16 }}>
                  <Field id="bk-city" label="City" required value={details.city}
                         onChange={setDetail('city')} error={errors.city} placeholder="Mumbai" />
                  <Field id="bk-pincode" label="Pincode" value={details.pincode}
                         onChange={setDetail('pincode')} error={errors.pincode}
                         placeholder="400001" />
                </div>
              </div>
            )}

            {/* ---------------------------------------- 3. date & time */}
            {stage === 2 && (
              <div className="wizard-panel">
                <SlotPicker
                  serviceSlug={slug}
                  date={date}
                  time={time}
                  onPick={(d, t) => {
                    setDate(d);
                    setTime(t);
                    setErrors((e) => ({ ...e, slot: undefined }));
                  }}
                  error={errors.slot}
                />
              </div>
            )}

            {/* ------------------------------------- 4. confirm & pay */}
            {stage === 3 && (
              <div className="wizard-panel">
                <h3 className="question-text">Check your booking</h3>
                <Summary
                  category={category}
                  form={form}
                  answers={answers}
                  details={details}
                  date={date}
                  time={time}
                />
              </div>
            )}

            {error && (
              <div role="alert" className="alert alert-error" style={{ marginTop: 18 }}>
                <Icon name="info" size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="wizard-nav">
              {stage > 0 || questionStep > 0 ? (
                <button type="button" className="btn btn-ghost" onClick={goBack}>
                  BACK
                </button>
              ) : (
                <span />
              )}

              {isLastStage ? (
                <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
                  {busy ? 'BOOKING…' : `PAY ${category.visitFeeDisplay.replace('.00', '')} & BOOK SITE VISIT`}
                  <Icon name="arrow-right" size={18} />
                </button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={goNext}>
                  CONTINUE
                  <Icon name="arrow-right" size={17} />
                </button>
              )}
            </div>
          </form>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------ helpers */

function Field({ id, label, required, hint, error, ...rest }) {
  return (
    <div className={`field ${error ? 'error' : ''}`}>
      <label htmlFor={id}>
        {label} {required && <span className="req">*</span>}
      </label>
      <input id={id} {...rest} />
      {error ? (
        <span className="field-error">{error}</span>
      ) : (
        hint && <span className="field-hint">{hint}</span>
      )}
    </div>
  );
}

/** A last look before paying — nobody should pay for a booking they misread. */
function Summary({ category, form, answers, details, date, time }) {
  const rows = form.questions
    .map((q) => {
      const value = answers[q.key];
      const values = Array.isArray(value) ? value : value ? [value] : [];
      if (values.length === 0) return null;
      const labels = values.map((v) => {
        const option = (q.options || []).find((o) => o.value === v);
        return option ? option.label : v;
      });
      return { key: q.key, question: q.text, answer: labels.join(', ') };
    })
    .filter(Boolean);

  return (
    <div className="summary">
      <dl className="summary-list">
        <div>
          <dt>Service</dt>
          <dd>{category.name}</dd>
        </div>
        <div>
          <dt>Visit</dt>
          <dd>
            {date} at {time}
          </dd>
        </div>
        {rows.map((row) => (
          <div key={row.key}>
            <dt>{row.question}</dt>
            <dd>{row.answer}</dd>
          </div>
        ))}
        <div>
          <dt>Name</dt>
          <dd>{details.name}</dd>
        </div>
        <div>
          <dt>Mobile</dt>
          <dd>{details.phone}</dd>
        </div>
        <div>
          <dt>Address</dt>
          <dd>
            {details.address}, {details.city} {details.pincode}
          </dd>
        </div>
      </dl>

      <div className="summary-total">
        <span>Site Visit &amp; Quotation Fee</span>
        <strong>{category.visitFeeDisplay.replace('.00', '')}</strong>
      </div>

      <p className="fee-note" style={{ marginTop: 12 }}>
        Supplybase will provide the required material according to the approved quotation.
      </p>
    </div>
  );
}

/** Spec §37. */
function Confirmation({ receipt, details }) {
  const message = encodeURIComponent(
    `Hello Supplybase, this is about my booking ${receipt.bookingNumber}.`
  );
  return (
    <section className="section">
      <div className="container container-narrow">
        <div className="booking-done">
          <div className="booking-done-icon">
            <Icon name="check-circle" size={40} strokeWidth={1.5} />
          </div>
          <h2>BOOKING CONFIRMED</h2>
          <p className="booking-ref">{receipt.bookingNumber}</p>

          <dl className="summary-list" style={{ textAlign: 'left', marginTop: 22 }}>
            <div>
              <dt>Service</dt>
              <dd>{receipt.serviceName}</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>{receipt.date}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{receipt.time}</dd>
            </div>
            <div>
              <dt>Site Visit &amp; Quotation Fee</dt>
              <dd>{receipt.visitFeeDisplay.replace('.00', '')}</dd>
            </div>
          </dl>

          <p style={{ marginTop: 18 }}>
            Thank you for booking with Supplybase. Our team will contact you to confirm your site
            visit{details.name ? `, ${details.name.split(' ')[0]}` : ''}.
          </p>

          <div className="btn-row" style={{ justifyContent: 'center', marginTop: 24 }}>
            <Link to="/dashboard" className="btn btn-primary">
              GO TO DASHBOARD
            </Link>
            <a
              href={`https://wa.me/${contact.phoneRaw}?text=${message}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp"
            >
              <Icon name="whatsapp" size={17} />
              CHAT ON WHATSAPP
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import QuestionField from '../components/booking/QuestionField';
import SlotPicker from '../components/booking/SlotPicker';
import api, { friendlyError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { contact } from '../data/siteConfig';

/**
 * One booking page, four services.
 *
 * Nothing about the questions lives here. The page asks the API what to ask
 * (GET /api/catalogue/services/{slug}/form) and renders whatever comes back,
 * so adding an option is a database row rather than a release.
 *
 * Five stages, matching the approved reference: Service, Property, Details,
 * Schedule, Confirm. The catalogue tags each question with a step number;
 * step 1 becomes Service, step 2 Property, and everything after folds into
 * Details — so a service with nine questions and one with four both end up
 * as the same five-stage journey.
 */
const STAGES = ['Service', 'Property', 'Details', 'Schedule', 'Confirm'];
const SCHEDULE = 3;
const CONFIRM = 4;

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

export default function ServiceBooking({
  serviceSlug,
  modal = false,
  onStepChange,
  onClose,
}) {
  const { slug: routeSlug } = useParams();
  const slug = serviceSlug || routeSlug;
  const { user } = useAuth();
  // A category-list card can deep-link straight into one `service_needed`
  // choice, e.g. /booking/pop-ceiling-design?preselect=False%20Ceiling —
  // used by subservices that have no dedicated flow of their own and fall
  // back to this generic wizard. Read once; a value that doesn't match any
  // option this category actually offers is silently ignored below.
  const [searchParams] = useSearchParams();
  const preselect = searchParams.get('preselect');

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [stage, setStage] = useState(0);
  const [answers, setAnswers] = useState({});
  const [details, setDetails] = useState(emptyDetails);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
  if (modal && onStepChange) {
    onStepChange();
  }
}, [stage, receipt, modal, onStepChange]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    api
      .serviceForm(slug)
      .then((result) => {
        if (cancelled) return;
        setForm(result);
        // Switching service mid-flow must not carry answers to questions the
        // new service never asked.
        setStage(0);
        const validPreselect = preselect
          && result.questions.some((q) => q.key === 'service_needed'
            && q.options?.some((o) => o.value === preselect));
        setAnswers(validPreselect ? { service_needed: [preselect] } : {});
        setDate('');
        setTime('');
        setErrors({});
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

  /**
   * Questions for each of the three question stages.
   *
   * Split by MEANING, not by the catalogue's step number. Plumbing puts
   * property_type at step 3 while painting puts it at step 2, so a positional
   * split labelled the "Where is the service required?" question as
   * "Property". The Property stage is whichever question asks for the
   * property type, wherever the catalogue happens to place it.
   *
   * FILE questions are dropped for now — uploads are collected on WhatsApp
   * until the storage backend exists, and a dead upload button would be worse
   * than none.
   */
  const stageQuestions = useMemo(() => {
    if (!form) return [[], [], []];
    const usable = form.questions.filter((q) => q.inputType !== 'FILE');
    const service = usable.filter((q) => q.key === 'service_needed');
    const property = usable.filter((q) => q.key === 'property_type');
    const details = usable.filter(
      (q) => q.key !== 'service_needed' && q.key !== 'property_type'
    );
    return [service, property, details];
  }, [form]);

  // `next` may be a value or an updater — QuestionField sends an updater so
  // two taps in one React batch cannot overwrite each other.
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

  const validateQuestions = (list) => {
    const next = {};
    list.forEach((q) => {
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

  const canLeaveStage = () => {
    if (stage < SCHEDULE) return validateQuestions(stageQuestions[stage]);
    if (stage === SCHEDULE) {
      if (!date || !time) {
        setErrors({ slot: 'Please choose a date and a time' });
        return false;
      }
      return true;
    }
    return validateDetails();
  };

  const goNext = () => {
    setError('');
    if (!canLeaveStage()) return;
    setStage((s) => Math.min(s + 1, CONFIRM));
    if (!modal) {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
  };

  const goBack = () => {
    setError('');
    setStage((s) => Math.max(s - 1, 0));
    if (!modal) {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateDetails()) return;

    setBusy(true);
    setError('');
    try {
      // Flatten the answers: a MULTI question becomes one row per choice, so
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
        areaSqft: answers.area_sqft ? Number(answers.area_sqft) : null,
      });
      setReceipt(result);
      if (!modal) {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
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
      <div className={modal ? 'w-full' : 'wizard-shell'}>
    <div className={modal ? 'w-full' : 'wizard-container'}>
          <p style={{ color: 'rgba(255,255,255,.6)' }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (loadError || !form) {
  return (
    <div className={modal ? 'w-full' : 'wizard-shell'}>
      <div className={modal ? 'w-full' : 'wizard-container'}>
          <div className="wizard-card">
            <div role="alert" className="alert alert-error">
              <Icon name="info" size={18} />
              <span>{loadError || 'That service could not be found.'}</span>
            </div>
            <Link to="/services" className="btn btn-primary btn-block">
              SEE ALL SERVICES
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { category } = form;

  if (receipt) {
  return (
    <Confirmation
      receipt={receipt}
      details={details}
      modal={modal}
    />
  );
}

  return (
  <div className={modal ? 'w-full' : 'wizard-shell'}>
    <div className={modal ? 'w-full' : 'wizard-container'}>
        {/* ------------------------------------------------------ top bar */}
        {!modal &&(
        <div className="wizard-top">
          {stage > 0 ? (
            <button type="button" className="wizard-back" onClick={goBack} aria-label="Go back">
              <Icon name="arrow-left" size={20} />
            </button>
          ) : (
            <Link to="/services" className="wizard-back" aria-label="Back to services">
              <Icon name="arrow-left" size={20} />
            </Link>
          )}

          <h1 className="wizard-title">Book a Service</h1>

          <a
            href={`https://wa.me/${contact.phoneRaw}?text=${encodeURIComponent(
              `Hello Supplybase, I need help booking ${category.name}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="wizard-help"
          >
            Need help?
          </a>
        </div>
        )}
        {/* ----------------------------------------------------- progress */}
        <ol className={modal ? 'wizard-steps !mb-5' : 'wizard-steps'}>
          {STAGES.map((label, i) => (
            <li
              key={label}
              className={`wstep ${i === stage ? 'current' : ''} ${i < stage ? 'done' : ''}`}
              aria-current={i === stage ? 'step' : undefined}
            >
              <span className="wstep-num">
                {i < stage ? <Icon name="check" size={14} strokeWidth={3} /> : i + 1}
              </span>
              <span className="wstep-label">{label}</span>
            </li>
          ))}
        </ol>

        <form onSubmit={handleSubmit} noValidate>
          <div className={modal ? 'wizard-card !rounded-xl !shadow-none !p-5' : 'wizard-card'}>
            {/* ------------------------- 1-3. catalogue questions */}
            {stage < SCHEDULE &&
              stageQuestions[stage].map((question) => (
                <QuestionField
                  key={question.key}
                  question={question}
                  value={answers[question.key]}
                  onChange={setAnswer(question.key)}
                  error={errors[question.key]}
                />
              ))}

            {/* --------------------------------------- 4. schedule */}
            {stage === SCHEDULE && (
              <>
                <div className="wizard-card-head">
                  <h2>Choose Date &amp; Time for Site Visit</h2>
                  <p>Our team will visit your site.</p>
                </div>
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
              </>
            )}

            {/* ---------------------------- 5. details + summary */}
            {stage === CONFIRM && (
              <>
                <div className="wizard-card-head">
                  <h2>Enter Your Details</h2>
                  <p>We will contact you to confirm the appointment.</p>
                </div>

                <div className="form-grid">
                  <Field id="bk-name" label="Full Name" required value={details.name}
                         onChange={setDetail('name')} error={errors.name}
                         placeholder="Enter your name" />
                  <Field id="bk-phone" label="Mobile Number" required type="tel"
                         inputMode="numeric" value={details.phone}
                         onChange={setDetail('phone')} error={errors.phone}
                         placeholder="Enter mobile number" />
                  <Field id="bk-whatsapp" label="WhatsApp Number (Optional)" type="tel"
                         inputMode="numeric" value={details.whatsapp}
                         onChange={setDetail('whatsapp')} error={errors.whatsapp}
                         placeholder="Enter WhatsApp number"
                         hint="Leave blank if it is the same as your mobile." />
                  <Field id="bk-email" label="Email Address (Optional)" type="email"
                         value={details.email} onChange={setDetail('email')}
                         error={errors.email} placeholder="Enter email address" />
                </div>

                <div className="field" style={{ marginTop: 16 }}>
                  <label htmlFor="bk-address">
                    Project Address <span className="req">*</span>
                  </label>
                  <textarea id="bk-address" rows={3} value={details.address}
                            onChange={setDetail('address')}
                            placeholder="Enter complete address" />
                  {errors.address && <span className="field-error">{errors.address}</span>}
                </div>

                <div className="form-grid" style={{ marginTop: 16 }}>
                  <Field id="bk-city" label="City" required value={details.city}
                         onChange={setDetail('city')} error={errors.city}
                         placeholder="Mumbai" />
                  <Field id="bk-pincode" label="Pincode" value={details.pincode}
                         onChange={setDetail('pincode')} error={errors.pincode}
                         placeholder="400001" />
                </div>

                <Summary
                  category={category}
                  form={form}
                  answers={answers}
                  date={date}
                  time={time}
                />
              </>
            )}

            {error && (
              <div role="alert" className="alert alert-error" style={{ marginTop: 18 }}>
                <Icon name="info" size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* ---------------------------------------------- footer */}
            <div
  className={`
    wizard-foot
    ${stage === 0 ? 'single' : ''}
    ${
      modal
  ? 'max-md:!sticky max-md:!left-auto max-md:!right-auto max-md:!bottom-0 max-md:!z-20 max-md:!px-2 max-md:!py-2 max-md:!mt-4 max-md:!bg-white max-md:!border-0 max-md:!shadow-none max-md:!rounded-lg'
  : ''
    }
  `}
>
              {(stage > 0 || modal) && (
  <button
    type="button"
    className="btn btn-ghost btn-back btn-sm md:!flex-none md:!w-36 md:!me-auto"
    onClick={stage > 0 ? goBack : onClose}
  >
    BACK
  </button>
)}

              {stage === CONFIRM ? (
  <button
    type="submit"
    className="
  btn btn-primary btn-sm
  md:!flex-none md:!w-56 md:!ms-auto
  max-md:!text-[11px]
  max-md:!px-3
  max-md:!whitespace-nowrap
  max-md:!ms-auto
"
    disabled={busy}
  >
    {busy ? 'BOOKING…' : 'PAY & CONFIRM BOOKING'}
    <Icon name="arrow-right" size={15} />
  </button>
) : (
  (
  stage >= SCHEDULE ||
  (
    stageQuestions[stage].length > 0 &&
    stageQuestions[stage].every((question) => {
      if (!question.required) return true;

      const value = answers[question.key];

      return Array.isArray(value)
        ? value.length > 0
        : Boolean(value);
    })
  )
) && (
    <button type="button" className="btn btn-primary btn-sm md:!flex-none md:!w-44 md:!ms-auto" onClick={goNext}>
      CONTINUE
      <Icon name="arrow-right" size={17} />
    </button>
  )
)}
            </div>
          </div>
        </form>
      </div>
    </div>
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
function Summary({ category, form, answers, date, time }) {
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
    <div style={{ marginTop: 26 }}>
      <div className="wizard-card-head">
        <h2>Booking Summary</h2>
        <p>Please check everything before you pay.</p>
      </div>

      <dl className="review-list">
        <div>
          <dt>Service</dt>
          <dd>{category.name}</dd>
        </div>
        <div>
          <dt>Site visit</dt>
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
      </dl>

      <div className="fee-panel">
        <div className="fee-panel-top">
          <strong>Site Visit &amp; Quotation Fee</strong>
        </div>

        <ul className="fee-includes">
          {['Site visit', 'Assessment', 'Measurement where required', 'Quotation'].map((item) => (
            <li key={item}>
              <Icon name="check" size={13} strokeWidth={3} />
              {item}
            </li>
          ))}
        </ul>

        <p className="fee-small">
          This is a one-time fee.{' '}
          <strong>No advance payment is required for the actual work.</strong> The final project
          cost will be provided after site inspection. Supplybase will provide the required
          material according to the approved quotation.
        </p>
      </div>
    </div>
  );
}

/** The confirmation screen from the approved reference. */
function Confirmation({ receipt, details, modal = false }) {
  const message = encodeURIComponent(
    `Hello Supplybase, this is about my booking ${receipt.bookingNumber}.`
  );

  return (
    <div className={modal ? 'w-full' : 'wizard-shell'}>
  <div className={modal ? 'w-full' : 'wizard-container'}>
        <div
  className={
    modal
      ? 'wizard-card !p-5 !rounded-xl !shadow-none'
      : 'wizard-card'
  }
>
          <div className="confirmed">
            <div className="confirmed-tick">
              <Icon name="check" size={38} strokeWidth={3} />
            </div>

            <h2>Your Site Visit is Booked!</h2>
            <p>
              We have received your request. Our team will contact you on WhatsApp or phone to
              confirm the appointment.
            </p>

            <dl className="confirmed-panel">
              <div>
                <dt>Booking ID</dt>
                <dd className="booking-id">{receipt.bookingNumber}</dd>
              </div>
              <div>
                <dt>Date &amp; Time</dt>
                <dd>
                  {receipt.date}, {receipt.time}
                </dd>
              </div>
              <div>
                <dt>Service</dt>
                <dd>{receipt.serviceName}</dd>
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
              <a
                href={`https://wa.me/${contact.phoneRaw}?text=${message}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp"
              >
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

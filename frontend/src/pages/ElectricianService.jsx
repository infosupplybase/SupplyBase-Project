import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import QuestionField from '../components/booking/QuestionField';
import SlotPicker from '../components/booking/SlotPicker';
import api, { friendlyError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { contact } from '../data/siteConfig';
import { electricianServiceIntros, ELECTRICIAN_STAGES } from '../data/electricianServices';

const TYPE = 0;
const DETAILS = 1;
const ADDONS = 2;
const SCHEDULE = 3;
const CONFIRM = 4;

const emptyDetails = { name: '', phone: '', whatsapp: '', email: '', address: '', city: '', pincode: '' };

/**
 * Only strips a country-code prefix when the digit count actually implies
 * one is there (12 digits = 91 + a 10-digit number, 11 = a leading 0) — a
 * blind `.replace(/^91/, '')` on any input, which is what the original
 * booking wizard's version of this check does, incorrectly mangles a real
 * 10-digit number that happens to start with 91 (e.g. 9123456780).
 */
const isValidPhone = (v) => {
  let digits = String(v || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits);
};

/** ₹1,234.50 -> "1,234.50", dropping a trailing ".00" for a cleaner read. */
function formatMoney(n) {
  const fixed = Number(n).toFixed(2);
  const clean = fixed.endsWith('.00') ? fixed.slice(0, -3) : fixed;
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * /services/electrical/:subSlug — one of the seven detailed electrician
 * journeys: intro, then a catalogue-driven wizard (Type -> Details ->
 * Add-Ons -> Schedule -> Confirm) reusing the same api.serviceForm /
 * api.createBooking the original four services already use, so a booking
 * made here lands in the same bookings table the office already works from.
 *
 * The catalogue answers this question set on its own; what this component
 * adds on top is: a splash intro screen, an estimated price range that
 * updates with the add-ons picked, and real photo upload for the two
 * services that ask for one.
 */
export default function ElectricianService() {
  const { subSlug } = useParams();
  const { user } = useAuth();
  const intro = electricianServiceIntros[subSlug];

  const [started, setStarted] = useState(false);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [stage, setStage] = useState(TYPE);
  const [answers, setAnswers] = useState({});
  const [pendingFiles, setPendingFiles] = useState({});
  const [details, setDetails] = useState(emptyDetails);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [uploadState, setUploadState] = useState({}); // key -> 'uploading' | 'done' | 'error'
  const submittedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    api
      .serviceForm(subSlug)
      .then((result) => {
        if (cancelled) return;
        setForm(result);
        setStarted(false);
        setStage(TYPE);
        setAnswers({});
        setPendingFiles({});
        setDate('');
        setTime('');
        setErrors({});
        setReceipt(null);
        submittedRef.current = false;
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
  }, [subSlug]);

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

  const typeQuestions = useMemo(
    () => (form ? form.questions.filter((q) => q.stepNo === 1) : []),
    [form]
  );
  const detailQuestions = useMemo(
    () => (form ? form.questions.filter((q) => q.stepNo === 2 && q.inputType !== 'FILE') : []),
    [form]
  );
  const fileQuestions = useMemo(
    () => (form ? form.questions.filter((q) => q.inputType === 'FILE') : []),
    [form]
  );
  const addOnQuestions = useMemo(
    () => (form ? form.questions.filter((q) => q.stepNo === 3) : []),
    [form]
  );

  // The service's own "how many" field, if it has one — Number of Fans,
  // Number of Points, Number of MCBs. Add-on prices scale with it; a service
  // with no such field (repair, appliance) prices its add-ons per unit.
  const quantityQuestion = useMemo(
    () => (form ? form.questions.find((q) => q.inputType === 'NUMBER') : null),
    [form]
  );
  const quantity = quantityQuestion ? Number(answers[quantityQuestion.key]) || 1 : 1;

  const estimate = useMemo(() => {
    if (!form) return null;
    const base = form.category;
    if (base.estimateMin == null && base.estimateMax == null) return null;
    let min = Number(base.estimateMin || 0);
    let max = Number(base.estimateMax || 0);
    addOnQuestions.forEach((q) => {
      const chosen = Array.isArray(answers[q.key]) ? answers[q.key] : [];
      chosen.forEach((value) => {
        const option = q.options.find((o) => o.value === value);
        if (option && option.price != null) {
          min += Number(option.price) * quantity;
          max += Number(option.price) * quantity;
        }
      });
    });
    return { min, max };
  }, [form, addOnQuestions, answers, quantity]);

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

  const MAX_FILES = 5;
  const MAX_FILE_MB = 8;

  const onFilesPicked = (key) => (e) => {
    const chosen = Array.from(e.target.files || []);
    e.target.value = ''; // lets picking the same file again re-trigger onChange
    setErrors((err) => ({ ...err, [key]: undefined }));
    setPendingFiles((p) => {
      const existing = p[key] || [];
      const room = MAX_FILES - existing.length;
      if (room <= 0) {
        setErrors((err) => ({ ...err, [key]: `You can attach up to ${MAX_FILES} photos.` }));
        return p;
      }
      const tooBig = chosen.find((f) => f.size > MAX_FILE_MB * 1024 * 1024);
      if (tooBig) {
        setErrors((err) => ({ ...err, [key]: `${tooBig.name} is over ${MAX_FILE_MB} MB.` }));
      }
      const accepted = chosen.filter((f) => f.size <= MAX_FILE_MB * 1024 * 1024).slice(0, room);
      return { ...p, [key]: [...existing, ...accepted] };
    });
  };

  const removeFile = (key, index) => {
    setPendingFiles((p) => ({ ...p, [key]: p[key].filter((_, i) => i !== index) }));
  };

  const validateQuestions = (list) => {
    const next = {};
    list.forEach((q) => {
      if (!q.required) return;
      const value = answers[q.key];
      const empty = Array.isArray(value) ? value.length === 0 : !value;
      if (empty) next[q.key] = 'Please answer this question';
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
    if (stage === TYPE) return validateQuestions(typeQuestions);
    if (stage === DETAILS) return validateQuestions(detailQuestions);
    if (stage === ADDONS) return true; // optional by definition
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setError('');
    setStage((s) => Math.max(s - 1, TYPE));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const uploadPendingFiles = async (bookingNumber, phone) => {
    const entries = Object.entries(pendingFiles).filter(([, files]) => files.length > 0);
    for (const [key, files] of entries) {
      for (let i = 0; i < files.length; i += 1) {
        const uploadKey = `${key}-${i}`;
        setUploadState((s) => ({ ...s, [uploadKey]: 'uploading' }));
        try {
          // eslint-disable-next-line no-await-in-loop
          await api.uploadBookingFile(bookingNumber, phone, files[i]);
          setUploadState((s) => ({ ...s, [uploadKey]: 'done' }));
        } catch {
          setUploadState((s) => ({ ...s, [uploadKey]: 'error' }));
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateDetails()) return;
    // A slow tap-happy double submit must not create two bookings.
    if (submittedRef.current || busy) return;
    submittedRef.current = true;

    setBusy(true);
    setError('');
    try {
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
        serviceSlug: subSlug,
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
      window.scrollTo({ top: 0, behavior: 'smooth' });

      const hasFiles = Object.values(pendingFiles).some((files) => files.length > 0);
      if (hasFiles) {
        uploadPendingFiles(result.bookingNumber, details.phone);
      }
    } catch (err) {
      submittedRef.current = false;
      if (err && err.fieldErrors) setErrors(err.fieldErrors);
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  if (!intro) return <Navigate to="/services/electrical" replace />;

  /* ---------------------------------------------------------- intro splash */
  if (!started) {
    return (
      <div className="elc-intro-wrap">
        <div className="elc-intro-hero">
          <img src={intro.image} alt="" />
        </div>
        <div className="container container-narrow">
          <h1>{form ? form.category.name : ''}</h1>
          <p className="elc-intro-tagline">{intro.tagline}</p>

          <div className="elc-badges">
            {intro.badges.map((b) => (
              <div className="elc-badge" key={b.label}>
                <Icon name={b.icon} size={20} />
                <span>{b.label}</span>
              </div>
            ))}
          </div>

          <div className="elc-included">
            <h2>What's Included?</h2>
            <ul>
              {intro.whatsIncluded.map((item) => (
                <li key={item}>
                  <Icon name="check" size={14} strokeWidth={3} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {loading && <p className="question-hint">Loading…</p>}
          {loadError && (
            <div role="alert" className="alert alert-error">
              <Icon name="info" size={18} />
              <span>{loadError}</span>
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary btn-block elc-get-started"
            disabled={loading || !!loadError}
            onClick={() => setStarted(true)}
          >
            Get Started
            <Icon name="arrow-right" size={17} />
          </button>
          <Link to="/services/electrical" className="elc-back-link">
            <Icon name="arrow-left" size={15} />
            Back to Electrical Services
          </Link>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------- confirm */
  if (receipt) {
    return <ElectricianConfirmation receipt={receipt} details={details} pendingFiles={pendingFiles} uploadState={uploadState} />;
  }

  const { category } = form;

  return (
    <div className="wizard-shell">
      <div className="wizard-container">
        <div className="wizard-top">
          <button type="button" className="wizard-back" onClick={stage === TYPE ? () => setStarted(false) : goBack} aria-label="Go back">
            <Icon name="arrow-left" size={20} />
          </button>
          <h1 className="wizard-title">{category.name}</h1>
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

        <ol className="wizard-steps">
          {ELECTRICIAN_STAGES.map((label, i) => (
            <li key={label} className={`wstep ${i === stage ? 'current' : ''} ${i < stage ? 'done' : ''}`} aria-current={i === stage ? 'step' : undefined}>
              <span className="wstep-num">{i < stage ? <Icon name="check" size={14} strokeWidth={3} /> : i + 1}</span>
              <span className="wstep-label">{label}</span>
            </li>
          ))}
        </ol>

        <form onSubmit={handleSubmit} noValidate>
          <div className="wizard-card !bg-white/45 !border-white/35 !shadow-[0_10px_35px_rgba(0,0,0,0.10)]">
            {stage === TYPE &&
              typeQuestions.map((q) => (
                <QuestionField key={q.key} question={q} value={answers[q.key]} onChange={setAnswer(q.key)} error={errors[q.key]} />
              ))}

            {stage === DETAILS && (
              <>
                {detailQuestions.map((q) => (
                  <QuestionField key={q.key} question={q} value={answers[q.key]} onChange={setAnswer(q.key)} error={errors[q.key]} />
                ))}
                {fileQuestions.map((q) => (
                  <FileField
                    key={q.key}
                    question={q}
                    files={pendingFiles[q.key] || []}
                    onPick={onFilesPicked(q.key)}
                    onRemove={(i) => removeFile(q.key, i)}
                    error={errors[q.key]}
                  />
                ))}
              </>
            )}

            {stage === ADDONS && (
              <>
                {addOnQuestions.map((q) => (
                  <QuestionField key={q.key} question={q} value={answers[q.key]} onChange={setAnswer(q.key)} error={errors[q.key]} />
                ))}
                {addOnQuestions.length === 0 && (
                  <p className="question-hint">No optional add-ons for this service.</p>
                )}
              </>
            )}

            {stage === SCHEDULE && (
              <>
                <div className="wizard-card-head">
                  <h2>Choose Date &amp; Time for Site Visit</h2>
                  <p>Our team will visit your site.</p>
                </div>
                <SlotPicker
                  serviceSlug={subSlug}
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

            {stage === CONFIRM && (
              <>
                <div className="wizard-card-head">
                  <h2>Enter Your Details</h2>
                  <p>We will contact you to confirm the appointment.</p>
                </div>

                <div className="form-grid">
                  <Field id="ec-name" label="Full Name" required value={details.name} onChange={setDetail('name')} error={errors.name} placeholder="Enter your name" />
                  <Field id="ec-phone" label="Mobile Number" required type="tel" inputMode="numeric" value={details.phone} onChange={setDetail('phone')} error={errors.phone} placeholder="Enter mobile number" />
                  <Field id="ec-whatsapp" label="WhatsApp Number (Optional)" type="tel" inputMode="numeric" value={details.whatsapp} onChange={setDetail('whatsapp')} error={errors.whatsapp} placeholder="Enter WhatsApp number" hint="Leave blank if it is the same as your mobile." />
                  <Field id="ec-email" label="Email Address (Optional)" type="email" value={details.email} onChange={setDetail('email')} error={errors.email} placeholder="Enter email address" />
                </div>

                <div className="field" style={{ marginTop: 16 }}>
                  <label htmlFor="ec-address">
                    Full Address <span className="req">*</span>
                  </label>
                  <textarea id="ec-address" rows={3} value={details.address} onChange={setDetail('address')} placeholder="Enter complete address" />
                  {errors.address && <span className="field-error">{errors.address}</span>}
                </div>

                <div className="form-grid" style={{ marginTop: 16 }}>
                  <Field id="ec-city" label="City" required value={details.city} onChange={setDetail('city')} error={errors.city} placeholder="Mumbai" />
                  <Field id="ec-pincode" label="Pincode" value={details.pincode} onChange={setDetail('pincode')} error={errors.pincode} placeholder="400001" />
                </div>

                <ElectricianSummary category={category} form={form} answers={answers} date={date} time={time} estimate={estimate} />
              </>
            )}

            {error && (
              <div role="alert" className="alert alert-error" style={{ marginTop: 18 }}>
                <Icon name="info" size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className={`wizard-foot ${stage === TYPE ? 'single' : ''}`}>
              {stage > TYPE && (
                <button type="button" className="btn btn-ghost btn-back" onClick={goBack}>
                  BACK
                </button>
              )}
              {stage === CONFIRM ? (
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'BOOKING…' : 'PAY & CONFIRM BOOKING'}
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

/* -------------------------------------------------------------- helpers */

function Field({ id, label, required, hint, error, ...rest }) {
  return (
    <div className={`field ${error ? 'error' : ''}`}>
      <label htmlFor={id}>
        {label} {required && <span className="req">*</span>}
      </label>
      <input id={id} {...rest} />
      {error ? <span className="field-error">{error}</span> : hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

function FileField({ question, files, onPick, onRemove, error }) {
  const inputId = `file-${question.key}`;
  return (
    <div className="field elc-file-field">
      <label htmlFor={inputId}>{question.text}</label>
      <div className="elc-file-row">
        {files.map((file, i) => (
          <div className="elc-file-thumb" key={`${file.name}-${i}`}>
            <img src={URL.createObjectURL(file)} alt={file.name} />
            <button type="button" aria-label={`Remove ${file.name}`} onClick={() => onRemove(i)}>
              <Icon name="close" size={13} />
            </button>
          </div>
        ))}
        {files.length < 5 && (
          <label htmlFor={inputId} className="elc-file-add">
            <Icon name="upload" size={18} />
            <span>Add Photos</span>
          </label>
        )}
      </div>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        onChange={onPick}
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
      />
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

function ElectricianSummary({ category, form, answers, date, time, estimate }) {
  const rows = form.questions
    .filter((q) => q.inputType !== 'FILE')
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
          <dd>{date} at {time}</dd>
        </div>
        {rows.map((row) => (
          <div key={row.key}>
            <dt>{row.question}</dt>
            <dd>{row.answer}</dd>
          </div>
        ))}
      </dl>

      {estimate && (
        <div className="elc-estimate">
          <span className="elc-estimate-label">Estimated Price</span>
          <strong className="elc-estimate-value">
            ₹{formatMoney(estimate.min)} – ₹{formatMoney(estimate.max)}
          </strong>
          <span className="elc-estimate-note">Final price may change after on-site inspection and material selection.</span>
        </div>
      )}

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
          This is a one-time fee. <strong>No advance payment is required for the actual work.</strong> The final
          project cost will be provided after site inspection.
        </p>
      </div>
    </div>
  );
}

function ElectricianConfirmation({ receipt, details, pendingFiles, uploadState }) {
  const message = encodeURIComponent(`Hello Supplybase, this is about my booking ${receipt.bookingNumber}.`);
  const fileCount = Object.values(pendingFiles).reduce((n, files) => n + files.length, 0);
  const uploadedCount = Object.values(uploadState).filter((s) => s === 'done').length;
  const failedCount = Object.values(uploadState).filter((s) => s === 'error').length;
  const stillUploading = Object.values(uploadState).some((s) => s === 'uploading');

  const addToCalendar = () => {
    const start = `${receipt.date.replace(/-/g, '')}T${receipt.time.replace(/:/g, '').slice(0, 4)}00`;
    const url = new URL('https://www.google.com/calendar/render');
    url.searchParams.set('action', 'TEMPLATE');
    url.searchParams.set('text', `Supplybase — ${receipt.serviceName} site visit`);
    url.searchParams.set('dates', `${start}/${start}`);
    url.searchParams.set('details', `Booking ${receipt.bookingNumber}`);
    url.searchParams.set('location', details.city || '');
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="wizard-shell">
      <div className="wizard-container">
        <div className="wizard-card">
          <div className="confirmed">
            <div className="confirmed-tick">
              <Icon name="check" size={38} strokeWidth={3} />
            </div>

            <h2>Booking Confirmed!</h2>
            <p>
              We have received your request. Our team will contact you on WhatsApp or phone to confirm the
              appointment.
            </p>

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
                <dt>Service</dt>
                <dd>{receipt.serviceName}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{details.address}, {details.city}</dd>
              </div>
            </dl>

            {fileCount > 0 && (
              <p className="elc-upload-status">
                {stillUploading && `Uploading your photos… (${uploadedCount}/${fileCount})`}
                {!stillUploading && failedCount === 0 && `All ${fileCount} photo(s) uploaded.`}
                {!stillUploading && failedCount > 0 &&
                  `${uploadedCount}/${fileCount} photo(s) uploaded — ${failedCount} failed. You can share the rest on WhatsApp.`}
              </p>
            )}

            <button type="button" className="btn btn-ghost btn-block" onClick={addToCalendar}>
              <Icon name="calendar" size={17} />
              Add to Calendar
            </button>

            <Link to="/dashboard" className="btn btn-primary btn-block" style={{ marginTop: 10 }}>
              VIEW BOOKING
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

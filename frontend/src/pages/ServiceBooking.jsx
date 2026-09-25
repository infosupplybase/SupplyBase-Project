
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
 * Five stages:
 * Service -> Property -> Details -> Schedule -> Confirm
 */

const STAGES = ['Service', 'Property', 'Details', 'Schedule', 'Confirm'];

const SCHEDULE = 3;
const CONFIRM = 4;

 const DEDICATED_FLOW_PREFIXES = ['pop_', 'wp_'];
//const DEDICATED_FLOW_PREFIXES = ['wp_'];

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
  /^[6-9]\d{9}$/.test(
    String(v || '')
      .replace(/\D/g, '')
      .replace(/^91/, '')
      .replace(/^0/, '')
  );

export default function ServiceBooking({
  serviceSlug,
  modal = false,
  onStepChange,
  onClose,
}) {
  const { slug: routeSlug } = useParams();

  const slug = serviceSlug || routeSlug;

  const { user } = useAuth();

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

  /**
   * Notify parent modal about current step.
   */
  useEffect(() => {
    if (modal && onStepChange) {
      onStepChange(stage, receipt);
    }
  }, [stage, receipt, modal, onStepChange]);

  /**
   * Load service form.
   */
  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setLoadError('');

    api
      .serviceForm(slug)
      .then((result) => {
        if (cancelled) return;

        if (!result || !Array.isArray(result.questions)) {
          throw new Error('Invalid service form received from server.');
        }

        /*
         * Debug information.
         *
         * This also helps identify duplicate question keys such as "notes".
         */
        console.log(
          'SERVICE FORM QUESTIONS:',
          result.questions.map((q, index) => ({
            index,
            key: q.key,
            text: q.text,
            inputType: q.inputType,
          }))
        );

        setForm(result);

        /*
         * Switching service mid-flow must not carry answers to questions
         * that the new service never asked.
         */
        setStage(0);

        const validPreselect =
          preselect &&
          result.questions.some(
            (q) =>
              q.key === 'service_needed' &&
              q.options?.some((o) => o.value === preselect)
          );

        setAnswers(
          validPreselect
            ? {
                service_needed: [preselect],
              }
            : {}
        );

        setDate('');
        setTime('');
        setErrors({});
        setError('');
        setReceipt(null);
      })
      .catch((err) => {
        console.error('SERVICE FORM ERROR:', err);

        if (!cancelled) {
          setLoadError(friendlyError(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug, preselect]);

  /**
   * Prefill details from signed-in account.
   */
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
   * Questions for each question stage.
   *
   * Service:
   *   service_needed
   *
   * Property:
   *   property_type
   *
   * Details:
   *   everything else
   *
   * FILE questions are excluded.
   *
   * Dedicated flow questions beginning with pop_ or wp_ are excluded because
   * those are handled by their dedicated flow pages.
   */
  // const stageQuestions = useMemo(() => {
  //   if (!form || !Array.isArray(form.questions)) {
  //     return [[], [], []];
  //   }

  //   const usable = form.questions.filter(
  //     (q) =>
  //       q &&
  //       q.inputType !== 'FILE' &&
  //       !DEDICATED_FLOW_PREFIXES.some((prefix) =>
  //         String(q.key || '').startsWith(prefix)
  //       )
  //   );

  //   const service = usable.filter(
  //     (q) => q.key === 'service_needed'
  //   );

  //   const property = usable.filter(
  //     (q) => q.key === 'property_type'
  //   );

  //   const detailsQuestions = usable.filter(
  //     (q) =>
  //       q.key !== 'service_needed' &&
  //       q.key !== 'property_type'
  //   );

  //   return [service, property, detailsQuestions];
  // }, [form]);
const stageQuestions = useMemo(() => {
  if (!form || !Array.isArray(form.questions)) {
    return [[], [], []];
  }

  const usable = form.questions
    .filter(
      (q) =>
        q &&
        q.inputType !== 'FILE' &&
        !DEDICATED_FLOW_PREFIXES.some((prefix) =>
          String(q.key || '').startsWith(prefix)
        )
    )
    // The catalogue can hold the same question twice (Waterproofing asks
    // "Tell us anything else about your work." at step 3 and again at step 6,
    // both answering the one `notes` key). Same key and same wording means the
    // same question, so it is asked once — the first one is kept.
    .filter(
      (question, index, questions) =>
        index ===
        questions.findIndex(
          (q) => q.key === question.key && q.text === question.text
        )
    )
    .map((q, index) => ({
      ...q,
      _questionId: `${q.key}-${index}`,
    }));

  const service = usable.filter(
    (q) => q.key === 'service_needed'
  );

  const property = usable.filter(
    (q) => q.key === 'property_type'
  );

  const detailsQuestions = usable.filter(
    (q) =>
      q.key !== 'service_needed' &&
      q.key !== 'property_type'
  );

  return [
    service,
    property,
    detailsQuestions,
  ];
}, [form]);
  /**
   * Set answer.
   *
   * QuestionField can send either:
   *   - a direct value
   *   - a functional updater
   *
   * Both are supported here.
   */
  const setAnswer = (key) => (next) => {
    setAnswers((currentAnswers) => {
      const nextValue =
        typeof next === 'function'
          ? next(currentAnswers[key])
          : next;

      return {
        ...currentAnswers,
        [key]: nextValue,
      };
    });

    setErrors((currentErrors) => ({
      ...currentErrors,
      [key]: undefined,
    }));

    setError('');
  };

  /**
   * Set customer detail.
   */
  const setDetail = (key) => (e) => {
    const value = e.target.value;

    setDetails((currentDetails) => ({
      ...currentDetails,
      [key]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [key]: undefined,
    }));

    setError('');
  };

  /**
   * Validate catalogue questions.
   */
  const validateQuestions = (list) => {
    const nextErrors = {};

    list.forEach((question) => {
      if (!question.required) return;

      const value = answers[question.key];

      const empty = Array.isArray(value)
        ? value.length === 0
        : !value;

      if (empty) {
        nextErrors[question.key] = 'Please choose an option';
      }
    });

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  /**
   * Validate customer details.
   */
  const validateDetails = () => {
    const nextErrors = {};

    if (!details.name.trim()) {
      nextErrors.name = 'Please enter your name';
    }

    if (!details.phone.trim()) {
      nextErrors.phone = 'Please enter your mobile number';
    } else if (!isValidPhone(details.phone)) {
      nextErrors.phone = 'Enter a 10-digit mobile number';
    }

    if (
      details.whatsapp.trim() &&
      !isValidPhone(details.whatsapp)
    ) {
      nextErrors.whatsapp =
        'Enter a 10-digit number, or leave it blank';
    }

    if (
      details.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        details.email.trim()
      )
    ) {
      nextErrors.email =
        'That email address does not look right';
    }

    if (!details.address.trim()) {
      nextErrors.address = 'Please enter your address';
    }

    if (!details.city.trim()) {
      nextErrors.city = 'Please enter your city';
    }

    if (
      details.pincode.trim() &&
      !/^[1-9][0-9]{5}$/.test(details.pincode.trim())
    ) {
      nextErrors.pincode = 'Enter a 6-digit pincode';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  /**
   * Check whether current stage can be left.
   */
  const canLeaveStage = () => {
    if (stage < SCHEDULE) {
      return validateQuestions(stageQuestions[stage]);
    }

    if (stage === SCHEDULE) {
      if (!date || !time) {
        setErrors({
          slot: 'Please choose a date and a time',
        });

        return false;
      }

      return true;
    }

    return validateDetails();
  };

  /**
   * Next stage.
   */
  const goNext = () => {
    setError('');

    if (!canLeaveStage()) {
      return;
    }

    setStage((currentStage) =>
      Math.min(currentStage + 1, CONFIRM)
    );

    if (!modal) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  /**
   * Previous stage.
   */
  const goBack = () => {
    setError('');

    setStage((currentStage) =>
      Math.max(currentStage - 1, 0)
    );

    if (!modal) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  /**
   * Submit booking.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateDetails()) {
      return;
    }

    setBusy(true);
    setError('');

    try {
      /*
       * Flatten answers.
       *
       * MULTI questions become one row per selected option.
       */
      const flat = [];

      Object.entries(answers).forEach(([key, value]) => {
        const question = form.questions.find(
          (q) => q.key === key
        );

        const values = Array.isArray(value)
          ? value
          : [value];

        values
          .filter(
            (v) =>
              v !== '' &&
              v !== null &&
              v !== undefined
          )
          .forEach((v) => {
            const option = (
              question?.options || []
            ).find((o) => o.value === v);

            flat.push({
              key,
              value: String(v),
              label: option
                ? option.label
                : String(v),
            });
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

        areaSqft: answers.area_sqft
          ? Number(answers.area_sqft)
          : null,
      });

      setReceipt(result);

      if (!modal) {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }
    } catch (err) {
      console.error('BOOKING ERROR:', err);

      if (err && err.fieldErrors) {
        setErrors(err.fieldErrors);
      }

      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  /* ----------------------------------------------------------
     Loading
  ---------------------------------------------------------- */

  if (loading) {
    return (
      <div
        className={
          modal
            ? 'w-full'
            : 'wizard-shell'
        }
      >
        <div
          className={
            modal
              ? 'w-full'
              : 'wizard-container'
          }
        >
          <p
            style={{
              color: 'rgba(255,255,255,.6)',
            }}
          >
            Loading…
          </p>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------------
     Load error
  ---------------------------------------------------------- */

  if (loadError || !form) {
    return (
      <div
        className={
          modal
            ? 'w-full'
            : 'wizard-shell'
        }
      >
        <div
          className={
            modal
              ? 'w-full'
              : 'wizard-container'
          }
        >
          <div className="wizard-card">
            <div
              role="alert"
              className="alert alert-error"
            >
              <Icon
                name="info"
                size={18}
              />

              <span>
                {loadError ||
                  'That service could not be found.'}
              </span>
            </div>

            <Link
              to="/services"
              className="btn btn-primary btn-block"
            >
              SEE ALL SERVICES
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { category } = form;

  /* ----------------------------------------------------------
     Confirmation
  ---------------------------------------------------------- */

  if (receipt) {
    return (
      <Confirmation
        receipt={receipt}
        details={details}
        modal={modal}
      />
    );
  }

  /* ----------------------------------------------------------
     Main booking UI
  ---------------------------------------------------------- */

  return (
    <div
      className={
        modal
          ? 'w-full'
          : 'wizard-shell'
      }
    >
      <div
        className={
          modal
            ? 'w-full'
            : 'wizard-container'
        }
      >
        {/* --------------------------------------------------
            Top bar
        -------------------------------------------------- */}

        {!modal && (
          <div className="wizard-top">
            {stage > 0 ? (
              <button
                type="button"
                className="wizard-back"
                onClick={goBack}
                aria-label="Go back"
              >
                <Icon
                  name="arrow-left"
                  size={20}
                />
              </button>
            ) : (
              <Link
                to="/services"
                className="wizard-back"
                aria-label="Back to services"
              >
                <Icon
                  name="arrow-left"
                  size={20}
                />
              </Link>
            )}

            <h1 className="wizard-title">
              Book a Service
            </h1>

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

        {/* --------------------------------------------------
            Progress
        -------------------------------------------------- */}

        <ol
          className={
            modal
              ? 'wizard-steps !mb-5'
              : 'wizard-steps'
          }
        >
          {STAGES.map((label, index) => (
            <li
              key={label}
              className={`wstep ${
                index === stage
                  ? 'current'
                  : ''
              } ${
                index < stage
                  ? 'done'
                  : ''
              }`}
              aria-current={
                index === stage
                  ? 'step'
                  : undefined
              }
            >
              <span className="wstep-num">
                {index < stage ? (
                  <Icon
                    name="check"
                    size={14}
                    strokeWidth={3}
                  />
                ) : (
                  index + 1
                )}
              </span>

              <span className="wstep-label">
                {label}
              </span>
            </li>
          ))}
        </ol>

        {/* --------------------------------------------------
            Form
        -------------------------------------------------- */}

        <form
          onSubmit={handleSubmit}
          noValidate
        >
          <div
            className={
              modal
                ? 'wizard-card !rounded-xl !shadow-none !p-5'
                : 'wizard-card'
            }
          >
            {/* --------------------------------------------
                Stages 1-3: Questions
            -------------------------------------------- */}

            {stage < SCHEDULE &&
              stageQuestions[stage].map(
                (question, index) => (
              <QuestionField
                key={question._questionId || `${question.key}-${index}`}
                question={question}
                value={answers[question.key]}
                onChange={setAnswer(question.key)}
                error={errors[question.key]}
                serviceSlug={slug}
              />
                )
              )}

            {/* --------------------------------------------
                Stage 4: Schedule
            -------------------------------------------- */}

            {stage === SCHEDULE && (
              <>
                <div className="wizard-card-head">
                  <h2>
                    Choose Date &amp; Time for
                    Site Visit
                  </h2>

                  <p>
                    Our team will visit your site.
                  </p>
                </div>

                <SlotPicker
                  serviceSlug={slug}
                  date={date}
                  time={time}
                  onPick={(d, t) => {
                    setDate(d);
                    setTime(t);

                    setErrors((currentErrors) => ({
                      ...currentErrors,
                      slot: undefined,
                    }));
                  }}
                  error={errors.slot}
                />
              </>
            )}

            {/* --------------------------------------------
                Stage 5: Customer details + Summary
            -------------------------------------------- */}

            {stage === CONFIRM && (
              <>
                <div className="wizard-card-head">
                  <h2>
                    Enter Your Details
                  </h2>

                  <p>
                    We will contact you to
                    confirm the appointment.
                  </p>
                </div>

                <div className="form-grid">
                  <Field
                    id="bk-name"
                    label="Full Name"
                    required
                    value={details.name}
                    onChange={setDetail('name')}
                    error={errors.name}
                    placeholder="Enter your name"
                  />

                  <Field
                    id="bk-phone"
                    label="Mobile Number"
                    required
                    type="tel"
                    inputMode="numeric"
                    value={details.phone}
                    onChange={setDetail('phone')}
                    error={errors.phone}
                    placeholder="Enter mobile number"
                  />

                  <Field
                    id="bk-whatsapp"
                    label="WhatsApp Number (Optional)"
                    type="tel"
                    inputMode="numeric"
                    value={details.whatsapp}
                    onChange={setDetail('whatsapp')}
                    error={errors.whatsapp}
                    placeholder="Enter WhatsApp number"
                    hint="Leave blank if it is the same as your mobile."
                  />

                  <Field
                    id="bk-email"
                    label="Email Address (Optional)"
                    type="email"
                    value={details.email}
                    onChange={setDetail('email')}
                    error={errors.email}
                    placeholder="Enter email address"
                  />
                </div>

                <div
                  className="field"
                  style={{
                    marginTop: 16,
                  }}
                >
                  <label htmlFor="bk-address">
                    Project Address{' '}
                    <span className="req">
                      *
                    </span>
                  </label>

                  <textarea
                    id="bk-address"
                    rows={3}
                    value={details.address}
                    onChange={setDetail('address')}
                    placeholder="Enter complete address"
                  />

                  {errors.address && (
                    <span className="field-error">
                      {errors.address}
                    </span>
                  )}
                </div>

                <div
                  className="form-grid"
                  style={{
                    marginTop: 16,
                  }}
                >
                  <Field
                    id="bk-city"
                    label="City"
                    required
                    value={details.city}
                    onChange={setDetail('city')}
                    error={errors.city}
                    placeholder="Mumbai"
                  />

                  <Field
                    id="bk-pincode"
                    label="Pincode"
                    value={details.pincode}
                    onChange={setDetail('pincode')}
                    error={errors.pincode}
                    placeholder="400001"
                  />
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

            {/* --------------------------------------------
                Error
            -------------------------------------------- */}

            {error && (
              <div
                role="alert"
                className="alert alert-error"
                style={{
                  marginTop: 18,
                }}
              >
                <Icon
                  name="info"
                  size={18}
                />

                <span>{error}</span>
              </div>
            )}

            {/* --------------------------------------------
                Footer
            -------------------------------------------- */}

            <div
              className={
                modal
                  ? 'wizard-foot !static !inset-auto !z-auto !mt-5 !mb-0 !flex !w-full !gap-3 !border-0 !bg-transparent !p-0 !shadow-none'
                  : 'wizard-foot'
              }
            >
              {(stage > 0 || modal) && (
                <button
                  type="button"
                  className="btn btn-ghost btn-back btn-sm md:!flex-none md:!w-36 md:!me-auto"
                  onClick={
                    stage > 0
                      ? goBack
                      : onClose
                  }
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
                  {busy
                    ? 'BOOKING…'
                    : 'BOOK NOW'}

                  <Icon
                    name="arrow-right"
                    size={15}
                  />
                </button>
              ) : (
                (
                  stage >= SCHEDULE ||
                  (
                    stageQuestions[stage]
                      .length > 0 &&
                    stageQuestions[stage].every(
                      (question) => {
                        if (
                          !question.required
                        ) {
                          return true;
                        }

                        const value =
                          answers[
                            question.key
                          ];

                        return Array.isArray(
                          value
                        )
                          ? value.length > 0
                          : Boolean(value);
                      }
                    )
                  )
                ) && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm md:!flex-none md:!w-44 md:!ms-auto"
                    onClick={goNext}
                  >
                    CONTINUE

                    <Icon
                      name="arrow-right"
                      size={17}
                    />
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

/* ==========================================================
   Field
========================================================== */

function Field({
  id,
  label,
  required,
  hint,
  error,
  ...rest
}) {
  return (
    <div
      className={`field ${
        error ? 'error' : ''
      }`}
    >
      <label htmlFor={id}>
        {label}{' '}
        {required && (
          <span className="req">
            *
          </span>
        )}
      </label>

      <input
        id={id}
        {...rest}
      />

      {error ? (
        <span className="field-error">
          {error}
        </span>
      ) : (
        hint && (
          <span className="field-hint">
            {hint}
          </span>
        )
      )}
    </div>
  );
}

/* ==========================================================
   Summary
========================================================== */

function Summary({
  category,
  form,
  answers,
  date,
  time,
}) {
  /*
   * Filter out FILE questions and dedicated-flow questions.
   */
  const rows = form.questions
  .filter(
    (q) =>
      q &&
      q.inputType !== 'FILE' &&
      !DEDICATED_FLOW_PREFIXES.some((prefix) =>
        String(q.key || '').startsWith(prefix)
      )
  )
  .filter(
    (question, index, questions) =>
      index ===
      questions.findIndex(
        (q) =>
          q.key === question.key &&
          q.text === question.text
      )
  )
  .map((q, questionIndex) => {
      const value = answers[q.key];

      const values = Array.isArray(value)
        ? value
        : value
          ? [value]
          : [];

      if (values.length === 0) {
        return null;
      }

      const labels = values.map((v) => {
        const option = (
          q.options || []
        ).find(
          (o) => o.value === v
        );

        return option
          ? option.label
          : v;
      });

      return {
        key: q.key,
        index: questionIndex,
        question: q.text,
        answer: labels.join(', '),
      };
    })
    .filter(Boolean);

  return (
    <div
      style={{
        marginTop: 26,
      }}
    >
      <div className="wizard-card-head">
        <h2>Booking Summary</h2>

        <p>
          Please check everything before
          you pay.
        </p>
      </div>

      <dl className="review-list">
        <div>
          <dt>Service</dt>

          <dd>
            {category.name}
          </dd>
        </div>

        <div>
          <dt>Site visit</dt>

          <dd>
            {date} at {time}
          </dd>
        </div>

        {rows.map((row) => (
          /*
           * Index is included because the API can return duplicate
           * catalogue keys such as "notes".
           */
          <div
            key={`${row.key}-${row.index}`}
          >
            <dt>
              {row.question}
            </dt>

            <dd>
              {row.answer}
            </dd>
          </div>
        ))}
      </dl>

      <div className="fee-panel">
        <div className="fee-panel-top">
          <strong>
            Site Visit &amp; Quotation Fee
          </strong>
        </div>

        <ul className="fee-includes">
          {[
            'Site visit',
            'Assessment',
            'Measurement where required',
            'Quotation',
          ].map((item) => (
            <li key={item}>
              <Icon
                name="check"
                size={13}
                strokeWidth={3}
              />

              {item}
            </li>
          ))}
        </ul>

        <p className="fee-small">
          This is a one-time fee.{' '}
          <strong>
            No advance payment is required
            for the actual work.
          </strong>{' '}
          The final project cost will be
          provided after site inspection.
          Supplybase will provide the
          required material according to the
          approved quotation.
        </p>
      </div>
    </div>
  );
}

/* ==========================================================
   Confirmation
========================================================== */

function Confirmation({
  receipt,
  details,
  modal = false,
}) {
  const message = encodeURIComponent(
    `Hello Supplybase, this is about my booking ${receipt.bookingNumber}.`
  );

  return (
    <div
      className={
        modal
          ? 'w-full'
          : 'wizard-shell'
      }
    >
      <div
        className={
          modal
            ? 'w-full'
            : 'wizard-container'
        }
      >
        <div
          className={
            modal
              ? 'wizard-card !p-5 !rounded-xl !shadow-none'
              : 'wizard-card'
          }
        >
          <div className="confirmed">
            <div className="confirmed-tick">
              <Icon
                name="check"
                size={38}
                strokeWidth={3}
              />
            </div>

            <h2>
              Your Site Visit is Booked!
            </h2>

            <p>
              We have received your request.
              Our team will contact you on
              WhatsApp or phone to confirm the
              appointment.
            </p>

            <dl className="confirmed-panel">
              <div>
                <dt>Booking ID</dt>

                <dd className="booking-id">
                  {receipt.bookingNumber}
                </dd>
              </div>

              <div>
                <dt>Date &amp; Time</dt>

                <dd>
                  {receipt.date},{' '}
                  {receipt.time}
                </dd>
              </div>

              <div>
                <dt>Service</dt>

                <dd>
                  {receipt.serviceName}
                </dd>
              </div>

              <div>
                <dt>Location</dt>

                <dd>
                  {details.city}
                </dd>
              </div>
            </dl>

            <Link
              to="/dashboard"
              className="btn btn-primary w-full sm:w-auto sm:min-w-[250px]"
            >
              GO TO DASHBOARD
            </Link>

            <div
              className="btn-row flex justify-center"
              style={{
                marginTop: 12,
              }}
            >
              <a
                href={`https://wa.me/${contact.phoneRaw}?text=${message}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp"
              >
                <Icon
                  name="whatsapp"
                  size={17}
                />

                CHAT ON WHATSAPP
              </a>

              <Link
                to="/"
                className="btn btn-ghost btn-back"
              >
                BACK TO HOME
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
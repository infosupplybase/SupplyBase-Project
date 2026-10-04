
import { useEffect, useMemo, useState, useRef } from 'react';

import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import Icon from '../components/ui/Icon';

import QuestionField from '../components/booking/QuestionField';

import SlotPicker from '../components/booking/SlotPicker';

import api, { friendlyError } from '../lib/api';

import { useAuth } from '../context/AuthContext';

import { contact } from '../data/siteConfig';
import { formatVisit } from '../lib/visitTime';
import { hasHistoryState, useFormBack, useHistoryState } from '../hooks/useHistoryState';
import ModalFoot from '../components/services/ModalFoot';
import { composeAddress, emptyDetails, validateDetails as checkDetails } from '../lib/bookingDetails';
import { usePickedLocation } from '../context/LocationContext';
import { useEnsureLogin } from '../components/auth/LoginGate';
import { uploadBookingPhotos } from '../lib/bookingPhotos';
import CustomerDetailsFields from '../components/booking/CustomerDetailsFields';
import { wpCategories } from '../data/waterproofingContent';




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

// const DEDICATED_FLOW_PREFIXES = ['pop_', 'wp_'];
const DEDICATED_FLOW_PREFIXES = ['wp_'];

// POP's catalogue also holds the questions of its two detailed journeys
// (Full Home POP, Room POP). Its design style question is kept here for its
// pictures; these are left out — they repeat what this form already asks
// (home type, room type, a second design style, two more notes boxes), and
// the additional options are not offered when booking.
const REPEATED_QUESTIONS = {
  'pop-ceiling-design': [
    'pop_home_type',
    'pop_room_type',
    'pop_room_design_style',
    'pop_room_notes',
    'pop_design_notes',
    'pop_addon',
  ],
};

// Services not offered for now. They stay in the catalogue and are only
// hidden from the "What service do you need?" choices — delete a line here
// to offer that service again.
const HIDDEN_SERVICES = {
  waterproofing: [
    'Balcony Waterproofing',
    'Toilet Waterproofing',
    'Kitchen Waterproofing',
    'Podium Waterproofing',
    'Wall Waterproofing',
    'Bathroom Corner & Joint Sealing',
    'Bathroom Pipeline & Fixture Sealing',
    'Bathroom Shower Area Waterproofing',
    'Bathroom Tile Re-sealing',
  ],
};

/** The question without any service that is not offered for now. */
const withoutHiddenServices = (q, slug) => {
  const hidden = HIDDEN_SERVICES[slug];
  if (q.key !== 'service_needed' || !Array.isArray(q.options)) {
    return q;
  }
  if (!hidden) return q;
  return {
    ...q,
    options: q.options.filter((option) => !hidden.includes(option.value)),
  };
};

/** Whether this general form asks a catalogue question. */
const isAskedHere = (q, slug) =>
  Boolean(q) &&
  q.inputType !== 'FILE' &&
  !DEDICATED_FLOW_PREFIXES.some((prefix) =>
    String(q.key || '').startsWith(prefix)
  ) &&
  !(REPEATED_QUESTIONS[slug] || []).includes(q.key);

export default function ServiceBooking({
  serviceSlug,
  modal = false,
  onStepChange,
  onClose,
  onSelectWaterproofingService,
  preselectOption,
}) {
  const { slug: routeSlug } = useParams();

  const slug = serviceSlug || routeSlug;

  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // The visit location pinned on the map (with a Google Maps key), or null.
  const pickedLocation = usePickedLocation();
  const ensureLogin = useEnsureLogin();

  const [searchParams] = useSearchParams();

  const preselect = preselectOption || searchParams.get('preselect');

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // This form's step and answers live in the browser's history (see
  // hooks/useHistoryState): a refresh keeps them, Back goes one step back.
  const scope = preselect ? `f:svc:${slug}:preselect:${preselect}` : `f:svc:${slug}`;
  const formBack = useFormBack();
  const [stage, setStage] = useHistoryState(`${scope}:stage`, preselect ? 1 : 0, { push: true });

  const [answers, setAnswers] = useHistoryState(`${scope}:answers`, {});

  const [details, setDetails] = useHistoryState(`${scope}:details`, emptyDetails);

  const [date, setDate] = useHistoryState(`${scope}:date`, '');
  const [time, setTime] = useHistoryState(`${scope}:time`, '');

  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');

  const [busy, setBusy] = useState(false);

  const [receipt, setReceipt] = useHistoryState(`${scope}:receipt`, null);

  /**
   * Notify parent modal about current step.
   */
  // Kept in a ref: a new callback from the parent is not a step change.
  const onStepChangeRef = useRef(onStepChange);
  onStepChangeRef.current = onStepChange;

  useEffect(() => {
    if (modal && onStepChangeRef.current) {
      onStepChangeRef.current(stage, receipt);
    }
  }, [stage, receipt, modal]);

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

        setForm(result);

        /*
         * Each service keeps its own saved answers (the history-state keys
         * include the slug), so switching service never carries answers
         * over, and a refresh must not wipe what was restored. Only a fresh
         * visit with ?preselect= starts with that option ticked.
         */
        const validPreselect =
          preselect &&
          result.questions.some(
            (q) =>
              q.key === 'service_needed' &&
              q.options?.some((o) => o.value === preselect)
          );

        if (validPreselect && !hasHistoryState(`${scope}:answers`)) {
          setAnswers({
            service_needed: [preselect],
          });
        }

        setErrors({});
        setError('');
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
  }, [slug, preselect]); // eslint-disable-line react-hooks/exhaustive-deps

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
    .filter((q) => isAskedHere(q, slug))
    // The catalogue can hold the same question twice (Waterproofing asks
    // "Tell us anything else about your work." at step 3 and again at step 6,
    // both answering the one `notes` key). Two questions with the same key
    // fill the same answer, whatever their wording, so each key is asked
    // once — the first one is kept.
    .filter(
      (question, index, questions) =>
        index === questions.findIndex((q) => q.key === question.key)
    )
    .map((q, index) => ({
      ...withoutHiddenServices(q, slug),
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

  // "Tell us anything else" reads best as the last question of the step.
  const notesLast = [
    ...detailsQuestions.filter((q) => q.key !== 'notes'),
    ...detailsQuestions.filter((q) => q.key === 'notes'),
  ];

  if (slug === 'waterproofing') {
    const serviceQuestion = service[0];
    const catalogueServiceQuestion = form.questions.find((question) => question.key === 'service_needed');
    const waterproofingServiceQuestion = serviceQuestion
      ? [{
          ...serviceQuestion,
          key: 'wp_service_category',
          text: 'Which waterproofing service do you need?',
          inputType: 'SINGLE',
          options: wpCategories.map((category) => {
            const catalogueName = category.slug === 'interior-wall'
              ? 'Wall Waterproofing'
              : category.slug === 'exterior-wall'
                ? 'External Waterproofing'
                : category.name;
            const option = catalogueServiceQuestion?.options?.find((item) =>
              item.value === catalogueName || item.label === catalogueName
            );
            return option ? { ...option, label: category.name, icon: category.icon, route: category.route } : null;
          }).filter(Boolean),
          _questionId: 'wp_service_category',
        }]
      : [];
    return [waterproofingServiceQuestion, notesLast];
  }

  return [service, property, notesLast];
}, [form, slug]);

  const scheduleStage = stageQuestions.length;
  const confirmStage = scheduleStage + 1;
  const stageLabels = slug === 'waterproofing'
    ? ['Waterproofing', 'Details', 'Schedule', 'Confirm']
    : STAGES;
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
   * Validate customer details — the same checks as every booking flow
   * (lib/bookingDetails), which also know about a map pin.
   */
  const validateDetails = () => {
    const nextErrors = checkDetails(details, pickedLocation);

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  /**
   * Check whether current stage can be left.
   */
  const canLeaveStage = () => {
    if (stage < scheduleStage) {
      return validateQuestions(stageQuestions[stage]);
    }

    if (stage === scheduleStage) {
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
      Math.min(currentStage + 1, confirmStage)
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

    formBack(() =>
      setStage((currentStage) =>
        Math.max(currentStage - 1, 0)
      )
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

    // Every booking needs an account: ask now, over this form (LoginGate).
    if (!(await ensureLogin(details))) {
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
      const seenAnswers = new Set();

      Object.entries(answers).forEach(([key, value]) => {
        const submittedKey = key === 'wp_service_category' ? 'service_needed' : key;
        const question = form.questions.find(
          (q) => q.key === submittedKey
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
            const answerId = `${submittedKey}:${v}`;
            if (seenAnswers.has(answerId)) return;
            seenAnswers.add(answerId);

            const option = (
              question?.options || []
            ).find((o) => o.value === v);

            flat.push({
              key: submittedKey,
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

        // Building / room / floor, the pinned location, then anything typed.
        address: composeAddress(details, pickedLocation),

        city: details.city,

        pincode: details.pincode || null,

        areaSqft: answers.area_sqft
          ? Number(answers.area_sqft)
          : null,
      });

      setReceipt(result);
      // Photos picked in the details form go to the booking now it exists.
      uploadBookingPhotos('bk', result.bookingNumber, details.phone);

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
              ? 'wizard-steps !mb-3'
              : 'wizard-steps'
          }
        >
          {stageLabels.map((label, index) => (
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
                ? 'wizard-card !rounded-none !shadow-none !px-0 !pt-1 !pb-0'
                : 'wizard-card'
            }
          >
            {/* --------------------------------------------
                Stages 1-3: Questions
            -------------------------------------------- */}

            {stage < scheduleStage &&
              stageQuestions[stage].map(
                (question, index) => (
              <QuestionField
                key={question._questionId || `${question.key}-${index}`}
                question={question}
                value={answers[question.key]}
                onChange={setAnswer(question.key)}
                error={errors[question.key]}
                serviceSlug={slug}
                onWaterproofingServiceSelect={slug === 'waterproofing'
                  ? (route) => onSelectWaterproofingService ? onSelectWaterproofingService(route) : navigate(route)
                  : undefined}
              />
                )
              )}

            {/* --------------------------------------------
                Stage 4: Schedule
            -------------------------------------------- */}

            {stage === scheduleStage && (
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

            {stage === confirmStage && (
              <>
                <div className="wizard-card-head">
                  <h2>
                    Your Details
                  </h2>

                  <p>
                    We will contact you to
                    confirm the appointment.
                  </p>
                </div>

                <CustomerDetailsFields
                  details={details}
                  setDetail={setDetail}
                  errors={errors}
                  idPrefix="bk"
                />

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

            <ModalFoot
              className={
                modal
                  ? 'wizard-foot modal-sticky-foot !flex !w-full !gap-3 !border-0'
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

              {!(slug === 'waterproofing' && stage === 0) && (stage === confirmStage ? (
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
                  stage >= scheduleStage ||
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
              ))}
            </ModalFoot>
          </div>
        </form>

      </div>
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
    .filter((q) => isAskedHere(q, category.slug))
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
            {formatVisit(date, time)}
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
                  {formatVisit(receipt.date, receipt.time)}
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
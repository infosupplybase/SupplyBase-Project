import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Icon from '../components/ui/Icon';
import SlotPicker from '../components/booking/SlotPicker';
import GoogleLocationPicker from '../components/layout/GoogleLocationPicker';

import api, { friendlyError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatRupees } from '../lib/money';

const DETAILS = 0;
const SCHEDULE = 1;
const CONFIRM = 2;

const EMPTY_DETAILS = {
  name: '',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  city: '',
  pincode: '',
  buildingName: '',
  roomNo: '',
  floorNo: '',
  notes: '',
};

/*
 * ---------------------------------------------------------
 * ELECTRICAL SERVICE SLUG
 * ---------------------------------------------------------
 *
 * The booking API still needs a serviceSlug.
 * We determine it from the electrical cart items.
 */

function getElectricalServiceSlug(items) {
  if (!items || items.length === 0) {
    return 'home-electrical-services';
  }

  const slugs = items.map(
    (item) => item.itemSlug || ''
  );

  if (
    slugs.some((slug) =>
      slug.startsWith('elec-fan-')
    )
  ) {
    return 'fan-installation';
  }

  if (
    slugs.some((slug) =>
      slug.startsWith('elec-light-')
    )
  ) {
    return 'light-installation';
  }

  if (
    slugs.some(
      (slug) =>
        slug.startsWith('elec-switch-') ||
        slug.startsWith('elec-socket-') ||
        slug === 'elec-new-point' ||
        slug === 'elec-plug-top'
    )
  ) {
    return 'switch-socket-installation';
  }

  if (
    slugs.some(
      (slug) =>
        slug.startsWith('elec-wiring-') ||
        slug.startsWith('elec-repair-') ||
        slug.startsWith('elec-inspection-')
    )
  ) {
    return 'wiring-rewiring-services';
  }

  if (
    slugs.some(
      (slug) =>
        slug.startsWith('elec-mcb-') ||
        slug.startsWith('elec-fuse-') ||
        slug.startsWith('elec-db-') ||
        slug.startsWith('elec-inverter-') ||
        slug.startsWith('elec-stabilizer-')
    )
  ) {
    return 'mcb-db-installation';
  }

  if (
    slugs.some((slug) =>
      slug.startsWith('elec-app-')
    )
  ) {
    return 'appliance-installation-services';
  }

  return 'home-electrical-services';
}

/*
 * ---------------------------------------------------------
 * PHONE VALIDATION
 * ---------------------------------------------------------
 */

function isValidPhone(value) {
  let digits = String(value || '').replace(
    /\D/g,
    ''
  );

  if (
    digits.length === 12 &&
    digits.startsWith('91')
  ) {
    digits = digits.slice(2);
  }

  if (
    digits.length === 11 &&
    digits.startsWith('0')
  ) {
    digits = digits.slice(1);
  }

  return /^[6-9]\d{9}$/.test(digits);
}

/*
 * ---------------------------------------------------------
 * DATE DISPLAY
 * ---------------------------------------------------------
 */

function formatBookingDate(value) {
  if (!value) return '—';

  const date = new Date(
    `${value}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    'en-IN',
    {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }
  ).format(date);
}

/*
 * ---------------------------------------------------------
 * TIME DISPLAY
 * ---------------------------------------------------------
 */

function formatBookingTime(value) {
  if (!value) return '—';

  const match = String(value).match(
    /^(\d{1,2}):(\d{2})/
  );

  if (!match) {
    return value;
  }

  const hour = Number(match[1]);
  const minute = match[2];

  const suffix =
    hour >= 12 ? 'PM' : 'AM';

  const displayHour =
    hour % 12 || 12;

  return `${displayHour}:${minute} ${suffix}`;
}

/*
 * ---------------------------------------------------------
 * MAIN COMPONENT
 * ---------------------------------------------------------
 */

export default function ElectricalCheckoutModal({
  onBackToCart,
  onStepChange,
}) {
  const { user } = useAuth();

  /*
   * IMPORTANT:
   *
   * This is ONLY the electrical cart.
   *
   * Plumbing cart is completely separate.
   */
  const {
    items,
    count,
    subtotalPaise,
    clear,
  } = useCart('electrical');

  const [
    stage,
    setStage,
  ] = useState(DETAILS);

  const [
    details,
    setDetails,
  ] = useState(EMPTY_DETAILS);

  const [
    date,
    setDate,
  ] = useState('');

  const [
    time,
    setTime,
  ] = useState('');

  const [
    locationPickerOpen,
    setLocationPickerOpen,
  ] = useState(false);

  const [
    locationData,
    setLocationData,
  ] = useState(null);

  const [
    errors,
    setErrors,
  ] = useState({});

  const [
    error,
    setError,
  ] = useState('');

  const [
    busy,
    setBusy,
  ] = useState(false);

  const [
    receipt,
    setReceipt,
  ] = useState(null);

  /*
   * -------------------------------------------------------
   * SERVICE SLUG
   * -------------------------------------------------------
   */

  const serviceSlug = useMemo(
    () =>
      getElectricalServiceSlug(items),
    [items]
  );

  /*
   * -------------------------------------------------------
   * PREFILL LOGGED-IN USER
   * -------------------------------------------------------
   */

  useEffect(() => {
    if (!user) return;

    setDetails((current) => ({
      ...current,

      name:
        current.name ||
        user.fullName ||
        '',

      phone:
        current.phone ||
        user.phone ||
        '',

      email:
        current.email ||
        user.email ||
        '',
    }));
  }, [user]);

  /*
   * -------------------------------------------------------
   * STEP CHANGE
   * -------------------------------------------------------
   */

  useEffect(() => {
    onStepChange?.();
  }, [stage, receipt]);

  /*
   * -------------------------------------------------------
   * INPUT HANDLER
   * -------------------------------------------------------
   */

  const setDetail =
    (key) =>
    (event) => {
      const value =
        event.target.value;

      setDetails((current) => ({
        ...current,
        [key]: value,
      }));

      setErrors((current) => ({
        ...current,
        [key]: undefined,
      }));

      setError('');
    };

  /*
   * -------------------------------------------------------
   * LOCATION
   * -------------------------------------------------------
   */

  const handleLocationSelect = (
    selectedLocation
  ) => {
    if (!selectedLocation) {
      return;
    }

    setLocationData(
      selectedLocation
    );

    setDetails((current) => ({
      ...current,

      address:
        selectedLocation.address ||
        current.address,
    }));

    setErrors((current) => ({
      ...current,
      address: undefined,
    }));

    setLocationPickerOpen(false);
  };

  /*
   * -------------------------------------------------------
   * VALIDATE DETAILS
   * -------------------------------------------------------
   */

  const validateDetails = () => {
    const next = {};

    if (!details.name.trim()) {
      next.name =
        'Enter your name';
    }

    if (!details.phone.trim()) {
      next.phone =
        'Enter your mobile number';
    } else if (
      !isValidPhone(details.phone)
    ) {
      next.phone =
        'Enter a valid 10-digit mobile number';
    }

    if (
      details.whatsapp.trim() &&
      !isValidPhone(
        details.whatsapp
      )
    ) {
      next.whatsapp =
        'Enter a valid WhatsApp number';
    }

    if (
      details.email.trim() &&
      !/^\S+@\S+\.\S+$/.test(
        details.email.trim()
      )
    ) {
      next.email =
        'Enter a valid email address';
    }

    if (
      !details.address.trim() &&
      !locationData?.address
    ) {
      next.address =
        'Please select your project location';
    }

    if (
      !details.buildingName.trim()
    ) {
      next.buildingName =
        'Enter building name';
    }

    if (!details.city.trim()) {
      next.city =
        'Enter your city';
    }

    if (!details.pincode.trim()) {
      next.pincode =
        'Enter your pincode';
    } else if (
      !/^[1-9][0-9]{5}$/.test(
        details.pincode.trim()
      )
    ) {
      next.pincode =
        'Enter a valid 6-digit pincode';
    }

    setErrors(next);

    return (
      Object.keys(next).length === 0
    );
  };

  /*
   * -------------------------------------------------------
   * FULL ADDRESS
   * -------------------------------------------------------
   */

  const fullAddress = useMemo(() => {
    return [
      details.buildingName.trim(),

      details.roomNo.trim()
        ? `Room ${details.roomNo.trim()}`
        : '',

      details.floorNo.trim()
        ? `Floor ${details.floorNo.trim()}`
        : '',

      locationData?.address ||
        details.address.trim(),
    ]
      .filter(Boolean)
      .join(', ');
  }, [
    details,
    locationData,
  ]);

  /*
   * -------------------------------------------------------
   * CONTINUE
   * -------------------------------------------------------
   */

  const handleContinue = () => {
    setError('');

    if (stage === DETAILS) {
      if (!validateDetails()) {
        return;
      }

      setStage(SCHEDULE);

      return;
    }

    if (stage === SCHEDULE) {
      if (!date || !time) {
        setErrors((current) => ({
          ...current,
          slot:
            'Pick a date and a time',
        }));

        return;
      }

      setStage(CONFIRM);

      return;
    }
  };

  /*
   * -------------------------------------------------------
   * BACK
   * -------------------------------------------------------
   */

  const handleBack = () => {
    setErrors({});
    setError('');

    if (stage === DETAILS) {
      onBackToCart?.();
      return;
    }

    setStage((current) =>
      Math.max(
        current - 1,
        DETAILS
      )
    );
  };

  /*
   * -------------------------------------------------------
   * SUBMIT BOOKING
   * -------------------------------------------------------
   */

  const submitBooking = async (
    event
  ) => {
    event?.preventDefault();

    setError('');

    if (!validateDetails()) {
      setStage(DETAILS);
      return;
    }

    if (!date || !time) {
      setErrors((current) => ({
        ...current,
        slot:
          'Pick a date and a time',
      }));

      setStage(SCHEDULE);
      return;
    }

    if (busy) {
      return;
    }

    setBusy(true);

    try {
      /*
       * Convert electrical cart
       * items into booking answers.
       */
      const answers = items.map(
        (item) => ({
          key: `cart-${item.itemSlug}`,

          value: String(
            item.quantity
          ),

          label:
            `${item.name} × ${item.quantity}`,
        })
      );

      /*
       * Add customer notes as one
       * additional answer.
       */
      if (details.notes.trim()) {
        answers.push({
          key: 'notes',
          value:
            details.notes
              .trim()
              .slice(0, 400),
          label:
            'Specific requirements',
        });
      }

      const result =
        await api.createBooking({
          serviceSlug,

          answers,

          preferredDate: date,

          preferredTime: time,

          name:
            details.name.trim(),

          phone:
            details.phone,

          whatsapp:
            details.whatsapp.trim() ||
            null,

          email:
            details.email.trim() ||
            null,

          address:
            fullAddress,

          city:
            details.city.trim(),

          pincode:
            details.pincode.trim() ||
            null,
        });

      /*
       * Store receipt first.
       */
      setReceipt(result);

      /*
       * Clear ONLY electrical cart.
       *
       * Plumbing remains untouched.
       */
      clear();

      /*
       * Show confirmation.
       */
      setStage(CONFIRM);

    } catch (err) {
      if (
        err?.fieldErrors
      ) {
        setErrors(
          err.fieldErrors
        );
      }

      setError(
        friendlyError(err)
      );
    } finally {
      setBusy(false);
    }
  };

  /*
   * -------------------------------------------------------
   * EMPTY CART
   * -------------------------------------------------------
   */

  if (
    count === 0 &&
    !receipt
  ) {
    return (
      <section className="ibc-booking-modal">
        <div className="ibc-form-panel">
          <h3>
            Your electrical cart is empty
          </h3>

          <p>
            Add an electrical service
            before continuing.
          </p>

          <button
            type="button"
            className="btn btn-primary ibc-form-submit"
            onClick={
              onBackToCart
            }
          >
            Back to Electrical Services
          </button>
        </div>
      </section>
    );
  }

  /*
   * -------------------------------------------------------
   * CONFIRMATION SCREEN
   * -------------------------------------------------------
   */

  if (receipt) {
    return (
      <section className="ibc-booking-modal">
        <div className="ibc-form-panel">

          <div className="ibc-confirm-panel">

            <span className="ibc-confirm-icon">
              <Icon
                name="check"
                size={30}
              />
            </span>

            <h2>
              Booking Confirmed!
            </h2>

            <p>
              Our expert will visit your home.
            </p>

            <div className="ibc-confirm-details">

              <div>
                <span>
                  Booking ID
                </span>

                <strong>
                  {
                    receipt.bookingNumber ||
                    receipt.bookingId ||
                    '—'
                  }
                </strong>
              </div>

              <div>
                <span>
                  Date
                </span>

                <strong>
                  {formatBookingDate(
                    receipt.date ||
                    date
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Time Slot
                </span>

                <strong>
                  {formatBookingTime(
                    receipt.time ||
                    time
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Address
                </span>

                <strong>
                  {fullAddress}
                </strong>
              </div>

              <div>
                <span>
                  Service Total
                </span>

                <strong>
                  {formatRupees(
                    subtotalPaise /
                      100
                  )}
                </strong>
              </div>

            </div>

            <div className="ibc-confirm-note">

              <Icon
                name="helmet"
                size={26}
              />

              <p>
                Our electrician will
                visit your location,
                inspect the work and
                provide the required
                service.
              </p>

            </div>

            <Link
              to="/dashboard"
              className="btn btn-dark ibc-form-submit"
            >
              View Booking
            </Link>

          </div>

        </div>
      </section>
    );
  }

  /*
   * -------------------------------------------------------
   * MAIN CHECKOUT
   * -------------------------------------------------------
   */

  return (
    <section className="ibc-booking-modal">

      {/* ==============================================
          STEP INDICATOR
         ============================================== */}

      <ol className="ibc-steps">

        <li
          className={`ibc-step ${
            stage === DETAILS
              ? 'current'
              : ''
          } ${
            stage > DETAILS
              ? 'done'
              : ''
          }`}
        >
          <span className="ibc-step-num">
            {stage > DETAILS ? (
              <Icon
                name="check"
                size={14}
              />
            ) : (
              '1'
            )}
          </span>

          <span>
            Details
          </span>
        </li>

        <li
          className={`ibc-step ${
            stage === SCHEDULE
              ? 'current'
              : ''
          } ${
            stage > SCHEDULE
              ? 'done'
              : ''
          }`}
        >
          <span className="ibc-step-num">
            {stage > SCHEDULE ? (
              <Icon
                name="check"
                size={14}
              />
            ) : (
              '2'
            )}
          </span>

          <span>
            Schedule
          </span>
        </li>

        <li
          className={`ibc-step ${
            stage === CONFIRM
              ? 'current'
              : ''
          }`}
        >
          <span className="ibc-step-num">
            3
          </span>

          <span>
            Confirm
          </span>
        </li>

      </ol>

      {/* ==============================================
          ELECTRICAL CART SUMMARY
         ============================================== */}

      {stage < CONFIRM && (
        <div className="ibc-selected-service electrical-selected-service">

          <div className="electrical-selected-icon">
            <Icon
              name="zap"
              size={24}
            />
          </div>

          <div>

            <span className="ibc-selected-label">
              Selected Services
            </span>

            <strong>
              {items.length === 1
                ? items[0].name
                : `${items.length} electrical services`}
            </strong>

            <span className="ibc-selected-price">
              {formatRupees(
                subtotalPaise /
                  100
              )}
            </span>

          </div>

          <button
            type="button"
            className="ibc-selected-change"
            onClick={
              onBackToCart
            }
          >
            Change
          </button>

        </div>
      )}

      {/* ==============================================
          DETAILS
         ============================================== */}

      {stage === DETAILS && (
        <div className="ibc-form-panel">

          <h3>
            YOUR DETAILS
          </h3>

          <div className="form-grid">

            {/* NAME */}

            <div
              className={`field ${
                errors.name
                  ? 'error'
                  : ''
              }`}
            >
              <label>
                FULL NAME
                <span className="req">
                  *
                </span>
              </label>

              <input
                type="text"
                placeholder="Your name"
                value={
                  details.name
                }
                onChange={setDetail(
                  'name'
                )}
              />

              {errors.name && (
                <span className="field-error">
                  {errors.name}
                </span>
              )}
            </div>

            {/* PHONE */}

            <div
              className={`field ${
                errors.phone
                  ? 'error'
                  : ''
              }`}
            >
              <label>
                PHONE NUMBER
                <span className="req">
                  *
                </span>
              </label>

              <input
                type="tel"
                inputMode="numeric"
                placeholder="+91"
                value={
                  details.phone
                }
                onChange={setDetail(
                  'phone'
                )}
              />

              {errors.phone && (
                <span className="field-error">
                  {errors.phone}
                </span>
              )}
            </div>

            {/* WHATSAPP */}

            <div
              className={`field ${
                errors.whatsapp
                  ? 'error'
                  : ''
              }`}
            >
              <label>
                WHATSAPP NUMBER
                <span className="optional">
                  {' '}
                  (OPTIONAL)
                </span>
              </label>

              <input
                type="tel"
                inputMode="numeric"
                placeholder="Enter WhatsApp number"
                value={
                  details.whatsapp
                }
                onChange={setDetail(
                  'whatsapp'
                )}
              />

              {errors.whatsapp && (
                <span className="field-error">
                  {errors.whatsapp}
                </span>
              )}
            </div>

            {/* EMAIL */}

            <div
              className={`field ${
                errors.email
                  ? 'error'
                  : ''
              }`}
            >
              <label>
                EMAIL ADDRESS
                <span className="optional">
                  {' '}
                  (OPTIONAL)
                </span>
              </label>

              <input
                type="email"
                placeholder="Enter email address"
                value={
                  details.email
                }
                onChange={setDetail(
                  'email'
                )}
              />

              {errors.email && (
                <span className="field-error">
                  {errors.email}
                </span>
              )}
            </div>

          </div>

          {/* =========================================
              PROJECT ADDRESS
             ========================================= */}

          <div
            className="field booking-address-field"
            style={{
              marginTop: 16,
            }}
          >

            <div className="booking-address-label-row">

              <label>
                PROJECT ADDRESS
                <span className="req">
                  *
                </span>
              </label>

              <button
                type="button"
                className="booking-use-location"
                onClick={() =>
                  setLocationPickerOpen(
                    true
                  )
                }
              >
                <Icon
                  name="map-pin"
                  size={14}
                />

                {locationData?.address
                  ? 'Change location'
                  : 'Use current location'}
              </button>

            </div>

            {locationData?.address ? (

              <div className="booking-selected-location">

                <Icon
                  name="map-pin"
                  size={15}
                />

                <div>

                  <span className="booking-location-label">
                    SELECTED LOCATION
                  </span>

                  <span className="booking-location-address">
                    {
                      locationData.address
                    }
                  </span>

                </div>

              </div>

            ) : (

              <div className="booking-selected-location">

                <Icon
                  name="map-pin"
                  size={15}
                />

                <div>

                  <span className="booking-location-label">
                    SELECTED LOCATION
                  </span>

                  <span className="booking-location-address">
                    Select your project
                    location
                  </span>

                </div>

              </div>

            )}

            {errors.address && (
              <span className="field-error">
                {errors.address}
              </span>
            )}

            {/* BUILDING */}

            <div className="booking-address-inputs">

              <div className="booking-building-field">

                <label htmlFor="electrical-building">
                  BUILDING NAME
                  <span className="req">
                    *
                  </span>
                </label>

                <input
                  id="electrical-building"
                  type="text"
                  placeholder="Enter building name"
                  value={
                    details.buildingName
                  }
                  onChange={setDetail(
                    'buildingName'
                  )}
                />

                {errors.buildingName && (
                  <span className="field-error">
                    {
                      errors.buildingName
                    }
                  </span>
                )}

              </div>

              <div className="booking-small-fields">

                <div>

                  <label htmlFor="electrical-room">
                    ROOM NO.
                  </label>

                  <input
                    id="electrical-room"
                    type="text"
                    placeholder="Room no."
                    value={
                      details.roomNo
                    }
                    onChange={setDetail(
                      'roomNo'
                    )}
                  />

                </div>

                <div>

                  <label htmlFor="electrical-floor">
                    FLOOR
                  </label>

                  <input
                    id="electrical-floor"
                    type="text"
                    placeholder="Floor"
                    value={
                      details.floorNo
                    }
                    onChange={setDetail(
                      'floorNo'
                    )}
                  />

                </div>

              </div>

            </div>

          </div>

          {/* CITY + PINCODE */}

          <div className="form-grid">

            <div
              className={`field ${
                errors.city
                  ? 'error'
                  : ''
              }`}
            >
              <label>
                CITY
                <span className="req">
                  *
                </span>
              </label>

              <input
                type="text"
                placeholder="Mumbai"
                value={
                  details.city
                }
                onChange={setDetail(
                  'city'
                )}
              />

              {errors.city && (
                <span className="field-error">
                  {errors.city}
                </span>
              )}
            </div>

            <div
              className={`field ${
                errors.pincode
                  ? 'error'
                  : ''
              }`}
            >
              <label>
                PINCODE
                <span className="req">
                  *
                </span>
              </label>

              <input
                type="text"
                inputMode="numeric"
                placeholder="400001"
                value={
                  details.pincode
                }
                onChange={setDetail(
                  'pincode'
                )}
              />

              {errors.pincode && (
                <span className="field-error">
                  {errors.pincode}
                </span>
              )}
            </div>

          </div>

          {/* NOTES */}

          <div className="field">

            <label>
              ANY SPECIFIC REQUIREMENTS?
              <span className="optional">
                {' '}
                (OPTIONAL)
              </span>
            </label>

            <textarea
              rows={4}
              placeholder="Tell us anything specific about the work..."
              value={
                details.notes
              }
              onChange={setDetail(
                'notes'
              )}
            />

          </div>

          {/* CONTINUE */}

          <button
            type="button"
            className="btn btn-primary ibc-form-submit"
            onClick={
              handleContinue
            }
          >
            CONTINUE
            <Icon
              name="arrow-right"
              size={17}
            />
          </button>

        </div>
      )}

      {/* ==============================================
          DATE & TIME
         ============================================== */}

      {stage === SCHEDULE && (
        <div className="ibc-form-panel">

          <SlotPicker
            serviceSlug={
              serviceSlug
            }
            date={date}
            time={time}
            onPick={(d, t) => {
              setDate(d);
              setTime(t);

              setErrors(
                (current) => ({
                  ...current,
                  slot: undefined,
                })
              );
            }}
            error={
              errors.slot
            }
          />

          {error && (
            <div
              role="alert"
              className="alert alert-error"
              style={{
                marginTop: 16,
              }}
            >
              <Icon
                name="info"
                size={18}
              />

              <span>
                {error}
              </span>
            </div>
          )}

          <div className="electrical-schedule-actions">

            <button
              type="button"
              className="btn btn-secondary"
              onClick={
                handleBack
              }
            >
              BACK
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={
                handleContinue
              }
            >
              CONTINUE
              <Icon
                name="arrow-right"
                size={17}
              />
            </button>

          </div>

        </div>
      )}

      {/* ==============================================
          CONFIRM
         ============================================== */}

      {stage === CONFIRM && (
        <div className="ibc-form-panel">

          <h3>
            CONFIRM YOUR BOOKING
          </h3>

          <p className="field-hint">
            Please check your details
            before confirming.
          </p>

          {/* SERVICES */}

          <div className="electrical-review-card">

            <div className="electrical-review-heading">
              SERVICES
            </div>

            {items.map(
              (item) => (
                <div
                  key={
                    item.itemSlug
                  }
                  className="electrical-review-row"
                >

                  <div>

                    <strong>
                      {item.name}
                    </strong>

                    <span>
                      ×{' '}
                      {
                        item.quantity
                      }
                    </span>

                  </div>

                  <strong>
                    {formatRupees(
                      (
                        item.unitPricePaise *
                        item.quantity
                      ) / 100
                    )}
                  </strong>

                </div>
              )
            )}

            <div className="electrical-review-total">

              <span>
                TOTAL
              </span>

              <strong>
                {formatRupees(
                  subtotalPaise /
                    100
                )}
              </strong>

            </div>

          </div>

          {/* APPOINTMENT */}

          <div className="electrical-review-card">

            <div className="electrical-review-heading">
              APPOINTMENT
            </div>

            <div className="electrical-review-row">

              <span>
                Date
              </span>

              <strong>
                {formatBookingDate(
                  date
                )}
              </strong>

            </div>

            <div className="electrical-review-row">

              <span>
                Time Slot
              </span>

              <strong>
                {formatBookingTime(
                  time
                )}
              </strong>

            </div>

          </div>

          {/* CUSTOMER */}

          <div className="electrical-review-card">

            <div className="electrical-review-heading">
              CUSTOMER DETAILS
            </div>

            <div className="electrical-review-row">

              <span>
                Name
              </span>

              <strong>
                {details.name}
              </strong>

            </div>

            <div className="electrical-review-row">

              <span>
                Phone
              </span>

              <strong>
                {details.phone}
              </strong>

            </div>

            <div className="electrical-review-row">

              <span>
                Address
              </span>

              <strong>
                {fullAddress}
                {details.city
                  ? `, ${details.city}`
                  : ''}
              </strong>

            </div>

          </div>

          {error && (
            <div
              role="alert"
              className="alert alert-error"
              style={{
                marginTop: 16,
              }}
            >
              <Icon
                name="info"
                size={18}
              />

              <span>
                {error}
              </span>
            </div>
          )}

          <div className="electrical-schedule-actions">

            <button
              type="button"
              className="btn btn-secondary"
              onClick={
                handleBack
              }
              disabled={busy}
            >
              BACK
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={
                submitBooking
              }
              disabled={busy}
            >
              {busy
                ? 'BOOKING…'
                : 'CONFIRM BOOKING'}

              <Icon
                name="arrow-right"
                size={17}
              />
            </button>

          </div>

          <p className="ibc-secure-note">
            <Icon
              name="lock"
              size={14}
            />
            Your booking details are
            securely submitted to
            SupplyBase.
          </p>

        </div>
      )}

      {/* ==============================================
          GOOGLE LOCATION PICKER
         ============================================== */}

      <GoogleLocationPicker
        open={
          locationPickerOpen
        }
        onClose={() =>
          setLocationPickerOpen(
            false
          )
        }
        onSelect={
          handleLocationSelect
        }
      />

    </section>
  );
}
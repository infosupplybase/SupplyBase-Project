import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import SlotPicker from '../components/booking/SlotPicker';
import GoogleLocationPicker from '../components/layout/GoogleLocationPicker';

import api, { friendlyError } from '../lib/api';
import { useLocationContext } from '../context/LocationContext';
import {
  getSpaceBySlug,
  getDesignBySlug,
  HOME_VISIT_FEE,
} from '../data/interiorCatalog';
import { formatVisitDate, formatVisitTime } from '../lib/visitTime';
import { useFormBack, useHistoryState } from '../hooks/useHistoryState';

const STEPS = ['Details', 'Schedule', 'Confirm'];

const CATEGORY_SLUG = 'interior-by-choice';

/**
 * Ten digits once the +91, spaces and brackets are stripped.
 */
const isValidPhone = (value) =>
  /^[6-9]\d{9}$/.test(
    String(value || '')
      .replace(/\D/g, '')
      .replace(/^91/, '')
      .replace(/^0/, '')
  );

/**
 * /interior-by-choice/book
 * /interior-by-choice/:spaceSlug/:designSlug/book
 *
 * Paid home-visit booking flow:
 * Details -> Schedule -> Confirm
 */
export default function InteriorBooking({
  modal = false,
  spaceSlug: propSpaceSlug,
  designSlug: propDesignSlug,
  onBack,
  onStepChange,
}) {
  const params = useParams();

  const spaceSlug = propSpaceSlug || params.spaceSlug;
  const designSlug = propDesignSlug || params.designSlug;

  const { location, locationData } = useLocationContext();

  const [locationPickerOpen, setLocationPickerOpen] = useState(false);

  const space = spaceSlug ? getSpaceBySlug(spaceSlug) : null;

  const design =
    spaceSlug && designSlug
      ? getDesignBySlug(spaceSlug, designSlug)
      : null;

  // -------------------------------------------------------------
  // History-backed form state
  // -------------------------------------------------------------

  const scope = `f:ibc:${spaceSlug}:${designSlug}`;

  const formBack = useFormBack();

  const [step, setStep] = useHistoryState(
    `${scope}:step`,
    0,
    { push: true }
  );

  const [form, setForm] = useHistoryState(`${scope}:form`, {
    name: '',
    phone: '',
    address: '',
    buildingName: '',
    roomNo: '',
    floorNo: '',
    city: '',
    pincode: '',
    notes: '',
  });

  const [date, setDate] = useHistoryState(
    `${scope}:date`,
    ''
  );

  const [time, setTime] = useHistoryState(
    `${scope}:time`,
    ''
  );

  const [errors, setErrors] = useState({});

  const [error, setError] = useState('');

  const [busy, setBusy] = useState(false);

  const [receipt, setReceipt] = useHistoryState(
    `${scope}:receipt`,
    null
  );

  // -------------------------------------------------------------
  // Build the final address automatically
  //
  // Example:
  // ABC Heights, Room 402, Floor 4, Kalyan, Maharashtra, India
  // -------------------------------------------------------------

  useEffect(() => {
    const locationAddress = locationData?.address || '';

    const addressParts = [
      form.buildingName?.trim(),

      form.roomNo?.trim()
        ? `Room ${form.roomNo.trim()}`
        : '',

      form.floorNo?.trim()
        ? `Floor ${form.floorNo.trim()}`
        : '',

      locationAddress,
    ].filter(Boolean);

    const finalAddress = addressParts.join(', ');

    setForm((current) => {
      if (current.address === finalAddress) {
        return current;
      }

      return {
        ...current,
        address: finalAddress,
      };
    });
  }, [
    locationData?.address,
    form.buildingName,
    form.roomNo,
    form.floorNo,
    setForm,
  ]);

  // -------------------------------------------------------------
  // Modal step callback
  // -------------------------------------------------------------

  useEffect(() => {
    if (modal && onStepChange) {
      onStepChange();
    }
  }, [
    step,
    receipt,
    modal,
    onStepChange,
  ]);

  // -------------------------------------------------------------
  // Generic field setter
  // -------------------------------------------------------------

  const setField = (key) => (e) =>
    setForm((current) => ({
      ...current,
      [key]: e.target.value,
    }));

  // -------------------------------------------------------------
  // Validate customer details
  // -------------------------------------------------------------

  const validateDetails = () => {
    const next = {};

    if (!form.name.trim()) {
      next.name = 'Enter your name';
    }

    if (!isValidPhone(form.phone)) {
      next.phone = 'Enter a valid 10-digit mobile number';
    }

    if (!form.buildingName?.trim()) {
      next.buildingName = 'Enter your building name';
    }

    if (!locationData?.address) {
      next.address = 'Please select your project location';
    }

    if (!form.city?.trim()) {
      next.city = 'Enter your city';
    }

    if (
      form.pincode?.trim() &&
      !/^[1-9][0-9]{5}$/.test(form.pincode.trim())
    ) {
      next.pincode = 'Enter a valid 6-digit pincode';
    }

    setErrors(next);

    return Object.keys(next).length === 0;
  };

  // -------------------------------------------------------------
  // Go to schedule
  // -------------------------------------------------------------

  const goToSchedule = () => {
    if (validateDetails()) {
      setStep(1);
    }
  };

  // -------------------------------------------------------------
  // Submit booking
  // -------------------------------------------------------------

  const submit = async () => {
    if (!date || !time) {
      setErrors((current) => ({
        ...current,
        slot: 'Pick a date and a time',
      }));

      return;
    }

    const selectedLabel = design
      ? `${space.name} – ${design.name}`
      : space
        ? space.name
        : 'Not selected from the catalogue';

    const notesParts = [
      `Selected design: ${selectedLabel}.`,
    ];

    if (form.notes.trim()) {
      notesParts.push(form.notes.trim());
    }

    setBusy(true);
    setError('');

    try {
      const result = await api.createBooking({
        serviceSlug: CATEGORY_SLUG,

        answers: [
          {
            key: 'notes',
            value: notesParts
              .join(' ')
              .slice(0, 400),
            label: 'Selected design and requirements',
          },
        ],

        preferredDate: date,
        preferredTime: time,

        name: form.name.trim(),

        phone: form.phone,

        // Final combined address
        address: form.address.trim(),

        // City entered by customer
        city: form.city.trim() || location,

        // Keep pincode available if backend later supports it
        ...(form.pincode?.trim()
          ? { pincode: form.pincode.trim() }
          : {}),
      });

      setReceipt(result);

      setStep(2, {
        push: false,
      });

      if (modal) {
        onStepChange?.();
      } else {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }
    } catch (err) {
      if (err && err.fieldErrors) {
        setErrors(err.fieldErrors);
      }

      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  // -------------------------------------------------------------
  // UI
  // -------------------------------------------------------------

  return (
    <>
      {!modal && (
        <PageHero
          eyebrow="INTERIOR BY CHOICE"
          title="Book a Home Visit"
          breadcrumbs={[
            {
              label: 'Interior by Choice',
              to: '/interior-by-choice',
            },
            {
              label: 'Book a Home Visit',
            },
          ]}
        />
      )}

      <section
        className={
          modal
            ? 'ibc-booking-modal w-full'
            : 'ibc-section'
        }
      >
        <div
          className={
            modal
              ? 'w-full max-sm:mx-auto max-sm:max-w-[360px]'
              : 'container container-narrow'
          }
        >
          {/* -----------------------------------------------------
              STEPS
          ----------------------------------------------------- */}

          {step < 2 && (
            <ol className="ibc-steps">
              {STEPS.map((label, i) => (
                <li
                  key={label}
                  className={`ibc-step ${
                    i === step ? 'current' : ''
                  } ${
                    i < step ? 'done' : ''
                  }`}
                >
                  <span className="ibc-step-num">
                    {i < step ? (
                      <Icon
                        name="check"
                        size={14}
                      />
                    ) : (
                      i + 1
                    )}
                  </span>

                  <span>{label}</span>
                </li>
              ))}
            </ol>
          )}

          {/* -----------------------------------------------------
              SELECTED SERVICE
          ----------------------------------------------------- */}

          {(space || design) && step < 2 && (
            <div className="ibc-selected-service">
              <img
                src={(design || space).image}
                alt={(design || space).name}
              />

              <div>
                <span className="ibc-selected-label">
                  Selected Service
                </span>

                <strong>
                  {design
                    ? `${space.name} – ${design.name}`
                    : space.name}
                </strong>

                {design && (
                  <span className="ibc-selected-price">
                    ₹{HOME_VISIT_FEE} (Visit Charge)
                  </span>
                )}
              </div>

              {modal ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="ibc-selected-change"
                >
                  Change
                </button>
              ) : (
                <Link
                  to={`/interior-by-choice${
                    spaceSlug
                      ? `/${spaceSlug}`
                      : ''
                  }`}
                >
                  Change
                </Link>
              )}
            </div>
          )}

          {/* =====================================================
              STEP 1 — CUSTOMER DETAILS
          ===================================================== */}

          {step === 0 && (
            <div className="ibc-form-panel">
              <h3>Your Details</h3>

              {/* FULL NAME */}

              <div
                className={`field ${
                  errors.name ? 'error' : ''
                }`}
              >
                <label>
                  Full Name{' '}
                  <span className="req">*</span>
                </label>

                <input
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={setField('name')}
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
                  errors.phone ? 'error' : ''
                }`}
              >
                <label>
                  Phone Number{' '}
                  <span className="req">*</span>
                </label>

                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="+91"
                  value={form.phone}
                  onChange={setField('phone')}
                />

                {errors.phone && (
                  <span className="field-error">
                    {errors.phone}
                  </span>
                )}
              </div>

              {/* =================================================
                  PROJECT ADDRESS
              ================================================= */}

              <div
                className="field booking-address-field"
                style={{ marginTop: 16 }}
              >
                <div className="booking-address-label-row">
                  <label>
                    Project Address{' '}
                    <span className="req">*</span>
                  </label>

                  <button
                    type="button"
                    className="booking-use-location"
                    onClick={() =>
                      setLocationPickerOpen(true)
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

                {/* GOOGLE SELECTED LOCATION */}

                {locationData?.address && (
                  <div className="booking-selected-location">
                    <Icon
                      name="map-pin"
                      size={15}
                    />

                    <div>
                      <span className="booking-location-label">
                        Selected location
                      </span>

                      <span className="booking-location-address">
                        {locationData.address}
                      </span>
                    </div>
                  </div>
                )}

                {/* BUILDING / ROOM / FLOOR */}

                <div className="booking-address-inputs">
                  {/* BUILDING NAME */}

                  <div className="booking-building-field">
                    <label htmlFor="ibc-building">
                      Building Name{' '}
                      <span className="req">*</span>
                    </label>

                    <input
                      id="ibc-building"
                      type="text"
                      value={
                        form.buildingName || ''
                      }
                      onChange={setField(
                        'buildingName'
                      )}
                      placeholder="Enter building name"
                    />

                    {errors.buildingName && (
                      <span className="field-error">
                        {errors.buildingName}
                      </span>
                    )}
                  </div>

                  {/* ROOM + FLOOR */}

                  <div className="booking-small-fields">
                    <div>
                      <label htmlFor="ibc-room">
                        Room No.
                      </label>

                      <input
                        id="ibc-room"
                        type="text"
                        value={
                          form.roomNo || ''
                        }
                        onChange={setField(
                          'roomNo'
                        )}
                        placeholder="Room no."
                      />
                    </div>

                    <div>
                      <label htmlFor="ibc-floor">
                        Floor
                      </label>

                      <input
                        id="ibc-floor"
                        type="text"
                        value={
                          form.floorNo || ''
                        }
                        onChange={setField(
                          'floorNo'
                        )}
                        placeholder="Floor"
                      />
                    </div>
                  </div>
                </div>

                {/* LOCATION ERROR */}

                {errors.address && (
                  <span className="field-error">
                    {errors.address}
                  </span>
                )}
              </div>

              {/* =================================================
                  GOOGLE LOCATION PICKER
              ================================================= */}

              <GoogleLocationPicker
                open={locationPickerOpen}
                onClose={() =>
                  setLocationPickerOpen(false)
                }
                onSelect={() =>
                  setLocationPickerOpen(false)
                }
              />

              {/* =================================================
                  CITY + PINCODE
              ================================================= */}

              <div
                className="form-grid"
                style={{ marginTop: 16 }}
              >
                {/* CITY */}

                <div
                  className={`field ${
                    errors.city ? 'error' : ''
                  }`}
                >
                  <label htmlFor="ibc-city">
                    City{' '}
                    <span className="req">*</span>
                  </label>

                  <input
                    id="ibc-city"
                    type="text"
                    value={form.city || ''}
                    onChange={setField('city')}
                    placeholder="Mumbai"
                  />

                  {errors.city && (
                    <span className="field-error">
                      {errors.city}
                    </span>
                  )}
                </div>

                {/* PINCODE */}

                <div
                  className={`field ${
                    errors.pincode ? 'error' : ''
                  }`}
                >
                  <label htmlFor="ibc-pincode">
                    Pincode
                  </label>

                  <input
                    id="ibc-pincode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={
                      form.pincode || ''
                    }
                    onChange={setField(
                      'pincode'
                    )}
                    placeholder="400001"
                  />

                  {errors.pincode && (
                    <span className="field-error">
                      {errors.pincode}
                    </span>
                  )}
                </div>
              </div>

              {/* =================================================
                  REQUIREMENTS
              ================================================= */}

              <div className="field">
                <label>
                  Any specific requirements?
                  {' '}
                  (Optional)
                </label>

                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={setField('notes')}
                />
              </div>

              {/* CONTINUE */}

              <button
                type="button"
                className="btn btn-primary ibc-form-submit"
                onClick={goToSchedule}
              >
                Continue
              </button>
            </div>
          )}

          {/* =====================================================
              STEP 2 — SCHEDULE
          ===================================================== */}

          {step === 1 && (
            <div className="ibc-form-panel">
              <SlotPicker
                serviceSlug={CATEGORY_SLUG}
                date={date}
                time={time}
                onPick={(d, t) => {
                  setDate(d);
                  setTime(t);

                  setErrors((current) => ({
                    ...current,
                    slot: undefined,
                  }));
                }}
                error={errors.slot}
              />

              {error && (
                <div
                  role="alert"
                  className="alert alert-error"
                  style={{ marginTop: 16 }}
                >
                  <Icon
                    name="info"
                    size={18}
                  />

                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                className="btn btn-primary ibc-form-submit"
                onClick={submit}
                disabled={busy}
              >
                {busy
                  ? 'Booking…'
                  : `Confirm Booking · ₹${HOME_VISIT_FEE}`}
              </button>

              <p className="ibc-secure-note">
                <Icon
                  name="lock"
                  size={14}
                />

                No advance payment — pay the visit fee
                to our team on the day
              </p>
            </div>
          )}

          {/* =====================================================
              STEP 3 — CONFIRMATION
          ===================================================== */}

          {step === 2 && receipt && (
            <div className="ibc-confirm-panel pb-6">
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
                {/* BOOKING ID */}

                <div>
                  <span>
                    Booking ID
                  </span>

                  <strong>
                    {receipt.bookingNumber}
                  </strong>
                </div>

                {/* DATE */}

                <div>
                  <span>
                    Date
                  </span>

                  <strong>
                    {formatVisitDate(
                      receipt.date
                    )}
                  </strong>
                </div>

                {/* TIME */}

                <div>
                  <span>
                    Time Slot
                  </span>

                  <strong>
                    {formatVisitTime(
                      receipt.time
                    )}
                  </strong>
                </div>

                {/* ADDRESS */}

                <div>
                  <span>
                    Address
                  </span>

                  <strong>
                    {form.address}
                  </strong>
                </div>

                {/* VISIT FEE */}

                <div>
                  <span>
                    Visit Fee
                  </span>

                  <strong>
                    {receipt.visitFeeDisplay}
                    {' '}
                    (Visit Charge)
                  </strong>
                </div>
              </div>

              {/* CONFIRMATION NOTE */}

              <div className="ibc-confirm-note">
                <Icon
                  name="helmet"
                  size={26}
                />

                <p>
                  Our expert will measure your space,
                  understand your choice, suggest designs
                  and give you a final quotation.
                  {' '}
                  <strong>
                    {receipt.visitFeeDisplay}
                    {' '}
                    will be adjusted in your final
                    project cost!
                  </strong>
                </p>
              </div>

              {/* VIEW BOOKING */}

              <Link
                to="/dashboard"
                className="btn btn-dark ibc-form-submit"
              >
                View Booking
              </Link>

              {/* HOME */}

              <Link
                to="/"
                className="btn btn-ghost ibc-form-submit mb-2"
              >
                Back to Home
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
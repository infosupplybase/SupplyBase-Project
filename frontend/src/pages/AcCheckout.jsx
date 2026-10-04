import Icon from '../components/ui/Icon';
import AcEstimateSummary from '../components/ac/AcEstimateSummary';
import { useEffect, useRef, useState } from 'react';
import CustomerDetailsFields from '../components/booking/CustomerDetailsFields';
import SlotPicker from '../components/booking/SlotPicker';
import ModalFoot from '../components/services/ModalFoot';
import { useEnsureLogin } from '../components/auth/LoginGate';
import { useAuth } from '../context/AuthContext';
import { usePickedLocation } from '../context/LocationContext';
import { useHistoryState } from '../hooks/useHistoryState';
import {
  composeAddress,
  emptyDetails,
  validateDetails,
} from '../lib/bookingDetails';
import { uploadBookingPhotos } from '../lib/bookingPhotos';
import api, { friendlyError } from '../lib/api';
import { formatVisit } from '../lib/visitTime';
import {
  acCategories,
  acTypes,
  acCapacities,
  acRefrigerants,
  acServicesByCategory,
  acAddonsByCategory,
} from '../data/acContent';
import PayBookingButton from '../components/payment/PayBookingButton';

function labelFor(options, value) {
  return options.find((option) => option.value === value)?.label || value;
}

function bookingAnswers(selection) {
  const category = selection.category;
  const rows = [];

  function add(key, value, label) {
    if (value !== undefined && value !== null && value !== '') {
      rows.push({
        key,
        value: String(value),
        label: String(label ?? value),
      });
    }
  }

  add('ac_category', category, labelFor(acCategories.map((item) => ({
    value: item.slug,
    label: item.label,
  })), category));

  add(
    'ac_service',
    selection.service,
    labelFor(acServicesByCategory[category] || [], selection.service)
  );

  add('ac_type', selection.acType, labelFor(acTypes, selection.acType));
  add('ac_units', selection.units, `${selection.units} AC unit(s)`);

  if (category === 'installation') {
    add(
      'ac_capacity',
      selection.capacity,
      labelFor(acCapacities, selection.capacity)
    );
  }

  if (category === 'gas-charging') {
    add(
      'ac_refrigerant',
      selection.refrigerant,
      labelFor(acRefrigerants, selection.refrigerant)
    );
  }

  for (const value of selection.addons || []) {
    const addon = (acAddonsByCategory[category] || []).find(
      (item) => item.value === value
    );

    if (!addon) continue;

    add('ac_addons', value, addon.label);

    if (addon.unit) {
      const quantity = selection.addonQuantities?.[value] ?? 1;

      add(
        `ac_qty_${value.replaceAll('-', '_')}`,
        quantity,
        `${quantity} ${addon.unit}`
      );
    }
  }

  return rows;
}

export default function AcCheckout({
  selection,
  onBack,
  onClose,
  onStepChange,
}) {
  const scope = `f:ac:${selection.category}:checkout`;
  const photoPrefix = `ac-${selection.category}`;

  const pickedLocation = usePickedLocation();
  const ensureLogin = useEnsureLogin();
  const { user } = useAuth();

  const [stage, setStage] = useHistoryState(
    `${scope}:stage-v2`,
    0,
    { push: true }
  );

  const [details, setDetails] = useHistoryState(
    `${scope}:details`,
    emptyDetails
  );

  const [date, setDate] = useHistoryState(`${scope}:date`, '');
  const [time, setTime] = useHistoryState(`${scope}:time`, '');
  const [receipt, setReceipt] = useHistoryState(`${scope}:receipt`, null);

  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState(null);
  const [catalogueError, setCatalogueError] = useState('');
  const [photoWarning, setPhotoWarning] = useState('');
  const submitting = useRef(false);

  // A signed-in customer's name, phone and email, as in every other flow.
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

  useEffect(() => {
    let cancelled = false;

    api.serviceForm('ac-services')
      .then((form) => {
        if (!cancelled) setCategory(form.category);
      })
      .catch((err) => {
        if (!cancelled) setCatalogueError(friendlyError(err));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function setDetail(key) {
    return (event) => {
      const value = event.target.value;

      setDetails((previous) => ({
        ...previous,
        [key]: value,
      }));

      setErrors((previous) => ({
        ...previous,
        [key]: undefined,
      }));

      setError('');
    };
  }

  function continueSchedule() {
    if (!date || !time) {
      setErrors({ slot: 'Please select a date and time.' });
      return;
    }

    setErrors({});
    setError('');
    setStage(2);
    onStepChange?.();
  }

  async function submit(event) {
    event.preventDefault();

    if (submitting.current || receipt) return;

    const nextErrors = validateDetails(details, pickedLocation);

    if (!date || !time) {
      nextErrors.slot = 'Please select a date and time.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      setError('Please complete the required details.');

      if (nextErrors.slot) {
        setStage(1, { push: false });
        onStepChange?.();
      }

      return;
    }

    if (!category || catalogueError) {
      setError(catalogueError || 'Please wait for the booking details to load.');
      return;
    }

    submitting.current = true;
    setBusy(true);
    setError('');

    try {
      if (!(await ensureLogin(details))) return;

      const result = await api.createBooking({
        serviceSlug: 'ac-services',
        answers: bookingAnswers(selection),
        preferredDate: date,
        preferredTime: time,
        name: details.name.trim(),
        phone: details.phone.trim(),
        whatsapp: details.whatsapp?.trim() || null,
        email: details.email?.trim() || null,
        address: composeAddress(details, pickedLocation),
        city: details.city.trim(),
        pincode: details.pincode.trim(),
        areaSqft: null,
      });

      setReceipt(result);
      onStepChange?.();

      try {
        await uploadBookingPhotos(
          photoPrefix,
          result.bookingNumber,
          details.phone
        );
      } catch {
        setPhotoWarning(
          'Your booking was saved, but the photos could not be uploaded.'
        );
      }
    } catch (err) {
      if (err?.fieldErrors) {
        setErrors(err.fieldErrors);
      }

      setError(friendlyError(err));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  function backCheckout() {
    if (busy) return;
    setError('');
    setErrors({});

    if (stage === 0) {
      onBack?.();
    } else {
      setStage(stage - 1, { push: false });
      onStepChange?.();
    }
  }

  if (receipt) {
    return (
      <div className="ac-checkout-shell">
        <div className="ac-checkout-card ac-booking-success">
          <span className="ac-success-icon" aria-hidden="true">
            <Icon name="check" size={28} />
          </span>

          <h2>Booking request received</h2>
          <p>Our team will contact you to confirm your AC service.</p>

          <div className="ac-booking-number">
            <span>Booking number</span>
            <strong>{receipt.bookingNumber}</strong>
          </div>

          <div className="ac-confirmation-details">
            <p><strong>Service:</strong> {
              labelFor(acServicesByCategory[selection.category] || [], selection.service)
            }</p>
            <p><strong>AC type:</strong> {labelFor(acTypes, selection.acType)}</p>
            <p><strong>Units:</strong> {selection.units}</p>
            <p><strong>Appointment:</strong> {formatVisit(date, time)}</p>
          </div>

          <PayBookingButton bookingNumber={receipt.bookingNumber} amountDisplay={receipt.visitFeeDisplay} />

          {photoWarning && (
            <p className="ac-checkout-notice" role="status">{photoWarning}</p>
          )}
        </div>

        {onClose && (
          <ModalFoot className="ac-checkout-actions">
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Done <Icon name="check" size={17} />
            </button>
          </ModalFoot>
        )}
      </div>
    );
  }

  const titles = ['Estimated price', 'Choose date and time', 'Your details'];

  return (
    <form onSubmit={submit} noValidate className="ac-checkout-shell">
      <div className="ac-checkout-back-row">
        <button
          type="button"
          onClick={backCheckout}
          disabled={busy}
          className="ac-checkout-back-button"
        >
          <Icon name="arrow-left" size={16} />
          <span>Back</span>
        </button>
      </div>

      <div className="ac-checkout-card">
        <h3 className="ac-checkout-heading">{titles[stage]}</h3>

        {stage === 0 && (
          <AcEstimateSummary
            selection={selection}
            visitFee={category?.visitFee}
          />
        )}

        {stage === 1 && (
          <SlotPicker
            serviceSlug="ac-services"
            date={date}
            time={time}
            onPick={(nextDate, nextTime) => {
              setDate(nextDate);
              setTime(nextTime);
              setErrors({});
              setError('');
            }}
            error={errors.slot}
          />
        )}

        {stage === 2 && (
          <>
            <CustomerDetailsFields
              details={details}
              setDetail={setDetail}
              errors={errors}
              idPrefix={photoPrefix}
            />

            <details className="ac-checkout-review">
              <summary>Review your estimate and appointment</summary>
              <AcEstimateSummary
                selection={selection}
                visitFee={category?.visitFee}
              />
              <p>Appointment: {formatVisit(date, time)}</p>
            </details>
          </>
        )}

        {(error || catalogueError) && (
          <p className="ac-checkout-error" role="alert">
            {error || catalogueError}
          </p>
        )}
      </div>

      <ModalFoot className="ac-checkout-actions">
        {stage === 0 && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={!category || Boolean(catalogueError)}
            onClick={() => {
              setError('');
              setErrors({});
              setStage(1);
              onStepChange?.();
            }}
          >
            Choose Visit Slot <Icon name="arrow-right" size={17} />
          </button>
        )}

        {stage === 1 && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={continueSchedule}
          >
            Continue <Icon name="arrow-right" size={17} />
          </button>
        )}

        {stage === 2 && (
          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy || !category || Boolean(catalogueError)}
          >
            {busy ? 'Submitting...' : 'Confirm Booking'}
          </button>
        )}
      </ModalFoot>
    </form>
  );
}
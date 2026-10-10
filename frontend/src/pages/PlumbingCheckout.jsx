import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import SlotPicker from '../components/booking/SlotPicker';
import CustomerDetailsFields from '../components/booking/CustomerDetailsFields';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api, { friendlyError } from '../lib/api';
import { formatRupees } from '../lib/money';
import { composeAddress, emptyDetails, validateDetails } from '../lib/bookingDetails';
import { usePickedLocation } from '../context/LocationContext';
import { useEnsureLogin } from '../components/auth/LoginGate';
import { uploadBookingPhotos } from '../lib/bookingPhotos';
import { contact } from '../data/siteConfig';
import { formatVisit } from '../lib/visitTime';
import { useFormBack, useHistoryState } from '../hooks/useHistoryState';
import ModalFoot from '../components/services/ModalFoot';
import PayBookingButton from '../components/payment/PayBookingButton';

const STAGES = ['Schedule', 'Details', 'Confirm'];
const SCHEDULE = 0;
const DETAILS = 1;
const CONFIRM = 2;

/** The electrical service a cart books under: Appliance Installation when
    every item is an appliance, otherwise Home Electrical Services. */
const electricalServiceFor = (items) =>
  items.length > 0 && items.every((i) => i.itemSlug.startsWith('elec-app-'))
    ? 'appliance-installation-services'
    : 'home-electrical-services';

/**
 * What differs between the two cart checkouts.
 *
 * Plumbing: one `cart_item` answer per line; the server looks up the real
 * price of each item and computes the total, so nothing the client sends is
 * trusted as a price.
 *
 * Electrical: its items are not in the server's catalogue, so each line goes
 * as the service's free-text "requirements" answer ("Ceiling Fan
 * Installation × 2 — ₹298") — the office sees exactly what was ordered — and
 * the price is confirmed at the visit (electrician screens show no fee).
 */
const TRADES = {
  plumbing: {
    scope: 'f:plb-checkout',
    cartPath: '/services/plumbing/cart',
    serviceSlug: () => 'plumbing',
    answers: (items) =>
      items.map((item) => ({
        key: 'cart_item',
        value: item.itemSlug,
        label: item.name,
        quantity: item.quantity,
      })),
    arrival: 'Our plumber will arrive in this window.',
    help: 'Hello Supplybase, I need help with my plumbing cart checkout.',
    backLabel: 'BACK TO PLUMBING',
    showsFees: true,
  },
  electrical: {
    scope: 'f:elc-checkout',
    cartPath: '/services/electrical/cart',
    serviceSlug: electricalServiceFor,
    // The label is what the booking pages show, so it carries the quantity
    // and price too: the server has no catalogue price to add them from.
    answers: (items) =>
      items.map((item) => {
        const line = `${item.name} × ${item.quantity} — ${formatRupees((item.unitPricePaise * item.quantity) / 100)}`;
        return { key: 'requirements', value: line.slice(0, 400), label: line.slice(0, 300) };
      }),
    arrival: 'Our electrician will arrive in this window.',
    help: 'Hello Supplybase, I need help with my electrical cart checkout.',
    backLabel: 'BACK TO ELECTRICAL',
    showsFees: false,
  },
};

/** /services/plumbing/checkout and /services/electrical/checkout — submits
    that cart as one booking, with the same details form as every service. */
export default function PlumbingCheckout({
  trade = 'plumbing',
  modal = false,
  onBackToCart,
  onStepChange,
  onBackToServices,
}) {
  const config = TRADES[trade];
  const { user } = useAuth();
  const { items, count, subtotalPaise, clear } = useCart(trade);
  const serviceSlug = config.serviceSlug(items);

  // This form's step and answers live in the browser's history (see
  // hooks/useHistoryState): a refresh keeps them, Back goes one step back.
  const scope = config.scope;
  const formBack = useFormBack();
  const [stage, setStage] = useHistoryState(`${scope}:stage`, SCHEDULE, { push: true });
  const [date, setDate] = useHistoryState(`${scope}:date`, '');
  const [time, setTime] = useHistoryState(`${scope}:time`, '');
  const pickedLocation = usePickedLocation();
  const ensureLogin = useEnsureLogin();
  const [details, setDetails] = useHistoryState(`${scope}:details`, emptyDetails);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useHistoryState(`${scope}:receipt`, null);

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

  const setDetail = (key) => (e) => {
    setDetails((d) => ({ ...d, [key]: e.target.value }));
    setErrors((err) => ({ ...err, [key]: undefined }));
    setError('');
  };

  if (count === 0 && !receipt) {
    if (modal) return null;

    return <Navigate to={config.cartPath} replace />;
  }

  const goNext = () => {
    setError('');
    if (stage === SCHEDULE) {
      if (!date || !time) {
        setErrors({ slot: 'Please choose a date and a time' });
        return;
      }
    }
    if (stage === DETAILS) {
      const nextErrors = validateDetails(details, pickedLocation);
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;
    }
    setStage((s) => Math.min(s + 1, CONFIRM));

    if (modal) {
      onStepChange?.();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goBack = () => {
    setError('');

    if (stage === SCHEDULE && modal) {
      onBackToCart?.();
      return;
    }

    formBack(() => setStage((s) => Math.max(s - 1, SCHEDULE)));

    if (modal) {
      onStepChange?.();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validateDetails(details, pickedLocation);
    setErrors(nextErrors);
    // The fields are not on the Confirm step: go back to where they are.
    if (Object.keys(nextErrors).length > 0) {
      setStage(DETAILS, { push: false });
      return;
    }
    // Every booking needs an account: ask now, over this form (LoginGate).
    if (!(await ensureLogin(details))) return;

    setBusy(true);
    setError('');
    try {
      const result = await api.createBooking({
        serviceSlug,
        answers: config.answers(items),
        preferredDate: date,
        preferredTime: time,
        name: details.name,
        phone: details.phone,
        whatsapp: details.whatsapp || null,
        email: details.email || null,
        address: composeAddress(details, pickedLocation),
        city: details.city,
        pincode: details.pincode || null,
      });
      setReceipt(result);
      // Photos picked in the details form go to the booking now it exists.
      uploadBookingPhotos(trade === 'plumbing' ? 'pco' : 'eco', result.bookingNumber, details.phone);
      clear();

      if (modal) {
        onStepChange?.();
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      if (err && err.fieldErrors) {
        setErrors(err.fieldErrors);
        // A detail the server turned down is fixed on the Details step, not here.
        if (Object.keys(err.fieldErrors).some((key) => key in emptyDetails)) {
          setStage(DETAILS, { push: false });
        }
      }
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  if (receipt) {
    return (
      <CheckoutConfirmation
        trade={trade}
        receipt={receipt}
        details={details}
        config={config}
        modal={modal}
        onBackToServices={onBackToServices}
        onPaid={() => setReceipt({ ...receipt, paidOnline: true })}
      />
    );
  }

  return (
    <div
      className={
        modal
          ? 'wizard-shell !min-h-0 !bg-transparent !pt-0 !pb-0'
          : 'wizard-shell'
      }
    >
      <div
        className={
          modal
  ? 'wizard-container !w-full !max-w-none !px-0 !pt-0 !pb-0 sm:!pb-6'
  : 'wizard-container'
        }
      >
        <div className="wizard-top">
          {stage > 0 || modal ? (
            <button
              type="button"
              className="wizard-back"
              onClick={goBack}
              aria-label="Go back"
            >
              <Icon name="arrow-left" size={20} />
            </button>
          ) : (
            <Link
              to={config.cartPath}
              className="wizard-back"
              aria-label="Back to cart"
            >
              <Icon name="arrow-left" size={20} />
            </Link>
          )}
          <h1 className="wizard-title">Checkout</h1>
          <a
            href={`https://wa.me/${contact.phoneRaw}?text=${encodeURIComponent(config.help)}`}
            target="_blank" rel="noopener noreferrer" className="wizard-help"
          >
            Need help?
          </a>
        </div>

        <ol className="wizard-steps">
          {STAGES.map((label, i) => (
            <li key={label} className={`wstep ${i === stage ? 'current' : ''} ${i < stage ? 'done' : ''}`}
              aria-current={i === stage ? 'step' : undefined}>
              <span className="wstep-num">{i < stage ? <Icon name="check" size={14} strokeWidth={3} /> : i + 1}</span>
              <span className="wstep-label">{label}</span>
            </li>
          ))}
        </ol>

        <form onSubmit={handleSubmit} noValidate>
          <div
  className={
    modal
      ? 'wizard-card sm:!mb-6'
      : 'wizard-card'
  }
>
            {stage === SCHEDULE && (
              <>
                <div className="wizard-card-head">
                  <h2>Choose Date &amp; Time</h2>
                  <p>{config.arrival}</p>
                </div>
                <SlotPicker
                  serviceSlug={serviceSlug}
                  date={date}
                  time={time}
                  onPick={(d, t) => {
                    setDate(d);
                    setTime(t);
                    setErrors((err) => ({ ...err, slot: undefined }));
                  }}
                  error={errors.slot}
                />
              </>
            )}

            {stage === DETAILS && (
              <>
                <div className="wizard-card-head">
                  <h2>Your Details</h2>
                  <p>We will contact you to confirm the appointment.</p>
                </div>
                <CustomerDetailsFields details={details} setDetail={setDetail} errors={errors} idPrefix={trade === 'plumbing' ? 'pco' : 'eco'} />
              </>
            )}

            {stage === CONFIRM && (
              <CartSummary
                items={items}
                subtotalPaise={subtotalPaise}
                date={date}
                time={time}
                address={[composeAddress(details, pickedLocation), details.city, details.pincode].filter(Boolean).join(', ')}
                showsFees={config.showsFees}
              />
            )}

            {error && (
              <div role="alert" className="alert alert-error" style={{ marginTop: 18 }}>
                <Icon name="info" size={18} />
                <span>{error}</span>
              </div>
            )}

            <ModalFoot
              className={
                modal
  ? 'wizard-foot modal-sticky-foot !grid !w-full !grid-cols-2 !gap-3 !border-0'
                  : `wizard-foot ${stage === 0 ? 'single' : ''}`
              }
            >
              {(stage > 0 || modal) && (
  <button
    type="button"
    className="btn btn-ghost btn-back !m-0 !w-auto !min-w-[140px] !max-w-[180px] !flex-none !justify-center"
    onClick={goBack}
  >
    BACK
  </button>
)}
              {stage === CONFIRM ? (
                <button key="submit" type="submit" className="btn btn-primary !m-0 !w-auto !min-w-[160px] !flex-1 !justify-center" disabled={busy}>
                  {busy ? 'BOOKING…' : 'CONFIRM BOOKING'}
                  <Icon name="arrow-right" size={17} />
                </button>
              ) : (
                <button
  key="continue"
  type="button"
  className="btn btn-primary !m-0 !w-auto !min-w-[160px] !flex-1 !justify-center"
  onClick={goNext}
>
                  CONTINUE
                  <Icon name="arrow-right" size={17} />
                </button>
              )}
            </ModalFoot>
          </div>
        </form>
      </div>
    </div>
  );
}

function CartSummary({ items, subtotalPaise, date, time, address, showsFees }) {
  const overThreshold = subtotalPaise / 100 > 5000;
  const feePanel = showsFees ? (
    <div className="fee-panel">
      <div className="fee-panel-top">
        <strong>{overThreshold ? 'Home Visit Fee' : 'Services Total'}</strong>
        <span className="fee-panel-amount">{overThreshold ? '₹99' : formatRupees(subtotalPaise / 100)}</span>
      </div>
      <p className="fee-small">
        {overThreshold ? (
          <>
            Your selected services total <strong>{formatRupees(subtotalPaise / 100)}</strong>, which is above ₹5,000.
            The <strong>₹99 home visit fee</strong> is paid to our team on the day of the visit — it will be adjusted
            into your final bill of {formatRupees(subtotalPaise / 100)} if you proceed with the work.
          </>
        ) : (
          <>
            This is actual, transparent pricing for your selected services — no hidden charges, no home visit fee for
            this total.
          </>
        )}
      </p>
    </div>
  ) : (
    <div className="fee-panel">
      <div className="fee-panel-top">
        <strong>Estimated Total</strong>
        <span className="fee-panel-amount">{formatRupees(subtotalPaise / 100)}</span>
      </div>
      <p className="fee-small">Listed prices for your selected services. Our electrician confirms the final amount at the visit.</p>
    </div>
  );

  return (
    <div style={{ marginTop: 0 }}>
      <div className="wizard-card-head">
        <h2>Booking Summary</h2>
        <p>Please check everything before you confirm.</p>
      </div>

      <dl className="review-list">
        <div>
          <dt>Site visit</dt>
          <dd>{formatVisit(date, time)}</dd>
        </div>
        <div>
          <dt>Visit address</dt>
          <dd>{address}</dd>
        </div>
        {items.map((item) => (
          <div key={item.itemSlug}>
            <dt>{item.name} × {item.quantity}</dt>
            <dd>{formatRupees((item.unitPricePaise * item.quantity) / 100)}</dd>
          </div>
        ))}
      </dl>

      {feePanel}
    </div>
  );
}

function CheckoutConfirmation({
  trade,
  receipt,
  details,
  config,
  modal = false,
  onBackToServices,
  onPaid,
}) {
  const message = encodeURIComponent(`Hello Supplybase, this is about my booking ${receipt.bookingNumber}.`);
  // The cart's single Checkout button books plumbing first; electrical items
  // still in the cart are the next booking.
  const electricalLeft = useCart('electrical').count;
  const nextCheckout = trade === 'plumbing' && electricalLeft > 0 && !modal;
  return (
    <div
      className={
        modal
          ? 'wizard-shell !min-h-0 !bg-transparent !pt-0 !pb-0'
          : 'wizard-shell'
      }
    >
      <div
        className={
          modal
            ? 'wizard-container !min-h-0 !w-full !max-w-none !px-0 !pt-0 !pb-0'
            : 'wizard-container'
        }
      >
        <div className="wizard-card">
          <div className="confirmed">
            <div className="confirmed-tick">
              <Icon name="check" size={38} strokeWidth={3} />
            </div>
            {config.showsFees ? (
              <>
                <h2>Your Booking is Reserved!</h2>
                {!receipt.paidOnline && <p>{receipt.message}</p>}
              </>
            ) : (
              // Like the electrician journeys: no fee amounts on this screen.
              <>
                <h2>{receipt.status === 'CONFIRMED' ? 'Booking Confirmed!' : 'Booking Request Received'}</h2>
                <p>
                  We have received your request. Our team will contact you on WhatsApp or phone to confirm the
                  appointment.
                </p>
              </>
            )}

            <dl className="confirmed-panel">
              <div>
                <dt>Booking ID</dt>
                <dd className="booking-id">{receipt.bookingNumber}</dd>
              </div>
              <div>
                <dt>Date &amp; Time</dt>
                <dd>{formatVisit(receipt.date, receipt.time)}</dd>
              </div>
              {config.showsFees && receipt.itemsTotalDisplay && (
                <div>
                  <dt>Items Total</dt>
                  <dd>{receipt.itemsTotalDisplay}</dd>
                </div>
              )}
              {config.showsFees ? (
                <div>
                  <dt>{receipt.homeVisitFeeOnly ? 'Home Visit Fee' : 'Amount Due'}</dt>
                  <dd>{receipt.visitFeeDisplay}</dd>
                </div>
              ) : (
                <div>
                  <dt>Service</dt>
                  <dd>{receipt.serviceName}</dd>
                </div>
              )}
              <div>
                <dt>Location</dt>
                <dd>{details.city}</dd>
              </div>
            </dl>

            <PayBookingButton
              bookingNumber={receipt.bookingNumber}
              amountDisplay={receipt.visitFeeDisplay}
              paid={receipt.paidOnline}
              onPaid={onPaid}
            />

            {nextCheckout && (
              <Link to="/services/electrical/checkout" className="btn btn-primary btn-block">
                NEXT: BOOK YOUR ELECTRICAL ITEMS ({electricalLeft})
              </Link>
            )}
            {!modal && !nextCheckout && (
              <Link to="/dashboard" className="btn btn-primary btn-block">
                GO TO DASHBOARD
              </Link>
            )}
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

              {modal ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-back !w-auto !min-w-[190px] !justify-center"
                  onClick={() => onBackToServices?.()}
                >
                  {config.backLabel}
                </button>
              ) : (
                <Link to="/" className="btn btn-ghost btn-back">
                  BACK TO HOME
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

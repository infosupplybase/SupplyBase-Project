import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import SlotPicker from '../components/booking/SlotPicker';
import CustomerDetailsFields from '../components/booking/CustomerDetailsFields';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api, { friendlyError } from '../lib/api';
import { formatRupees } from '../lib/money';
import { emptyDetails, validateDetails } from '../lib/bookingDetails';
import { contact } from '../data/siteConfig';

const STAGES = ['Schedule', 'Details', 'Confirm'];
const SCHEDULE = 0;
const DETAILS = 1;
const CONFIRM = 2;

/** /services/plumbing/checkout — submits the real cart as one booking
    (serviceSlug: 'plumbing', one `cart_item` answer per line with its
    quantity). The server looks up the real price for each item and computes
    the total; nothing the client sends here is trusted as a price. */
export default function PlumbingCheckout() {
  const { user } = useAuth();
  const { items, count, subtotalPaise, clear } = useCart();

  const [stage, setStage] = useState(SCHEDULE);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [details, setDetails] = useState(emptyDetails);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);

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
    return <Navigate to="/services/plumbing/cart" replace />;
  }

  const goNext = () => {
    setError('');
    if (stage === SCHEDULE) {
      if (!date || !time) {
        setErrors({ slot: 'Please choose a date and a time' });
        return;
      }
    }
    setStage((s) => Math.min(s + 1, CONFIRM));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setError('');
    setStage((s) => Math.max(s - 1, SCHEDULE));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validateDetails(details);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    setError('');
    try {
      const result = await api.createBooking({
        serviceSlug: 'plumbing',
        answers: items.map((item) => ({
          key: 'cart_item',
          value: item.itemSlug,
          label: item.name,
          quantity: item.quantity,
        })),
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
      clear();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err && err.fieldErrors) setErrors(err.fieldErrors);
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  if (receipt) return <CheckoutConfirmation receipt={receipt} details={details} />;

  return (
    <div className="wizard-shell">
      <div className="wizard-container">
        <div className="wizard-top">
          {stage > 0 ? (
            <button type="button" className="wizard-back" onClick={goBack} aria-label="Go back">
              <Icon name="arrow-left" size={20} />
            </button>
          ) : (
            <Link to="/services/plumbing/cart" className="wizard-back" aria-label="Back to cart">
              <Icon name="arrow-left" size={20} />
            </Link>
          )}
          <h1 className="wizard-title">Checkout</h1>
          <a
            href={`https://wa.me/${contact.phoneRaw}?text=${encodeURIComponent('Hello Supplybase, I need help with my plumbing cart checkout.')}`}
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
          <div className="wizard-card">
            {stage === SCHEDULE && (
              <>
                <div className="wizard-card-head">
                  <h2>Choose Date &amp; Time</h2>
                  <p>Our plumber will arrive in this window.</p>
                </div>
                <SlotPicker
                  serviceSlug="plumbing"
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
                  <h2>Enter Your Details</h2>
                  <p>We will contact you to confirm the appointment.</p>
                </div>
                <CustomerDetailsFields details={details} setDetail={setDetail} errors={errors} idPrefix="pco" />
              </>
            )}

            {stage === CONFIRM && (
              <CartSummary items={items} subtotalPaise={subtotalPaise} date={date} time={time} />
            )}

            {error && (
              <div role="alert" className="alert alert-error" style={{ marginTop: 18 }}>
                <Icon name="info" size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className={`wizard-foot ${stage === 0 ? 'single' : ''}`}>
              {stage > 0 && (
                <button type="button" className="btn btn-ghost btn-back" onClick={goBack}>
                  BACK
                </button>
              )}
              {stage === CONFIRM ? (
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'BOOKING…' : 'CONFIRM BOOKING'}
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

function CartSummary({ items, subtotalPaise, date, time }) {
  const overThreshold = subtotalPaise / 100 > 5000;
  return (
    <div style={{ marginTop: 0 }}>
      <div className="wizard-card-head">
        <h2>Booking Summary</h2>
        <p>Please check everything before you confirm.</p>
      </div>

      <dl className="review-list">
        <div>
          <dt>Site visit</dt>
          <dd>{date} at {time}</dd>
        </div>
        {items.map((item) => (
          <div key={item.itemSlug}>
            <dt>{item.name} × {item.quantity}</dt>
            <dd>{formatRupees((item.unitPricePaise * item.quantity) / 100)}</dd>
          </div>
        ))}
      </dl>

      <div className="fee-panel">
        <div className="fee-panel-top">
          <strong>{overThreshold ? 'Home Visit Fee' : 'Services Total'}</strong>
          <span className="fee-panel-amount">{overThreshold ? '₹99' : formatRupees(subtotalPaise / 100)}</span>
        </div>
        <p className="fee-small">
          {overThreshold ? (
            <>
              Your selected services total <strong>{formatRupees(subtotalPaise / 100)}</strong>, which is above ₹5,000.
              Pay the <strong>₹99 home visit fee</strong> now to confirm — it will be adjusted into your final bill of{' '}
              {formatRupees(subtotalPaise / 100)} if you proceed with the work.
            </>
          ) : (
            <>
              This is actual, transparent pricing for your selected services — no hidden charges, no home visit fee for
              this total.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function CheckoutConfirmation({ receipt, details }) {
  const message = encodeURIComponent(`Hello Supplybase, this is about my booking ${receipt.bookingNumber}.`);
  return (
    <div className="wizard-shell">
      <div className="wizard-container">
        <div className="wizard-card">
          <div className="confirmed">
            <div className="confirmed-tick">
              <Icon name="check" size={38} strokeWidth={3} />
            </div>
            <h2>Your Booking is Reserved!</h2>
            <p>{receipt.message}</p>

            <dl className="confirmed-panel">
              <div>
                <dt>Booking ID</dt>
                <dd className="booking-id">{receipt.bookingNumber}</dd>
              </div>
              <div>
                <dt>Date &amp; Time</dt>
                <dd>{receipt.date}, {receipt.time}</dd>
              </div>
              {receipt.itemsTotalDisplay && (
                <div>
                  <dt>Items Total</dt>
                  <dd>{receipt.itemsTotalDisplay}</dd>
                </div>
              )}
              <div>
                <dt>{receipt.homeVisitFeeOnly ? 'Home Visit Fee' : 'Amount Due'}</dt>
                <dd>{receipt.visitFeeDisplay}</dd>
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

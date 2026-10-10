import { useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon';
import { friendlyError } from '../../lib/api';
import { onlinePaymentsEnabled, payForBooking, PaymentCancelledError } from '../../lib/razorpay';

/**
 * "Pay ₹99 to confirm" for a booking that has just been made, or one still
 * awaiting payment. Opens Razorpay's checkout; the booking only shows as
 * confirmed once our API has verified Razorpay's signature.
 *
 * Paying is compulsory: a booking whose visiting fee is not paid online is
 * cancelled after a short window, so the payment window opens by itself
 * (autoStart) as soon as the booking is made, and the button reopens it.
 */
export default function PayBookingButton({ bookingNumber, amountDisplay, onPaid, paid = false, autoStart = true, className = '' }) {
  const [state, setState] = useState(paid ? 'paid' : 'idle'); // idle | paying | paid
  const [error, setError] = useState('');
  const [closed, setClosed] = useState(false); // checkout closed without paying
  const [online, setOnline] = useState(null); // null while asking the API
  const started = useRef(false);

  useEffect(() => {
    let live = true;
    onlinePaymentsEnabled().then((enabled) => {
      if (live) setOnline(enabled);
    });
    return () => {
      live = false;
    };
  }, []);

  async function pay() {
    setError('');
    setClosed(false);
    setState('paying');
    try {
      const payment = await payForBooking(bookingNumber);
      setState('paid');
      onPaid?.(payment);
    } catch (err) {
      setState('idle');
      if (err instanceof PaymentCancelledError) {
        setClosed(true);
      } else {
        setError(err?.status ? friendlyError(err) : err?.message || friendlyError(err));
      }
    }
  }

  // Open checkout once, straight after booking, so paying is the next step.
  useEffect(() => {
    if (autoStart && online && state === 'idle' && !started.current) {
      started.current = true;
      pay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, online]);

  // "₹99.00" reads as "₹99" on the button and in the summary.
  const amount = amountDisplay ? amountDisplay.replace(/\.00$/, '') : '';

  if (state === 'paid') {
    return (
      <div role="status" className={`alert alert-success pay-booking is-paid ${className}`}>
        <Icon name="check-circle" size={18} />
        <span>
          Payment received{amount ? ` (${amount})` : ''}. Your booking is confirmed.
        </span>
      </div>
    );
  }

  if (online === null) return null;

  if (!online) {
    return (
      <div className={`pay-booking ${className}`}>
        <p className="pay-booking-hint">
          Online payment is not available right now, so this booking cannot be confirmed online. Please call or
          WhatsApp us on +91 91373 06446.
        </p>
      </div>
    );
  }

  return (
    <div className={`pay-booking pay-booking-card ${className}`}>
      <div className="pay-booking-row">
        <span className="pay-booking-label">
          Visiting fee
          <small>Adjusted in your final bill</small>
        </span>
        {amount && <strong className="pay-booking-amount">{amount}</strong>}
      </div>

      {closed && (
        <p role="status" className="pay-booking-pending">
          <Icon name="info" size={16} />
          <span>Payment not completed. Your booking is confirmed only after you pay.</span>
        </p>
      )}

      <button type="button" className="btn btn-primary pay-booking-btn" onClick={pay} disabled={state === 'paying'}>
        <Icon name="rupee" size={18} />
        {state === 'paying' ? 'Opening payment…' : amount ? `Pay ${amount} & confirm` : 'Pay & confirm'}
      </button>

      <p className="pay-booking-hint">
        <Icon name="lock" size={13} />
        UPI, card or net banking, secured by Razorpay. Unpaid bookings are cancelled after 30 minutes.
      </p>

      {error && (
        <div role="alert" className="alert alert-error">
          <Icon name="info" size={18} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

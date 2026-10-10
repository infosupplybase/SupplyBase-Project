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
    setState('paying');
    try {
      const payment = await payForBooking(bookingNumber);
      setState('paid');
      onPaid?.(payment);
    } catch (err) {
      setState('idle');
      if (err instanceof PaymentCancelledError) {
        setError('Your booking is not confirmed until the visiting fee is paid. Tap the button to pay.');
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

  if (state === 'paid') {
    return (
      <div role="status" className={`alert alert-success pay-booking ${className}`}>
        <Icon name="check-circle" size={18} />
        <span>
          Payment received{amountDisplay ? ` (${amountDisplay})` : ''}. Your booking is confirmed.
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
    <div className={`pay-booking ${className}`}>
      <button type="button" className="btn btn-primary" onClick={pay} disabled={state === 'paying'}>
        <Icon name="rupee" size={18} />
        {state === 'paying'
          ? 'Opening payment…'
          : amountDisplay
            ? `Pay ${amountDisplay} visiting fee to confirm`
            : 'Pay visiting fee to confirm'}
      </button>
      <p className="pay-booking-hint">
        Pay securely by UPI, card or net banking through Razorpay. The visiting fee is adjusted into your final bill.
        Unpaid bookings are cancelled after 30 minutes.
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

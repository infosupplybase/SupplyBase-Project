import { useEffect, useState } from 'react';
import Icon from '../ui/Icon';
import { friendlyError } from '../../lib/api';
import { onlinePaymentsEnabled, payForBooking, PaymentCancelledError } from '../../lib/razorpay';

/**
 * "Pay ₹X now" for a booking that has just been made, or one still awaiting
 * payment on the dashboard. Opens Razorpay's checkout; the booking only shows
 * as paid once our API has verified Razorpay's signature.
 *
 * Paying online is optional: the booking is already reserved, and the
 * customer can still pay our team on the day of the visit. While online
 * payment is switched off on the server, only that is said, with no button.
 */
export default function PayBookingButton({ bookingNumber, amountDisplay, onPaid, paid = false, className = '' }) {
  const [state, setState] = useState(paid ? 'paid' : 'idle'); // idle | paying | paid
  const [error, setError] = useState('');
  const [online, setOnline] = useState(null); // null while asking the API

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
      if (!(err instanceof PaymentCancelledError)) {
        setError(err?.status ? friendlyError(err) : err?.message || friendlyError(err));
      }
    }
  }

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
        <p className="pay-booking-hint">Pay our team on the day of the visit.</p>
      </div>
    );
  }

  return (
    <div className={`pay-booking ${className}`}>
      <button type="button" className="btn btn-primary" onClick={pay} disabled={state === 'paying'}>
        <Icon name="rupee" size={18} />
        {state === 'paying' ? 'Opening payment…' : amountDisplay ? `Pay ${amountDisplay} now` : 'Pay now'}
      </button>
      <p className="pay-booking-hint">Pay securely by UPI, card or net banking through Razorpay, or pay our team on the day of the visit.</p>
      {error && (
        <div role="alert" className="alert alert-error">
          <Icon name="info" size={18} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

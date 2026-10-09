import api from './api';

/**
 * RAZORPAY CHECKOUT
 * -----------------
 * Loads Razorpay's checkout script on first use (not on every page) and runs
 * one payment: ask our API for an order, open Razorpay's modal, then send the
 * signed result back for the API to verify. The browser never decides that a
 * payment succeeded; only the server's signature check does.
 *
 * The key id comes from the API with the order, so switching from test to
 * live keys is a server .env change with no website deploy.
 */

const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptPromise = null;

function loadCheckoutScript() {
  if (window.Razorpay) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        script.remove();
        reject(new Error('We could not load the payment window. Check your connection and try again.'));
      };
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
}

let statusPromise = null;

/**
 * Whether the API can take online payments at all (its Razorpay keys are set).
 * Asked once per page load. If the question itself fails, assume yes: the Pay
 * button then behaves as it always did and the API explains any refusal.
 */
export function onlinePaymentsEnabled() {
  if (!statusPromise) {
    statusPromise = api
      .paymentStatus()
      .then((status) => status?.onlinePayments !== false)
      .catch(() => {
        statusPromise = null;
        return true;
      });
  }
  return statusPromise;
}

/** Thrown when the customer closes the payment window without paying. */
export class PaymentCancelledError extends Error {
  constructor() {
    super('Payment was not completed.');
    this.name = 'PaymentCancelledError';
  }
}

/**
 * Pays a booking's fee. Resolves with the verified payment from our API;
 * rejects with PaymentCancelledError if the window is closed, or an Error
 * whose message can be shown as is.
 */
export async function payForBooking(bookingNumber) {
  const [order] = await Promise.all([api.startBookingPayment(bookingNumber), loadCheckoutScript()]);

  const result = await new Promise((resolve, reject) => {
    const checkout = new window.Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amountPaise,
      currency: order.currency,
      name: 'Supplybase',
      description: order.description,
      image: `${window.location.origin}/assets/brand/favicon.png`,
      prefill: {
        name: order.customerName || '',
        email: order.customerEmail || '',
        contact: order.customerPhone || '',
      },
      notes: { reference: order.paymentReference },
      theme: { color: '#dfaf35' },
      handler: resolve,
      modal: { ondismiss: () => reject(new PaymentCancelledError()) },
    });
    checkout.on('payment.failed', (response) => {
      // Razorpay keeps its window open so the customer can retry with another
      // method; this only records why the attempt failed.
      console.warn('Razorpay payment attempt failed', response?.error?.code);
    });
    checkout.open();
  });

  return api.verifyPayment(result);
}

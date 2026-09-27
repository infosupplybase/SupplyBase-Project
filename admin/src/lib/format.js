/**
 * Formatting shared by every admin page — one place for how an enum, a date
 * or a status reads, instead of a copy of `label()` in each file.
 */

/** "WORK_IN_PROGRESS" -> "Work In Progress". */
export const label = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * A date-only value ("2026-10-15") as a local date. Built from its parts, not
 * `new Date("2026-10-15")`, which is read as UTC and can show the previous day.
 */
const parseDay = (value) => {
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};

const isDateOnly = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

/** "15 Oct 2026" from a timestamp or a date-only value; "—" when empty. */
export const formatDate = (value) => {
  if (!value) return '—';
  const date = isDateOnly(value) ? parseDay(value) : new Date(value);
  return date
    ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
};

/** "Thu, 15 Oct" — for schedules, where the weekday matters more than the year. */
export const formatDay = (value) => {
  if (!value) return '—';
  const date = isDateOnly(value) ? parseDay(value) : new Date(value);
  return date ? date.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' }) : '—';
};

/** "just now", "12 min ago", "3 h ago", "2 days ago", then a plain date. */
export const timeAgo = (value) => {
  if (!value) return '—';
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return formatDate(value);
};

/** Today as yyyy-mm-dd in the browser's own time zone (not UTC). */
export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** A plain rupee amount from the API (e.g. 125000.5) -> "₹1,25,000.50". */
export const formatAmount = (rupees) => {
  if (rupees == null || rupees === '') return '—';
  const n = Number(rupees);
  const decimals = Number.isInteger(n) ? 0 : 2;
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};

/** Digits with India's 91 in front, for wa.me links. */
export const whatsappHref = (phone, text) => {
  const digits = String(phone || '').replace(/\D/g, '').replace(/^0+/, '');
  if (!digits) return null;
  const number = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};

export const telHref = (phone) => {
  const n = String(phone || '').replace(/[^\d+]/g, '');
  return n ? `tel:${n}` : null;
};

/* ------------------------------------------------------ status → tone */

/** Booking statuses: warning = needs staff, accent = moving, success/danger = finished. */
export const bookingTone = (status) => {
  if (status === 'CANCELLED') return 'danger';
  if (status === 'WORK_COMPLETED') return 'success';
  if (['PAYMENT_PENDING', 'BOOKING_REQUESTED', 'CONFIRMED', 'ASSIGNMENT_PENDING'].includes(status)) return 'warning';
  return 'accent';
};

/**
 * PAYMENT_PENDING and BOOKING_REQUESTED bookings are cancelled by the server
 * (BookingExpiryJob) 24 hours after they were made, unless staff move them on.
 */
export const EXPIRY_HOURS = 24;
export const EXPIRING_STATUSES = ['PAYMENT_PENDING', 'BOOKING_REQUESTED'];

/** Hours left before the server auto-cancels this booking, or null if it never will. */
export const hoursUntilAutoCancel = (booking) => {
  if (!booking || !EXPIRING_STATUSES.includes(booking.status) || !booking.createdAt) return null;
  const deadline = new Date(booking.createdAt).getTime() + EXPIRY_HOURS * 3600000;
  return Math.max(0, Math.ceil((deadline - Date.now()) / 3600000));
};

/** What each booking status means, in plain words, for the staff who move it on. */
export const BOOKING_STATUS_HELP = {
  PAYMENT_PENDING: 'New booking. Check it and confirm — it is cancelled automatically after 24 hours.',
  BOOKING_REQUESTED: 'Requested by the customer. Confirm it — it is cancelled automatically after 24 hours.',
  CONFIRMED: 'Confirmed. Next: assign a partner.',
  ASSIGNMENT_PENDING: 'Waiting for a partner to be assigned.',
  PROFESSIONAL_ASSIGNED: 'A partner is assigned. Next: schedule the site visit.',
  SITE_VISIT_SCHEDULED: 'Site visit booked. The partner marks it done.',
  SITE_VISIT_COMPLETED: 'Visit done. Next: prepare the quotation.',
  QUOTATION_CREATED: 'Quotation ready. Next: send it to the customer.',
  QUOTATION_SENT: 'Waiting for the customer to approve the quotation.',
  CUSTOMER_APPROVED: 'Customer approved. Next: schedule the work.',
  WORK_SCHEDULED: 'Work scheduled. The partner starts it on the day.',
  WORK_IN_PROGRESS: 'Work under way. The partner marks it completed.',
  WORK_COMPLETED: 'Finished. Set and pay the partner payout if you have not.',
  CANCELLED: 'Cancelled.',
};

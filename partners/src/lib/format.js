/**
 * Dates, phone numbers and map links for the dashboard.
 */

/**
 * A date-only value from the API ("2026-10-15") as a local Date. Built from
 * its parts rather than `new Date("2026-10-15")`, which is read as UTC and can
 * land on the previous day in some time zones.
 */
export const parseDay = (value) => {
  if (!value) return null;
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

/** Whole days from today to a date-only value: 0 today, 1 tomorrow, -1 yesterday. */
export const daysFromToday = (value) => {
  const day = parseDay(value);
  return day ? Math.round((day - startOfToday()) / 86400000) : null;
};

/** "Thu, 15 Oct" */
export const formatDay = (value) => {
  const day = parseDay(value);
  return day ? day.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' }) : null;
};

/** "Today", "Tomorrow", "In 3 days", "2 days ago" — or null when a plain date reads better. */
export const dayLabel = (value) => {
  const n = daysFromToday(value);
  if (n == null) return null;
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  if (n < 0) return `${-n} days ago`;
  if (n < 7) return `In ${n} days`;
  return null;
};

/** "15 Oct 2026" from a timestamp. */
export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

/** Digits only, with India's 91 in front when a 10-digit number was given. */
const withCountryCode = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '').replace(/^0+/, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

/** A wa.me link that opens a WhatsApp chat with this number, optionally pre-filled. */
export const whatsappHref = (phone, text) => {
  const number = withCountryCode(phone);
  if (!number) return null;
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};

/** A tel: link. */
export const telHref = (phone) => {
  const number = String(phone || '').replace(/[^\d+]/g, '');
  return number ? `tel:${number}` : null;
};

/** Google Maps directions target for a job's address. */
export const mapsHref = (...parts) => {
  const query = parts.filter(Boolean).join(', ').trim();
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
};

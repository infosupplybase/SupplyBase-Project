/**
 * How a visit's date and time read on screen. The API sends them as
 * "2026-10-04" and "14:45:00"; customers should see "Sun, 4 Oct" and
 * "2:45 PM". Built from the parts, not new Date("2026-10-04"), which is read
 * as UTC and can land on the previous day.
 */
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-10-04" -> "Sun, 4 Oct 2026" (the year only when it is not this year). */
export function formatVisitDate(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return String(iso);
  const date = new Date(y, m - 1, d);
  const year = y === new Date().getFullYear() ? '' : ` ${y}`;
  return `${DAYS[date.getDay()]}, ${d} ${MONTHS[m - 1]}${year}`;
}

/** "14:45:00" or "14:45" -> "2:45 PM" */
export function formatVisitTime(time) {
  if (!time) return '';
  const [h, min] = String(time).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(min)) return String(time);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(min).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** "Sun, 4 Oct at 2:45 PM" */
export function formatVisit(date, time) {
  const d = formatVisitDate(date);
  const t = formatVisitTime(time);
  return d && t ? `${d} at ${t}` : d || t;
}

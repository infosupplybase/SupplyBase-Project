/**
 * StatusBadge — a coloured pill for a status value.
 * `tone` picks the colour; the page decides which tone a given status maps to,
 * since ENQUIRY/BOOKING/PROJECT/PAYMENT statuses each need their own mapping.
 */
export default function StatusBadge({ tone = 'neutral', children }) {
  return <span className={`admin-badge admin-badge-${tone}`}>{children}</span>;
}

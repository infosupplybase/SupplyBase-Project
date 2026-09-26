/**
 * StatusBadge — a coloured pill for a status value, with a dot so the colour
 * is never the only signal (the text always says it too).
 * `tone` picks the colour; the page decides which tone a given status maps to,
 * since ENQUIRY/BOOKING/PROJECT/PAYMENT statuses each need their own mapping.
 */
export default function StatusBadge({ tone = 'neutral', children, title }) {
  return (
    <span className={`admin-badge admin-badge-${tone}`} title={title}>
      {children}
    </span>
  );
}

import Icon from '../ui/Icon';

const GAP_MESSAGE = 'Our team will confirm the exact product and rate for this brand during your free site inspection.';

/**
 * A plain, read-only rate table — Service/Solution + indicative rate range
 * (text from the catalogue's option_hint, e.g. "₹70 – ₹90 / sq. ft."; see
 * V17's migration comment on why no row carries a numeric price). Nothing
 * here is selectable — matching the reference's own rate screens, which
 * are informational, not an "add to cart" UI. `rows` is pre-filtered by
 * the caller to the selected brand; an empty array renders the honest
 * "confirmed at inspection" state instead of inventing a number.
 */
export default function RateTable({ title, rows }) {
  return (
    <div className="wp-rate-table">
      {title && <h3>{title}</h3>}
      {rows.length === 0 ? (
        <div className="wp-rate-gap">
          <Icon name="chat" size={20} />
          <p>{GAP_MESSAGE}</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Service / Solution</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.value}>
                <td>{r.label}</td>
                <td>{r.hint}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

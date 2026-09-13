import Icon from '../ui/Icon';
import { formatRupees } from '../../lib/money';

/**
 * Editable summary — every selection made across the flow, each with an
 * "Edit" link back to the step that set it (per the brief: "allow users to
 * edit earlier steps from the summary"). Colours and add-ons are always
 * included here even for flows where the reference's own summary screen
 * was placed before those steps (see paintingContent.js / V15's notes on
 * the Few Walls reference's own numbering bug) — this summary always
 * reflects every selection, in the flow's real order.
 */
export default function EstimateSummary({ rows, whatsIncluded, itemsTotalPaise, onEditStep }) {
  const total = itemsTotalPaise != null ? itemsTotalPaise / 100 : null;

  return (
    <div className="pnt-summary">
      <dl className="pnt-summary-rows">
        {rows.map((row) => (
  <div
    key={row.stepIndex}
    className="
      pnt-summary-row
      !grid
      !grid-cols-1
      !gap-1

      md:!flex
      md:!items-baseline
      md:!justify-between
      md:!gap-3
    "
  >
    <dt className="!w-full md:!w-auto">
      {row.label}
    </dt>

    <dd
      className="
        !flex
        !w-full
        !min-w-0
        !items-center
        !justify-between
        !gap-2
        !text-left

        md:!w-auto
        md:!justify-end
        md:!text-right
      "
    >
      <span className="!min-w-0 !flex-1 !break-normal">
        {row.value || '—'}
      </span>

      <button
        type="button"
        className="pnt-summary-edit !shrink-0"
        onClick={() => onEditStep(row.stepIndex)}
      >
        Edit
      </button>
    </dd>
  </div>
))}
      </dl>

      <div className="pnt-summary-total">
        <span>Estimated Price</span>
        <strong>{total != null ? formatRupees(total) : 'To be confirmed on site visit'}</strong>
      </div>

      {whatsIncluded && whatsIncluded.length > 0 && (
        <div className="pnt-summary-includes">
          <h3>Includes</h3>
          <ul>
            {whatsIncluded.map((item) => (
              <li key={item}>
                <Icon name="check" size={13} strokeWidth={3.5} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="pnt-summary-note">
        This is an estimate. Final scope and price are confirmed after our team inspects the site.
      </p>
    </div>
  );
}

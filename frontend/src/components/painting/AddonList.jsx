import Icon from '../ui/Icon';
import { formatRupees } from '../../lib/money';
import { ITEM_ICON_OVERRIDES } from '../../data/paintingContent';

/** MULTI-select checklist — used for add-ons on every flow and Renovation's
    repair/preparation step (same shape, different question key). */
export default function AddonList({ options, selected, onToggle }) {
  const isChecked = (value) => selected.includes(value);

  return (
    <div className="pnt-addon-list">
      {options.map((opt) => (
        <label key={opt.value} className={`pnt-addon ${isChecked(opt.value) ? 'selected' : ''}`}>
          <input
            type="checkbox"
            checked={isChecked(opt.value)}
            onChange={() => onToggle(opt.value)}
          />
          <span className="pnt-addon-icon" aria-hidden="true">
            <Icon name={ITEM_ICON_OVERRIDES[opt.value] || 'roller'} size={22} />
          </span>
          <span className="pnt-addon-body">
            <span className="pnt-addon-label">{opt.label}</span>
            {opt.hint && <span className="pnt-addon-hint">{opt.hint}</span>}
            {opt.price != null && (
              <span className="pnt-addon-price">From {formatRupees(opt.price)}</span>
            )}
          </span>
          <span className="pnt-addon-check" aria-hidden="true">
            <Icon name="check" size={13} strokeWidth={3.5} />
          </span>
        </label>
      ))}
    </div>
  );
}

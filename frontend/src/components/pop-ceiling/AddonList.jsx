import Icon from '../ui/Icon';
import { ADDON_ICONS } from '../../data/popCeilingContent';

/**
 * MULTI-select checklist for POP's add-ons — same shape and CSS classes as
 * painting/AddonList.jsx (pnt-addon-list / pnt-addon), forked rather than
 * imported only because that component's icon lookup is hardcoded to
 * paintingContent's ITEM_ICON_OVERRIDES. No POP add-on ever carries a
 * price_paise (see V16's migration comment), so `opt.price` is always null
 * here and only the rate text in `opt.hint` (e.g. "₹25 / sq. ft.") renders.
 */
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
            <Icon name={ADDON_ICONS[opt.value] || 'ceiling'} size={22} />
          </span>
          <span className="pnt-addon-body">
            <span className="pnt-addon-label">{opt.label}</span>
            {opt.hint && <span className="pnt-addon-hint">{opt.hint}</span>}
          </span>
          <span className="pnt-addon-check" aria-hidden="true">
            <Icon name="check" size={13} strokeWidth={3.5} />
          </span>
        </label>
      ))}
    </div>
  );
}

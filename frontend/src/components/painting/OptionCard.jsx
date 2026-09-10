import Icon from '../ui/Icon';
import { formatRupees } from '../../lib/money';

/**
 * One selectable SINGLE-choice row — home type, painting type, area. A real
 * radio input underneath (visually hidden), gold border + pale gold fill +
 * a filled dot when chosen, matching the reference's selection state.
 */
export default function OptionCard({ option, name, icon, checked, onSelect }) {
  return (
    <label className={`pnt-option ${checked ? 'selected' : ''}`}>
      <input
        type="radio"
        name={name}
        value={option.value}
        checked={checked}
        onChange={() => onSelect(option.value)}
      />
      {icon && (
        <span className="pnt-option-icon" aria-hidden="true">
          <Icon name={icon} size={24} />
        </span>
      )}
      <span className="pnt-option-body">
        <span className="pnt-option-label">{option.label}</span>
        {option.hint && <span className="pnt-option-hint">{option.hint}</span>}
        {option.price != null && (
          <span className="pnt-option-price">From {formatRupees(option.price)}</span>
        )}
      </span>
      <span className="pnt-option-radio" aria-hidden="true" />
    </label>
  );
}

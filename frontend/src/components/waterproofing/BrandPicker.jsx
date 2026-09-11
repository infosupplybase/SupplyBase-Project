import Icon from '../ui/Icon';
import { BRAND_LOGO } from '../../data/waterproofingContent';

/**
 * Three brand cards (real logo files — see waterproofingContent.js's asset
 * note on why no product packshots are shown). Deliberately logo-only:
 * the reference's own product-bucket photos mislabel several Asian Paints
 * cards with a Berger bucket, so showing only the correct brand logos
 * sidesteps that error entirely rather than risking repeating it.
 */
export default function BrandPicker({ options, value, onSelect }) {
  return (
    <div className="wp-brand-grid">
      {options.map((opt) => (
        <label key={opt.value} className={`wp-brand-card ${value === opt.value ? 'selected' : ''}`}>
          <input
            type="radio"
            name="wp_brand"
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onSelect(opt.value)}
          />
          <img src={BRAND_LOGO[opt.value]} alt={opt.label} />
          <span className="wp-brand-body">
            <strong>{opt.label}</strong>
            {opt.hint && <span>{opt.hint}</span>}
          </span>
          {value === opt.value && (
            <span className="wp-brand-check" aria-hidden="true">
              <Icon name="check" size={12} strokeWidth={3.5} />
            </span>
          )}
        </label>
      ))}
    </div>
  );
}

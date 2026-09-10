import Icon from '../ui/Icon';
import { BRAND_WHY } from '../../data/paintingContent';

const BRAND_LOGO = {
  'asian-paints': '/assets/materials/asian-paints.png',
  berger: '/assets/materials/berger-paints.jpg',
};

/** Two brand cards (real project logo files — see paintingContent.js's
    asset note) plus a "why this brand" checklist that updates with the
    selection. */
export default function BrandPicker({ options, value, onSelect }) {
  const why = BRAND_WHY[value] || [];

  return (
    <div className="pnt-brands">
      <div className="pnt-brand-grid">
        {options.map((opt) => (
          <label key={opt.value} className={`pnt-brand-card ${value === opt.value ? 'selected' : ''}`}>
            <input
              type="radio"
              name="paint_brand"
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onSelect(opt.value)}
            />
            <img src={BRAND_LOGO[opt.value]} alt={opt.label} />
            {value === opt.value && (
              <span className="pnt-brand-check" aria-hidden="true">
                <Icon name="check" size={12} strokeWidth={3.5} />
              </span>
            )}
          </label>
        ))}
      </div>

      {why.length > 0 && (
        <div className="pnt-brand-why">
          <h3>Why {options.find((o) => o.value === value)?.label}?</h3>
          <ul>
            {why.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import Icon from '../ui/Icon';
import { BRAND_WHY } from '../../data/paintingContent';

const BRAND_LOGOS = {
  'asian-paints': '/assets/materials/asian-paints.webp',
  berger: '/assets/materials/berger-paints.webp',
};

function BrandCard({ option, selected, onSelect }) {
  const [failedLogo, setFailedLogo] = useState(null);
  const logo = BRAND_LOGOS[option.value];
  const showLogo = logo && failedLogo !== logo;

  return (
    <label
      className={`pnt-brand-card ${selected ? 'selected' : ''}`}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        minWidth: 0,
        minHeight: 160,
        padding: '20px 12px',
        borderRadius: 14,
        border: selected
          ? '2px solid #d9a624'
          : '2px solid #e7e7e7',
        background: selected ? '#fff9e9' : '#ffffff',
        cursor: 'pointer',
        boxShadow: selected
          ? '0 0 0 3px rgba(217, 166, 36, 0.12)'
          : '0 3px 12px rgba(0, 0, 0, 0.04)',
      }}
    >
      <input
        type="radio"
        name="paint_brand"
        value={option.value}
        checked={selected}
        onChange={() => onSelect(option.value)}
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          opacity: 0,
        }}
      />

      <span
        aria-hidden="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: 72,
        }}
      >
        {showLogo ? (
          <img
            src={logo}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFailedLogo(logo)}
            style={{
              display: 'block',
              width: '100%',
              maxWidth: 150,
              height: 72,
              objectFit: 'contain',
            }}
          />
        ) : (
          <Icon name="palette" size={36} />
        )}
      </span>

      <strong
        style={{
          fontSize: 16,
          lineHeight: 1.4,
          textAlign: 'center',
          color: '#202020',
        }}
      >
        {option.label}
      </strong>

      <span
        aria-hidden="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          color: selected ? '#8a650b' : '#737373',
          fontSize: 12,
          fontWeight: selected ? 700 : 400,
        }}
      >
        {selected && <Icon name="check" size={14} />}
        {selected ? 'Selected' : 'Select brand'}
      </span>

      {selected && (
        <span className="pnt-brand-check" aria-hidden="true">
          <Icon name="check" size={12} strokeWidth={3.5} />
        </span>
      )}
    </label>
  );
}

export default function BrandPicker({
  options = [],
  value,
  onSelect,
}) {
  const selectedBrand = options.find((option) => option.value === value);
  const why = BRAND_WHY[value] || [];

  return (
    <div className="pnt-brands">
      <p
        className="question-hint"
        style={{ marginBottom: 16 }}
      >
        Choose your preferred paint brand.
      </p>

      <div
        className="pnt-brand-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 12,
        }}
      >
        {options.map((option) => (
          <BrandCard
            key={option.value}
            option={option}
            selected={value === option.value}
            onSelect={onSelect}
          />
        ))}
      </div>

      {selectedBrand && (
        <div
          className="pnt-brand-why"
          style={{
            marginTop: 18,
            padding: 16,
            border: '1px solid #eee3c4',
            borderRadius: 12,
            background: '#fffaf0',
          }}
        >
          <h3 style={{ margin: '0 0 12px' }}>
            {why.length > 0
              ? `Why ${selectedBrand.label}?`
              : selectedBrand.label}
          </h3>

          {why.length > 0 ? (
            <ul
              style={{
                display: 'grid',
                gap: 10,
                listStyle: 'none',
                margin: 0,
                padding: 0,
              }}
            >
              {why.map((line) => (
                <li
                  key={line}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{ color: '#9b7415', flexShrink: 0 }}
                  >
                    <Icon name="check" size={16} />
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            selectedBrand.hint && (
              <p style={{ margin: 0 }}>
                {selectedBrand.hint}
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}
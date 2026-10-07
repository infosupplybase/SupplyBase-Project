import { useState } from 'react';
import Icon from '../ui/Icon';
import { formatRupees } from '../../lib/money';
import { ITEM_ICON_OVERRIDES } from '../../data/paintingContent';

const TEXTURE_IMAGE = '/assets/projects/interior-by-choice/tv-wall/stone-texture.webp';

const CLEANING_IMAGE =
  'https://images.squarespace-cdn.com/content/v1/6453d23ab5f3007cff4aa827/63fe1953-7434-4c63-81c6-92f6a86c0de4/limpieza-pisos.jpg';

const SHIFTING_IMAGE =
  'https://www.engler-umzuege.de/upload/large/umzug2_large_znjyXxr6Ub.jpg';

const addonImages = {
  'ceiling-painting': '/assets/pop-ceiling/types/flat-ceiling.webp',
  'doors-windows-painting':
    '/assets/services/finishing-work/doors-windows.webp',
  'grill-painting': '/assets/services/fabrication/grills.webp',
  'waterproofing-treatment':
    '/assets/services/civil-construction/waterproofing.webp',
  'crack-filling': '/assets/waterproofing/hero/Cracks.webp',
  'damp-treatment': '/assets/waterproofing/hero/Dampness.webp',
  'texture-feature-wall': TEXTURE_IMAGE,
  'texture-wall': TEXTURE_IMAGE,
  'feature-wall': TEXTURE_IMAGE,
  'deep-cleaning': CLEANING_IMAGE,
  'furniture-shifting': SHIFTING_IMAGE,
};

function getAddonImage(option) {
  const mappedImage = addonImages[option.value];

  if (mappedImage) return mappedImage;

  // Also match labels when catalogue values differ.
  const label = String(option.label || '').toLowerCase();

  if (label.includes('texture') || label.includes('feature wall')) {
    return TEXTURE_IMAGE;
  }
  if (label.includes('deep cleaning')) return addonImages['deep-cleaning'];
  if (label.includes('furniture shifting')) {
    return addonImages['furniture-shifting'];
  }
  if (label.includes('waterproof')) {
    return addonImages['waterproofing-treatment'];
  }
  if (label.includes('door') || label.includes('window')) {
    return addonImages['doors-windows-painting'];
  }

  if (label.includes('cleaning')) {
    return CLEANING_IMAGE;
  }

  if (label.includes('furniture') && label.includes('shift')) {
    return SHIFTING_IMAGE;
  }

  return null;
}

function AddonRow({ option, checked, onToggle }) {
  const [failedImage, setFailedImage] = useState(null);

  const image = getAddonImage(option);
  const showImage = Boolean(image && failedImage !== image);
  const icon = ITEM_ICON_OVERRIDES[option.value] || 'roller';

  return (
    <label className={`pnt-addon ${checked ? 'selected' : ''}`}>
      <input
        type="checkbox"
        value={option.value}
        checked={checked}
        onChange={() => onToggle(option.value)}
      />

      {showImage ? (
        <span
          aria-hidden="true"
          style={{
            display: 'block',
            width: 88,
            height: 72,
            flexShrink: 0,
            overflow: 'hidden',
            borderRadius: 10,
            background: '#f5f1e8',
          }}
        >
          <img
            src={image}
            alt=""
            width={88}
            height={72}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setFailedImage(image)}
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        </span>
      ) : (
        <span className="pnt-addon-icon" aria-hidden="true">
          <Icon name={icon} size={22} />
        </span>
      )}

      <span className="pnt-addon-body" style={{ minWidth: 0 }}>
        <span className="pnt-addon-label">{option.label}</span>

        {option.hint && (
          <span className="pnt-addon-hint">{option.hint}</span>
        )}

        {option.price != null && (
          <span className="pnt-addon-price">
            From {formatRupees(option.price)}
          </span>
        )}
      </span>

      <span className="pnt-addon-check" aria-hidden="true">
        <Icon name="check" size={13} strokeWidth={3.5} />
      </span>
    </label>
  );
}

export default function AddonList({
  options = [],
  selected = [],
  onToggle,
}) {
  const selectedValues = Array.isArray(selected) ? selected : [];

  return (
    <div className="pnt-addon-list">
      {options.map((option) => (
        <AddonRow
          key={option.value}
          option={option}
          checked={selectedValues.includes(option.value)}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}

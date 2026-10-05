import { useState } from 'react';
import Icon from '../ui/Icon';
import { formatRupees } from '../../lib/money';

const homeImages = {
  '1bhk': '/assets/services/architectural-design/1bhk.webp',
  '2bhk': '/assets/services/architectural-design/2bhk.webp',
  '3bhk': '/assets/services/architectural-design/3bhk.webp',
  '4bhk': '/assets/services/architectural-design/4bhk.webp',
  '4bhk-villa': '/assets/services/architectural-design/4bhk.webp',
  'independent-house':
    '/assets/services/architectural-design/villa-bungalow.webp',
};

const roomImages = {
  'living-room': '/assets/pop-ceiling/hero/living-room-cove.webp',
  'living-room-walls': '/assets/pop-ceiling/hero/living-room-cove.webp',
  bedroom: '/assets/projects/bedroom.webp',
  'bedroom-walls': '/assets/projects/bedroom.webp',
  'tv-wall': '/assets/pop-ceiling/hero/pop-tv-wall.webp',
  kitchen: '/assets/waterproofing/hero/kitchen.webp',
  'dining-room': '/assets/pop-ceiling/hero/diningroom.webp',
  ceiling: '/assets/pop-ceiling/types/flat-ceiling.webp',
  'kids-room': '/assets/pop-ceiling/hero/kidsroom.webp',
  'study-home-office': '/assets/pop-ceiling/hero/studyroom.webp',
  'other-area': '/assets/projects/modern-interior.webp',
};

const renovationImages = {
  'full-home': '/assets/projects/painting-finishing.webp',
  'few-walls': '/assets/projects/modern-interior.webp',
  'single-room': '/assets/projects/bedroom.webp',
  ceiling: '/assets/pop-ceiling/types/flat-ceiling.webp',
  'exterior-walls':
    '/assets/services/architectural-design/3d-exterior-design.webp',
  'staircase-common-area':
    '/assets/services/fabrication/staircase.webp',
};

const UNFURNISHED_IMAGE = '/assets/painting/hero/painter-roller.webp';
const RENOVATION_IMAGE = '/assets/projects/villa-renovation.webp';

const packageImages = {
  'unfurnished-home': UNFURNISHED_IMAGE,
  'renovation-repaint': RENOVATION_IMAGE,
  'renovation-repainting': RENOVATION_IMAGE,
  'renovation-painting': RENOVATION_IMAGE,
};

const imagesByQuestion = {
  home_type: homeImages,
  few_walls_area: roomImages,
  renovation_area: renovationImages,
  full_home_painting_type: packageImages,
  few_walls_painting_type: packageImages,
};

function findOptionImage(name, option) {
  const paintingWallImages = {
    '1-wall': '/assets/painting/walls/1-wall.jpg',
    '2-walls': '/assets/painting/walls/2-walls.jpg',
    'multiple-walls': '/assets/painting/walls/multiple-walls.jpg',
  };

  if (name === 'few_walls_area' && paintingWallImages[option.value]) {
    return paintingWallImages[option.value];
  }

  const label = String(option.label || '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ');

  const text = `${option.value || ''} ${option.label || ''}`
    .toLowerCase()
    .replace(/[_-]+/g, ' ');

  const isPaintingType =
    name === 'full_home_painting_type' ||
    name === 'few_walls_painting_type';

  if (isPaintingType) {
    // Match the displayed label first so each package uses its own photo.
    if (/renovation/.test(label)) return RENOVATION_IMAGE;
    if (/unfurnished/.test(label)) return UNFURNISHED_IMAGE;

    const mappedImage = packageImages[option.value];
    if (mappedImage) return mappedImage;

    if (/renovation/.test(text)) return RENOVATION_IMAGE;
    if (/unfurnished/.test(text)) return UNFURNISHED_IMAGE;

    return null;
  }

  const directImage = imagesByQuestion[name]?.[option.value];
  if (directImage) return directImage;

  if (name === 'home_type') {
    const bhk = text.match(/([1-4])\s*bhk/);

    if (bhk) {
      return homeImages[`${bhk[1]}bhk`];
    }

    if (/villa|bungalow|independent/.test(text)) {
      return homeImages['independent-house'];
    }
  }

  if (name === 'few_walls_area') {
    if (/\btv\b|television/.test(text)) {
      return roomImages['tv-wall'];
    }
    if (/living/.test(text)) {
      return roomImages['living-room'];
    }
    if (/kids|children/.test(text)) {
      return roomImages['kids-room'];
    }
    if (/bedroom/.test(text)) {
      return roomImages.bedroom;
    }
    if (/kitchen/.test(text)) {
      return roomImages.kitchen;
    }
    if (/dining/.test(text)) {
      return roomImages['dining-room'];
    }
    if (/ceiling/.test(text)) {
      return roomImages.ceiling;
    }
    if (/study|office/.test(text)) {
      return roomImages['study-home-office'];
    }
    if (/other/.test(text)) {
      return roomImages['other-area'];
    }
  }

  if (name === 'renovation_area') {
    if (/full home|entire home/.test(text)) {
      return renovationImages['full-home'];
    }
    if (/few walls/.test(text)) {
      return renovationImages['few-walls'];
    }
    if (/single room/.test(text)) {
      return renovationImages['single-room'];
    }
    if (/ceiling/.test(text)) {
      return renovationImages.ceiling;
    }
    if (/exterior|outer wall/.test(text)) {
      return renovationImages['exterior-walls'];
    }
    if (/staircase|common area|passage|lobby/.test(text)) {
      return renovationImages['staircase-common-area'];
    }
  }

  return null;
}

export default function OptionCard({
  option,
  name,
  icon,
  checked,
  onSelect,
}) {
  const [failedImage, setFailedImage] = useState(null);

  const image = findOptionImage(name, option);
  const showImage = Boolean(image && failedImage !== image);

  const fallbackIcon =
    icon ||
    (name === 'home_type' ||
    name === 'few_walls_area' ||
    name === 'renovation_area'
      ? 'building'
      : 'roller');

  return (
    <label className={`pnt-option ${checked ? 'selected' : ''}`}>
      <input
        type="radio"
        name={name}
        value={option.value}
        checked={checked}
        onChange={() => onSelect(option.value)}
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
          }}
        >
          <img
            src={image}
            alt=""
            width={88}
            height={72}
            loading="lazy"
            decoding="async"
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
        <span className="pnt-option-icon" aria-hidden="true">
          <Icon name={fallbackIcon} size={24} />
        </span>
      )}

      <span className="pnt-option-body" style={{ minWidth: 0 }}>
        <span className="pnt-option-label">{option.label}</span>

        {option.hint && (
          <span className="pnt-option-hint">{option.hint}</span>
        )}

        {option.price != null && (
          <span className="pnt-option-price">
            From {formatRupees(option.price)}
          </span>
        )}
      </span>

      <span className="pnt-option-radio" aria-hidden="true" />
    </label>
  );
}
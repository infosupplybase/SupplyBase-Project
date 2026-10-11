import PopCeilingCardAnimation from './PopCeilingCardAnimation';
import WaterproofingCardAnimation from './WaterproofingCardAnimation';
import InteriorChoiceCardAnimation from './InteriorChoiceCardAnimation';
import InteriorDesignCardAnimation from './InteriorDesignCardAnimation';
import PaintingCardAnimation from './PaintingCardAnimation';
import Icon from '../ui/Icon';
import useServiceCatalogue from '../../hooks/useServiceCatalogue';
import optimizedImage from '../../lib/optimizedImage';
import { useServiceBookingModal } from '../services/useServiceBookingModal';
import LazyServiceBookingModal, { useWarmBookingModal } from '../services/LazyServiceBookingModal';

const COMING_SOON = new Set(['plumbing', 'electrical', 'ac-services']);

const ICON_BY_SLUG = {
  'interior-design': 'sofa',
  'interior-by-choice': 'layers',
  painting: 'roller',
  waterproofing: 'droplet',
  'pop-ceiling-design': 'ceiling',
  plumbing: 'tap',
  electrical: 'bolt',
  'ac-services': 'fan',
};

const HOME_IMAGE_OVERRIDES = {
  waterproofing: '/assets/waterproofing/hero/Preventive-waterproofing.webp',
};

/** Soft hyphens (\u00ad, invisible unless the line actually breaks there)
    so the long single-word labels split cleanly on narrow phones. */
const LABEL_OVERRIDES = {
  waterproofing: 'Water\u00adproofing',
  plumbing: 'Plumber',
  electrical: 'Electri\u00adcian',
};

const displayName = (category) =>
  LABEL_OVERRIDES[category.slug] || category.name;

// Services whose tile plays a short looping video instead of a photo.
const CARD_VIDEOS = {
  painting: PaintingCardAnimation,
  'interior-design': InteriorDesignCardAnimation,
  'interior-by-choice': InteriorChoiceCardAnimation,
  waterproofing: WaterproofingCardAnimation,
  'pop-ceiling-design': PopCeilingCardAnimation,
};

function ServicePhoto({ category, index }) {
  const heroImage =
    HOME_IMAGE_OVERRIDES[category.slug] || category.heroImage;

  const CardVideo = CARD_VIDEOS[category.slug];

  return (
    <span className="service-tile-photo">
      {CardVideo ? (
        <CardVideo />
      ) : category.slug === 'ac-services' || heroImage ? (
        <img
          src={
            category.slug === 'ac-services'
              ? '/assets/ac-services/ac-unit.webp'
              : optimizedImage(heroImage)
          }
          alt=""
          width={200}
          height={200}
          loading={index < 4 ? 'eager' : 'lazy'}
          decoding="async"
        />
      ) : (
        <span className="service-tile-placeholder">
          <Icon
            name={ICON_BY_SLUG[category.slug] || category.icon}
            size={34}
          />
        </span>
      )}
    </span>
  );
}

export default function PopularServices() {
  const { services: categories, error } = useServiceCatalogue();
  const booking = useServiceBookingModal();
  useWarmBookingModal();

  const available = (categories || []).filter(
    (category) => !COMING_SOON.has(category.slug)
  );

  const upcoming = (categories || []).filter(
    (category) => COMING_SOON.has(category.slug)
  );

  return (
    <section className="popular-services popular-services-grouped">
      <div className="container">
        <div className="popular-services-head">
          <h2 className="popular-services-title">Popular Services</h2>
          <p className="popular-services-hint">
            Tap a service to see its options and book a visit.
          </p>
        </div>

        {error && (
          <div role="alert" className="alert alert-error">
            <Icon name="info" size={18} />
            <span>{error}</span>
          </div>
        )}

        {!error && !categories && (
          <div className="service-tile-grid ps-active-grid" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="service-tile service-tile-skeleton"
              />
            ))}
          </div>
        )}

        {!error && categories && (
          <>
            <div className="service-tile-grid ps-active-grid">
              {available.map((category, index) => (
                <button
                  key={category.slug}
                  type="button"
                  className="service-tile"
                  onClick={() => booking.open(category)}
                >
                  <ServicePhoto category={category} index={index} />
                  <span className="service-tile-name">
                    {displayName(category)}
                  </span>
                </button>
              ))}
            </div>

            {upcoming.length > 0 && (
              <div className="ps-upcoming">
                <div className="popular-services-head">
                  <h2 className="popular-services-title">Coming Soon</h2>
                </div>

                <div className="service-tile-grid ps-upcoming-grid">
                  {upcoming.map((category, index) => (
                    <div
                      key={category.slug}
                      className="service-tile ps-upcoming-tile"
                    >
                      <ServicePhoto category={category} index={index + 5} />
                      <span className="service-tile-name">
                        {displayName(category)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {booking.service && (
        <LazyServiceBookingModal
          key={booking.openToken}
          service={booking.service}
          onClose={booking.close}
        />
      )}
    </section>
  );
}

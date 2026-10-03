import Icon from '../ui/Icon';
import useServiceCatalogue from '../../hooks/useServiceCatalogue';
import optimizedImage from '../../lib/optimizedImage';
import ServiceBookingModal, {
  useServiceBookingModal,
} from '../services/ServiceBookingModal';

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

const LABEL_OVERRIDES = {
  waterproofing: 'Water­proofing',
  electrical: 'Electri­cian',
};

const displayName = (category) =>
  LABEL_OVERRIDES[category.slug] || category.name;

export default function PopularServices() {
  const { services: categories, error } = useServiceCatalogue();
  const booking = useServiceBookingModal();

  return (
    <section className="popular-services">
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
          <div className="service-tile-grid" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="service-tile service-tile-skeleton"
              />
            ))}
          </div>
        )}

        {!error && categories && (
          <div className="service-tile-grid">
            {categories.map((category, index) => (
              <button
                key={category.slug}
                type="button"
                className="service-tile"
                onClick={() => booking.open(category)}
              >
                <span className="service-tile-photo">
                  {(category.slug === 'ac-services' || category.heroImage) ? (
                    <img
                      src={
                        category.slug === 'ac-services'
                          ? '/assets/ac-services/ac-unit.jpg'
                          : optimizedImage(category.heroImage)
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
                        name={
                          ICON_BY_SLUG[category.slug] ||
                          category.icon
                        }
                        size={34}
                      />
                    </span>
                  )}
                </span>

                <span className="service-tile-name">
                  {displayName(category)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {booking.service && (
        <ServiceBookingModal
          key={booking.openToken}
          service={booking.service}
          onClose={booking.close}
        />
      )}
    </section>
  );
}
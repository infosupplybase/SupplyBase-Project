import Icon from '../ui/Icon';
import useServiceCatalogue from '../../hooks/useServiceCatalogue';
import optimizedImage from '../../lib/optimizedImage';
import ServiceBookingModal, { useServiceBookingModal } from '../services/ServiceBookingModal';

/** Backend `icon` values are free-text labels, not guaranteed to match a
    key in components/ui/Icon.jsx — used only as a placeholder if a category
    has no hero image at all. */
const ICON_BY_SLUG = {
  'interior-design': 'sofa',
  'interior-by-choice': 'layers',
  painting: 'roller',
  waterproofing: 'droplet',
  'pop-ceiling-design': 'ceiling',
  plumbing: 'tap',
  electrical: 'bolt',
  'other-services': 'settings',
};

/** Soft-hyphen (­, invisible unless the browser actually breaks the
    line there) insertion points for the two labels that are a single long
    word with no space to wrap at. Deliberately explicit rather than relying
    on CSS hyphens:auto — its dictionary-based guess is inconsistent across
    browsers and, on some phones, breaks at an ugly point ("Waterproof-ing"
    instead of "Water-proofing"). Every other label wraps fine at its own
    word boundary and needs no override. */
const LABEL_OVERRIDES = {
  waterproofing: 'Water­proofing',
  electrical: 'Electri­cian',
};

const displayName = (category) => LABEL_OVERRIDES[category.slug] || category.name;

export default function PopularServices() {
  const { services: categories, error } = useServiceCatalogue();

  const booking = useServiceBookingModal();

  return (
    <section className="popular-services">
      <div className="container">
        <div className="popular-services-head">
          <h2 className="popular-services-title">Popular Services</h2>
          <p className="popular-services-hint">Tap a service to see its options and book a visit.</p>
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
              <div key={i} className="service-tile service-tile-skeleton" />
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
                  {category.heroImage ? (
                    <img
                      src={optimizedImage(category.heroImage)}
                      alt=""
                      width={200}
                      height={200}
                      /* The first row is on screen straight away; the rest can wait. */
                      loading={index < 4 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  ) : (
                    <span className="service-tile-placeholder">
                      <Icon name={ICON_BY_SLUG[category.slug] || category.icon} size={34} />
                    </span>
                  )}
                </span>
                <span className="service-tile-name">{displayName(category)}</span>
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

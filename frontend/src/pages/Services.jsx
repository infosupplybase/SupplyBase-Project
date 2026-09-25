import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import Reveal from '../components/ui/Reveal';
import CtaBand from '../components/ui/CtaBand';
import useServiceCatalogue from '../hooks/useServiceCatalogue';
import ServiceBookingModal, { useServiceBookingModal } from '../components/services/ServiceBookingModal';
import optimizedImage from '../lib/optimizedImage';

/**
 * Every service we offer.
 *
 * Fetched, not hard-coded: the home tiles, footer, menus and quote form read
 * the same catalogue (see useServiceCatalogue), so they cannot drift apart.
 */

const serviceImages = {
  'interior-design': '/assets/services/interior-design.webp',
  'interior-by-choice': '/assets/services/interior-by-choice.webp',
  painting: '/assets/services/painting.webp',
  waterproofing: '/assets/services/waterproofing.avif',
  'pop-ceiling-design': '/assets/services/pop-ceiling-design.webp',
  plumbing: '/assets/services/plumber.webp',
  electrical: '/assets/services/electrician.avif',
  'other-services': '/assets/services/other-services.webp',
};

export default function Services() {
  const { services, loading, error } = useServiceCatalogue([]);

  const booking = useServiceBookingModal();

  return (
    <>
      <PageHero
        eyebrow="OUR SERVICES"
        title="WHAT WE DO"
        text="One accountable team for every job. Book a site visit and we will assess the work and send you a written quotation."
        image="/assets/services/service-hero.webp"
        breadcrumbs={[{ label: 'Services' }]}
      />

      <section className="section">
        <div className="container">
          {loading && (
            <p className="question-hint">
              Loading services…
            </p>
          )}

          {error && (
            <div
              role="alert"
              className="alert alert-error"
            >
              <Icon
                name="info"
                size={18}
              />

              <span>
                {error}
              </span>
            </div>
          )}

          <div className="svc-grid">
            {services.map((service, i) => (
              <Reveal
                key={service.slug}
                delay={i * 70}
              >
                <article
                  className="svc-card"
                  data-service={service.slug}
                  onClick={() => booking.open(service)}
                >
                  <div className="svc-card-media">
                    <img loading="lazy" decoding="async"
                      src={serviceImages[service.slug] || optimizedImage(service.heroImage)}
                      alt={service.name}
                    />
                  </div>

                  <div className="svc-card-body">
                    {/* <div className="svc-card-icon">
                      <Icon
                        name={service.icon || 'tools'}
                        size={22}
                        strokeWidth={1.4}
                      />
                    </div> */}

                    <h3>
                      {service.name}
                    </h3>
{/* 
                    <p>
                      {service.description}
                    </p> */}

                    <div className="svc-card-foot">
                      {/* No onClick here — the click bubbles up to the card's own
                          handler above (a real <button>'s keyboard activation
                          dispatches a bubbling click too, so Tab+Enter still works). */}
                      <button type="button" className="btn btn-primary btn-sm">
                        BOOK NOW

                        <Icon
                          name="arrow-right"
                          size={15}
                        />
                      </button>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />

      {booking.service && (
        <ServiceBookingModal
          key={booking.openToken}
          service={booking.service}
          onClose={booking.close}
        />
      )}
    </>
  );
}

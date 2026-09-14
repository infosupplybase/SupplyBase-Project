import { useEffect, useState } from 'react';
import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import Reveal from '../components/ui/Reveal';
import CtaBand from '../components/ui/CtaBand';
import api, { friendlyError } from '../lib/api';
import ServiceBookingModal, { useServiceBookingModal } from '../components/services/ServiceBookingModal';

/**
 * The four services (RULE 1).
 *
 * Fetched, not hard-coded: this and the booking form read the same catalogue,
 * so they cannot drift apart.
 */

const serviceImages = {
  'interior-design': '/assets/services/interior-design.webp',
  'interior-by-choice': '/assets/services/interior-by-choice.png',
  painting: '/assets/services/painting.jpg',
  waterproofing: '/assets/services/waterproofing.avif',
  'pop-ceiling-design': '/assets/services/pop-ceiling-design.jpg',
  plumbing: '/assets/services/plumber.jpg',
  electrical: '/assets/services/electrician.avif',
  'other-services': '/assets/services/other-services.webp',
};

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const booking = useServiceBookingModal();

  useEffect(() => {
    let cancelled = false;

    api
      .services()
      .then((result) => {
        if (!cancelled) {
          setServices(result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(friendlyError(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageHero
        eyebrow="OUR SERVICES"
        title="WHAT WE DO"
        text="Four services, one accountable team. Book a site visit and we will assess the work and send you a written quotation."
        image="/assets/services/service-hero.jpg"
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
                >
                  <div className="svc-card-media">
                    <img
                      src={serviceImages[service.slug]}
                      alt={service.name}
                    />
                  </div>

                  <div className="svc-card-body">
                    <div className="svc-card-icon">
                      <Icon
                        name={service.icon || 'tools'}
                        size={22}
                        strokeWidth={1.4}
                      />
                    </div>

                    <h3>
                      {service.name}
                    </h3>

                    <p>
                      {service.description}
                    </p>

                    <div className="svc-card-foot">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => booking.open(service)}
                      >
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

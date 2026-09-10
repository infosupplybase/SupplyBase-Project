import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import Reveal from '../components/ui/Reveal';
import CtaBand from '../components/ui/CtaBand';
import api, { friendlyError } from '../lib/api';
import ServiceBooking from './ServiceBooking';

/**
 * The four services (RULE 1).
 *
 * Fetched, not hard-coded: this and the booking form read the same catalogue,
 * so they cannot drift apart.
 */
export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const modalScrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    api
      .services()
      .then((result) => {
        if (!cancelled) setServices(result);
      })
      .catch((err) => {
        if (!cancelled) setError(friendlyError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
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
        image="/assets/hero-house.svg"
        breadcrumbs={[{ label: 'Services' }]}
      />

      <section className="section">
        <div className="container">
          {loading && <p className="question-hint">Loading services…</p>}

          {error && (
            <div role="alert" className="alert alert-error">
              <Icon name="info" size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="svc-grid">
            {services.map((service, i) => (
              <Reveal key={service.slug} delay={i * 70}>
                <article
  className="
    svc-card
    !bg-black/5
    backdrop-blur-xl
    !border-white/40
    !shadow-[0_8px_28px_rgba(0,0,0,0.10)]
  "
  data-service={service.slug}
>
                  <div className="svc-card-icon">
                    <Icon name={service.icon || 'tools'} size={30} strokeWidth={1.4} />
                  </div>
                  <h2>{service.name}</h2>
                  <p>{service.description}</p>
                  <div className="svc-card-foot">
                    <button
  type="button"
  className="btn btn-primary btn-sm"
  onClick={() => setSelectedService(service)}
>
  BOOK NOW
  <Icon name="arrow-right" size={15} />
</button>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
      {selectedService && (
  <div
    className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/65 backdrop-blur-[3px] p-4"
    onClick={() => setSelectedService(null)}
  >
    <div
  className="
  relative
  w-full
  max-w-[760px]
  max-h-[88vh]
  overflow-hidden
  rounded-2xl
  bg-white
  shadow-2xl

  max-sm:h-[92vh]
  max-sm:max-h-[92vh]
  max-sm:rounded-xl
"
  onClick={(e) => e.stopPropagation()}
>
      <button
        type="button"
        onClick={() => setSelectedService(null)}
        className="
  !absolute !right-5 !top-5 !z-50
  !flex !h-10 !w-10
  !items-center !justify-center
  !rounded-full
  !border !border-gray-200
  !bg-white
  !text-xl !text-gray-700
  !shadow-sm
  transition
  hover:!bg-gray-100
"
        aria-label="Close booking modal"
      >
        ✕
      </button>

      <div className="px-6 pt-6 pr-16">
        <p className="mb-1 text-sm font-semibold uppercase tracking-[0.16em] text-amber-500">
          Book a service
        </p>

        <h2 className="text-2xl font-bold text-gray-950">
          {selectedService.name
          }
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          {selectedService.description}
        </p>
      </div>

      <div className="my-6 h-px bg-gray-200" />

      <div
  ref={modalScrollRef}
  className="
  max-h-[calc(88vh-170px)]
  overflow-y-auto
  px-6 pb-6
  [scrollbar-width:none]
  [&::-webkit-scrollbar]:hidden
"
>
  <ServiceBooking
  serviceSlug={selectedService.slug}
  modal={true}
  onClose={() => setSelectedService(null)}
  onStepChange={() => {
  requestAnimationFrame(() => {
    modalScrollRef.current?.scrollTo({
      top: 0,
      behavior: 'auto',
    });
  });
}}
/>
</div>
    </div>
  </div>
)}
    </>
  );
}

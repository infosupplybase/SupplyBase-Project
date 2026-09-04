import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import Reveal from '../components/ui/Reveal';
import CtaBand from '../components/ui/CtaBand';
import api, { friendlyError } from '../lib/api';

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
                <article className="svc-card" data-service={service.slug}>
                  <div className="svc-card-icon">
                    <Icon name={service.icon || 'tools'} size={30} strokeWidth={1.4} />
                  </div>
                  <h2>{service.name}</h2>
                  <p>{service.description}</p>
                  <div className="svc-card-foot">
                    <Link to={`/services/${service.slug}`} className="btn btn-primary btn-sm">
                      BOOK NOW
                      <Icon name="arrow-right" size={15} />
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}

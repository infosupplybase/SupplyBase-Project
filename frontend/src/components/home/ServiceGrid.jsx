import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import Reveal from '../ui/Reveal';
import api from '../../lib/api';

/**
 * The four services on the home page.
 *
 * Reads the same catalogue the booking form does, so the home page can never
 * offer a service the form does not know about.
 */
export default function ServiceGrid() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    let cancelled = false;
    api
      .services()
      .then((r) => {
        if (!cancelled) setServices(r);
      })
      // A failure here must not blank the home page — the rest of it still
      // sells the business, and the nav still reaches /services.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="svc-grid">
      {services.map((service, i) => (
        <Reveal key={service.slug} delay={i * 70}>
          <article className="svc-card" data-service={service.slug}>
            <div className="svc-card-icon">
              <Icon name={service.icon || 'tools'} size={30} strokeWidth={1.4} />
            </div>
            <h3>{service.name}</h3>
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
  );
}

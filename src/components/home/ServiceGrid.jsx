import ServiceCard from './ServiceCard';
import { services } from '../../data/services';

/**
 * ServiceGrid — renders every service category from services.js.
 */
export default function ServiceGrid({ limit, maxSubServices = 8 }) {
  const list = limit ? services.slice(0, limit) : services;

  return (
    <div className="service-grid">
      {list.map((service, i) => (
        <ServiceCard
          key={service.slug}
          service={service}
          delay={(i % 4) * 70}
          maxSubServices={maxSubServices}
        />
      ))}
    </div>
  );
}

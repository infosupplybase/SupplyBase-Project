import ServiceCard from './ServiceCard';
import { services } from '../../data/services';

/**
 * ServiceGrid — renders service cards.
 *
 * With no props it renders every service from services.js. Pass `list` to
 * render a specific set (the home page passes its four featured services),
 * or `limit` to take the first N.
 */
export default function ServiceGrid({ list, limit, maxSubServices = 8, columns }) {
  const items = list ?? (limit ? services.slice(0, limit) : services);

  return (
    <div className={`service-grid${columns ? ` service-grid-${columns}` : ''}`}>
      {items.map((service, i) => (
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

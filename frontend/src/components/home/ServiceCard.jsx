import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import Reveal from '../ui/Reveal';

/**
 * ServiceCard — one service category. The whole card links to the service page,
 * and each sub-service links to its section on that page.
 */
export default function ServiceCard({ service, delay = 0, maxSubServices = 8 }) {
  const to = `/services/${service.slug}`;

  return (
    <Reveal delay={delay}>
      {/* data-service picks this service's hue out of the identity map in
          components.css — the card itself never names a colour. */}
      <article className="service-card" data-service={service.slug}>
        <div className="service-card-icon">
          <Icon name={service.icon} size={28} strokeWidth={1.4} />
        </div>
        <span className="service-card-num">{service.number}</span>
        <h3>
          <Link to={to}>{service.name}</Link>
        </h3>

        <ul className="service-card-list">
          {service.subServices.slice(0, maxSubServices).map((sub) => (
            <li key={sub.name}>
              <Link to={`${to}#${slugify(sub.name)}`}>{sub.name}</Link>
            </li>
          ))}
        </ul>

        <div className="service-card-foot">
          <Link to={to} className="link-arrow">
            VIEW DETAILS
            <Icon name="arrow-right" size={16} />
          </Link>
        </div>
      </article>
    </Reveal>
  );
}

export const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

import Link from 'next/link';
import Icon from '../ui/Icon';
import { getServicesByGroup } from '../../data/services';

/**
 * ServiceMegaMenu — the full services panel that drops from the header.
 * Groups come straight from services.js, so adding a service adds it here.
 */
export default function ServiceMegaMenu({ open, onNavigate }) {
  const groups = getServicesByGroup();

  return (
    <div className={`mega ${open ? 'open' : ''}`} role="menu" aria-hidden={!open}>
      <div className="container">
        <div className="mega-inner">
          {groups.map(({ group, items }) => (
            <div key={group}>
              <div className="mega-group-title">{group}</div>
              {items.map((service) => (
                <Link
                  key={service.slug}
                  href={`/services/${service.slug}`}
                  className="mega-item"
                  onClick={onNavigate}
                  tabIndex={open ? 0 : -1}
                >
                  {service.name}
                </Link>
              ))}
            </div>
          ))}

          <div className="mega-cta">
            <h4>All Services</h4>
            <p>See all 10 categories and everything we deliver under one contract.</p>
            <Link
              href="/services"
              className="btn btn-primary btn-sm"
              onClick={onNavigate}
              tabIndex={open ? 0 : -1}
            >
              VIEW ALL
              <Icon name="arrow-right" size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

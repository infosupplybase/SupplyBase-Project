import { Link, Outlet, useLocation } from 'react-router-dom';
import Icon from '../ui/Icon';
import { contact } from '../../data/siteConfig';
import { telHref, whatsappHref } from '../../lib/contact';
import { COMING_SOON_NAMES, comingSoonServiceForPath } from '../../lib/comingSoon';

/**
 * Wraps the booking pages of services that are labelled "Coming Soon"
 * (lib/comingSoon.js). While a service is coming soon, every one of its pages
 * (category, cart, checkout, consultation, old /booking links) shows this page
 * instead, so nobody can book or pay for it. The API refuses those bookings too.
 */
export default function ComingSoonGate() {
  const { pathname } = useLocation();
  const service = comingSoonServiceForPath(pathname);
  if (!service) return <Outlet />;

  const name = COMING_SOON_NAMES[service] || 'This service';
  const phrase = service === 'ac-services' ? 'AC services' : name.toLowerCase();
  return (
    <div className="notfound coming-soon-page">
      <div className="coming-soon-badge">COMING SOON</div>
      <h1 style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)' }}>{name} is coming soon</h1>
      <p style={{ color: 'var(--grey-600)', maxWidth: '50ch' }}>
        We&rsquo;re not taking online bookings for {phrase} yet.
        If you need help now, call or WhatsApp us and we&rsquo;ll do our best to arrange it.
      </p>
      <div className="btn-row" style={{ justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
        <a href={telHref} className="btn btn-dark">
          <Icon name="phone" size={17} />
          CALL {contact.phoneDisplay}
        </a>
        <a
          href={whatsappHref(`Hello, I need ${phrase} help at my home.`)}
          className="btn btn-ghost"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="whatsapp" size={17} />
          WHATSAPP US
        </a>
        <Link to="/services" className="btn btn-ghost">
          SEE AVAILABLE SERVICES
          <Icon name="arrow-right" size={17} />
        </Link>
      </div>
    </div>
  );
}

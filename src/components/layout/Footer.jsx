import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import { company, contact, quickLinks, social } from '../../data/siteConfig';
import { services } from '../../data/services';
import { telHref, mailtoHref, whatsappHref } from '../../lib/contact';

export default function Footer() {
  const year = new Date().getFullYear();
  const activeSocial = social.filter((s) => s.url);

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* brand */}
          <div className="footer-brand">
            <img src="/assets/brand/logo-stacked.png" alt={`${company.name} logo`} />
            <p>{company.longIntro}</p>
            {activeSocial.length > 0 && (
              <div className="footer-social">
                {activeSocial.map((s) => (
                  <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
                    <Icon name={s.id} size={18} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* quick links */}
          <div>
            <h4>Quick Links</h4>
            <ul className="footer-links">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* services */}
          <div>
            <h4>Services</h4>
            <ul className="footer-links two-col">
              {services.map((service) => (
                <li key={service.slug}>
                  <Link to={`/services/${service.slug}`}>{service.shortName}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* contact */}
          <div>
            <h4>Contact Us</h4>
            <div className="footer-contact">
              <a href={telHref}>
                <Icon name="phone" size={17} />
                {contact.phoneDisplay}
              </a>
              <a href={mailtoHref}>
                <Icon name="mail" size={17} />
                {contact.email}
              </a>
              <div>
                <Icon name="map-pin" size={17} />
                <span>{contact.addressLines.join(', ')}</span>
              </div>
              <div>
                <Icon name="clock" size={17} />
                <span>{contact.workingHours}</span>
              </div>
            </div>

            <div className="footer-cta-box" style={{ marginTop: 20 }}>
              <p>Let&rsquo;s discuss your project.</p>
              <Link to="/quote" className="btn btn-primary btn-sm btn-block" style={{ marginBottom: 10 }}>
                REQUEST A QUOTE
                <Icon name="arrow-right" size={16} />
              </Link>
              <a
                href={whatsappHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp btn-sm btn-block"
              >
                <Icon name="whatsapp" size={16} />
                WHATSAPP US
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {year} {company.name}. All rights reserved.
          </span>
          <nav>
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms">Terms &amp; Conditions</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

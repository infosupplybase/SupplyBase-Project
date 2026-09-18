import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import { contact } from '../../data/siteConfig';
import { telHref, mailtoHref, whatsappHref } from '../../lib/contact';

/**
 * The "need something?" contact card + quick links shared by every account
 * page (Bookings, Profile) — the same content Dashboard.jsx used to carry
 * on its own, now reused instead of duplicated.
 */
export default function AccountSidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-card sidebar-cta">
        <h4>Need something?</h4>
        <p>Your project manager is one message away.</p>
        <div className="sidebar-contact">
          <a href={telHref} className="btn btn-primary btn-sm btn-block">
            <Icon name="phone" size={16} />
            {contact.phoneDisplay}
          </a>
          <a
            href={whatsappHref('Hello Supplybase, I have a question about my account.')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp btn-sm btn-block"
          >
            <Icon name="whatsapp" size={16} />
            WHATSAPP US
          </a>
          <a href={mailtoHref} className="btn btn-outline btn-sm btn-block">
            <Icon name="mail" size={16} />
            EMAIL US
          </a>
        </div>
      </div>

      <div className="sidebar-card">
        <h4>Quick Links</h4>
        <div className="sidebar-list">
          <Link to="/services">
            Our Services
            <Icon name="chevron-right" size={15} />
          </Link>
          {/* Projects section disabled sitewide — see App.jsx.
          <Link to="/projects">
            Our Projects
            <Icon name="chevron-right" size={15} />
          </Link>
          */}
          <Link to="/quote">
            Start a New Enquiry
            <Icon name="chevron-right" size={15} />
          </Link>
          <Link to="/contact">
            Contact Us
            <Icon name="chevron-right" size={15} />
          </Link>
        </div>
      </div>
    </aside>
  );
}

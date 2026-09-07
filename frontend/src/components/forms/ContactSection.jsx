import Icon from '../ui/Icon';
import { contact } from '../../data/siteConfig';
import { telHref, mailtoHref, whatsappHref } from '../../lib/contact';

/**
 * ContactSection — the phone / email / WhatsApp / location cards.
 * Every detail comes from siteConfig.js.
 */
export default function ContactSection() {
  return (
    <div className="contact-cards">
      <a className="
  contact-card
  !bg-white/15
  backdrop-blur-xl
  !border-white/25
  !shadow-[0_8px_24px_rgba(0,0,0,0.08)]
" href={telHref}>
        <span className="contact-card-icon">
          <Icon name="phone" size={22} />
        </span>
        <span>
          <h4>Call Us</h4>
          <p>{contact.phoneDisplay}</p>
        </span>
      </a>

      <a className="
  contact-card
  !bg-white/15
  backdrop-blur-xl
  !border-white/25
  !shadow-[0_8px_24px_rgba(0,0,0,0.08)]
" href={whatsappHref()} target="_blank" rel="noopener noreferrer">
        <span className="contact-card-icon">
          <Icon name="whatsapp" size={22} />
        </span>
        <span>
          <h4>WhatsApp</h4>
          <p>Message us — we usually reply the same day</p>
        </span>
      </a>

      <a className="
  contact-card
  !bg-white/15
  backdrop-blur-xl
  !border-white/25
  !shadow-[0_8px_24px_rgba(0,0,0,0.08)]
" href={mailtoHref}>
        <span className="contact-card-icon">
          <Icon name="mail" size={22} />
        </span>
        <span>
          <h4>Email</h4>
          <p>{contact.email}</p>
        </span>
      </a>

      <div className="
  contact-card
  !bg-white/15
  backdrop-blur-xl
  !border-white/25
  !shadow-[0_8px_24px_rgba(0,0,0,0.08)]
">
        <span className="contact-card-icon">
          <Icon name="map-pin" size={22} />
        </span>
        <span>
          <h4>Location</h4>
          <p>{contact.addressLines.join(', ')}</p>
          <div className="area-list">
            {contact.serviceAreas.map((area) => (
              <span key={area}>{area}</span>
            ))}
          </div>
        </span>
      </div>

      <div className="
  contact-card
  !bg-white/15
  backdrop-blur-xl
  !border-white/25
  !shadow-[0_8px_24px_rgba(0,0,0,0.08)]
">
        <span className="contact-card-icon">
          <Icon name="clock" size={22} />
        </span>
        <span>
          <h4>Working Hours</h4>
          <p>{contact.workingHours}</p>
        </span>
      </div>
    </div>
  );
}

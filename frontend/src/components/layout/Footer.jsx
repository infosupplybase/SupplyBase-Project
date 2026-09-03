import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import { company, contact, quickLinks, social } from '../../data/siteConfig';
import { homeServices } from '../../data/homeServices';
import { telHref, mailtoHref, whatsappHref } from '../../lib/contact';

/*
 * The same four customer-facing services the home page offers, read from the
 * one file that defines them. A second hand-written list here would be the
 * thing that goes stale when a name or a route changes.
 */
const footerServices = homeServices.map((s) => ({
  id: s.id,
  name: s.title,
  route: s.route,
  icon: s.icon,
}));

const WHATSAPP_MESSAGE = 'Hello Supplybase, I would like to discuss my project.';

/** Collapses the long link lists on a phone and leaves them open above it. */
function useIsPhone() {
  const query = '(max-width: 767px)';
  const [isPhone, setIsPhone] = useState(
    () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia(query).matches
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia(query);
    const sync = () => setIsPhone(mq.matches);

    /*
     * Subscribed twice on purpose. `change` is the right event and fires on
     * its own in every current browser, but it is the only signal telling the
     * footer to switch layouts, and if it goes missing the footer is stuck in
     * whichever mode it loaded in until the page is reloaded. `resize` costs
     * nothing as a backstop: sync sets the same boolean, and React drops a
     * render when the state has not actually changed.
     */
    mq.addEventListener('change', sync);
    window.addEventListener('resize', sync);
    sync();

    return () => {
      mq.removeEventListener('change', sync);
      window.removeEventListener('resize', sync);
    };
  }, []);

  return isPhone;
}

/**
 * A footer column that becomes an accordion on a phone.
 *
 * Built on <details>, so the open/close behaviour, the keyboard handling and
 * the screen-reader announcement all come from the browser. Above the phone
 * breakpoint it renders a plain heading and list instead — <details open> on
 * desktop would still let someone collapse a column that is meant to be
 * permanent.
 */
function FooterColumn({ title, id, children, collapsible = true }) {
  const isPhone = useIsPhone();

  if (isPhone && collapsible) {
    return (
      <details className="ft-col ft-accordion">
        <summary className="ft-heading">
          {title}
          <Icon name="chevron-down" size={18} className="ft-accordion-chevron" />
        </summary>
        {children}
      </details>
    );
  }

  return (
    <div className="ft-col">
      <h2 className="ft-heading" id={id}>
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  /*
   * Only social accounts with a URL are shown. Rendering the other circles
   * would put four buttons in the footer that go nowhere. Fill in `url` in
   * data/siteConfig.js and they appear.
   */
  const activeSocial = social.filter((s) => s.url);

  /* Stored as one string; the design puts the days and the times on separate
     lines. Split rather than duplicated so there is still one source. */
  const [hoursDays, hoursTimes] = contact.workingHours.split(/,\s*/);

  return (
    <footer className="ft">
      <div className="ft-inner">
        <div className="ft-grid">
          {/* ------------------------------------------------------ brand */}
          <div className="ft-col ft-brand">
            <img
              className="ft-logo"
              src="/assets/brand/logo-stacked.png"
              alt={`${company.name} logo`}
              width="220"
              height="150"
            />
            <p className="ft-intro">{company.longIntro}</p>

            {activeSocial.length > 0 && (
              <ul className="ft-social">
                {activeSocial.map((s) => (
                  <li key={s.id}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                    >
                      <Icon name={s.id} size={18} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ------------------------------------------------- quick links */}
          <FooterColumn title="QUICK LINKS" id="ft-quick">
            <nav aria-label="Footer">
              <ul className="ft-list">
                {quickLinks.map((link) => (
                  <li key={link.path}>
                    <Link to={link.path}>
                      <span>{link.label}</span>
                      <Icon name="chevron-right" size={16} className="ft-arrow" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </FooterColumn>

          {/* ---------------------------------------------------- services */}
          <FooterColumn title="SERVICES" id="ft-services">
            <ul className="ft-list ft-list-services">
              {footerServices.map((service) => (
                <li key={service.id}>
                  <Link to={service.route}>
                    <Icon name={service.icon} size={20} className="ft-service-icon" />
                    <span>{service.name}</span>
                    <Icon name="chevron-right" size={16} className="ft-arrow" />
                  </Link>
                </li>
              ))}
            </ul>
          </FooterColumn>

          {/* ----------------------------------------------------- contact */}
          <FooterColumn title="CONTACT US" id="ft-contact" collapsible={false}>
            <ul className="ft-contact">
              <li>
                <Icon name="phone" size={19} />
                <a href={telHref}>{contact.phoneDisplay}</a>
              </li>
              <li>
                <Icon name="mail" size={19} />
                <a href={mailtoHref}>{contact.email}</a>
              </li>
              <li>
                <Icon name="map-pin" size={19} />
                <span>{contact.addressLines.join(', ')}</span>
              </li>
              <li>
                <Icon name="clock" size={19} />
                <span>
                  {hoursDays}
                  <br />
                  {hoursTimes}
                </span>
              </li>
            </ul>

            <div className="ft-cta">
              <p>Let&rsquo;s discuss your project.</p>
              <Link to="/quote" className="ft-btn ft-btn-gold">
                REQUEST A QUOTE
                <Icon name="arrow-right" size={17} />
              </Link>
              <a
                href={whatsappHref(WHATSAPP_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
                className="ft-btn ft-btn-whatsapp"
              >
                <Icon name="whatsapp" size={18} />
                WHATSAPP US
              </a>
            </div>
          </FooterColumn>
        </div>

        {/* ------------------------------------------------------- bottom */}
        <div className="ft-bottom">
          <p>
            © {year} <span className="ft-gold">{company.name}</span>. All rights reserved.
          </p>
          <nav className="ft-legal" aria-label="Legal">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <span aria-hidden="true">|</span>
            <Link to="/terms">Terms &amp; Conditions</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

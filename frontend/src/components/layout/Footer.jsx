import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import {
  company,
  contact,
  partnersUrl,
  quickLinks,
  social,
} from '../../data/siteConfig';
import { activeServices } from '../../data/services';
import useServiceCatalogue, {
  serviceRoute,
} from '../../hooks/useServiceCatalogue';
import {
  telHref,
  mailtoHref,
  whatsappHref,
} from '../../lib/contact';
import { useLoginGate } from '../auth/LoginGate';

const WHATSAPP_MESSAGE =
  'Hello Supplybase, I would like to discuss my project.';

/**
 * Detect mobile screen.
 */
function useIsPhone() {
  const query = '(max-width: 767px)';

  const [isPhone, setIsPhone] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia(query).matches
  );

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !window.matchMedia
    ) {
      return undefined;
    }

    const mq = window.matchMedia(query);

    const sync = () => {
      setIsPhone(mq.matches);
    };

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
 * Footer column.
 * On mobile, Quick Links and Services become accordions.
 */
function FooterColumn({
  title,
  id,
  children,
  collapsible = true,
}) {
  const isPhone = useIsPhone();

  if (isPhone && collapsible) {
    return (
      <details className="ft-col ft-accordion">
        <summary className="ft-heading">
          {title}

          <Icon
            name="chevron-down"
            size={18}
            className="ft-accordion-chevron"
          />
        </summary>

        {children}
      </details>
    );
  }

  return (
    <div className="ft-col">
      <h2
        className="ft-heading"
        id={id}
      >
        {title}
      </h2>

      {children}
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  const { openLogin } = useLoginGate();

  /*
   * Services come from the live catalogue, the same source as the home
   * tiles and the /services page. The static list only fills in until it
   * arrives (or if it can't be reached) so the footer is never empty.
   */
  const { services: catalogue } = useServiceCatalogue(activeServices);


  /*
   * Only social accounts having a URL are displayed.
   */
  const activeSocial = social.filter(
    (s) => s.url
  );

  return (
    <footer className="ft">

      <div className="ft-inner">

        {/* =====================================================
            LOGO + TAGLINE
        ====================================================== */}

        <div className="ft-brand">

          <img loading="lazy" decoding="async"
            className="ft-logo"
            src="/assets/brand/logo-stacked.webp"
            alt={`${company.name} logo`}
          />

          <p className="ft-intro">
            Your trusted partner for home improvement,
            from start to finish.
          </p>

          {/* Always visible, not tucked inside a collapsed accordion — this
              is the footer's one job that matters most. */}
          <Link
            to="/quote"
            className="ft-quote-glass"
          >
            REQUEST A QUOTE

            <Icon
              name="arrow-right"
              size={17}
            />

          </Link>

        </div>


        {/* =====================================================
            FOUR FOOTER COLUMNS
        ====================================================== */}

        <div className="ft-grid">

          {/* =================================================
              QUICK LINKS
          ================================================== */}

          <FooterColumn
            title="QUICK LINKS"
            id="ft-quick"
          >

            <nav aria-label="Footer">

              <ul className="ft-list">

                {quickLinks.map((link) => (
                  <li key={link.path}>

                    {link.path === '/login' ? (
                      <button type="button" className="ft-link-btn" onClick={openLogin}>
                        {link.label}
                      </button>
                    ) : (
                      <Link to={link.path}>
                        {link.label}
                      </Link>
                    )}

                  </li>
                ))}

              </ul>

            </nav>

          </FooterColumn>


          {/* =================================================
              SERVICES
          ================================================== */}

          <FooterColumn
            title="SERVICES"
            id="ft-services"
          >

            <ul className="ft-list ft-list-services">

              {catalogue.map((service) => (
                <li key={service.slug}>

                  <Link to={serviceRoute(service.slug)}>
                    {service.name}
                  </Link>

                </li>
              ))}

            </ul>

          </FooterColumn>


          {/* =================================================
              CONTACT US
          ================================================== */}

          <FooterColumn
            title="CONTACT US"
            id="ft-contact"
            collapsible={false}
          >

            <ul className="ft-contact">

              {/* Phone */}
              <li>

                <Icon
                  name="phone"
                  size={19}
                />

                <a href={telHref}>
                  {contact.phoneDisplay}
                </a>

              </li>


              {/* Email */}
              <li>

                <Icon
                  name="mail"
                  size={19}
                />

                <a href={mailtoHref}>
                  {contact.email}
                </a>

              </li>


              {/* Address */}
              <li>

                <Icon
                  name="map-pin"
                  size={19}
                />

                <span>
                  {contact.addressLines.join(', ')}
                </span>

              </li>


             

            </ul>

          </FooterColumn>


          {/* =================================================
              SOCIAL LINKS
          ================================================== */}

          <FooterColumn
            title="SOCIAL LINKS"
            id="ft-social"
          >

            <ul className="ft-social">

              {/* WhatsApp — the channel most of this business's customers
                  actually reach for; pre-filled so they don't have to think
                  of an opening line. */}
              <li>

                <a
                  href={whatsappHref(WHATSAPP_MESSAGE)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                >
                  <Icon
                    name="whatsapp"
                    size={18}
                  />
                </a>

              </li>


              {/* Call — one tap to dial, which reading the number in
                  Contact Us doesn't give a phone user. */}
              <li>

                <a
                  href={telHref}
                  aria-label="Call"
                >
                  <Icon
                    name="phone"
                    size={18}
                  />
                </a>

              </li>


              {/* Real social platforms, driven by siteConfig's `social`
                  list — only the ones with a url actually configured show
                  up here, so adding or removing a platform never needs a
                  code change. */}
              {activeSocial.map((platform) => (
                <li key={platform.id}>

                  <a
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={platform.label}
                  >
                    <Icon
                      name={platform.id}
                      size={18}
                    />
                  </a>

                </li>
              ))}

            </ul>

          </FooterColumn>

        </div>


        {/* =====================================================
            BOTTOM SECTION
        ====================================================== */}

        <div className="ft-bottom">

          <p>
            © {year}{' '}

            <span className="ft-gold">
              {company.name}
            </span>

            . All rights reserved.
          </p>


          <nav
            className="ft-legal"
            aria-label="Legal"
          >

            {/* The full policy pages, so the footer and /privacy-policy can
                never say different things (the old pop-up carried a second,
                shorter copy of each policy). */}
            <Link to="/privacy-policy" className="ft-legal-btn">
              Privacy Policy
            </Link>


            <span aria-hidden="true">
              |
            </span>


            <Link to="/terms" className="ft-legal-btn">
              Terms &amp; Conditions
            </Link>


            {/* For professionals, not customers — kept in the legal strip so it is
                findable without competing with the customer-facing links above.
                It leads to the separate partners app, so it only shows once that
                app's address is configured (VITE_PARTNERS_URL). */}
            {partnersUrl && (
              <>
                <span aria-hidden="true">
                  |
                </span>

                <a
                  href={`${partnersUrl}/login`}
                  className="ft-partner-login"
                >
                  Partner Login
                </a>
              </>
            )}

          </nav>

        </div>



      </div>

    </footer>
  );
}
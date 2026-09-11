import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import {
  company,
  contact,
  quickLinks,
  social,
} from '../../data/siteConfig';
import { activeServices } from '../../data/services';
import {
  telHref,
  mailtoHref,
  whatsappHref,
} from '../../lib/contact';

/**
 * Interior by Choice, Electrical and Other Services each have their own
 * richer page instead of the generic booking wizard.
 */
function footerRoute(slug) {
  if (slug === 'interior-by-choice') {
    return '/interior-by-choice';
  }

  return `/services/${slug}`;
}

/*
 * Services are taken from the same source used by the rest of the website.
 */
const footerServices = activeServices.map((s) => ({
  id: s.slug,
  name: s.shortName || s.name,
  route: footerRoute(s.slug),
  icon: s.icon,
}));

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

  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  /*
   * Only social accounts having a URL are displayed.
   */
  const activeSocial = social.filter(
    (s) => s.url
  );

  /*
   * Existing working-hours content.
   */
  const [hoursDays, hoursTimes] =
    contact.workingHours.split(/,\s*/);

  return (
    <footer className="ft">

      <div className="ft-inner">

        {/* =====================================================
            LOGO + TAGLINE
        ====================================================== */}

        <div className="ft-brand">

          <img
            className="ft-logo"
            src="/assets/brand/logo-stacked.png"
            alt={`${company.name} logo`}
          />

          <p className="ft-intro">
            Your trusted partner for home improvement,
            from start to finish.
          </p>

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

                    <Link to={link.path}>
                      {link.label}
                    </Link>

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

              {footerServices.map((service) => (
                <li key={service.id}>

                  <Link to={service.route}>
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


              {/* Working Hours */}
              <li>

                <Icon
                  name="clock"
                  size={19}
                />

                <span>
                  {hoursDays}
                  <br />
                  {hoursTimes}
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

              {/* WhatsApp */}
              <li>

                <a
                  href="https://wa.me/917709588422"
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


              {/* Instagram */}
              <li>

                <a
                  href="https://www.instagram.com/supplybase_official/?hl=en"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  <Icon
                    name="instagram"
                    size={18}
                  />
                </a>

              </li>


              {/* Call */}
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


              {/* Email */}
              <li>

                <Link
                  to="/contact"
                  aria-label="Email"
                >
                  <Icon
                    name="mail"
                    size={18}
                  />
                </Link>

              </li>

            </ul>


            {/* Request a Quote */}
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

            <button
              type="button"
              className="ft-legal-btn"
              onClick={() => setShowPrivacy(true)}
            >
              Privacy Policy
            </button>


            <span aria-hidden="true">
              |
            </span>


            <button
              type="button"
              className="ft-legal-btn"
              onClick={() => setShowTerms(true)}
            >
              Terms &amp; Conditions
            </button>

          </nav>

        </div>


        {/* =====================================================
            PRIVACY POLICY MODAL
        ====================================================== */}

        {showPrivacy && (

          <div
            className="privacy-modal-overlay"
            onClick={() => setShowPrivacy(false)}
          >

            <div
              className="privacy-modal"
              onClick={(e) => e.stopPropagation()}
            >

              <button
                type="button"
                className="privacy-modal-close"
                onClick={() => setShowPrivacy(false)}
                aria-label="Close Privacy Policy"
              >
                ×
              </button>


              <h2>
                Privacy Policy
              </h2>


              <div className="privacy-modal-content">

                <h3>
                  Privacy Policy
                </h3>

                <p>
                  At Supplybase, we respect your privacy and are committed to
                  protecting the personal information you share with us. This
                  Privacy Policy explains how we collect, use, protect, and
                  manage information when you use our website and services.
                </p>


                <h4>
                  * Information We Collect
                </h4>

                <p>
                  We may collect information that you voluntarily provide while
                  using our website, requesting a service, making an enquiry,
                  or booking an appointment.
                </p>

                <ul>
                  <li>Your full name and contact details</li>
                  <li>Phone number and WhatsApp number</li>
                  <li>Email address</li>
                  <li>Project location and address</li>
                  <li>Type of service required</li>
                  <li>Project requirements and description</li>
                  <li>Approximate project budget</li>
                  <li>Preferred appointment or site visit details</li>
                  <li>Images, plans, or documents voluntarily uploaded</li>
                </ul>


                <h4>
                  * How We Use Your Information
                </h4>

                <p>
                  The information collected may be used to understand your
                  requirements and provide you with the requested services.
                </p>

                <ul>
                  <li>To respond to enquiries and service requests</li>
                  <li>To arrange site visits and consultations</li>
                  <li>To prepare quotations and project estimates</li>
                  <li>To schedule and manage appointments</li>
                  <li>To provide and manage requested services</li>
                  <li>To communicate with you about your project</li>
                  <li>To provide updates regarding bookings and services</li>
                  <li>To improve our website and customer experience</li>
                </ul>


                <h4>
                  * Communication
                </h4>

                <p>
                  When you provide your contact information through our website,
                  Supplybase may use it to communicate with you regarding your
                  enquiry, booking, quotation, site visit, or requested service.
                </p>

                <ul>
                  <li>Service-related communication</li>
                  <li>Booking and appointment updates</li>
                  <li>Quotation and project-related communication</li>
                  <li>Responses to customer enquiries</li>
                </ul>


                <h4>
                  * Information Protection
                </h4>

                <p>
                  We take reasonable measures to protect the information provided
                  by our customers and website users from unauthorized access,
                  alteration, disclosure, or misuse.
                </p>

                <ul>
                  <li>We take reasonable steps to protect user information.</li>
                  <li>Access to information may be limited to authorized personnel.</li>
                  <li>We work to prevent unauthorized use or disclosure of information.</li>
                  <li>No online system can be guaranteed to be completely secure.</li>
                </ul>


                <h4>
                  * Third-Party Services
                </h4>

                <p>
                  Some features or services on our website may use third-party
                  platforms or service providers for communication, payments,
                  hosting, analytics, or other functionality.
                </p>

                <ul>
                  <li>Third-party payment services may process payment information.</li>
                  <li>Communication services may be used to respond to enquiries.</li>
                  <li>Analytics services may help us understand website usage.</li>
                  <li>Third-party providers may have their own privacy policies.</li>
                </ul>


                <h4>
                  * Cookies
                </h4>

                <p>
                  Our website may use cookies or similar technologies to improve
                  website functionality, remember preferences, understand website
                  usage, and provide a better user experience.
                </p>

                <ul>
                  <li>Cookies may help improve website functionality.</li>
                  <li>Cookies may help us understand how visitors use the website.</li>
                  <li>Some website features may require cookies to function properly.</li>
                </ul>


                <h4>
                  * Payment Information
                </h4>

                <p>
                  Where payment functionality is available, payments may be
                  processed through third-party payment providers. Payment
                  information may be handled according to the privacy policy
                  and terms of the respective payment provider.
                </p>

                <ul>
                  <li>Payments may be processed by authorized third-party providers.</li>
                  <li>Payment providers may collect information required to process transactions.</li>
                  <li>Users should review the privacy policies of the respective payment providers.</li>
                </ul>


                <h4>
                  * Data Retention
                </h4>

                <p>
                  We may retain information for as long as reasonably necessary
                  to provide our services, respond to enquiries, maintain business
                  records, resolve issues, and comply with applicable requirements.
                </p>


                <h4>
                  * Your Choices
                </h4>

                <ul>
                  <li>You may choose not to provide optional information.</li>
                  <li>You may contact us regarding information you have provided.</li>
                  <li>You may ask questions about how your information is used.</li>
                  <li>You may contact us regarding privacy-related concerns.</li>
                </ul>


                <h4>
                  * Changes to This Policy
                </h4>

                <p>
                  We may update this Privacy Policy from time to time to reflect
                  changes in our website, services, business practices, or
                  applicable requirements. Any updates will be reflected in the
                  Privacy Policy displayed on our website.
                </p>


                <h4>
                  * Contact Us
                </h4>

                <p>
                  If you have any questions, concerns, or requests regarding this
                  Privacy Policy or the information you have provided, please
                  contact Supplybase through the Contact Us section of our website.
                </p>

              </div>

            </div>

          </div>

        )}


        {/* =====================================================
            TERMS & CONDITIONS MODAL
        ====================================================== */}

        {showTerms && (

          <div
            className="terms-modal-overlay"
            onClick={() => setShowTerms(false)}
          >

            <div
              className="terms-modal"
              onClick={(e) => e.stopPropagation()}
            >

              <button
                type="button"
                className="terms-modal-close"
                onClick={() => setShowTerms(false)}
                aria-label="Close Terms and Conditions"
              >
                ×
              </button>


              <h2>
                Terms &amp; Conditions
              </h2>


              <div className="terms-modal-content">

                <p>
                  Last updated: August 2026
                </p>


                <h3>
                  ABOUT THIS WEBSITE
                </h3>

                <p>
                  This website describes the services offered by Supplybase.
                  The content is provided for general information and does
                  not by itself form a contract. Information about services,
                  projects, materials, pricing, and timelines may change
                  depending on the requirements of each project.
                </p>


                <h3>
                  QUOTATIONS
                </h3>

                <ul>
                  <li>
                    Prices are confirmed only in a written quotation issued
                    after a site visit or scope discussion.
                  </li>

                  <li>
                    Quotations are valid for the period stated on them.
                  </li>

                  <li>
                    Work outside the quoted scope is charged separately and
                    agreed in writing before it is carried out.
                  </li>

                  <li>
                    The final quotation may depend on site conditions,
                    measurements, materials, and customer requirements.
                  </li>
                </ul>


                <h3>
                  PROJECT EXECUTION
                </h3>

                <ul>
                  <li>
                    Timelines are agreed at the start of the project and depend
                    on site readiness, approvals, and payments.
                  </li>

                  <li>
                    Material specifications are recorded in the quotation;
                    substitutions are agreed with you in advance.
                  </li>

                  <li>
                    Payments are linked to completed stages of work as set
                    out in the agreement.
                  </li>

                  <li>
                    Changes to the project scope may affect the timeline
                    and final cost.
                  </li>
                </ul>


                <h3>
                  IMAGES AND PROJECT CONTENT
                </h3>

                <p>
                  Project images and descriptions on this website illustrate
                  the type of work we carry out. Every site is different,
                  and the finished result depends on the specification agreed
                  for your project.
                </p>

                <ul>
                  <li>
                    Images shown on the website may represent completed,
                    ongoing, or illustrative projects.
                  </li>

                  <li>
                    Actual materials, colours, finishes, and designs may vary.
                  </li>

                  <li>
                    Customers should refer to the final quotation and approved
                    specifications for their individual project.
                  </li>
                </ul>


                <h3>
                  SERVICES
                </h3>

                <p>
                  Supplybase offers a range of home improvement, construction,
                  maintenance, and related services. The availability and scope
                  of services may vary depending on location and project
                  requirements.
                </p>

                <ul>
                  <li>
                    Services are provided according to the agreed project scope.
                  </li>

                  <li>
                    Additional requirements may require a revised quotation.
                  </li>

                  <li>
                    Supplybase may modify or update its services when required.
                  </li>
                </ul>


                <h3>
                  BOOKING AND SITE VISITS
                </h3>

                <ul>
                  <li>
                    Appointment requests are subject to availability.
                  </li>

                  <li>
                    Site visit timings may be changed when necessary.
                  </li>

                  <li>
                    Customers should provide accurate contact and project details.
                  </li>

                  <li>
                    A booking request does not automatically guarantee
                    confirmation of a service.
                  </li>
                </ul>


                <h3>
                  PAYMENTS
                </h3>

                <p>
                  Payments must be made according to the payment schedule
                  and terms agreed for the project.
                </p>

                <ul>
                  <li>
                    Payment requirements may vary depending on the project.
                  </li>

                  <li>
                    Additional work may result in additional charges.
                  </li>

                  <li>
                    Payment confirmations may be required before certain
                    stages of work begin.
                  </li>
                </ul>


                <h3>
                  CANCELLATION AND RESCHEDULING
                </h3>

                <p>
                  Customers may request cancellation or rescheduling of
                  appointments or services. Such requests may be subject
                  to the applicable project agreement, service terms,
                  and availability.
                </p>


                <h3>
                  CUSTOMER RESPONSIBILITIES
                </h3>

                <ul>
                  <li>
                    Provide accurate contact and project information.
                  </li>

                  <li>
                    Provide reasonable access to the project location when required.
                  </li>

                  <li>
                    Inform Supplybase about important project requirements or changes.
                  </li>

                  <li>
                    Review quotations and specifications before approving the work.
                  </li>

                  <li>
                    Make payments according to the agreed payment schedule.
                  </li>
                </ul>


                <h3>
                  LIABILITY
                </h3>

                <p>
                  Our responsibility for any project is governed by the written
                  agreement for that project. We are not responsible for delays
                  caused by circumstances outside our control, including approvals,
                  supply shortages, weather, site conditions, or other unforeseen
                  circumstances.
                </p>


                <h3>
                  THIRD-PARTY SERVICES
                </h3>

                <p>
                  Certain website features may use third-party services such as
                  payment providers, communication platforms, hosting services,
                  analytics services, or other external providers. These services
                  may have their own terms and privacy policies.
                </p>


                <h3>
                  WEBSITE CONTENT
                </h3>

                <p>
                  The information available on the website is provided for
                  general information. Supplybase may update, modify, or remove
                  website content, services, images, and other information when
                  necessary.
                </p>


                <h3>
                  PRIVACY
                </h3>

                <p>
                  Personal information provided through the website is handled
                  according to the Supplybase Privacy Policy. Customers are
                  encouraged to review the Privacy Policy to understand how their
                  information may be collected and used.
                </p>


                <h3>
                  CHANGES TO THESE TERMS
                </h3>

                <p>
                  Supplybase may update these Terms &amp; Conditions from time
                  to time to reflect changes in its services, website, business
                  practices, or applicable requirements. Updated terms will be
                  displayed on the website when applicable.
                </p>


                <h3>
                  CONTACT
                </h3>

                <p>
                  If you have any questions regarding these Terms &amp; Conditions,
                  please contact Supplybase through the Contact Us section of
                  the website.
                </p>

              </div>

            </div>

          </div>

        )}

      </div>

    </footer>
  );
}
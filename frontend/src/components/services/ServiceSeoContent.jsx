import { Link } from 'react-router-dom';
import Faq from '../ui/Faq';
import Icon from '../ui/Icon';
import { telHref, whatsappHref } from '../../lib/contact';
import { contact } from '../../data/siteConfig';
import {
  serviceSeoContent,
  relatedServiceLinks,
  bookingSteps,
  SERVICE_AREAS,
} from '../../data/serviceSeoContent';
import '../../styles/service-seo.css';

/**
 * ServiceSeoContent — the "about this service" section under a service's
 * booking cards: what the work includes, how booking works, the areas we
 * cover, common questions and related services. Text lives in
 * data/serviceSeoContent.js, which the build also writes into the page's
 * HTML for search engines.
 *
 * Renders nothing for a slug without content, so it is safe to drop into
 * any service page.
 */
export default function ServiceSeoContent({ slug }) {
  const content = serviceSeoContent[slug];
  if (!content) return null;

  return (
    <section className="svc-seo" aria-labelledby={`svc-seo-${slug}`}>
      <div className="container container-narrow">
        <h2 id={`svc-seo-${slug}`}>{content.h1}</h2>
        <p className="svc-seo-intro">{content.intro}</p>

        {content.types.length > 0 && (
          <div className="svc-seo-types">
            {content.types.map((type) => (
              <div key={type.name} className="svc-seo-type">
                <h3>{type.name}</h3>
                <p>{type.text}</p>
              </div>
            ))}
          </div>
        )}

        <h2>{content.includesTitle}</h2>
        <ul className="svc-seo-list">
          {content.includes.map((item) => (
            <li key={item}>
              <Icon name="check" size={16} />
              {item}
            </li>
          ))}
        </ul>

        <h2>How booking works</h2>
        <ol className="svc-seo-steps">
          {bookingSteps.map((step) => (
            <li key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>

        <h2>Areas we serve</h2>
        <p>
          We take {content.name.toLowerCase()} bookings in {SERVICE_AREAS.slice(0, -1).join(', ')} and{' '}
          {SERVICE_AREAS[SERVICE_AREAS.length - 1]}. Questions before you book? Call or WhatsApp us on{' '}
          <a href={telHref}>{contact.phoneDisplay}</a>, or{' '}
          <a href={whatsappHref(`Hi Supplybase, I have a question about ${content.name.toLowerCase()}.`)} target="_blank" rel="noopener noreferrer">
            message us on WhatsApp
          </a>
          . You can also <Link to={`/quote?service=${slug}`}>request a written quotation</Link>.
        </p>

        <h2>Frequently asked questions</h2>
        <Faq items={content.faqs} />

        <h2>Related services</h2>
        <ul className="svc-seo-related">
          {content.related.map((key) => {
            const link = relatedServiceLinks[key];
            return (
              <li key={key}>
                <Link to={link.path}>
                  {link.label}
                  <Icon name="chevron-right" size={16} />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

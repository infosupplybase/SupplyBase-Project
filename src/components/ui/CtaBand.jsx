import { Link } from 'react-router-dom';
import Icon from './Icon';
import { whatsappHref } from '../../lib/contact';

/**
 * CtaBand — the dark "let's discuss your project" strip used at the end of pages.
 */
export default function CtaBand({
  title = 'READY TO START YOUR PROJECT?',
  text = 'Tell us what you are planning and we will come back with a clear, itemised quotation.',
  primaryLabel = 'GET A QUOTE',
  primaryTo = '/quote',
}) {
  return (
    <section className="cta-band">
      <div className="container">
        <div className="cta-inner">
          <div>
            <span className="eyebrow">ONE PARTNER. COMPLETE PROJECT.</span>
            <h2>{title}</h2>
            <p>{text}</p>
          </div>
          <div className="btn-row">
            <Link to={primaryTo} className="btn btn-primary btn-lg">
              {primaryLabel}
              <Icon name="arrow-right" size={18} />
            </Link>
            <a
              href={whatsappHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-lg"
            >
              <Icon name="whatsapp" size={18} />
              WHATSAPP US
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

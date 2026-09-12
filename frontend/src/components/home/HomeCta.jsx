import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';

export default function HomeCta() {
  return (
    <section className="home-cta-section">
      <div className="uc-container">
        <div className="home-cta-card">

          <div className="home-cta-left">
            <span className="home-cta-eyebrow">ONE PARTNER. COMPLETE PROJECT.</span>
            <h2 className="home-cta-title">Ready to start your project?</h2>
            <p className="home-cta-desc">
              Tell us what you are planning and we will come back with a clear,
              itemised quotation.
            </p>
          </div>

          <div className="home-cta-right">
            <Link to="/contact" className="home-cta-btn home-cta-btn-primary">
              Get a Quote
              <Icon name="arrow-right" size={16} />
            </Link>
            <a
  href={`https://wa.me/917709588422?text=${encodeURIComponent('Hello Supplybase, I would like to discuss a project.')}`}
  target="_blank"
  rel="noopener noreferrer"
  className="home-cta-btn home-cta-btn-outline"
>
  <Icon name="whatsapp" size={18} />
  WhatsApp Us
</a>
          </div>

        </div>
      </div>
    </section>
  );
}


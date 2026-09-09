import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';

/** Consultation stays a separate call-to-action, not an eighth service
    category — it reuses the existing enquiry pipeline behind /quote rather
    than a new booking concept. */
export default function ConsultationBanner() {
  return (
    <section className="consult-banner">
      <img
        src="/assets/projects/luxury-bungalow.jpeg"
        alt=""
        width={1600}
        height={700}
        loading="lazy"
      />
      <div className="consult-banner-scrim" />
      <div className="container consult-banner-inner">
        <span className="consult-banner-eyebrow">YOUR SPACE OUR EXPERTISE</span>
        <h2>
          Beautiful Spaces
          <br />
          <span className="gold">Better Living</span>
        </h2>
        <Link to="/quote" className="btn btn-primary consult-banner-cta">
          Book a Consultation
          <Icon name="arrow-right" size={17} />
        </Link>
      </div>
    </section>
  );
}

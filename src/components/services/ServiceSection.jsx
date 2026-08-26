import ServiceCard from './ServiceCard';
import HowBookingWorks from './HowBookingWorks';
import { homeServices } from '../../data/homeServices';
import './ServiceSection.css';

/**
 * The approved services section: heading, four cards, then the booking steps.
 *
 * Data-driven from homeServices — one <ServiceCard> rendered four times, not
 * four hand-written blocks, so changing a price or a description is a one-line
 * edit and the admin screen can later feed the same shape from the API.
 */
export default function ServiceSection() {
  return (
    <section className="sc-section" aria-labelledby="services-heading">
      <div className="sc-section-inner">
        <div className="sc-head">
          <span className="sc-eyebrow">Our Services</span>
          <h2 id="services-heading" className="sc-heading">
            What do you need help with?
          </h2>
        </div>

        <div className="sc-grid">
          {homeServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>

        <HowBookingWorks />
      </div>
    </section>
  );
}

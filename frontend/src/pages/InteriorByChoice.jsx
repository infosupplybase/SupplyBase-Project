import { Link } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import Reveal from '../components/ui/Reveal';
import { interiorSpaces, HOME_VISIT_FEE } from '../data/interiorCatalog';

const highlights = [
  { icon: 'layers', title: 'Wide Range of Designs' },
  { icon: 'package', title: 'Premium Materials' },
  { icon: 'helmet', title: 'Expert Installation' },
  { icon: 'chat', title: '1-Day Consultation' },
];

/**
 * /interior-by-choice — the catalogue landing page: pick a space, browse
 * ready-made designs, book a paid home visit. A separate product from the
 * site-visit wizard the other services use, so it gets its own small route
 * tree instead of being squeezed into ServiceBooking.
 */
export default function InteriorByChoice() {
  return (
    <>
      <PageHero
        eyebrow="INTERIOR BY CHOICE"
        title="Interiors, Your Way"
        text="Choose a ready-made design, customise it to your space, and let us install it."
        image="/assets/projects/modern-interior.jpeg"
        breadcrumbs={[{ label: 'Interior by Choice' }]}
      />

      <section className="ibc-section">
        <div className="container">
          <div className="ibc-highlights">
            {highlights.map((h) => (
              <div className="ibc-highlight" key={h.title}>
                <span className="ibc-highlight-icon">
                  <Icon name={h.icon} size={22} />
                </span>
                <span>{h.title}</span>
              </div>
            ))}
          </div>

          <Reveal>
            <Link to="/interior-by-choice/book" className="ibc-visit-cta">
              <span>
                <strong>Book a Home Visit at just ₹{HOME_VISIT_FEE}</strong>
                <span>Get expert advice, measurement and a custom design as per your choice.</span>
              </span>
              <span className="ibc-visit-cta-arrow">
                <Icon name="arrow-right" size={20} />
              </span>
            </Link>
          </Reveal>

          <Reveal delay={80}>
            <h2 className="ibc-section-title">Choose Your Space</h2>
          </Reveal>

          <div className="ibc-space-grid">
            {interiorSpaces.map((space, i) => (
              <Reveal key={space.slug} delay={i * 40}>
                <Link to={`/interior-by-choice/${space.slug}`} className="ibc-space-tile">
                  <img src={space.image} alt={space.name} loading="lazy" />
                  <span>{space.name}</span>
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="ibc-custom-band">
              <div className="ibc-custom-copy">
                <h3>Make It Truly Yours</h3>
                <p>Pick your style, colours and materials, and we will bring it to life.</p>
              </div>
              <Link to="/interior-by-choice/book" className="btn btn-primary">
                Design My Space
                <Icon name="arrow-right" size={17} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

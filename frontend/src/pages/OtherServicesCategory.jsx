import { Link } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import Reveal from '../components/ui/Reveal';
import { otherServiceTiles } from '../data/otherServices';

/**
 * /services/other-services — the "Other Services" catch-all category list,
 * mirroring ElectricalCategory's tile-list pattern. Each tile opens the
 * existing generic site-visit wizard at its own slug (all five kept their
 * full question sets in the database while deactivated).
 */
export default function OtherServicesCategory() {
  return (
    <>
      <PageHero
        eyebrow="OTHER SERVICES"
        title="Other Services"
        text="Everything else we do — architectural design, civil construction, furniture, fabrication and finishing work."
        image="/assets/hero-house.svg"
        breadcrumbs={[{ label: 'Services', to: '/services' }, { label: 'Other Services' }]}
      />

      <section className="elc-section">
        <div className="container container-narrow">
          <div className="elc-list">
            {otherServiceTiles.map((tile, i) => (
              <Reveal key={tile.slug} delay={i * 30}>
                <Link to={`/services/${tile.slug}`} className="elc-tile">
                  <span className="elc-tile-icon">
                    <Icon name={tile.icon} size={22} />
                  </span>
                  <span className="elc-tile-body">
                    <strong>{tile.name}</strong>
                    <span>{tile.blurb}</span>
                  </span>
                  <Icon name="chevron-right" size={18} className="elc-tile-arrow" />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

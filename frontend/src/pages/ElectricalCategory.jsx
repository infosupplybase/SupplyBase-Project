import { Link } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import Reveal from '../components/ui/Reveal';
import { electricianCategoryTiles } from '../data/electricianServices';

/**
 * /services/electrical — the electrician category list (PDF step 2).
 *
 * Seven tiles open their own detailed booking journey (intro -> catalogue
 * wizard -> confirm), each backed by its own service_categories row so the
 * form itself comes from the database like every other service on the site.
 * Light Installation is the eighth tile and is intentionally not detailed —
 * it opens the pre-existing generic site-visit wizard unchanged, since no
 * richer flow for it exists in the brief or the project.
 */
export default function ElectricalCategory() {
  return (
    <>
      <PageHero
        eyebrow="ELECTRICIAN"
        title="Electrical Services"
        text="Certified electricians for wiring, fans, switches, repairs and more — pick a service to get started."
        image="/assets/services/electrical.svg"
        breadcrumbs={[{ label: 'Services', to: '/services' }, { label: 'Electrical' }]}
      />

      <section className="elc-section">
        <div className="container container-narrow">
          <div className="elc-list">
            {electricianCategoryTiles.map((tile, i) => (
              <Reveal key={tile.slug} delay={i * 30}>
                <Link
                  to={tile.detailed ? `/services/electrical/${tile.slug}` : tile.route}
                  className="elc-tile"
                >
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

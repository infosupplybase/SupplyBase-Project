import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import PaintingHero from '../components/painting/PaintingHero';
import { wpOverviewIntro, wpCategories, wpTrustPoints, WP_HERO_IMAGE } from '../data/waterproofingContent';

/**
 * /services/waterproofing — six-row overview in the reference's own order
 * (Terrace, Bathroom, Interior Wall, Exterior Wall, Basement, Water Tank).
 * Icon-led rows (reusing PopCeilingCategory's .pce-overview-icon treatment)
 * rather than per-row photos: only 4 of the 6 sections have a defensible
 * real photo (see waterproofingContent.js's asset note), and the hero
 * banner itself carries the one photograph the brief specifically asks
 * for at the overview level. Reuses PaintingHero directly, same as
 * PopCeilingCategory.
 */
export default function WaterproofingCategory() {
  return (
    <>
      <PaintingHero
        eyebrow={wpOverviewIntro.eyebrow}
        title={wpOverviewIntro.title}
        tagline={wpOverviewIntro.text}
        image={WP_HERO_IMAGE}
        trustPoints={wpTrustPoints}
      />

      <section className="pnt-section">
        <div className="container container-narrow">
          <div className="pnt-overview-list">
            {wpCategories.map((cat) => (
              <Link key={cat.slug} to={cat.route} className="pnt-overview-card">
                <span className="pnt-overview-photo pce-overview-icon">
                  <Icon name={cat.icon} size={30} />
                </span>
                <span className="pnt-overview-body">
                  <span className="pnt-overview-name">{cat.name}</span>
                  <span className="pnt-overview-tagline">{cat.tagline}</span>
                </span>
                <Icon name="chevron-right" size={18} className="pnt-overview-arrow" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

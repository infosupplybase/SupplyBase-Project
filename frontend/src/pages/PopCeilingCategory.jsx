import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import PaintingHero from '../components/painting/PaintingHero';
import { popOverviewIntro, popCategories, popTrustPoints, POP_HERO_IMAGE } from '../data/popCeilingContent';

/**
 * /services/pop-ceiling-design — the six-row category list, matching the
 * reference's own "POP Category" screen (icon + name + description rows,
 * not photo cards — the reference reserves photography for the category
 * hero itself and the two detailed flow intros, not per-row thumbnails).
 * Reuses PaintingHero directly (a generic, prop-driven component) rather
 * than a new one — see popCeilingContent.js's header comment for image
 * sourcing.
 */
export default function PopCeilingCategory() {
  return (
    <>
      <PaintingHero
        eyebrow={popOverviewIntro.eyebrow}
        title={popOverviewIntro.title}
        tagline={popOverviewIntro.text}
        image={POP_HERO_IMAGE}
        trustPoints={popTrustPoints}
      />

      <section className="pnt-section">
        <div className="container container-narrow">
          <div className="pnt-overview-list">
            {popCategories.map((cat) => (
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

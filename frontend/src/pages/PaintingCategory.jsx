import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import PaintingHero from '../components/painting/PaintingHero';
import { paintingOverviewIntro, paintingCategories, paintingTrustPoints } from '../data/paintingContent';

/** /services/painting — the four-card overview, matching the reference's
    "Painting Category" screen (shown at the start of every one of the
    reference's three flows). */
export default function PaintingCategory({
  modal = false,
  onSelectFlow,
}) {
  return (
    <>
      {!modal && (
  <PaintingHero
    eyebrow={paintingOverviewIntro.eyebrow}
    title={paintingOverviewIntro.title}
    tagline={paintingOverviewIntro.text}
  />
)}

      <section className="pnt-section">
        <div className="container container-narrow">
          <div className="pnt-overview-list">
            {paintingCategories.map((cat) =>
  modal ? (
    <button
      key={cat.slug}
      type="button"
      className="pnt-overview-card !w-full !text-left"
      onClick={() =>
        onSelectFlow?.(
          cat.slug === 'room' ? 'few-walls' : cat.slug
        )
      }
    >
      <span className="pnt-overview-photo">
        <img
          src={cat.image}
          alt=""
          width={96}
          height={96}
          loading="lazy"
        />
      </span>

      <span className="pnt-overview-body">
        <span className="pnt-overview-name">{cat.name}</span>
        <span className="pnt-overview-tagline">{cat.tagline}</span>
      </span>

      <Icon
        name="chevron-right"
        size={18}
        className="pnt-overview-arrow"
      />
    </button>
  ) : (
    <Link
      key={cat.slug}
      to={cat.route}
      className="pnt-overview-card"
    >
      <span className="pnt-overview-photo">
        <img
          src={cat.image}
          alt=""
          width={96}
          height={96}
          loading="lazy"
        />
      </span>

      <span className="pnt-overview-body">
        <span className="pnt-overview-name">{cat.name}</span>
        <span className="pnt-overview-tagline">{cat.tagline}</span>
      </span>

      <Icon
        name="chevron-right"
        size={18}
        className="pnt-overview-arrow"
      />
    </Link>
  )
)}
          </div>

          <ul className="pnt-trust-row">
            {paintingTrustPoints.map((t) => (
              <li key={t.label}>
                <Icon name={t.icon} size={24} />
                <span>{t.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

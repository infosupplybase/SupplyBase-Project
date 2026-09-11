import Icon from '../ui/Icon';
import { PAINTING_HERO_IMAGE, paintingTrustPoints } from '../../data/paintingContent';

/** Dark hero shared by every painting page — same pattern as PlumbingHero:
    a real photograph (cropped clean of any baked-in text) with real HTML
    heading/tagline/trust-icons/logo layered on top so they stay sharp at
    any size, instead of embedding a screenshot as the page. */
export default function PaintingHero({ eyebrow, title, tagline, trustPoints, image }) {
  return (
    <section className="pnt-hero">
      <img
        src={image || PAINTING_HERO_IMAGE}
        alt=""
        width={972}
        height={941}
        fetchpriority="high"
      />
      <div className="pnt-hero-scrim" />

      <div className="container pnt-hero-inner">
        <span className="pnt-hero-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {tagline && <p>{tagline}</p>}

        <ul className="pnt-hero-trust">
          {(trustPoints || paintingTrustPoints).map((t) => (
            <li key={t.label}>
              <Icon name={t.icon} size={22} />
              <span>{t.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <img
        className="pnt-hero-logo"
        src="/assets/brand/logo.png"
        alt="SupplyBase — One Partner. Complete Project."
        width={480}
        height={363}
      />
    </section>
  );
}

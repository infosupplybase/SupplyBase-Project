import Icon from '../ui/Icon';
import { PLUMBING_HERO_IMAGE, plumbingTrustPoints } from '../../data/plumbingContent';

/**
 * Dark hero shared by every plumbing page — the one real plumbing photograph
 * in the project (a plumber working under a sink), pre-cropped clean of its
 * source banner's baked-in marketing text (see plumbingContent.js's asset
 * note), with real HTML heading/tagline/trust icons/logo layered on top so
 * they stay sharp at any size.
 */
export default function PlumbingHero({ eyebrow, title, tagline }) {
  return (
    <section className="plb-hero">
      <img
        src={PLUMBING_HERO_IMAGE}
        alt=""
        width={772}
        height={941}
        fetchpriority="high"
      />
      <div className="plb-hero-scrim" />

      <div className="container plb-hero-inner">
        <span className="plb-hero-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {tagline && <p>{tagline}</p>}

        <ul className="plb-hero-trust">
          {plumbingTrustPoints.map((t) => (
            <li key={t.label}>
              <Icon name={t.icon} size={22} />
              <span>{t.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <img
        className="plb-hero-logo"
        src="/assets/brand/logo.png"
        alt="SupplyBase — One Partner. Complete Project."
        width={480}
        height={363}
      />
    </section>
  );
}

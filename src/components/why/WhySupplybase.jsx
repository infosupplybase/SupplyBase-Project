import { useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../ui/Reveal';
import Icon from '../ui/Icon';
import { company, whyUsPoints } from '../../data/siteConfig';
import './WhySupplybase.css';

/**
 * WHY SUPPLYBASE PROJECTS
 *
 * Two columns: the pitch on the left, a photograph of a finished project on
 * the right inside a gold offset frame. Stacks to one column on a phone with
 * the photograph last.
 */

/*
 * The approved photograph: the modern residence at dusk.
 *
 * The supplied PNG carried a rounded-corner mask painted into the pixels — a
 * 12px white margin down the left edge and arcs up to 15px deep in the top
 * corners — which would have shown as a pale double-edge inside our own 20px
 * radius. It is cropped 15px on every side to a clean rectangle and saved as
 * JPEG: 791 KB down to 96 KB with no visible loss on a photograph.
 *
 * The fallback stays as a safety net for a bad deploy — a missing file would
 * otherwise leave the frame empty rather than merely off-brand.
 */
const PHOTO = '/assets/why/modern-home.jpg';
const PHOTO_FALLBACK = '/assets/hero-house.svg';

/*
 * The About page is routed at /about, not /about-us (see App.jsx). Linking to
 * the requested path would land on the 404 page, so the button points at the
 * route that exists. Renaming the route is a router change and belongs
 * outside this section.
 */
const ABOUT_ROUTE = '/about';

/*
 * The four benefits come from siteConfig rather than a local array. The copy
 * is identical, and the About page reads the same list — duplicating it here
 * would mean a wording change that lands on the homepage but not on /about.
 */
const benefits = whyUsPoints.slice(0, 4);

export default function WhySupplybase() {
  const [photo, setPhoto] = useState(PHOTO);

  return (
    <section className="why" aria-labelledby="why-heading">
      <div className="why-inner">
        <Reveal className="why-copy">
          <span className="why-eyebrow">WHY SUPPLYBASE PROJECTS</span>
          <span className="why-rule" aria-hidden="true" />

          <h2 id="why-heading" className="why-heading">
            ONE PARTNER.
            <br />
            <span className="why-heading-gold">COMPLETE PROJECT.</span>
          </h2>

          <p className="why-lead">{company.longIntro}</p>

          <ul className="why-list">
            {benefits.map((point) => (
              <li key={point.title} className="why-item">
                <Icon name="check" size={19} strokeWidth={2.6} className="why-check" />
                <span className="why-item-text">
                  <strong>{point.title}</strong> — {point.text}
                </span>
              </li>
            ))}
          </ul>

          <Link to={ABOUT_ROUTE} className="why-cta" aria-label="About Supplybase Projects">
            ABOUT US
            <Icon name="arrow-right" size={18} />
          </Link>
        </Reveal>

        <Reveal className="why-media" delay={120}>
          {/* The frame is drawn by padding plus an inset ::after, never by
              negative offsets — a negative offset here is the classic source
              of a page-wide horizontal scrollbar. */}
          <div className="why-frame">
            <div className="why-shot">
              <img
                src={photo}
                alt="Modern residential project by Supplybase Projects"
                /* Not lazy: the fallback below only runs once the browser has
                   actually tried the file, and a deferred load would leave an
                   empty frame if the swap were ever needed. Low priority keeps
                   it from competing with the hero banners for bandwidth.
                   Spelled lowercase because React 18 does not know the
                   camelCase `fetchPriority` prop — it drops the attribute and
                   warns, which is what HeroSlider currently does. */
                fetchpriority="low"
                decoding="async"
                onError={() => setPhoto(PHOTO_FALLBACK)}
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

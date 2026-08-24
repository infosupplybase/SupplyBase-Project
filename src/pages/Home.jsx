import { Link } from 'react-router-dom';
import Hero from '../components/home/Hero';
import TrustBar from '../components/home/TrustBar';
import ServiceGrid from '../components/home/ServiceGrid';
import ProcessSection from '../components/home/ProcessSection';
import StatsSection from '../components/home/StatsSection';
import ProjectGrid from '../components/projects/ProjectGrid';
import Reveal from '../components/ui/Reveal';
import CtaBand from '../components/ui/CtaBand';
import Icon from '../components/ui/Icon';
import { getFeaturedProjects } from '../data/projects';
import { getFeaturedServices } from '../data/services';
import { whyUsPoints, company } from '../data/siteConfig';
import { featuredBrands } from '../data/materials';

export default function Home() {
  const featured = getFeaturedProjects(4);

  return (
    /* page-home widens every .container on this page to the full viewport —
       see "full-width home page" in pages.css. Other pages stay centred. */
    <div className="page-home">
      <Hero />
      <TrustBar />

      {/* ------------------------------------------------------- services */}
      <section className="section">
        <div className="container">
          <div className="section-head-row">
            <div>
              <span className="eyebrow">OUR SERVICES</span>
              <div className="rule" />
              <h2>
                WHAT <span className="gold">WE DO</span>
              </h2>
              <p>
                Our four most-requested trades below. Ten in total — from the first architectural
                drawing to the final coat of paint, with one team answerable for all of it.
              </p>
            </div>
            <Link to="/services" className="btn btn-ghost">
              VIEW ALL SERVICES
              <Icon name="arrow-right" size={17} />
            </Link>
          </div>

          {/* Four cards only. The other six live on /services — the button
              above is the way through. Edit featuredServiceSlugs in
              data/services.js to change which four lead. */}
          <ServiceGrid list={getFeaturedServices()} columns={4} maxSubServices={7} />
        </div>
      </section>

      {/* --------------------------------------------------------- why us */}
      <section className="section section-light">
        <div className="container">
          <div className="split">
            <Reveal>
              <span className="eyebrow">WHY SUPPLYBASE PROJECTS</span>
              <div className="rule" />
              <h2>
                ONE PARTNER.
                <br />
                <span className="gold">COMPLETE PROJECT.</span>
              </h2>
              <p style={{ color: 'var(--ink-soft)' }}>{company.longIntro}</p>
              <ul className="check-list">
                {whyUsPoints.slice(0, 4).map((point) => (
                  <li key={point.title}>
                    <Icon name="check" size={19} strokeWidth={2.2} />
                    <span>
                      <strong>{point.title}</strong> — {point.text}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="btn-row">
                {/* promoted from ghost to solid — it is the only button in
                    this row now that Why Us is gone. */}
                <Link to="/about" className="btn btn-dark">
                  ABOUT US
                  <Icon name="arrow-right" size={17} />
                </Link>
              </div>
            </Reveal>

            <Reveal className="media-frame" delay={120}>
              <div className="split-media">
                <img src="/assets/hero-house.svg" alt="Architectural project by Supplybase Projects" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ materials */}
      <section className="section-tight section-dark">
        <div className="container">
          <Reveal className="section-head center" style={{ marginBottom: 0 }}>
            <span className="eyebrow">LABOUR + MATERIAL</span>
            <div className="rule" />
            <h2>
              WE SUPPLY THE <span className="gold">MATERIAL TOO</span>
            </h2>
            <p>
              Branded materials bought at project rates and itemised in your quotation, so you can see
              exactly what you are paying for.
            </p>
            <div className="brand-strip">
              {featuredBrands.map((brand) => (
                <span key={brand}>{brand}</span>
              ))}
            </div>
            <div className="btn-row" style={{ justifyContent: 'center', marginTop: 26 }}>
              <Link to="/materials" className="btn btn-outline">
                SEE ALL MATERIALS
                <Icon name="arrow-right" size={17} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------- process */}
      <ProcessSection />

      {/* ------------------------------------------------------ projects */}
      <section className="section">
        <div className="container">
          <div className="section-head-row">
            <div>
              <span className="eyebrow">OUR WORK</span>
              <div className="rule" />
              <h2>
                FEATURED <span className="gold">PROJECTS</span>
              </h2>
              <p>
                Residential, commercial and interior fit-out work — completed and ongoing. Every project
                below was designed, built and handed over by the same team.
              </p>
            </div>
            <Link to="/projects" className="btn btn-ghost">
              VIEW ALL PROJECTS
              <Icon name="arrow-right" size={17} />
            </Link>
          </div>

          <ProjectGrid projects={featured} />
        </div>
      </section>

      {/* --------------------------------------------------------- stats */}
      <StatsSection />

      <CtaBand />
    </div>
  );
}

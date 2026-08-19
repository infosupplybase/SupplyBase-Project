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
          <div className="section-head-row" style={{ marginBottom: 'clamp(2rem,4vw,3rem)' }}>
            <div>
              <span className="eyebrow">OUR SERVICES</span>
              <div className="rule" />
              <h2>
                WHAT <span className="gold">WE DO</span>
              </h2>
              <p style={{ color: 'var(--grey-600)', margin: 0, maxWidth: '58ch' }}>
                End-to-end solutions for all your construction and interior needs — ten service categories,
                one accountable team.
              </p>
            </div>
            <Link to="/services" className="btn btn-ghost">
              VIEW ALL SERVICES
              <Icon name="arrow-right" size={17} />
            </Link>
          </div>

          <ServiceGrid maxSubServices={7} />
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
              <p style={{ color: 'var(--grey-600)' }}>{company.longIntro}</p>
              <ul className="check-list">
                {whyUsPoints.slice(0, 4).map((point) => (
                  <li key={point.title}>
                    <Icon name="check" size={19} strokeWidth={2.2} />
                    <span>
                      <strong style={{ color: 'var(--black)' }}>{point.title}</strong> — {point.text}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="btn-row">
                <Link to="/why-us" className="btn btn-dark">
                  WHY CHOOSE US
                  <Icon name="arrow-right" size={17} />
                </Link>
                <Link to="/about" className="btn btn-ghost">
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
            <p>Branded materials, bought at project rates and written into your quotation.</p>
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
          <div className="section-head-row" style={{ marginBottom: 'clamp(2rem,4vw,3rem)' }}>
            <div>
              <span className="eyebrow">OUR WORK</span>
              <div className="rule" />
              <h2>
                FEATURED <span className="gold">PROJECTS</span>
              </h2>
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

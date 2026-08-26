import { Link } from 'react-router-dom';
import HeroSlider from '../components/HeroSlider/HeroSlider';
import ServiceSection from '../components/services/ServiceSection';
import WhySupplybase from '../components/why/WhySupplybase';
import StatsSection from '../components/home/StatsSection';
import ProjectGrid from '../components/projects/ProjectGrid';
import Reveal from '../components/ui/Reveal';
import CtaBand from '../components/ui/CtaBand';
import Icon from '../components/ui/Icon';
import { getFeaturedProjects } from '../data/projects';
import { featuredBrands } from '../data/materials';

export default function Home() {
  const featured = getFeaturedProjects(4);

  return (
    /* page-home widens every .container on this page to the full viewport —
       see "full-width home page" in pages.css. Other pages stay centred. */
    <div className="page-home">
      <HeroSlider />

      <ServiceSection />

      <WhySupplybase />

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

import { Link } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import SectionHeading from '../components/ui/SectionHeading';
import Reveal from '../components/ui/Reveal';
import CtaBand from '../components/ui/CtaBand';
import Icon from '../components/ui/Icon';
// import StatsSection from '../components/home/StatsSection';
import ProcessSection from '../components/home/ProcessSection';
import { company, whyUsPoints } from '../data/siteConfig';

const pillars = [
  {
    icon: 'blueprint',
    title: 'Design',
    text: 'Architectural planning, 2D drawings, 3D exterior and interior views, elevations and working drawings.',
  },
  {
    icon: 'crane',
    title: 'Build',
    text: 'RCC structure, masonry, plastering, electrical, plumbing and everything the building needs to stand up.',
  },
  {
    icon: 'trowel',
    title: 'Finish',
    text: 'Ceiling, furniture, painting, flooring and the final touch-up that decides how the project looks on handover day.',
  },
];

export default function About() {
  return (
    <>
      <PageHero
        eyebrow="ABOUT US"
        title="ONE PARTNER. COMPLETE PROJECT."
        text={company.longIntro}
        image="/assets/hero-house.svg"
        breadcrumbs={[{ label: 'About Us' }]}
      />

      {/* who we are */}
      <section className="section">
        <div className="container">
          <div className="split">
            <Reveal>
              <span className="eyebrow">WHO WE ARE</span>
              <div className="rule" />
              <h2>
                DESIGN. BUILD. <span className="gold">DELIVER.</span>
              </h2>
              <p style={{ color: 'var(--grey-600)' }}>
                Most construction projects go wrong in the gaps — between the architect and the contractor, between
                the electrician and the carpenter, between what was drawn and what was built. Supplybase
                exists to close those gaps.
              </p>
              <p style={{ color: 'var(--grey-600)' }}>
                We take on the whole project: the drawings, the labour, the material and the management. That means
                one contract, one point of contact and one team that cannot pass the blame to anyone else — from the
                first sketch to the day you get the keys.
              </p>
              <div className="btn-row" style={{ marginTop: 22 }}>
                <Link to="/services" className="btn btn-dark">
                  OUR SERVICES
                  <Icon name="arrow-right" size={17} />
                </Link>
                <Link to="/projects" className="btn btn-ghost">
                  VIEW PROJECTS
                  <Icon name="arrow-right" size={17} />
                </Link>
              </div>
            </Reveal>

            <Reveal className="media-frame" delay={120}>
              <div className="split-media">
                <img src="/assets/services/architectural-design.svg" alt="Supplybase design and construction" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* what we do */}
      <section className="section section-light">
        <div className="container">
          <SectionHeading
            center
            eyebrow="WHAT WE DO"
            title="THREE STAGES, ONE TEAM"
            text="Design, construction and finishing are handled in-house, so nothing is lost in handover between trades."
          />
          <div className="value-grid">
            {pillars.map((pillar, i) => (
              <Reveal
  key={pillar.title}
  className="
    value-card
    !bg-black/10
    backdrop-blur-xl
    !border-white/25
    !shadow-[0_8px_28px_rgba(0,0,0,0.08)]
  "
  delay={i * 90}
>
                <div className="value-icon">
                  <Icon name={pillar.icon} size={26} strokeWidth={1.4} />
                </div>
                <h3>{pillar.title}</h3>
                <p>{pillar.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* how we work */}
      <section className="section">
        <div className="container">
          <SectionHeading
            center
            eyebrow="HOW WE WORK"
            title="WHAT YOU CAN EXPECT"
            text="The things our clients tell us matter most when they hand over a project."
          />
          <div className="value-grid">
            {whyUsPoints.map((point, i) => (
              <Reveal
  key={point.title}
  className="
    value-card
    !bg-black/10
    backdrop-blur-xl
    !border-white/25
    !shadow-[0_8px_28px_rgba(0,0,0,0.08)]
  "
  delay={(i % 3) * 80}
>
                <div className="value-icon">
                  <Icon name={point.icon} size={26} strokeWidth={1.4} />
                </div>
                <h3>{point.title}</h3>
                <p>{point.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <ProcessSection />
      {/* <StatsSection showHeading={false} /> */}
      <CtaBand />
    </>
  );
}

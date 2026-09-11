import { Link } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import SectionHeading from '../components/ui/SectionHeading';
import Reveal from '../components/ui/Reveal';
import CtaBand from '../components/ui/CtaBand';
import Icon from '../components/ui/Icon';
import StatsSection from '../components/home/StatsSection';
import ProcessSection from '../components/home/ProcessSection';
import { company, whyUsPoints } from '../data/siteConfig';

const pillars = [
  {
    icon: 'blueprint',
    title: 'Design',
    text: 'Architectural planning, 2D/3D designs, elevations, and working drawings.',
  },
  {
    icon: 'crane',
    title: 'Build',
    text: 'RCC, masonry, plastering, electrical, plumbing, and all essential building work.',
  },
  {
    icon: 'trowel',
    title: 'Finish',
    text: 'Ceiling, furniture, painting, flooring, and final touch-ups for a perfect handover.',
  },
];

export default function About() {
  return (
    <div className="overflow-hidden">

      {/* ================= HERO ================= */}
      <PageHero
        eyebrow="ABOUT US"
        title="ONE PARTNER. COMPLETE PROJECT."
        text={company.longIntro}
        image="/assets/hero-house.svg"
        breadcrumbs={[{ label: 'About Us' }]}
      />

      {/* ================= WHO WE ARE ================= */}
      <section className="py-8 md:py-10">
        <div className="container mx-auto px-4 md:px-6">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">

            {/* Text */}
            <Reveal>
              <div className="max-w-xl">

                <span className="eyebrow">
                  WHO WE ARE
                </span>

                <div className="rule my-2" />

                <h2 className="mt-0 mb-4">
                  DESIGN. BUILD.{' '}
                  <span className="gold">DELIVER.</span>
                </h2>

                <p className="text-[var(--grey-600)] mb-3">
                  Most construction projects go wrong in the gaps - between design, people, and execution. Supplybase exists to close those gaps.

                </p>

                <p className="text-[var(--grey-600)] mb-0">
                  Supplybase brings the entire project together under one team.We handle drawings, labour, materials, and project management.You get one contract, one point of contact, and clear accountability.From the first sketch to handover, we manage it all.
                </p>

                <div className="flex flex-wrap gap-3 mt-5">

                  <Link
                    to="/services"
                    className="btn btn-dark inline-flex items-center gap-2"
                  >
                    OUR SERVICES
                    <Icon name="arrow-right" size={17} />
                  </Link>

                  {/*
                  <Link
                    to="/projects"
                    className="btn btn-ghost inline-flex items-center gap-2"
                  >
                    VIEW PROJECTS
                    <Icon name="arrow-right" size={17} />
                  </Link>
                  */}

                </div>

              </div>
            </Reveal>

            {/* Image */}
            <Reveal
              className="media-frame"
              delay={120}
            >
              <div className="split-media">
                <img
                  src="/assets/services/architectural-design.svg"
                  alt="Supplybase design and construction"
                  className="w-full h-auto block"
                />
              </div>
            </Reveal>

          </div>
        </div>
      </section>

    {/* ================= WHAT WE DO ================= */}
<section className="pt-0 pb-4 md:pb-6 bg-[var(--section-light)]">
  <div className="container mx-auto px-3 md:px-5">

    <SectionHeading
      center
      eyebrow="WHAT WE DO"
      title="THREE STAGES, ONE TEAM"
      text="Design, construction and finishing are handled in-house, so nothing is lost in handover between trades."
    />

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">

      {pillars.map((pillar, i) => (
        <Reveal
          key={pillar.title}
          delay={i * 90}
          className="
            value-card
            !bg-black/10
            backdrop-blur-xl
            !border-white/25
            !shadow-[0_6px_20px_rgba(0,0,0,0.06)]
            !p-3
            !m-0
          "
        >
          <div className="value-icon mb-2">
            <Icon
              name={pillar.icon}
              size={24}
              strokeWidth={1.4}
            />
          </div>

          <h3 className="!mt-0 !mb-1">
            {pillar.title}
          </h3>

          <p className="!mt-0 !mb-0">
            {pillar.text}
          </p>
        </Reveal>
      ))}

    </div>
  </div>
</section>

     {/* ================= HOW WE WORK ================= */}
<section className="py-4 md:py-6">
  <div className="container mx-auto px-3 md:px-5">

    <SectionHeading
      center
      eyebrow="HOW WE WORK"
      title="WHAT YOU CAN EXPECT"
      text="The things our clients tell us matter most when they hand over a project."
    />

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">

      {whyUsPoints.map((point, i) => (
        <Reveal
          key={point.title}
          delay={(i % 3) * 80}
          className="
            value-card
            !bg-black/10
            backdrop-blur-xl
            !border-white/25
            !shadow-[0_6px_20px_rgba(0,0,0,0.06)]
            !p-3
            !m-0
          "
        >
          <div className="value-icon mb-2">
            <Icon
              name={point.icon}
              size={24}
              strokeWidth={1.4}
            />
          </div>

          <h3 className="!mt-0 !mb-1">
            {point.title}
          </h3>

          <p className="!mt-0 !mb-0">
            {point.text}
          </p>
        </Reveal>
      ))}

    </div>
  </div>
</section>
      {/* ================= PROCESS ================= */}
      <div className="mt-0">
        <ProcessSection />
      </div>

      {/* ================= STATS ================= */}
      {/* <div className="mt-0">
        <StatsSection showHeading={false} />
      </div> */}

      {/* ================= CTA ================= */}
      <div className="mt-1 mb-1 w-full px-0 py-10">
      <CtaBand />
    </div>

    </div>
  );
}
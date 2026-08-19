import { Link } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import SectionHeading from '../components/ui/SectionHeading';
import Reveal from '../components/ui/Reveal';
import CtaBand from '../components/ui/CtaBand';
import Icon from '../components/ui/Icon';
import StatsSection from '../components/home/StatsSection';
import Faq from '../components/ui/Faq';
import { whyUsPoints, company, trustPoints } from '../data/siteConfig';

const comparison = [
  { them: 'You coordinate an architect, a contractor and five separate trades', us: 'One contract and one project manager for the whole job' },
  { them: 'Material bought separately, with price and quality left to chance', us: 'Labour and material supplied together at one agreed rate' },
  { them: 'You only see the result once it is built', us: '2D plans and 3D views approved before work starts' },
  { them: 'Each trade blames the one before it', us: 'One team is accountable from foundation to finishing' },
  { them: 'Timelines slip because trades are not sequenced', us: 'A stage-wise schedule our own team is held to' },
];

const faqs = [
  {
    q: 'What does "one partner, complete project" actually mean?',
    a: 'It means a single contract covering design, civil work, electrical, plumbing, ceiling, furniture, painting and finishing — with labour, material and project management included. You deal with us, and we deal with everything else.',
  },
  {
    q: 'Can I hire you for just one part of the work?',
    a: 'Yes. Every service can be taken on its own — painting only, interiors only, electrical only. Turnkey is what we recommend, not what we insist on.',
  },
  {
    q: 'How do you price a project?',
    a: 'After a site visit and a scope discussion we issue an itemised quotation showing each head of cost, so you can see exactly what you are paying for before committing.',
  },
  {
    q: 'Do you work outside Mumbai?',
    a: 'We regularly work across Mumbai, Navi Mumbai, Thane, Kalyan, Panvel and Pune. Ask us about other locations — it depends on the size of the project.',
  },
];

export default function WhyUs() {
  return (
    <>
      <PageHero
        eyebrow="WHY US"
        title="WHY SUPPLYBASE PROJECTS?"
        text={`${company.model} — everything under one roof, delivered by a team that stays accountable from the first drawing to the final handover.`}
        image="/assets/projects/luxury-bungalow.svg"
        breadcrumbs={[{ label: 'Why Us' }]}
      />

      {/* headline promise */}
      <section className="section">
        <div className="container">
          <SectionHeading
            center
            eyebrow="OUR PROMISE"
            title="ONE PARTNER — COMPLETE PROJECT"
            text="Labour + material + management. One team, one contract, one point of accountability."
          />
          <div className="value-grid">
            {whyUsPoints.map((point, i) => (
              <Reveal key={point.title} className="value-card" delay={(i % 3) * 80}>
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

      {/* comparison */}
      <section className="section section-light">
        <div className="container container-narrow">
          <SectionHeading
            center
            eyebrow="THE DIFFERENCE"
            title="THE USUAL WAY VS. OUR WAY"
            text="Why clients stop juggling contractors and hand the whole project to one team."
          />
          <div style={{ display: 'grid', gap: 12 }}>
            {comparison.map((row, i) => (
              <Reveal
                key={row.us}
                delay={i * 60}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  gap: 16,
                  alignItems: 'center',
                  background: 'var(--white)',
                  border: '1px solid var(--grey-200)',
                  borderRadius: 'var(--radius)',
                  padding: '18px 20px',
                }}
              >
                <span style={{ color: 'var(--grey-500)', fontSize: '0.94rem' }}>{row.them}</span>
                <Icon name="arrow-right" size={18} style={{ color: 'var(--gold)' }} />
                <span style={{ color: 'var(--black)', fontWeight: 600, fontSize: '0.96rem' }}>{row.us}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* trust points */}
      <section className="section section-dark">
        <div className="container">
          <SectionHeading
            center
            eyebrow="WHAT YOU GET"
            title="EVERY PROJECT, EVERY TIME"
          />
          <div className="value-grid">
            {trustPoints.map((point, i) => (
              <Reveal key={point.title} className="value-card" delay={(i % 3) * 80}>
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

      <StatsSection showHeading={false} />

      <section className="section">
        <div className="container container-narrow">
          <SectionHeading center eyebrow="FAQ" title="QUESTIONS CLIENTS ASK" />
          <Faq items={faqs} />
          <div className="btn-row" style={{ justifyContent: 'center', marginTop: 30 }}>
            <Link to="/quote" className="btn btn-primary btn-lg">
              GET A QUOTE
              <Icon name="arrow-right" size={18} />
            </Link>
            <Link to="/projects" className="btn btn-ghost btn-lg">
              SEE OUR WORK
              <Icon name="arrow-right" size={18} />
            </Link>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}

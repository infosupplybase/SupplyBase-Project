import Icon from '../ui/Icon';
import Reveal from '../ui/Reveal';
import SectionHeading from '../ui/SectionHeading';

/**
 * The eight steps from spec §5.
 *
 * Worth showing in full: the ₹25 is step four of eight, which makes it read
 * as one small step in a long process rather than a charge for nothing.
 */
const STEPS = [
  { icon: 'tools', title: 'Select Service', text: 'Painting, plumbing, electrical or interior.' },
  { icon: 'chat', title: 'Tell Us Your Requirement', text: 'A few simple questions about the work.' },
  { icon: 'calendar', title: 'Book Site Visit', text: 'Pick a date and time that suits you.' },
  { icon: 'rupee', title: 'Pay ₹25', text: 'The site visit and quotation fee. Nothing more.' },
  { icon: 'team', title: 'Expert Visit', text: 'Our expert visits, measures and assesses.' },
  { icon: 'blueprint', title: 'Get Quotation', text: 'A written, itemised price — material and labour.' },
  { icon: 'check-circle', title: 'Approve Work', text: 'Happy with it? Approve and we schedule.' },
  { icon: 'home-check', title: 'Project Execution', text: 'We do the work and keep you updated.' },
];

export default function HowItWorks() {
  return (
    <section className="section section-light">
      <div className="container">
        <SectionHeading
          center
          eyebrow="HOW IT WORKS"
          title="HOW SUPPLYBASE WORKS"
          text="Eight simple steps from your first click to a finished project."
        />
        <ol className="how-grid">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} className="how-step" delay={(i % 4) * 70}>
              <span className="how-num">{String(i + 1).padStart(2, '0')}</span>
              <div className="how-icon">
                <Icon name={step.icon} size={24} strokeWidth={1.5} />
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

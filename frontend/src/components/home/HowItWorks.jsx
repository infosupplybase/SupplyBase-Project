import Icon from '../ui/Icon';
import Reveal from '../ui/Reveal';

/**
 * "How Booking Works" — five steps, on the dark band.
 *
 * Five, matching the grid: the connector between steps is drawn from each
 * item to the next, which only reads correctly along a single row. Adding a
 * sixth step would wrap the grid and leave a connector pointing at nothing,
 * so the count and the layout have to agree.
 */
const STEPS = [
  { icon: 'tools', title: 'Choose Service', text: 'Pick from painting, plumbing, electrical or interior work.' },
  { icon: 'calendar', title: 'Select Date & Time', text: 'Choose a visit slot that suits you.' },
  { icon: 'chat', title: 'Share Details', text: 'Answer a few simple questions about the work.' },
  { icon: 'team', title: 'Get Expert', text: 'Our expert visits, measures and quotes.' },
  { icon: 'check-circle', title: 'Work Completed', text: 'Approve the quotation and we get started.' },
];

export default function HowItWorks() {
  return (
    <section className="section section-dark how">
      <div className="container">
        <div className="section-head center">
          <span className="eyebrow">SIMPLE PROCESS</span>
          <div className="rule" />
          <h2>HOW BOOKING WORKS</h2>
          <p>From choosing a service to finished work — five steps, no surprises.</p>
        </div>

        <ol className="how-grid">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} className="how-step" delay={i * 80}>
              <div className="how-icon">
                <Icon name={step.icon} size={26} strokeWidth={1.5} />
                <span className="how-num">{i + 1}</span>
              </div>
              <div className="how-body">
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

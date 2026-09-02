import Icon from '../ui/Icon';
import Reveal from '../ui/Reveal';
import SectionHeading from '../ui/SectionHeading';
import { processSteps } from '../../data/siteConfig';

export default function ProcessSection({ dark = true }) {
  return (
    <section className={`section ${dark ? 'section-dark' : 'section-light'}`}>
      <div className="container">
        <SectionHeading
          center
          eyebrow="HOW IT WORKS"
          title="FROM FIRST CALL TO FINAL HANDOVER"
          text="Four clear stages, so you always know where your project stands."
        />
        <div className="process">
          {processSteps.map((step, i) => (
            <Reveal key={step.number} className="process-step" delay={i * 90}>
              <div className="process-icon">
                <Icon name={step.icon} size={30} strokeWidth={1.4} />
                <span className="process-num">{step.number}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

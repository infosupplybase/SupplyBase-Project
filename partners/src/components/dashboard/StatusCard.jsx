import Icon from '../ui/Icon';

/**
 * A single card with an icon, a title and a short message — one for each
 * account state that is not "approved and working" (no application, under
 * review, declined, paused).
 */
export default function StatusCard({ icon, tone, title, children }) {
  return (
    <div className={`pp-status-card ${tone === 'danger' ? 'is-danger' : ''}`}>
      <span className="pp-status-icon" aria-hidden="true">
        <Icon name={icon} size={24} />
      </span>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

/**
 * Where an application is, as three steps: sent, being reviewed, approved.
 * Shown while it is under review so the applicant can see what happens next.
 */
export function ApplicationSteps({ appliedOn }) {
  const steps = [
    { title: 'Application sent', text: appliedOn ? `On ${appliedOn}` : 'We have your details', state: 'done' },
    { title: 'Supplybase reviews it', text: 'Our team checks every application by hand', state: 'current' },
    { title: 'Approved — start getting jobs', text: 'Your jobs will appear on this page', state: 'todo' },
  ];

  return (
    <ol className="pp-app-steps">
      {steps.map((step, index) => (
        <li key={step.title} className={`is-${step.state}`}>
          <span className="pp-app-step-dot" aria-hidden="true">
            {step.state === 'done' ? <Icon name="check" size={14} strokeWidth={2.6} /> : index + 1}
          </span>
          <div>
            <strong>
              {step.title}
              {step.state === 'current' && <span className="sr-only"> (current step)</span>}
            </strong>
            <span>{step.text}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

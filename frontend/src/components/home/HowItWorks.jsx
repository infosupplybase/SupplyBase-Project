import Icon from '../ui/Icon';
export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Share Your Requirement',
      desc: 'Tell us what you need via WhatsApp or the contact form. No obligation.',
      // Chat/message icon
      svg: (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      number: '02',
      title: 'Free Site Visit',
      desc: 'We visit, measure, and understand the space before quoting.',
      // Map pin icon
      svg: (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
    },
    {
      number: '03',
      title: 'Itemised Quote',
      desc: 'You get a clear, written quotation — no hidden costs, no surprises.',
      // Document/file icon
      svg: (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="15" y2="17" />
        </svg>
      ),
    },
    {
      number: '04',
      title: 'Work Begins',
      desc: 'Our team starts on the agreed date and finishes on schedule.',
      // Check circle icon
      svg: (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
  ];

  return (
    <section className="uc-how-section">
      <div className="uc-container">
        <div className="uc-how-header">
          <span className="uc-eyebrow">HOW IT WORKS</span>
          <h2 className="uc-how-title">From enquiry to handover in 4 steps</h2>
          <p className="uc-how-desc">
            Simple, transparent, and built around your schedule.
          </p>
        </div>

        <div className="uc-how-grid">
          {steps.map((step) => (
            <div key={step.number} className="uc-how-card">
              <span className="uc-how-icon" data-step={step.number}>
                {step.svg}
              </span>

              <h3 className="uc-how-step-title">{step.title}</h3>
              <p className="uc-how-step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
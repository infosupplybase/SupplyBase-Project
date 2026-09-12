import Icon from '../ui/Icon';
export default function OurPromise() {
  const promises = [
    {
      title: 'Transparent Pricing',
      desc: 'Written, itemised quotes. No hidden charges, ever.',
      // File/document icon
      svg: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="15" y2="17" />
        </svg>
      ),
    },
    {
      title: 'In-House Team',
      desc: 'Our own workers — no subcontractors, no middlemen.',
      // Users icon
      svg: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      title: 'Fixed Timeline',
      desc: 'Agreed dates, tracked progress, delivered on schedule.',
      // Clock icon
      svg: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      title: 'Post-Work Support',
      desc: 'We stand by our work — help is a WhatsApp away.',
      // Shield icon
      svg: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
    },
  ];

  return (
    <section className="uc-promise-section">
      <div className="uc-container">
        <div className="uc-promise-header">
          <span className="uc-eyebrow">OUR PROMISE</span>
          <h2 className="uc-promise-title">What you can expect from us</h2>
          <p className="uc-promise-desc">
            Four commitments we make on every project.
          </p>
        </div>

        <div className="uc-promise-grid">
          {promises.map((item) => (
            <div key={item.title} className="uc-promise-card">
              <span className="uc-promise-icon">
                {item.svg}
              </span>
              <h3 className="uc-promise-card-title">{item.title}</h3>
              <p className="uc-promise-card-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
import Icon from '../ui/Icon';

export default function WhySupplyBase() {
  const points = [
    {
      icon: 'award',
      title: '10+ Years',
      subtitle: 'Building homes since 2014',
    },
    {
      icon: 'users',
      title: '30+ Professionals',
      subtitle: 'In-house team, no subcontractors',
    },
    {
      icon: 'star',
      title: '4.9 Rating',
      subtitle: 'From 250+ happy clients',
    },
    {
      icon: 'shield',
      title: '5-Year Warranty',
      subtitle: 'On all structural work',
    },
  ];

  return (
    <section className="uc-trust-section">
      <div className="uc-container">
        <div className="uc-trust-header">
          <span className="uc-eyebrow">WHY SUPPLYBASE</span>
          <h2 className="uc-trust-title">One Partner. Complete Project.</h2>
          <p className="uc-trust-desc">
            Labour, material and management — everything under one accountable roof.
          </p>
        </div>

        <div className="uc-trust-grid">
          {points.map((point) => (
            <div key={point.title} className="uc-trust-card">
              <span className="uc-trust-icon">
                <Icon name={point.icon} size={30} strokeWidth={1.5} />
              </span>
              <h3>{point.title}</h3>
              <p>{point.subtitle}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
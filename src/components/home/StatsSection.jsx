import Reveal from '../ui/Reveal';
import { stats, company } from '../../data/siteConfig';

/**
 * StatsSection — company numbers. Edit the values in src/data/siteConfig.js.
 */
export default function StatsSection({ showHeading = true }) {
  return (
    /* section-accent, not section-dark: the process band above this one is
       already gold-tinted, and two identical bands in a row read as one. */
    <section className="section section-accent">
      <div className="container">
        {showHeading && (
          <Reveal className="section-head center">
            <span className="eyebrow">WHY SUPPLYBASE PROJECTS?</span>
            <div className="rule" />
            <h2>
              ONE PARTNER — <span className="gold">COMPLETE PROJECT</span>
            </h2>
            <p>{company.model} — everything under one roof.</p>
          </Reveal>
        )}
        <div className="stats">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} className="stat" delay={i * 80}>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

import Reveal from '../ui/Reveal';
import Icon from '../ui/Icon';
import CountUp from './CountUp';
import StatsBackdrop from './StatsBackdrop';
import { stats, company } from '../../data/siteConfig';
import './WhySupplybaseStats.css';

/**
 * WHY SUPPLYBASE PROJECTS? — the four company numbers.
 *
 * Values, icons and which card is highlighted all come from siteConfig, so a
 * later admin screen can serve the same shape without this file changing.
 *
 * `showHeading` is kept from the component this replaces: /about already
 * carries its own headline and renders the cards alone.
 */
export default function WhySupplybaseStats({ showHeading = true }) {
  return (
    <section className="wss" aria-labelledby={showHeading ? 'stats-heading' : undefined}>
      <StatsBackdrop />

      <div className="wss-inner">
        {showHeading && (
          <Reveal className="wss-head">
            <span className="wss-eyebrow">WHY SUPPLYBASE PROJECTS?</span>
            <span className="wss-rule" aria-hidden="true" />
            <h2 id="stats-heading" className="wss-heading">
              ONE PARTNER — <span className="wss-heading-gold">COMPLETE PROJECT</span>
            </h2>
            <p className="wss-lead">{company.model} — everything under one roof.</p>
          </Reveal>
        )}

        <ul className="wss-grid">
          {stats.map((stat, i) => (
            <Reveal
              as="li"
              key={stat.id ?? stat.label}
              className={`
  wss-card
  !bg-black/5
  backdrop-blur-xl
  !border !border-white/25
  !shadow-[0_10px_30px_rgba(0,0,0,0.12)]
  ${stat.featured ? 'is-featured' : ''}
`}
              delay={i * 90}
            >
              <span className="wss-icon">
                <Icon name={stat.icon} size={44} strokeWidth={1.4} />
              </span>
              <span className="wss-value">
                <CountUp value={stat.value} />
              </span>
              <span className="wss-label">{stat.label}</span>
              <span className="wss-underline" aria-hidden="true" />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

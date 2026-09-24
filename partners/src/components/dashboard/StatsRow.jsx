import Icon from '../ui/Icon';
import { formatRupees } from '../../lib/money';

/**
 * Four numbers a partner checks first: what is on their plate, what they have
 * finished, what they earned this month, and what they are still owed.
 * `earnings` is null until it loads (the cards show a dash, not a zero).
 */
export default function StatsRow({ earnings }) {
  const e = earnings;

  const cards = [
    {
      key: 'active',
      icon: 'clock',
      label: 'Active jobs',
      value: e ? String(e.activeJobs) : '—',
      note: 'Scheduled or in progress',
    },
    {
      key: 'done',
      icon: 'check-circle',
      label: 'Jobs completed',
      value: e ? String(e.completedJobs) : '—',
      note: e ? `${e.completedThisMonth} this month` : '',
    },
    {
      key: 'month',
      icon: 'calendar',
      label: 'Earned this month',
      value: e ? formatRupees(e.thisMonthPaise) : '—',
      note: 'From jobs completed this month',
    },
    {
      key: 'pending',
      icon: 'rupee',
      label: 'Payout pending',
      value: e ? formatRupees(e.pendingPaise) : '—',
      note: e ? `${formatRupees(e.paidPaise)} paid so far` : '',
      accent: true,
    },
  ];

  return (
    <div className="pd-stats" aria-label="Your numbers">
      {cards.map((card) => (
        <div key={card.key} className={`pd-stat ${card.accent ? 'pd-stat-accent' : ''}`}>
          <span className="pd-stat-icon">
            <Icon name={card.icon} size={18} />
          </span>
          <span className="pd-stat-label">{card.label}</span>
          <strong className="pd-stat-value">{card.value}</strong>
          {card.note && <span className="pd-stat-note">{card.note}</span>}
        </div>
      ))}
    </div>
  );
}

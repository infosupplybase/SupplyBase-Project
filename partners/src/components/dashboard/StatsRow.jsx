import Icon from '../ui/Icon';
import { formatRupees } from '../../lib/money';

/**
 * Four numbers a partner checks first: what is on their plate, what they have
 * finished, what they earned this month, and what they are still owed.
 * `earnings` is null until it loads (the tiles show a dash, not a zero).
 */
export default function StatsRow({ earnings }) {
  const e = earnings;

  const cards = [
    {
      key: 'active',
      icon: 'briefcase',
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
    <ul className="pp-stats" aria-label="Your numbers">
      {cards.map((card) => (
        <li key={card.key} className={`pp-stat ${card.accent ? 'pp-stat-accent' : ''}`}>
          <span className="pp-stat-icon" aria-hidden="true">
            <Icon name={card.icon} size={19} />
          </span>
          <span className="pp-stat-label">{card.label}</span>
          <strong className="pp-stat-value">{card.value}</strong>
          {card.note && <span className="pp-stat-note">{card.note}</span>}
        </li>
      ))}
    </ul>
  );
}

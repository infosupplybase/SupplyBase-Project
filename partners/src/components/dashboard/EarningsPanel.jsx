import Icon from '../ui/Icon';
import { formatDate } from '../../lib/format';
import { formatRupees } from '../../lib/money';
import { PARTNER_PHONE, PARTNER_PHONE_RAW } from '../../config';

/** One completed job's line in the earnings list. */
function EarningRow({ item }) {
  let badge;

  if (item.payoutPaise == null) {
    badge = <span className="pd-badge pd-badge-muted">To be confirmed</span>;
  } else if (item.paidAt) {
    badge = <span className="pd-badge pd-badge-success">Paid {formatDate(item.paidAt)}</span>;
  } else {
    badge = <span className="pd-badge pd-badge-warning">Payment pending</span>;
  }

  return (
    <li className="pd-earn-row">
      <div className="pd-earn-main">
        <strong>{item.serviceLabel || 'Service'}</strong>
        <span>
          {item.bookingNumber}
          {item.completedAt ? ` · Completed ${formatDate(item.completedAt)}` : ''}
        </span>
      </div>
      <div className="pd-earn-amount">
        <strong>{formatRupees(item.payoutPaise)}</strong>
        {badge}
      </div>
    </li>
  );
}

/**
 * What the partner has earned. "Earned" means the job is completed and
 * Supplybase has set its payout; a completed job with no amount yet is shown
 * as "to be confirmed" rather than as ₹0. Amounts are set by Supplybase per job.
 */
export default function EarningsPanel({ earnings, error }) {
  if (error) {
    return (
      <div role="alert" className="alert alert-error">
        <Icon name="info" size={18} />
        <span>{error}</span>
      </div>
    );
  }

  if (!earnings) {
    return <p className="question-hint">Loading your earnings…</p>;
  }

  const cards = [
    { label: 'Total earned', value: formatRupees(earnings.earnedPaise), note: 'All completed jobs', primary: true },
    { label: 'Paid out', value: formatRupees(earnings.paidPaise), note: 'Already sent to you' },
    { label: 'Payout pending', value: formatRupees(earnings.pendingPaise), note: 'Earned, not yet paid', warn: true },
    { label: 'This month', value: formatRupees(earnings.thisMonthPaise), note: `${earnings.completedThisMonth} job${earnings.completedThisMonth === 1 ? '' : 's'} completed` },
  ];

  const helpLink = `https://wa.me/${PARTNER_PHONE_RAW}?text=${encodeURIComponent('Hello Supplybase, I have a question about a payout.')}`;

  return (
    <>
      <div className="pd-earn-cards">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`pd-earn-card ${card.primary ? 'pd-earn-card-primary' : ''} ${card.warn ? 'pd-earn-card-warn' : ''}`}
          >
            <span className="pd-earn-label">{card.label}</span>
            <strong className="pd-earn-value">{card.value}</strong>
            <span className="pd-earn-note">{card.note}</span>
          </div>
        ))}
      </div>

      {earnings.awaitingPayoutJobs > 0 && (
        <div className="pd-callout">
          <Icon name="info" size={18} />
          <span>
            {earnings.awaitingPayoutJobs} completed job{earnings.awaitingPayoutJobs === 1 ? ' is' : 's are'} waiting
            for Supplybase to confirm the amount. It will show here as soon as it is set.
          </span>
        </div>
      )}

      <div className="partner-section-title">
        <h2>Completed jobs &amp; payouts</h2>
        <span>{earnings.completedJobs}</span>
      </div>

      {earnings.recent.length === 0 ? (
        <div className="partner-empty">
          <Icon name="rupee" size={32} />
          <h3>No earnings yet</h3>
          <p>Complete your first job and its payout will appear here.</p>
        </div>
      ) : (
        <ul className="pd-earn-list">
          {earnings.recent.map((item) => (
            <EarningRow key={item.bookingId} item={item} />
          ))}
        </ul>
      )}

      <p className="pd-fineprint">
        Supplybase sets the payout for each job. Question about an amount?{' '}
        <a href={helpLink} target="_blank" rel="noopener noreferrer">
          WhatsApp the partner desk
        </a>{' '}
        on {PARTNER_PHONE}.
      </p>
    </>
  );
}

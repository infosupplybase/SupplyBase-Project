import Icon from '../ui/Icon';
import { formatDate } from '../../lib/format';
import { formatRupees } from '../../lib/money';
import { PARTNER_PHONE, PARTNER_PHONE_RAW } from '../../config';

/** One completed job's line in the earnings list. */
function EarningRow({ item }) {
  let badge;

  if (item.payoutPaise == null) {
    badge = <span className="pp-pill pp-pill-muted">To be confirmed</span>;
  } else if (item.paidAt) {
    badge = <span className="pp-pill pp-pill-success">Paid {formatDate(item.paidAt)}</span>;
  } else {
    badge = <span className="pp-pill pp-pill-warning">Payment pending</span>;
  }

  return (
    <li className="pp-earn-row">
      <span className="pp-earn-row-icon" aria-hidden="true">
        <Icon name={item.paidAt ? 'check-circle' : 'clock'} size={18} />
      </span>
      <div className="pp-earn-main">
        <strong>{item.serviceLabel || 'Service'}</strong>
        <span>
          {item.bookingNumber}
          {item.completedAt ? ` · Completed ${formatDate(item.completedAt)}` : ''}
        </span>
      </div>
      <div className="pp-earn-amount">
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
    return (
      <div className="pp-earn-hero pp-skeleton" aria-busy="true">
        <span className="sr-only" role="status">
          Loading your earnings…
        </span>
        <span className="pp-sk pp-sk-title" />
        <span className="pp-sk pp-sk-line" />
      </div>
    );
  }

  const tiles = [
    { label: 'Total earned', value: formatRupees(earnings.earnedPaise), note: 'All completed jobs' },
    { label: 'Paid to you', value: formatRupees(earnings.paidPaise), note: 'Already sent' },
    {
      label: 'This month',
      value: formatRupees(earnings.thisMonthPaise),
      note: `${earnings.completedThisMonth} job${earnings.completedThisMonth === 1 ? '' : 's'} completed`,
    },
  ];

  const helpLink = `https://wa.me/${PARTNER_PHONE_RAW}?text=${encodeURIComponent('Hello Supplybase, I have a question about a payout.')}`;

  return (
    <section aria-labelledby="pp-earn-title">
      <h2 id="pp-earn-title" className="sr-only">
        Earnings
      </h2>

      <div className="pp-earn-hero">
        <div>
          <span className="pp-earn-hero-label">Waiting to be paid to you</span>
          <strong className="pp-earn-hero-value">{formatRupees(earnings.pendingPaise)}</strong>
          <span className="pp-earn-hero-note">
            Earned on your completed jobs and not yet sent to you.
          </span>
        </div>
        <span className="pp-earn-hero-coin" aria-hidden="true">
          <Icon name="rupee" size={34} />
        </span>
      </div>

      <ul className="pp-earn-tiles">
        {tiles.map((tile) => (
          <li key={tile.label} className="pp-earn-tile">
            <span className="pp-earn-label">{tile.label}</span>
            <strong className="pp-earn-value">{tile.value}</strong>
            <span className="pp-earn-note">{tile.note}</span>
          </li>
        ))}
      </ul>

      {earnings.awaitingPayoutJobs > 0 && (
        <div className="pp-callout">
          <Icon name="info" size={18} />
          <span>
            {earnings.awaitingPayoutJobs} completed job{earnings.awaitingPayoutJobs === 1 ? ' is' : 's are'} waiting
            for Supplybase to confirm the amount. It will show here as soon as it is set.
          </span>
        </div>
      )}

      <div className="pp-section-head">
        <h3>Completed jobs &amp; payouts</h3>
        <span className="pp-count">{earnings.completedJobs}</span>
      </div>

      {earnings.recent.length === 0 ? (
        <div className="pp-empty pp-empty-sm">
          <span className="pp-empty-icon" aria-hidden="true">
            <Icon name="rupee" size={26} />
          </span>
          <h3>No earnings yet</h3>
          <p>Complete your first job and its payout will appear here.</p>
        </div>
      ) : (
        <ul className="pp-earn-list">
          {earnings.recent.map((item) => (
            <EarningRow key={item.bookingId} item={item} />
          ))}
        </ul>
      )}

      <p className="pp-fineprint">
        Supplybase sets the payout for each job. Question about an amount?{' '}
        <a href={helpLink} target="_blank" rel="noopener noreferrer">
          WhatsApp the partner desk
        </a>{' '}
        on {PARTNER_PHONE}.
      </p>
    </section>
  );
}

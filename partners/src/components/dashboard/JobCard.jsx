import Icon from '../ui/Icon';
import { NEXT_STEP, jobStatusLabel, jobStatusTone } from '../../lib/bookingStatus';
import { formatDate, formatDay, dayLabel, mapsHref, telHref, whatsappHref } from '../../lib/format';
import { formatRupees } from '../../lib/money';

/**
 * What this job pays the partner and where that stands. Only their own payout
 * — never what the customer pays.
 */
function payoutLine(job) {
  if (job.status === 'CANCELLED') return null;

  if (job.partnerPayoutPaise == null) {
    return { tone: 'muted', text: 'Payout: to be confirmed by Supplybase' };
  }

  const amount = formatRupees(job.partnerPayoutPaise);

  if (job.partnerPaidAt) {
    return { tone: 'success', text: `${amount} · Paid on ${formatDate(job.partnerPaidAt)}` };
  }
  if (job.status === 'WORK_COMPLETED') {
    return { tone: 'warning', text: `${amount} · Payment pending` };
  }
  return { tone: 'accent', text: `${amount} · earned once you complete the job` };
}

/** One assigned job: when, where, who, what was asked for, what it pays, and the next step. */
export default function JobCard({ job, done, busy, error, onAdvance, nextUp }) {
  const step = NEXT_STEP[job.status];
  const payout = payoutLine(job);
  const when = dayLabel(job.preferredDate);
  const address = [job.address, job.location].filter(Boolean).join(', ');
  const facts = [
    job.propertyType,
    job.areaSqft ? `${job.areaSqft} sq ft` : null,
    job.workNature,
    job.workOption,
  ].filter(Boolean);
  const requirements = job.requirements || [];

  const directions = mapsHref(job.address, job.location);
  const call = telHref(job.phone);
  const greeting = job.name ? `Hello ${job.name}` : 'Hello';
  const chat = whatsappHref(
    job.whatsapp || job.phone,
    `${greeting}, this is your Supplybase professional about booking ${job.bookingNumber || job.reference}.`
  );

  return (
    <div className={`partner-job-card ${done ? 'done' : ''} ${nextUp ? 'pd-next-up' : ''}`}>
      {nextUp && <span className="pd-next-flag">NEXT UP{when ? ` · ${when.toUpperCase()}` : ''}</span>}

      <div className="partner-job-top">
        <div>
          <span className="partner-job-number">{job.bookingNumber || job.reference}</span>
          <h3>{job.serviceLabel || 'Service'}</h3>
        </div>

        <span className={`partner-status partner-status-${jobStatusTone(job.status)}`}>
          {jobStatusLabel(job.status)}
        </span>
      </div>

      <ul className="partner-job-meta">
        {job.preferredDate && (
          <li>
            <Icon name="calendar" size={15} />
            <span>
              {formatDay(job.preferredDate)}
              {job.preferredSlot ? ` · ${job.preferredSlot}` : ''}
              {when && !nextUp && !done && <em className="pd-when"> · {when}</em>}
            </span>
          </li>
        )}

        {address && (
          <li>
            <Icon name="map-pin" size={15} />
            <span>{address}</span>
          </li>
        )}

        {job.name && (
          <li className="partner-job-contact">
            <Icon name="user" size={15} />
            <span>
              {job.name}
              {job.phone && (
                <>
                  {' · '}
                  <a href={`tel:${job.phone}`}>{job.phone}</a>
                </>
              )}
            </span>
          </li>
        )}

        {facts.length > 0 && (
          <li>
            <Icon name="layers" size={15} />
            <span>{facts.join(' · ')}</span>
          </li>
        )}
      </ul>

      {job.workDetail && <p className="pd-note">“{job.workDetail}”</p>}

      {requirements.length > 0 && (
        <details className="pd-requirements" open={!done && requirements.length <= 6}>
          <summary>What the customer asked for ({requirements.length})</summary>
          <ul>
            {requirements.map((item, index) => (
              <li key={`${item.question}-${index}`}>
                <span className="pd-req-q">{item.question}</span>
                <span className="pd-req-a">
                  {item.answer}
                  {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {payout && (
        <div className={`pd-payout pd-payout-${payout.tone}`}>
          <Icon name="rupee" size={15} />
          <span>{payout.text}</span>
        </div>
      )}

      {!done && (directions || call || chat) && (
        <div className="pd-quick-actions">
          {directions && (
            <a className="pd-chip" href={directions} target="_blank" rel="noopener noreferrer">
              <Icon name="map-pin" size={14} /> Directions
            </a>
          )}
          {call && (
            <a className="pd-chip" href={call}>
              <Icon name="phone" size={14} /> Call customer
            </a>
          )}
          {chat && (
            <a className="pd-chip" href={chat} target="_blank" rel="noopener noreferrer">
              <Icon name="whatsapp" size={14} /> WhatsApp
            </a>
          )}
        </div>
      )}

      {error && (
        <div role="alert" className="alert alert-error">
          <Icon name="info" size={18} />
          <span>{error}</span>
        </div>
      )}

      {!done && (
        <div className="partner-job-foot">
          {step ? (
            <button type="button" className="btn btn-primary" onClick={() => onAdvance(job)} disabled={busy}>
              {busy ? 'Saving…' : step.label}
            </button>
          ) : (
            <span className="partner-job-wait">Waiting on Supplybase for the next step.</span>
          )}
        </div>
      )}
    </div>
  );
}

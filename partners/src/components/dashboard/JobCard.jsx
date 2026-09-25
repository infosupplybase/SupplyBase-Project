import Icon from '../ui/Icon';
import { JOB_STEPS, NEXT_STEP, jobGuide, jobStatusLabel, jobStatusTone, jobStep } from '../../lib/bookingStatus';
import { daysFromToday, formatDate, formatDay, dayLabel, mapsHref, telHref, whatsappHref } from '../../lib/format';
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
  return { tone: 'accent', text: `${amount} · yours once you complete the job` };
}

/** The five steps as a bar: done ones filled, the current one ringed. */
function StepBar({ status }) {
  const current = jobStep(status);
  if (current == null) return null;
  const finished = status === 'WORK_COMPLETED';

  return (
    <ol className="pp-steps" aria-label={`Step ${current + 1} of ${JOB_STEPS.length}: ${JOB_STEPS[current]}`}>
      {JOB_STEPS.map((name, index) => {
        const state = index < current || finished ? 'done' : index === current ? 'current' : 'todo';
        return (
          <li key={name} className={`pp-step is-${state}`} aria-hidden="true">
            <span className="pp-step-dot">{state === 'done' ? <Icon name="check" size={12} strokeWidth={2.6} /> : index + 1}</span>
            <span className="pp-step-name">{name}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** One assigned job: where it is, what to do now, when, where, who, what was asked for, and what it pays. */
export default function JobCard({ job, done, busy, error, onAdvance, nextUp }) {
  const step = NEXT_STEP[job.status];
  const payout = payoutLine(job);
  const when = dayLabel(job.preferredDate);
  const day = formatDay(job.preferredDate);
  const daysAway = daysFromToday(job.preferredDate);
  const onDay = daysAway === 0 ? 'today' : daysAway === 1 ? 'tomorrow' : day ? `on ${day}` : '';
  const guide = jobGuide(job.status, onDay);
  const address = [job.address, job.location].filter(Boolean).join(', ');
  const facts = [
    job.propertyType,
    job.areaSqft ? `${job.areaSqft} sq ft` : null,
    job.workNature,
    job.workOption,
  ].filter(Boolean);
  const requirements = job.requirements || [];

  const directions = !done && mapsHref(job.address, job.location);
  const call = !done && telHref(job.phone);
  const greeting = job.name ? `Hello ${job.name}` : 'Hello';
  const chat =
    !done &&
    whatsappHref(
      job.whatsapp || job.phone,
      `${greeting}, this is your Supplybase professional about booking ${job.bookingNumber || job.reference}.`
    );

  return (
    <article
      className={`pp-job ${done ? 'is-done' : ''} ${nextUp ? 'is-next' : ''}`}
      aria-label={`${job.serviceLabel || 'Service'}, ${jobStatusLabel(job.status)}`}
    >
      {nextUp && (
        <div className="pp-job-flag">
          <Icon name="clock" size={15} />
          Next up{when ? ` · ${when}` : ''}
        </div>
      )}

      <header className="pp-job-head">
        <span className="pp-job-icon" aria-hidden="true">
          <Icon name="briefcase" size={20} />
        </span>
        <div className="pp-job-title">
          <h3>{job.serviceLabel || 'Service'}</h3>
          <span className="pp-job-ref">{job.bookingNumber || job.reference}</span>
        </div>
        <span className={`pp-pill pp-pill-${jobStatusTone(job.status)}`}>{jobStatusLabel(job.status)}</span>
      </header>

      <StepBar status={job.status} />

      <div className={`pp-guide ${guide.you ? 'is-you' : ''}`}>
        <Icon name={guide.you ? 'bell' : 'info'} size={18} />
        <p>
          <strong>{guide.you ? 'Your next step: ' : done ? '' : 'For now: '}</strong>
          {guide.text}
        </p>
      </div>

      <dl className="pp-facts">
        {job.preferredDate && (
          <div>
            <dt>
              <Icon name="calendar" size={15} /> When
            </dt>
            <dd>
              {day}
              {job.preferredSlot ? ` · ${job.preferredSlot}` : ''}
              {when && !done && <span className="pp-when">{when}</span>}
            </dd>
          </div>
        )}

        {address && (
          <div>
            <dt>
              <Icon name="map-pin" size={15} /> Where
            </dt>
            <dd>{address}</dd>
          </div>
        )}

        {job.name && (
          <div>
            <dt>
              <Icon name="user" size={15} /> Customer
            </dt>
            <dd>
              {job.name}
              {!done && job.phone && (
                <>
                  {' · '}
                  <a href={telHref(job.phone)}>{job.phone}</a>
                </>
              )}
            </dd>
          </div>
        )}

        {facts.length > 0 && (
          <div>
            <dt>
              <Icon name="layers" size={15} /> Work
            </dt>
            <dd>{facts.join(' · ')}</dd>
          </div>
        )}
      </dl>

      {job.workDetail && <p className="pp-note">“{job.workDetail}”</p>}

      {requirements.length > 0 && (
        <details className="pp-reqs" open={!done && requirements.length <= 6}>
          <summary>
            What the customer asked for <span>{requirements.length}</span>
          </summary>
          <ul>
            {requirements.map((item, index) => (
              <li key={`${item.question}-${index}`}>
                <span className="pp-req-q">{item.question}</span>
                <span className="pp-req-a">
                  {item.answer}
                  {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {payout && (
        <div className={`pp-payout pp-payout-${payout.tone}`}>
          <Icon name="rupee" size={16} />
          <span>{payout.text}</span>
        </div>
      )}

      {(directions || call || chat) && (
        <div className="pp-quick">
          {directions && (
            <a className="pp-quick-btn" href={directions} target="_blank" rel="noopener noreferrer">
              <Icon name="map-pin" size={18} />
              <span>Directions</span>
            </a>
          )}
          {call && (
            <a className="pp-quick-btn" href={call}>
              <Icon name="phone" size={18} />
              <span>Call</span>
            </a>
          )}
          {chat && (
            <a className="pp-quick-btn pp-quick-wa" href={chat} target="_blank" rel="noopener noreferrer">
              <Icon name="whatsapp" size={18} />
              <span>WhatsApp</span>
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

      {!done && step && (
        <div className="pp-job-foot">
          <button type="button" className="btn btn-primary pp-step-btn" onClick={() => onAdvance(job)} disabled={busy}>
            {busy ? 'Saving…' : step.label}
            {!busy && <Icon name="arrow-right" size={18} />}
          </button>
        </div>
      )}
    </article>
  );
}

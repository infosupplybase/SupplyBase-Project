import Icon from '../ui/Icon';
import JobCard from './JobCard';
import { isFinished } from '../../lib/bookingStatus';
import { daysFromToday } from '../../lib/format';

/**
 * Soonest visit first; a job with no date yet goes last. `Array.sort` is
 * stable, so jobs on the same day keep the order the API gave (newest first).
 */
const bySchedule = (a, b) => {
  const da = a.preferredDate || '9999-12-31';
  const db = b.preferredDate || '9999-12-31';
  return da < db ? -1 : da > db ? 1 : 0;
};

/** The partner's active jobs (soonest first) and their finished ones. */
export default function JobsSection({ jobs, busyJob, jobError, onAdvance }) {
  if (!jobs) {
    return <p className="question-hint">Loading your jobs…</p>;
  }

  if (jobs.length === 0) {
    return (
      <div className="partner-empty">
        <Icon name="calendar" size={32} />
        <h3>No jobs assigned yet</h3>
        <p>When Supplybase assigns you a job, it will appear here with the customer&apos;s details.</p>
      </div>
    );
  }

  const active = jobs.filter((job) => !isFinished(job.status)).sort(bySchedule);
  const finished = jobs.filter((job) => isFinished(job.status));

  // The first job that is today or later is the one to go to next.
  const nextUpId = active.find((job) => {
    const days = daysFromToday(job.preferredDate);
    return days != null && days >= 0;
  })?.id;

  return (
    <>
      <div className="partner-section-title">
        <h2>Active jobs</h2>
        <span>{active.length}</span>
      </div>

      {active.length === 0 ? (
        <p className="question-hint">Nothing active right now.</p>
      ) : (
        <div className="partner-job-list">
          {active.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              nextUp={job.id === nextUpId}
              busy={busyJob === job.id}
              error={jobError[job.id]}
              onAdvance={onAdvance}
            />
          ))}
        </div>
      )}

      {finished.length > 0 && (
        <>
          <div className="partner-section-title">
            <h2>Finished</h2>
            <span>{finished.length}</span>
          </div>

          <div className="partner-job-list">
            {finished.map((job) => (
              <JobCard key={job.id} job={job} done />
            ))}
          </div>
        </>
      )}
    </>
  );
}

import { useState } from 'react';
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

/** Placeholder cards while the jobs load, shaped like the real thing. */
function Skeleton() {
  return (
    <div className="pp-job-list" aria-hidden="true">
      {[0, 1].map((i) => (
        <div key={i} className="pp-job pp-skeleton">
          <span className="pp-sk pp-sk-title" />
          <span className="pp-sk pp-sk-bar" />
          <span className="pp-sk pp-sk-line" />
          <span className="pp-sk pp-sk-line short" />
        </div>
      ))}
    </div>
  );
}

/** The partner's active jobs (soonest first) and their finished ones, one list at a time. */
export default function JobsSection({ jobs, busyJob, jobError, onAdvance }) {
  const [view, setView] = useState('active');

  if (!jobs) {
    return (
      <>
        <p className="sr-only" role="status">
          Loading your jobs…
        </p>
        <Skeleton />
      </>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="pp-empty">
        <span className="pp-empty-icon" aria-hidden="true">
          <Icon name="briefcase" size={28} />
        </span>
        <h3>No jobs assigned yet</h3>
        <p>
          When Supplybase gives you a job, it appears here with the date, the address and what the customer needs. Keep
          your phone handy — we will also call you.
        </p>
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

  const showing = view === 'active' ? active : finished;

  return (
    <section aria-labelledby="pp-jobs-title">
      <div className="pp-section-head">
        <h2 id="pp-jobs-title">Your jobs</h2>
        <div className="pp-segment" role="group" aria-label="Which jobs to show">
          <button type="button" aria-pressed={view === 'active'} onClick={() => setView('active')}>
            Active <span>{active.length}</span>
          </button>
          <button type="button" aria-pressed={view === 'finished'} onClick={() => setView('finished')}>
            Finished <span>{finished.length}</span>
          </button>
        </div>
      </div>

      {view === 'finished' && finished.length > 0 && (
        <p className="pp-privacy-note">
          <Icon name="lock" size={15} />
          Customer phone numbers and addresses are removed from finished jobs to protect their privacy.
        </p>
      )}

      {showing.length === 0 ? (
        <div className="pp-empty pp-empty-sm">
          <h3>{view === 'active' ? 'Nothing active right now' : 'No finished jobs yet'}</h3>
          <p>
            {view === 'active'
              ? 'Your finished jobs are under “Finished”. New jobs appear here as soon as they are assigned.'
              : 'Jobs you complete will be listed here with their payout.'}
          </p>
        </div>
      ) : (
        <div className="pp-job-list">
          {showing.map((job) =>
            view === 'active' ? (
              <JobCard
                key={job.id}
                job={job}
                nextUp={job.id === nextUpId}
                busy={busyJob === job.id}
                error={jobError[job.id]}
                onAdvance={onAdvance}
              />
            ) : (
              <JobCard key={job.id} job={job} done />
            )
          )}
        </div>
      )}
    </section>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import { contact } from '../data/siteConfig';
import { useAuth } from '../context/AuthContext';
import api, { friendlyError } from '../lib/api';
import { bookingStatusLabel, bookingStatusTone } from '../lib/bookingStatus';

/**
 * The next step a partner may take on their own job, keyed by its current
 * status. This mirrors BookingService.SELF_SERVICE_TRANSITIONS on the server,
 * which is what actually enforces it — the buttons here are only the honest
 * way to offer what the API will accept. Everything before the visit is
 * scheduled (assignment, quotes, approvals) stays with SupplyBase staff.
 */
const NEXT_STEP = {
  SITE_VISIT_SCHEDULED: { status: 'SITE_VISIT_COMPLETED', label: 'Mark site visit done' },
  WORK_SCHEDULED: { status: 'WORK_IN_PROGRESS', label: 'Start work' },
  WORK_IN_PROGRESS: {
    status: 'WORK_COMPLETED',
    label: 'Mark work completed',
    confirm: 'Mark this job as completed? This tells SupplyBase the work is finished.',
  },
};

/** The booking labels are written for customers; a partner reads a couple of them differently. */
const PARTNER_LABEL = { PROFESSIONAL_ASSIGNED: 'Assigned to you' };
const jobStatusLabel = (status) => PARTNER_LABEL[status] || bookingStatusLabel(status);

const isFinished = (status) => status === 'WORK_COMPLETED' || status === 'CANCELLED';

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

/**
 * /partner — the professional's home.
 *
 * What it shows depends on where their application stands, all read from the
 * server: still under review, turned down, suspended (with the reason each
 * time), or approved — in which case their assigned jobs, with the next
 * step they are allowed to take on each one.
 *
 * "Approved" is decided by the account's role, not by the page: an admin
 * approving an application is what grants the PROFESSIONAL role, and the API
 * rejects the jobs endpoints for anyone without it. An admin who made
 * someone a professional through the Users page (with no application on
 * file) therefore still gets their jobs here.
 */
export default function PartnerDashboard() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  // undefined = still loading, null = this account never applied
  const [profile, setProfile] = useState(undefined);
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState('');
  const [busyJob, setBusyJob] = useState(null);
  const [jobError, setJobError] = useState({});
  const [checking, setChecking] = useState(false);

  const isProfessional = user.role === 'PROFESSIONAL';
  const isAdmin = user.role === 'ADMIN';

  const loadProfile = useCallback(async () => {
    try {
      setProfile(await api.partnerMe());
      setError('');
    } catch (err) {
      if (err && err.status === 404) setProfile(null);
      else setError(friendlyError(err));
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Approved, but this tab still holds the pre-approval role: pick up the new one.
  useEffect(() => {
    if (profile && profile.status === 'APPROVED' && !isProfessional) refreshUser().catch(() => {});
  }, [profile, isProfessional, refreshUser]);

  const loadJobs = useCallback(async () => {
    try {
      setJobs(await api.partnerJobs());
    } catch (err) {
      setError(friendlyError(err));
    }
  }, []);

  useEffect(() => {
    if (isProfessional) loadJobs();
  }, [isProfessional, loadJobs]);

  /** "Check again" — approval changes the role, so both need re-reading. */
  const handleCheckAgain = async () => {
    setChecking(true);
    try {
      await refreshUser();
      await loadProfile();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setChecking(false);
    }
  };

  const handleAdvance = async (job) => {
    const step = NEXT_STEP[job.status];
    if (!step) return;
    if (step.confirm && !window.confirm(step.confirm)) return;

    setBusyJob(job.id);
    setJobError((e) => ({ ...e, [job.id]: '' }));
    try {
      const updated = await api.partnerAdvanceJob(job.id, step.status);
      setJobs((list) => list.map((j) => (j.id === updated.id ? updated : j)));
    } catch (err) {
      setJobError((e) => ({ ...e, [job.id]: friendlyError(err) }));
    } finally {
      setBusyJob(null);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/partner/login', { replace: true });
  };

  const handleSignOutAndApply = async () => {
    await logout();
    navigate('/partner/join', { replace: true });
  };

  const firstName = (user.fullName || '').split(' ')[0];
  const loading = profile === undefined && !error;

  /* ------------------------------------------------------- what to show */

  let body;
  if (loading) {
    body = <p className="question-hint">Loading your partner account…</p>;
  } else if (isAdmin) {
    body = (
      <StatusCard icon="shield" title="This is an admin account">
        <p>
          Admin accounts manage partners from the admin portal rather than working jobs here. Sign
          in with a partner account to see the partner dashboard.
        </p>
        <div className="partner-actions">
          <button type="button" className="btn btn-outline" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </StatusCard>
    );
  } else if (isProfessional) {
    body = <JobsSection jobs={jobs} busyJob={busyJob} jobError={jobError} onAdvance={handleAdvance} />;
  } else if (profile === null) {
    body = (
      <StatusCard icon="user" title="No partner application on this account">
        <p>
          You&apos;re signed in as a customer. To work with SupplyBase, sign out and apply with your
          professional details.
        </p>
        <div className="partner-actions">
          <button type="button" className="btn btn-primary" onClick={handleSignOutAndApply}>
            Sign out and apply
          </button>
          <Link to="/dashboard/bookings" className="btn btn-outline">
            Go to my bookings
          </Link>
        </div>
      </StatusCard>
    );
  } else if (profile && profile.status === 'PENDING') {
    body = (
      <StatusCard icon="clock" title="Your application is under review">
        <p>
          Thanks{firstName ? `, ${firstName}` : ''}. We&apos;ve received your application and our
          team reviews every one by hand. Once it&apos;s approved, the jobs assigned to you will
          appear on this page.
        </p>
        <div className="partner-actions">
          <button type="button" className="btn btn-outline" onClick={handleCheckAgain} disabled={checking}>
            {checking ? 'Checking…' : 'Check status'}
          </button>
        </div>
      </StatusCard>
    );
  } else if (profile && profile.status === 'REJECTED') {
    body = (
      <StatusCard icon="info" tone="danger" title="Your application wasn't approved">
        {profile.reviewNote && <p className="partner-reason">{profile.reviewNote}</p>}
        <p>
          If you think this is a mistake or you&apos;d like to talk it through, call us on{' '}
          {contact.phoneDisplay}.
        </p>
      </StatusCard>
    );
  } else if (profile && profile.status === 'SUSPENDED') {
    body = (
      <StatusCard icon="info" tone="danger" title="Your partner access is paused">
        {profile.reviewNote && <p className="partner-reason">{profile.reviewNote}</p>}
        <p>Call us on {contact.phoneDisplay} to talk about getting back to work.</p>
      </StatusCard>
    );
  } else {
    // APPROVED but the role has not caught up yet — the effect above is fetching it.
    body = <p className="question-hint">Your application is approved — setting up your access…</p>;
  }

  return (
    <>
      <PageHero
        eyebrow="SUPPLYBASE PARTNERS"
        title="PARTNER DASHBOARD"
        text="Your application, your jobs and your next steps in one place."
        image="/assets/services/service-hero.jpg"
        breadcrumbs={[{ label: 'Partners' }, { label: 'Dashboard' }]}
      />

      <section className="section">
        <div className="container">
          <div className="partner-layout">
            <div className="partner-main">
              {error && (
                <div role="alert" className="alert alert-error">
                  <Icon name="info" size={18} />
                  <span>{error}</span>
                </div>
              )}
              {body}
            </div>

            <aside className="partner-side">
              <div className="partner-side-card">
                <h3>Your account</h3>
                <dl className="partner-summary">
                  <div>
                    <dt>Name</dt>
                    <dd>{user.fullName}</dd>
                  </div>
                  <div>
                    <dt>Mobile</dt>
                    <dd>{user.phone || '—'}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{user.email}</dd>
                  </div>
                </dl>
              </div>

              {profile && (
                <div className="partner-side-card">
                  <h3>Application</h3>
                  <dl className="partner-summary">
                    <div>
                      <dt>Status</dt>
                      <dd>{profile.status.charAt(0) + profile.status.slice(1).toLowerCase()}</dd>
                    </div>
                    <div>
                      <dt>Trade</dt>
                      <dd>{profile.tradeLabel || '—'}</dd>
                    </div>
                    <div>
                      <dt>Experience</dt>
                      <dd>{profile.experienceYears == null ? '—' : `${profile.experienceYears} yrs`}</dd>
                    </div>
                    <div>
                      <dt>City</dt>
                      <dd>{profile.city || '—'}</dd>
                    </div>
                    {profile.serviceAreas && (
                      <div>
                        <dt>Areas</dt>
                        <dd>{profile.serviceAreas}</dd>
                      </div>
                    )}
                    {profile.languages && (
                      <div>
                        <dt>Languages</dt>
                        <dd>{profile.languages}</dd>
                      </div>
                    )}
                    <div>
                      <dt>Applied</dt>
                      <dd>{formatDate(profile.appliedAt)}</dd>
                    </div>
                  </dl>
                </div>
              )}

              <button type="button" className="btn btn-outline" onClick={handleSignOut}>
                Sign out
              </button>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------ pieces */

function StatusCard({ icon, tone, title, children }) {
  return (
    <div className="partner-status-card">
      <span className={`partner-status-icon ${tone === 'danger' ? 'danger' : ''}`}>
        <Icon name={icon} size={22} />
      </span>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function JobsSection({ jobs, busyJob, jobError, onAdvance }) {
  if (!jobs) return <p className="question-hint">Loading your jobs…</p>;

  const active = jobs.filter((j) => !isFinished(j.status));
  const finished = jobs.filter((j) => isFinished(j.status));

  if (jobs.length === 0) {
    return (
      <div className="acct-empty">
        <Icon name="calendar" size={32} />
        <h3>No jobs assigned yet</h3>
        <p>When SupplyBase assigns you a job, it will appear here with the customer&apos;s details.</p>
      </div>
    );
  }

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
            <JobCard key={job.id} job={job} busy={busyJob === job.id} error={jobError[job.id]} onAdvance={onAdvance} />
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

function JobCard({ job, done, busy, error, onAdvance }) {
  const step = NEXT_STEP[job.status];

  return (
    <div className={`partner-job-card ${done ? 'done' : ''}`}>
      <div className="acct-booking-top">
        <div>
          <span className="acct-booking-number">{job.bookingNumber || job.reference}</span>
          <h3>{job.serviceLabel || 'Service'}</h3>
        </div>
        <span className={`acct-status acct-status-${bookingStatusTone(job.status)}`}>
          {jobStatusLabel(job.status)}
        </span>
      </div>

      <ul className="acct-booking-meta">
        {job.preferredDate && (
          <li>
            <Icon name="calendar" size={15} />
            {formatDate(job.preferredDate)}
            {job.preferredSlot ? ` · ${job.preferredSlot}` : ''}
          </li>
        )}
        {(job.address || job.location) && (
          <li>
            <Icon name="map-pin" size={15} />
            {[job.address, job.location].filter(Boolean).join(', ')}
          </li>
        )}
        {job.name && (
          <li className="partner-job-contact">
            <Icon name="user" size={15} />
            {job.name}
            {job.phone && (
              <>
                {' · '}
                <a href={`tel:${job.phone}`}>{job.phone}</a>
              </>
            )}
          </li>
        )}
      </ul>

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
            <span className="partner-job-wait">Waiting on SupplyBase for the next step.</span>
          )}
        </div>
      )}
    </div>
  );
}

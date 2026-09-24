import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Icon from '../components/ui/Icon';
import PartnerHero from '../components/dashboard/PartnerHero';
import StatusCard from '../components/dashboard/StatusCard';
import StatsRow from '../components/dashboard/StatsRow';
import JobsSection from '../components/dashboard/JobsSection';
import EarningsPanel from '../components/dashboard/EarningsPanel';
import SupportCard from '../components/dashboard/SupportCard';
import { SITE_URL, SUPPORT_PHONE } from '../config';
import { useAuth } from '../context/AuthContext';
import api, { friendlyError } from '../lib/api';
import { NEXT_STEP, isFinished } from '../lib/bookingStatus';
import { formatDate } from '../lib/format';

/** One "label — value" row in a sidebar card; rows with no value are skipped by the caller. */
function Row({ label, children }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/**
 * The partner dashboard.
 *
 * What a signed-in person sees depends on where they are: no application, under
 * review, declined, paused — each a short message with the way forward; an
 * approved partner gets their numbers, their jobs and their earnings.
 */
export default function Dashboard() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(undefined);
  const [jobs, setJobs] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [earningsError, setEarningsError] = useState('');
  const [tab, setTab] = useState('jobs');

  const [error, setError] = useState('');
  const [busyJob, setBusyJob] = useState(null);
  const [jobError, setJobError] = useState({});
  const [checking, setChecking] = useState(false);

  const isProfessional = user.role === 'PROFESSIONAL';
  const isAdmin = user.role === 'ADMIN';

  /* ------------------------------------------------------------- loading */

  const loadProfile = useCallback(async () => {
    try {
      setProfile(await api.application());
      setError('');
    } catch (err) {
      if (err && err.status === 404) {
        setProfile(null);
      } else {
        setError(friendlyError(err));
      }
    }
  }, []);

  const loadJobs = useCallback(async () => {
    try {
      setJobs(await api.jobs());
    } catch (err) {
      setError(friendlyError(err));
    }
  }, []);

  // A failure here shows on the Earnings tab only — it must not hide the jobs.
  const loadEarnings = useCallback(async () => {
    try {
      setEarnings(await api.earnings());
      setEarningsError('');
    } catch (err) {
      setEarningsError(friendlyError(err));
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Approved in the admin portal while this page was open: pick up the new role.
  useEffect(() => {
    if (profile && profile.status === 'APPROVED' && !isProfessional) {
      refreshUser().catch(() => {});
    }
  }, [profile, isProfessional, refreshUser]);

  useEffect(() => {
    if (isProfessional) {
      loadJobs();
      loadEarnings();
    }
  }, [isProfessional, loadJobs, loadEarnings]);

  // A partner leaves this tab open all day; pick up new jobs and payouts when they come back to it.
  useEffect(() => {
    if (!isProfessional) return undefined;
    const onVisible = () => {
      if (!document.hidden) {
        loadJobs();
        loadEarnings();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [isProfessional, loadJobs, loadEarnings]);

  /* ------------------------------------------------------------- actions */

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
    setJobError((current) => ({ ...current, [job.id]: '' }));

    try {
      const updated = await api.advanceJob(job.id, step.status);
      setJobs((list) => list.map((item) => (item.id === updated.id ? updated : item)));
      // Finishing a job changes the completed count and what is owed.
      if (isFinished(updated.status)) loadEarnings();
    } catch (err) {
      setJobError((current) => ({ ...current, [job.id]: friendlyError(err) }));
    } finally {
      setBusyJob(null);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleSignOutAndApply = async () => {
    await logout();
    navigate('/join', { replace: true });
  };

  /* ---------------------------------------------------------------- body */

  const firstName = (user.fullName || '').split(' ')[0];
  const loading = profile === undefined && !error;
  const activeCount = jobs ? jobs.filter((job) => !isFinished(job.status)).length : null;

  let body;

  if (loading) {
    body = <p className="question-hint">Loading your partner account…</p>;
  } else if (isAdmin) {
    body = (
      <StatusCard icon="shield" title="This is an admin account">
        <p>
          Admin accounts manage partners from the admin portal rather than working jobs here. Sign in with a partner
          account to see the partner dashboard.
        </p>
        <div className="partner-actions">
          <button type="button" className="btn btn-outline" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </StatusCard>
    );
  } else if (isProfessional) {
    body = (
      <>
        <div className="pd-tabs" role="tablist" aria-label="Dashboard sections">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'jobs'}
            className={`pd-tab ${tab === 'jobs' ? 'active' : ''}`}
            onClick={() => setTab('jobs')}
          >
            <Icon name="calendar" size={16} /> Jobs
            {activeCount != null && activeCount > 0 && <span className="pd-tab-count">{activeCount}</span>}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'earnings'}
            className={`pd-tab ${tab === 'earnings' ? 'active' : ''}`}
            onClick={() => setTab('earnings')}
          >
            <Icon name="rupee" size={16} /> Earnings
          </button>
        </div>

        {tab === 'jobs' ? (
          <JobsSection jobs={jobs} busyJob={busyJob} jobError={jobError} onAdvance={handleAdvance} />
        ) : (
          <EarningsPanel earnings={earnings} error={earningsError} />
        )}
      </>
    );
  } else if (profile === null) {
    body = (
      <StatusCard icon="user" title="No partner application on this account">
        <p>
          You&apos;re signed in as a customer. To work with Supplybase, sign out and apply with your professional
          details.
        </p>
        <div className="partner-actions">
          <button type="button" className="btn btn-primary" onClick={handleSignOutAndApply}>
            Sign out and apply
          </button>
          <a href={`${SITE_URL}/dashboard/bookings`} className="btn btn-outline">
            Go to my bookings
          </a>
        </div>
      </StatusCard>
    );
  } else if (profile && profile.status === 'PENDING') {
    body = (
      <StatusCard icon="clock" title="Your application is under review">
        <p>
          Thanks{firstName ? `, ${firstName}` : ''}. We&apos;ve received your application and our team reviews every
          one by hand. Once it&apos;s approved, the jobs assigned to you will appear on this page.
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
          If you think this is a mistake or you&apos;d like to talk it through, call us on {SUPPORT_PHONE}.
        </p>
      </StatusCard>
    );
  } else if (profile && profile.status === 'SUSPENDED') {
    body = (
      <StatusCard icon="info" tone="danger" title="Your partner access is paused">
        {profile.reviewNote && <p className="partner-reason">{profile.reviewNote}</p>}
        <p>Call us on {SUPPORT_PHONE} to talk about getting back to work.</p>
      </StatusCard>
    );
  } else {
    // Approved, and the role has not come through yet.
    body = <p className="question-hint">Your application is approved — setting up your access…</p>;
  }

  /* ---------------------------------------------------------------- page */

  return (
    <div className="partner-shell">
      {/* The recruiting banner is for people who are not partners yet. */}
      {!isProfessional && <PartnerHero />}

      <section className="partner-dashboard-heading">
        <div className="container">
          <span className="partner-hero-eyebrow">Supplybase Partners</span>
          <h1>{isProfessional && firstName ? `Welcome back, ${firstName}` : 'Partner dashboard'}</h1>
          <p>
            {isProfessional
              ? 'Your jobs, your earnings and your support desk in one place.'
              : 'Your application, your jobs and your next steps in one place.'}
          </p>
        </div>
      </section>

      <div className="partner-body">
        <div className="container">
          {isProfessional && <StatsRow earnings={earnings} />}

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
                  <Row label="Name">{user.fullName}</Row>
                  <Row label="Mobile">{user.phone || '—'}</Row>
                  <Row label="Email">{user.email}</Row>
                </dl>
              </div>

              {profile && (
                <div className="partner-side-card">
                  <h3>Application</h3>
                  <dl className="partner-summary">
                    <Row label="Status">{profile.status.charAt(0) + profile.status.slice(1).toLowerCase()}</Row>
                    <Row label="Trade">{profile.tradeLabel || '—'}</Row>
                    <Row label="Experience">
                      {profile.experienceYears == null ? '—' : `${profile.experienceYears} yrs`}
                    </Row>
                    <Row label="City">{profile.city || '—'}</Row>
                    {profile.serviceAreas && <Row label="Areas">{profile.serviceAreas}</Row>}
                    {profile.languages && <Row label="Languages">{profile.languages}</Row>}
                    <Row label="Applied">{formatDate(profile.appliedAt)}</Row>
                  </dl>
                </div>
              )}

              <SupportCard firstName={firstName} />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

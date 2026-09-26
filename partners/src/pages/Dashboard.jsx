import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Icon from '../components/ui/Icon';
import PartnerHero from '../components/dashboard/PartnerHero';
import StatusCard, { ApplicationSteps } from '../components/dashboard/StatusCard';
import StatsRow from '../components/dashboard/StatsRow';
import JobsSection from '../components/dashboard/JobsSection';
import EarningsPanel from '../components/dashboard/EarningsPanel';
import SupportCard from '../components/dashboard/SupportCard';
import SecurityCard from '../components/dashboard/SecurityCard';
import WelcomeBand from '../components/dashboard/WelcomeBand';
import SectionNav from '../components/dashboard/SectionNav';
import ConfirmDialog from '../components/dashboard/ConfirmDialog';
import { SITE_URL, SUPPORT_PHONE } from '../config';
import { useAuth } from '../context/AuthContext';
import api, { friendlyError } from '../lib/api';
import { NEXT_STEP, isFinished, jobStatusLabel } from '../lib/bookingStatus';
import { daysFromToday, formatDate, formatDay } from '../lib/format';

/** One "label — value" row in an account card; rows with no value are skipped by the caller. */
function Row({ label, children }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

const TABS = ['jobs', 'earnings', 'account'];

/** One plain sentence about the partner's day, for the top of the page. */
function daySummary(jobs) {
  if (!jobs) return 'Loading your jobs…';
  const active = jobs.filter((job) => !isFinished(job.status));
  if (active.length === 0) return 'No active jobs right now. New jobs appear here as soon as they are assigned.';
  const today = active.filter((job) => daysFromToday(job.preferredDate) === 0).length;
  if (today > 0) return `You have ${today} job${today === 1 ? '' : 's'} today, and ${active.length} active in all.`;
  const upcoming = active
    .map((job) => job.preferredDate)
    .filter((date) => date && daysFromToday(date) > 0)
    .sort()[0];
  return upcoming
    ? `${active.length} active job${active.length === 1 ? '' : 's'}. Your next one is on ${formatDay(upcoming)}.`
    : `${active.length} active job${active.length === 1 ? '' : 's'}.`;
}

/**
 * The partner dashboard.
 *
 * What a signed-in person sees depends on where they are: no application, under
 * review, declined, paused — each a short message with the way forward; an
 * approved partner gets their numbers, their jobs and their earnings, in
 * sections they switch between with tabs (wide screen) or the bottom bar (phone).
 */
export default function Dashboard() {
  const { user, remembered, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [profile, setProfile] = useState(undefined);
  const [jobs, setJobs] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [earningsError, setEarningsError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState('');
  const [busyJob, setBusyJob] = useState(null);
  const [jobError, setJobError] = useState({});
  const [checking, setChecking] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

  const isProfessional = user.role === 'PROFESSIONAL';
  const isAdmin = user.role === 'ADMIN';

  const tab = TABS.includes(params.get('tab')) ? params.get('tab') : 'jobs';
  const setTab = (next) => {
    setParams(next === 'jobs' ? {} : { tab: next }, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showToast = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 3500);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

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
      setUpdatedAt(new Date());
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

  const handleRefresh = async () => {
    setRefreshing(true);
    setError('');
    await Promise.all([loadJobs(), loadEarnings()]);
    setRefreshing(false);
  };

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

  const advance = async (job) => {
    const step = NEXT_STEP[job.status];
    if (!step) return;

    setBusyJob(job.id);
    setJobError((current) => ({ ...current, [job.id]: '' }));

    try {
      const updated = await api.advanceJob(job.id, step.status);
      setJobs((list) => list.map((item) => (item.id === updated.id ? updated : item)));
      setConfirming(null);
      showToast(`Done — ${job.serviceLabel || 'job'} is now “${jobStatusLabel(updated.status)}”.`);
      // Finishing a job changes the completed count and what is owed.
      if (isFinished(updated.status)) loadEarnings();
    } catch (err) {
      setConfirming(null);
      setJobError((current) => ({ ...current, [job.id]: friendlyError(err) }));
    } finally {
      setBusyJob(null);
    }
  };

  // Steps that cannot be undone ask first, in the app's own dialog.
  const handleAdvance = (job) => {
    const step = NEXT_STEP[job.status];
    if (!step) return;
    if (step.confirm) setConfirming(job);
    else advance(job);
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
  const activeCount = jobs ? jobs.filter((job) => !isFinished(job.status)).length : 0;

  let body;

  if (loading) {
    body = (
      <div className="pp-loading pp-loading-inline" role="status">
        <span className="pp-spinner" aria-hidden="true" />
        Loading your partner account…
      </div>
    );
  } else if (isAdmin) {
    body = (
      <StatusCard icon="shield" title="This is an admin account">
        <p>
          Admin accounts manage partners from the admin portal rather than working jobs here. Sign in with a partner
          account to see the partner dashboard.
        </p>
        <div className="pp-actions">
          <button type="button" className="btn btn-outline" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </StatusCard>
    );
  } else if (isProfessional) {
    body =
      tab === 'earnings' ? (
        <EarningsPanel earnings={earnings} error={earningsError} />
      ) : (
        <JobsSection jobs={jobs} busyJob={busyJob} jobError={jobError} onAdvance={handleAdvance} />
      );
  } else if (profile === null) {
    body = (
      <StatusCard icon="user" title="No partner application on this account">
        <p>
          You&apos;re signed in as a customer. To work with Supplybase, sign out and apply with your professional
          details.
        </p>
        <div className="pp-actions">
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
          Thanks{firstName ? `, ${firstName}` : ''}. We&apos;ve received your application. Once it&apos;s approved, the
          jobs assigned to you will appear on this page.
        </p>
        <ApplicationSteps appliedOn={formatDate(profile.appliedAt)} />
        <div className="pp-actions">
          <button type="button" className="btn btn-outline" onClick={handleCheckAgain} disabled={checking}>
            <Icon name="refresh" size={17} className={checking ? 'pp-spin' : ''} />
            {checking ? 'Checking…' : 'Check status'}
          </button>
        </div>
      </StatusCard>
    );
  } else if (profile && profile.status === 'REJECTED') {
    body = (
      <StatusCard icon="info" tone="danger" title="Your application wasn't approved">
        {profile.reviewNote && <p className="pp-reason">{profile.reviewNote}</p>}
        <p>If you think this is a mistake or you&apos;d like to talk it through, call us on {SUPPORT_PHONE}.</p>
      </StatusCard>
    );
  } else if (profile && profile.status === 'SUSPENDED') {
    body = (
      <StatusCard icon="info" tone="danger" title="Your partner access is paused">
        {profile.reviewNote && <p className="pp-reason">{profile.reviewNote}</p>}
        <p>Call us on {SUPPORT_PHONE} to talk about getting back to work.</p>
      </StatusCard>
    );
  } else {
    // Approved, and the role has not come through yet.
    body = (
      <div className="pp-loading pp-loading-inline" role="status">
        <span className="pp-spinner" aria-hidden="true" />
        Your application is approved — setting up your access…
      </div>
    );
  }

  /* ---------------------------------------------------------------- page */

  const side = (
    <>
      <div className="pp-card pp-account">
        <div className="pp-account-head">
          <span className="pp-avatar pp-avatar-lg" aria-hidden="true">
            {(firstName[0] || '?').toUpperCase()}
          </span>
          <div>
            <strong>{user.fullName}</strong>
            <span>{isProfessional ? 'Verified Supplybase partner' : 'Your account'}</span>
          </div>
        </div>
        <dl className="pp-summary">
          <Row label="Mobile">{user.phone || '—'}</Row>
          <Row label="Email">{user.email}</Row>
          {profile && (
            <>
              <Row label="Trade">{profile.tradeLabel || '—'}</Row>
              <Row label="Experience">{profile.experienceYears == null ? '—' : `${profile.experienceYears} yrs`}</Row>
              <Row label="City">{profile.city || '—'}</Row>
              {profile.serviceAreas && <Row label="Areas">{profile.serviceAreas}</Row>}
              {profile.languages && <Row label="Languages">{profile.languages}</Row>}
              {isProfessional && profile.reviewedAt ? (
                <Row label="Partner since">{formatDate(profile.reviewedAt)}</Row>
              ) : (
                <Row label="Applied">{formatDate(profile.appliedAt) || '—'}</Row>
              )}
            </>
          )}
        </dl>
        <p className="pp-account-note">To change these details, message the partner desk.</p>
      </div>

      <SecurityCard user={user} remembered={remembered} onSignOut={handleSignOut} />
      <SupportCard firstName={firstName} />
    </>
  );

  return (
    <div className={`pp-dashboard ${isProfessional ? 'has-nav' : ''}`}>
      {/* The recruiting banner is for signed-in people who have not applied. */}
      {profile === null && !isProfessional && !isAdmin && <PartnerHero />}

      <WelcomeBand
        eyebrow="Supplybase Partners"
        title={isProfessional && firstName ? `Welcome back, ${firstName}` : 'Partner dashboard'}
        summary={
          isProfessional ? daySummary(jobs) : 'Your application, your account and the partner desk in one place.'
        }
        onRefresh={isProfessional ? handleRefresh : null}
        refreshing={refreshing}
        updatedAt={updatedAt}
      />

      <div className="container pp-body">
        {isProfessional && <StatsRow earnings={earnings} />}
        {isProfessional && <SectionNav tab={tab} onChange={setTab} jobsBadge={activeCount} />}

        <div className={`pp-layout ${isProfessional ? 'has-tabs' : ''}`} data-tab={tab}>
          <div className="pp-main">
            {error && (
              <div role="alert" className="alert alert-error">
                <Icon name="info" size={18} />
                <span>{error}</span>
              </div>
            )}

            {body}
          </div>

          <aside className="pp-side" aria-label="Your account">
            {side}
          </aside>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirming)}
        title="Mark this job as completed?"
        confirmLabel="Yes, it's completed"
        busy={confirming && busyJob === confirming.id}
        onConfirm={() => confirming && advance(confirming)}
        onCancel={() => setConfirming(null)}
      >
        {confirming && (
          <p>
            This tells Supplybase the <strong>{confirming.serviceLabel || 'work'}</strong> job (
            {confirming.bookingNumber || confirming.reference}) is fully finished. You can&apos;t undo this yourself.
          </p>
        )}
      </ConfirmDialog>

      <div className={`pp-toast ${toast ? 'show' : ''}`} role="status" aria-live="polite">
        {toast && (
          <>
            <Icon name="check-circle" size={18} />
            <span>{toast}</span>
          </>
        )}
      </div>
    </div>
  );
}

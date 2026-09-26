<<<<<<< HEAD
// import { useCallback, useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Icon from '../components/ui/Icon';
// import { SITE_URL, SUPPORT_PHONE } from '../config';
// import { useAuth } from '../context/AuthContext';
// import api, { friendlyError } from '../lib/api';
// import { isFinished, jobStatusLabel, jobStatusTone } from '../lib/bookingStatus';

// /**
//  * The next step a partner may take on their own job, keyed by its current
//  * status. This mirrors BookingService.SELF_SERVICE_TRANSITIONS on the server,
//  * which is what actually enforces it — the buttons here are only the honest
//  * way to offer what the API will accept. Everything before the visit is
//  * scheduled (assignment, quotes, approvals) stays with Supplybase staff.
//  */
// const NEXT_STEP = {
//   SITE_VISIT_SCHEDULED: { status: 'SITE_VISIT_COMPLETED', label: 'Mark site visit done' },
//   WORK_SCHEDULED: { status: 'WORK_IN_PROGRESS', label: 'Start work' },
//   WORK_IN_PROGRESS: {
//     status: 'WORK_COMPLETED',
//     label: 'Mark work completed',
//     confirm: 'Mark this job as completed? This tells Supplybase the work is finished.',
//   },
// };

// const formatDate = (value) =>
//   value
//     ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
//     : null;

// /**
//  * The partner's home.
//  *
//  * What it shows depends on where their application stands, all read from the
//  * server: still under review, turned down, suspended (with the reason each
//  * time), or approved — in which case their assigned jobs, with the next
//  * step they are allowed to take on each one.
//  *
//  * "Approved" is decided by the account's role, not by this page: an admin
//  * approving an application is what grants the PROFESSIONAL role, and the API
//  * rejects the jobs endpoints for anyone without it. An admin who made someone
//  * a professional through the Users page (with no application on file)
//  * therefore still gets their jobs here.
//  */
// export default function Dashboard() {
//   const { user, logout, refreshUser } = useAuth();
//   const navigate = useNavigate();

//   // undefined = still loading, null = this account never applied
//   const [profile, setProfile] = useState(undefined);
//   const [jobs, setJobs] = useState(null);
//   const [error, setError] = useState('');
//   const [busyJob, setBusyJob] = useState(null);
//   const [jobError, setJobError] = useState({});
//   const [checking, setChecking] = useState(false);

//   const isProfessional = user.role === 'PROFESSIONAL';
//   const isAdmin = user.role === 'ADMIN';

//   const loadProfile = useCallback(async () => {
//     try {
//       setProfile(await api.application());
//       setError('');
//     } catch (err) {
//       if (err && err.status === 404) setProfile(null);
//       else setError(friendlyError(err));
//     }
//   }, []);

//   useEffect(() => {
//     loadProfile();
//   }, [loadProfile]);

//   // Approved, but this tab still holds the pre-approval role: pick up the new one.
//   useEffect(() => {
//     if (profile && profile.status === 'APPROVED' && !isProfessional) refreshUser().catch(() => {});
//   }, [profile, isProfessional, refreshUser]);

//   const loadJobs = useCallback(async () => {
//     try {
//       setJobs(await api.jobs());
//     } catch (err) {
//       setError(friendlyError(err));
//     }
//   }, []);

//   useEffect(() => {
//     if (isProfessional) loadJobs();
//   }, [isProfessional, loadJobs]);

//   /** "Check status" — approval changes the role, so both need re-reading. */
//   const handleCheckAgain = async () => {
//     setChecking(true);
//     try {
//       await refreshUser();
//       await loadProfile();
//     } catch (err) {
//       setError(friendlyError(err));
//     } finally {
//       setChecking(false);
//     }
//   };

//   const handleAdvance = async (job) => {
//     const step = NEXT_STEP[job.status];
//     if (!step) return;
//     if (step.confirm && !window.confirm(step.confirm)) return;

//     setBusyJob(job.id);
//     setJobError((e) => ({ ...e, [job.id]: '' }));
//     try {
//       const updated = await api.advanceJob(job.id, step.status);
//       setJobs((list) => list.map((j) => (j.id === updated.id ? updated : j)));
//     } catch (err) {
//       setJobError((e) => ({ ...e, [job.id]: friendlyError(err) }));
//     } finally {
//       setBusyJob(null);
//     }
//   };

//   const handleSignOut = async () => {
//     await logout();
//     navigate('/login', { replace: true });
//   };

//   const handleSignOutAndApply = async () => {
//     await logout();
//     navigate('/join', { replace: true });
//   };

//   const firstName = (user.fullName || '').split(' ')[0];
//   const loading = profile === undefined && !error;

//   /* ------------------------------------------------------- what to show */

//   let body;
//   if (loading) {
//     body = <p className="question-hint">Loading your partner account…</p>;
//   } else if (isAdmin) {
//     body = (
//       <StatusCard icon="shield" title="This is an admin account">
//         <p>
//           Admin accounts manage partners from the admin portal rather than working jobs here. Sign in
//           with a partner account to see the partner dashboard.
//         </p>
//         <div className="partner-actions">
//           <button type="button" className="btn btn-outline" onClick={handleSignOut}>
//             Sign out
//           </button>
//         </div>
//       </StatusCard>
//     );
//   } else if (isProfessional) {
//     body = <JobsSection jobs={jobs} busyJob={busyJob} jobError={jobError} onAdvance={handleAdvance} />;
//   } else if (profile === null) {
//     body = (
//       <StatusCard icon="user" title="No partner application on this account">
//         <p>
//           You&apos;re signed in as a customer. To work with Supplybase, sign out and apply with your
//           professional details.
//         </p>
//         <div className="partner-actions">
//           <button type="button" className="btn btn-primary" onClick={handleSignOutAndApply}>
//             Sign out and apply
//           </button>
//           <a href={`${SITE_URL}/dashboard/bookings`} className="btn btn-outline">
//             Go to my bookings
//           </a>
//         </div>
//       </StatusCard>
//     );
//   } else if (profile && profile.status === 'PENDING') {
//     body = (
//       <StatusCard icon="clock" title="Your application is under review">
//         <p>
//           Thanks{firstName ? `, ${firstName}` : ''}. We&apos;ve received your application and our team
//           reviews every one by hand. Once it&apos;s approved, the jobs assigned to you will appear on
//           this page.
//         </p>
//         <div className="partner-actions">
//           <button type="button" className="btn btn-outline" onClick={handleCheckAgain} disabled={checking}>
//             {checking ? 'Checking…' : 'Check status'}
//           </button>
//         </div>
//       </StatusCard>
//     );
//   } else if (profile && profile.status === 'REJECTED') {
//     body = (
//       <StatusCard icon="info" tone="danger" title="Your application wasn't approved">
//         {profile.reviewNote && <p className="partner-reason">{profile.reviewNote}</p>}
//         <p>
//           If you think this is a mistake or you&apos;d like to talk it through, call us on {SUPPORT_PHONE}.
//         </p>
//       </StatusCard>
//     );
//   } else if (profile && profile.status === 'SUSPENDED') {
//     body = (
//       <StatusCard icon="info" tone="danger" title="Your partner access is paused">
//         {profile.reviewNote && <p className="partner-reason">{profile.reviewNote}</p>}
//         <p>Call us on {SUPPORT_PHONE} to talk about getting back to work.</p>
//       </StatusCard>
//     );
//   } else {
//     // APPROVED but the role has not caught up yet — the effect above is fetching it.
//     body = <p className="question-hint">Your application is approved — setting up your access…</p>;
//   }

//   return (
//     <>
//       <section className="partner-hero">
//         <div className="container">
//           <span className="partner-hero-eyebrow">Supplybase Partners</span>
//           <h1>Partner dashboard</h1>
//           <p>Your application, your jobs and your next steps in one place.</p>
//         </div>
//       </section>

//       <div className="partner-body">
//         <div className="container">
//           <div className="partner-layout">
//             <div className="partner-main">
//               {error && (
//                 <div role="alert" className="alert alert-error">
//                   <Icon name="info" size={18} />
//                   <span>{error}</span>
//                 </div>
//               )}
//               {body}
//             </div>

//             <aside className="partner-side">
//               <div className="partner-side-card">
//                 <h3>Your account</h3>
//                 <dl className="partner-summary">
//                   <div>
//                     <dt>Name</dt>
//                     <dd>{user.fullName}</dd>
//                   </div>
//                   <div>
//                     <dt>Mobile</dt>
//                     <dd>{user.phone || '—'}</dd>
//                   </div>
//                   <div>
//                     <dt>Email</dt>
//                     <dd>{user.email}</dd>
//                   </div>
//                 </dl>
//               </div>

//               {profile && (
//                 <div className="partner-side-card">
//                   <h3>Application</h3>
//                   <dl className="partner-summary">
//                     <div>
//                       <dt>Status</dt>
//                       <dd>{profile.status.charAt(0) + profile.status.slice(1).toLowerCase()}</dd>
//                     </div>
//                     <div>
//                       <dt>Trade</dt>
//                       <dd>{profile.tradeLabel || '—'}</dd>
//                     </div>
//                     <div>
//                       <dt>Experience</dt>
//                       <dd>{profile.experienceYears == null ? '—' : `${profile.experienceYears} yrs`}</dd>
//                     </div>
//                     <div>
//                       <dt>City</dt>
//                       <dd>{profile.city || '—'}</dd>
//                     </div>
//                     {profile.serviceAreas && (
//                       <div>
//                         <dt>Areas</dt>
//                         <dd>{profile.serviceAreas}</dd>
//                       </div>
//                     )}
//                     {profile.languages && (
//                       <div>
//                         <dt>Languages</dt>
//                         <dd>{profile.languages}</dd>
//                       </div>
//                     )}
//                     <div>
//                       <dt>Applied</dt>
//                       <dd>{formatDate(profile.appliedAt)}</dd>
//                     </div>
//                   </dl>
//                 </div>
//               )}
//             </aside>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// /* ------------------------------------------------------------ pieces */

// function StatusCard({ icon, tone, title, children }) {
//   return (
//     <div className="partner-status-card">
//       <span className={`partner-status-icon ${tone === 'danger' ? 'danger' : ''}`}>
//         <Icon name={icon} size={22} />
//       </span>
//       <h2>{title}</h2>
//       {children}
//     </div>
//   );
// }

// function JobsSection({ jobs, busyJob, jobError, onAdvance }) {
//   if (!jobs) return <p className="question-hint">Loading your jobs…</p>;

//   const active = jobs.filter((j) => !isFinished(j.status));
//   const finished = jobs.filter((j) => isFinished(j.status));

//   if (jobs.length === 0) {
//     return (
//       <div className="partner-empty">
//         <Icon name="calendar" size={32} />
//         <h3>No jobs assigned yet</h3>
//         <p>When Supplybase assigns you a job, it will appear here with the customer&apos;s details.</p>
//       </div>
//     );
//   }

//   return (
//     <>
//       <div className="partner-section-title">
//         <h2>Active jobs</h2>
//         <span>{active.length}</span>
//       </div>
//       {active.length === 0 ? (
//         <p className="question-hint">Nothing active right now.</p>
//       ) : (
//         <div className="partner-job-list">
//           {active.map((job) => (
//             <JobCard key={job.id} job={job} busy={busyJob === job.id} error={jobError[job.id]} onAdvance={onAdvance} />
//           ))}
//         </div>
//       )}

//       {finished.length > 0 && (
//         <>
//           <div className="partner-section-title">
//             <h2>Finished</h2>
//             <span>{finished.length}</span>
//           </div>
//           <div className="partner-job-list">
//             {finished.map((job) => (
//               <JobCard key={job.id} job={job} done />
//             ))}
//           </div>
//         </>
//       )}
//     </>
//   );
// }

// function JobCard({ job, done, busy, error, onAdvance }) {
//   const step = NEXT_STEP[job.status];

//   return (
//     <div className={`partner-job-card ${done ? 'done' : ''}`}>
//       <div className="partner-job-top">
//         <div>
//           <span className="partner-job-number">{job.bookingNumber || job.reference}</span>
//           <h3>{job.serviceLabel || 'Service'}</h3>
//         </div>
//         <span className={`partner-status partner-status-${jobStatusTone(job.status)}`}>
//           {jobStatusLabel(job.status)}
//         </span>
//       </div>

//       <ul className="partner-job-meta">
//         {job.preferredDate && (
//           <li>
//             <Icon name="calendar" size={15} />
//             {formatDate(job.preferredDate)}
//             {job.preferredSlot ? ` · ${job.preferredSlot}` : ''}
//           </li>
//         )}
//         {(job.address || job.location) && (
//           <li>
//             <Icon name="map-pin" size={15} />
//             {[job.address, job.location].filter(Boolean).join(', ')}
//           </li>
//         )}
//         {job.name && (
//           <li className="partner-job-contact">
//             <Icon name="user" size={15} />
//             {job.name}
//             {job.phone && (
//               <>
//                 {' · '}
//                 <a href={`tel:${job.phone}`}>{job.phone}</a>
//               </>
//             )}
//           </li>
//         )}
//       </ul>

//       {error && (
//         <div role="alert" className="alert alert-error">
//           <Icon name="info" size={18} />
//           <span>{error}</span>
//         </div>
//       )}

//       {!done && (
//         <div className="partner-job-foot">
//           {step ? (
//             <button type="button" className="btn btn-primary" onClick={() => onAdvance(job)} disabled={busy}>
//               {busy ? 'Saving…' : step.label}
//             </button>
//           ) : (
//             <span className="partner-job-wait">Waiting on Supplybase for the next step.</span>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }



// new added


import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import { SITE_URL, SUPPORT_PHONE } from '../config';
import { useAuth } from '../context/AuthContext';
import api, { friendlyError } from '../lib/api';
import { isFinished, jobStatusLabel, jobStatusTone } from '../lib/bookingStatus';

/**
 * The next step a partner may take on their own job.
 */
const NEXT_STEP = {
  SITE_VISIT_SCHEDULED: {
    status: 'SITE_VISIT_COMPLETED',
    label: 'Mark site visit done',
  },

  WORK_SCHEDULED: {
    status: 'WORK_IN_PROGRESS',
    label: 'Start work',
  },

  WORK_IN_PROGRESS: {
    status: 'WORK_COMPLETED',
    label: 'Mark work completed',
    confirm:
      'Mark this job as completed? This tells Supplybase the work is finished.',
  },
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null;


/* ============================================================
   PARTNER HERO
   ============================================================ */

function PartnerHero() {
  const [phone, setPhone] = useState('');

  const handleJoin = () => {
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length !== 10) {
      alert('Please enter a valid 10-digit WhatsApp number.');
      return;
    }

    const message = encodeURIComponent(
      `Hello Supplybase, I want to join as a service professional. My WhatsApp number is +91 ${cleanPhone}.`
    );

    window.open(
      `https://wa.me/8356928520?text=${message}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <section className="partner-hero-section">

      {/* Main Hero */}
      <div className="partner-hero-main">
        <div className="container partner-hero-container">

          {/* LEFT CONTENT */}
          <div className="partner-hero-content">

            <span className="partner-hero-small">
              SUPPLYBASE PARTNERS
            </span>

            <h1>
              Earn More.
              <br />
              Earn Respect.
              <br />
              <span>Build Your Future.</span>
            </h1>

            <p>
              Join Supplybase as a service professional and get access to
              genuine projects, reliable work opportunities and a growing
              customer network.
            </p>

            <div className="partner-hero-points">
              <div>
                <span>✓</span>
                More project opportunities
              </div>

              <div>
                <span>✓</span>
                Transparent work process
              </div>

              <div>
                <span>✓</span>
                Professional support
              </div>
            </div>

          </div>


          {/* RIGHT IMAGE */}
          <div className="partner-hero-image-wrap">

            <div className="partner-hero-image-bg"></div>

            <img
              src="/assets/partners/partner-hero.png"
              alt="Supplybase service professionals"
              className="partner-hero-image"
            />

          </div>

        </div>
      </div>


      {/* WHATSAPP JOIN BOX */}
      <div className="container partner-whatsapp-container">

        <div className="partner-whatsapp-box">

          <div className="partner-whatsapp-content">

            <h2>
              Join Supplybase as a Service Professional
            </h2>

            <p>
              Share your WhatsApp number and we'll reach out to you.
            </p>

          </div>


          <div className="partner-whatsapp-form">

            <div className="partner-phone-input">

              <div className="partner-country-code">
                <span>🇮🇳</span>
                <span>+91</span>
                <span className="partner-arrow">⌄</span>
              </div>

              <input
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                }
                placeholder="Enter WhatsApp number"
                maxLength={10}
              />

            </div>


            <button
              type="button"
              className="partner-join-button"
              onClick={handleJoin}
            >
              Join Us
            </button>

          </div>

        </div>

      </div>

    </section>
  );
}


/**
 * The partner's home.
 */
export default function Dashboard() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  // undefined = still loading, null = this account never applied
  const [profile, setProfile] = useState(undefined);
  const [jobs, setJobs] = useState(null);
=======
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

>>>>>>> main
  const [error, setError] = useState('');
  const [busyJob, setBusyJob] = useState(null);
  const [jobError, setJobError] = useState({});
  const [checking, setChecking] = useState(false);
<<<<<<< HEAD
=======
  const [confirming, setConfirming] = useState(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);
>>>>>>> main

  const isProfessional = user.role === 'PROFESSIONAL';
  const isAdmin = user.role === 'ADMIN';

<<<<<<< HEAD
=======
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

>>>>>>> main
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

<<<<<<< HEAD
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);


  // Approved, but this tab still holds the pre-approval role
  useEffect(() => {
    if (
      profile &&
      profile.status === 'APPROVED' &&
      !isProfessional
    ) {
      refreshUser().catch(() => {});
    }
  }, [
    profile,
    isProfessional,
    refreshUser,
  ]);


  const loadJobs = useCallback(async () => {
    try {
      setJobs(await api.jobs());
=======
  const loadJobs = useCallback(async () => {
    try {
      setJobs(await api.jobs());
      setUpdatedAt(new Date());
>>>>>>> main
    } catch (err) {
      setError(friendlyError(err));
    }
  }, []);

<<<<<<< HEAD
=======
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
>>>>>>> main

  useEffect(() => {
    if (isProfessional) {
      loadJobs();
<<<<<<< HEAD
    }
  }, [
    isProfessional,
    loadJobs,
  ]);


  /** Check status */
  const handleCheckAgain = async () => {
    setChecking(true);

=======
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
>>>>>>> main
    try {
      await refreshUser();
      await loadProfile();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setChecking(false);
    }
  };

<<<<<<< HEAD

  const handleAdvance = async (job) => {
    const step = NEXT_STEP[job.status];

    if (!step) return;

    if (
      step.confirm &&
      !window.confirm(step.confirm)
    ) {
      return;
    }

    setBusyJob(job.id);

    setJobError((e) => ({
      ...e,
      [job.id]: '',
    }));

    try {
      const updated = await api.advanceJob(
        job.id,
        step.status
      );

      setJobs((list) =>
        list.map((j) =>
          j.id === updated.id
            ? updated
            : j
        )
      );

    } catch (err) {

      setJobError((e) => ({
        ...e,
        [job.id]: friendlyError(err),
      }));

=======
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
>>>>>>> main
    } finally {
      setBusyJob(null);
    }
  };

<<<<<<< HEAD

  const handleSignOut = async () => {
    await logout();

    navigate('/login', {
      replace: true,
    });
  };


  const handleSignOutAndApply = async () => {
    await logout();

    navigate('/join', {
      replace: true,
    });
  };


  const firstName =
    (user.fullName || '').split(' ')[0];

  const loading =
    profile === undefined &&
    !error;


  /* ========================================================
     DASHBOARD BODY
     ======================================================== */
=======
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
>>>>>>> main

  let body;

  if (loading) {
<<<<<<< HEAD

    body = (
      <p className="question-hint">
        Loading your partner account…
      </p>
    );

  } else if (isAdmin) {

    body = (
      <StatusCard
        icon="shield"
        title="This is an admin account"
      >

        <p>
          Admin accounts manage partners from the admin
          portal rather than working jobs here. Sign in
          with a partner account to see the partner
          dashboard.
        </p>

        <div className="partner-actions">

          <button
            type="button"
            className="btn btn-outline"
            onClick={handleSignOut}
          >
            Sign out
          </button>

        </div>

      </StatusCard>
    );

  } else if (isProfessional) {

    body = (
      <JobsSection
        jobs={jobs}
        busyJob={busyJob}
        jobError={jobError}
        onAdvance={handleAdvance}
      />
    );

  } else if (profile === null) {

    body = (
      <StatusCard
        icon="user"
        title="No partner application on this account"
      >

        <p>
          You&apos;re signed in as a customer. To work
          with Supplybase, sign out and apply with your
          professional details.
        </p>

        <div className="partner-actions">

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSignOutAndApply}
          >
            Sign out and apply
          </button>

          <a
            href={`${SITE_URL}/dashboard/bookings`}
            className="btn btn-outline"
          >
            Go to my bookings
          </a>

        </div>

      </StatusCard>
    );

  } else if (
    profile &&
    profile.status === 'PENDING'
  ) {

    body = (
      <StatusCard
        icon="clock"
        title="Your application is under review"
      >

        <p>
          Thanks
          {firstName ? `, ${firstName}` : ''}.
          We&apos;ve received your application and our
          team reviews every one by hand. Once it&apos;s
          approved, the jobs assigned to you will appear
          on this page.
        </p>

        <div className="partner-actions">

          <button
            type="button"
            className="btn btn-outline"
            onClick={handleCheckAgain}
            disabled={checking}
          >
            {checking
              ? 'Checking…'
              : 'Check status'}
          </button>

        </div>

      </StatusCard>
    );

  } else if (
    profile &&
    profile.status === 'REJECTED'
  ) {

    body = (
      <StatusCard
        icon="info"
        tone="danger"
        title="Your application wasn't approved"
      >

        {profile.reviewNote && (
          <p className="partner-reason">
            {profile.reviewNote}
          </p>
        )}

        <p>
          If you think this is a mistake or you&apos;d
          like to talk it through, call us on{' '}
          {SUPPORT_PHONE}.
        </p>

      </StatusCard>
    );

  } else if (
    profile &&
    profile.status === 'SUSPENDED'
  ) {

    body = (
      <StatusCard
        icon="info"
        tone="danger"
        title="Your partner access is paused"
      >

        {profile.reviewNote && (
          <p className="partner-reason">
            {profile.reviewNote}
          </p>
        )}

        <p>
          Call us on {SUPPORT_PHONE} to talk about
          getting back to work.
        </p>

      </StatusCard>
    );

  } else {

    body = (
      <p className="question-hint">
        Your application is approved — setting up
        your access…
      </p>
    );
  }


  return (
    <>

      {/* =====================================================
          NEW STARTING HERO SECTION
          ===================================================== */}

      <PartnerHero />


      {/* =====================================================
          EXISTING DASHBOARD
          ===================================================== */}

      <section className="partner-dashboard-heading">

        <div className="container">

          <span className="partner-hero-eyebrow">
            Supplybase Partners
          </span>

          <h1>
            Partner dashboard
          </h1>

          <p>
            Your application, your jobs and your next
            steps in one place.
          </p>

        </div>

      </section>


      <div className="partner-body">

        <div className="container">

          <div className="partner-layout">

            <div className="partner-main">

              {error && (
                <div
                  role="alert"
                  className="alert alert-error"
                >

                  <Icon
                    name="info"
                    size={18}
                  />

                  <span>
                    {error}
                  </span>

                </div>
              )}

              {body}

            </div>


            <aside className="partner-side">

              <div className="partner-side-card">

                <h3>
                  Your account
                </h3>

                <dl className="partner-summary">

                  <div>
                    <dt>Name</dt>
                    <dd>
                      {user.fullName}
                    </dd>
                  </div>

                  <div>
                    <dt>Mobile</dt>
                    <dd>
                      {user.phone || '—'}
                    </dd>
                  </div>

                  <div>
                    <dt>Email</dt>
                    <dd>
                      {user.email}
                    </dd>
                  </div>

                </dl>

              </div>


              {profile && (

                <div className="partner-side-card">

                  <h3>
                    Application
                  </h3>

                  <dl className="partner-summary">

                    <div>
                      <dt>Status</dt>
                      <dd>
                        {profile.status.charAt(0) +
                          profile.status
                            .slice(1)
                            .toLowerCase()}
                      </dd>
                    </div>

                    <div>
                      <dt>Trade</dt>
                      <dd>
                        {profile.tradeLabel || '—'}
                      </dd>
                    </div>

                    <div>
                      <dt>Experience</dt>
                      <dd>
                        {profile.experienceYears == null
                          ? '—'
                          : `${profile.experienceYears} yrs`}
                      </dd>
                    </div>

                    <div>
                      <dt>City</dt>
                      <dd>
                        {profile.city || '—'}
                      </dd>
                    </div>

                    {profile.serviceAreas && (
                      <div>
                        <dt>Areas</dt>
                        <dd>
                          {profile.serviceAreas}
                        </dd>
                      </div>
                    )}

                    {profile.languages && (
                      <div>
                        <dt>Languages</dt>
                        <dd>
                          {profile.languages}
                        </dd>
                      </div>
                    )}

                    <div>
                      <dt>Applied</dt>
                      <dd>
                        {formatDate(
                          profile.appliedAt
                        )}
                      </dd>
                    </div>

                  </dl>

                </div>

              )}

            </aside>

          </div>

        </div>

      </div>

    </>
  );
}


/* ============================================================
   STATUS CARD
   ============================================================ */

function StatusCard({
  icon,
  tone,
  title,
  children,
}) {
  return (
    <div className="partner-status-card">

      <span
        className={`partner-status-icon ${
          tone === 'danger'
            ? 'danger'
            : ''
        }`}
      >
        <Icon
          name={icon}
          size={22}
        />
      </span>

      <h2>
        {title}
      </h2>

      {children}

    </div>
  );
}


/* ============================================================
   JOBS SECTION
   ============================================================ */

function JobsSection({
  jobs,
  busyJob,
  jobError,
  onAdvance,
}) {

  if (!jobs) {
    return (
      <p className="question-hint">
        Loading your jobs…
      </p>
    );
  }

  const active =
    jobs.filter(
      (j) => !isFinished(j.status)
    );

  const finished =
    jobs.filter(
      (j) => isFinished(j.status)
    );


  if (jobs.length === 0) {

    return (
      <div className="partner-empty">

        <Icon
          name="calendar"
          size={32}
        />

        <h3>
          No jobs assigned yet
        </h3>

        <p>
          When Supplybase assigns you a job,
          it will appear here with the
          customer&apos;s details.
        </p>

      </div>
    );
  }


  return (
    <>

      <div className="partner-section-title">

        <h2>
          Active jobs
        </h2>

        <span>
          {active.length}
        </span>

      </div>


      {active.length === 0 ? (

        <p className="question-hint">
          Nothing active right now.
        </p>

      ) : (

        <div className="partner-job-list">

          {active.map((job) => (

            <JobCard
              key={job.id}
              job={job}
              busy={
                busyJob === job.id
              }
              error={
                jobError[job.id]
              }
              onAdvance={
                onAdvance
              }
            />

          ))}

        </div>

      )}


      {finished.length > 0 && (

        <>

          <div className="partner-section-title">

            <h2>
              Finished
            </h2>

            <span>
              {finished.length}
            </span>

          </div>

          <div className="partner-job-list">

            {finished.map((job) => (

              <JobCard
                key={job.id}
                job={job}
                done
              />

            ))}

          </div>

        </>

      )}

    </>
  );
}


/* ============================================================
   JOB CARD
   ============================================================ */

function JobCard({
  job,
  done,
  busy,
  error,
  onAdvance,
}) {

  const step =
    NEXT_STEP[job.status];


  return (
    <div
      className={`partner-job-card ${
        done ? 'done' : ''
      }`}
    >

      <div className="partner-job-top">

        <div>

          <span className="partner-job-number">
            {job.bookingNumber ||
              job.reference}
          </span>

          <h3>
            {job.serviceLabel ||
              'Service'}
          </h3>

        </div>

        <span
          className={`partner-status partner-status-${jobStatusTone(
            job.status
          )}`}
        >
          {jobStatusLabel(
            job.status
          )}
        </span>

      </div>


      <ul className="partner-job-meta">

        {job.preferredDate && (

          <li>

            <Icon
              name="calendar"
              size={15}
            />

            {formatDate(
              job.preferredDate
            )}

            {job.preferredSlot
              ? ` · ${job.preferredSlot}`
              : ''}

          </li>

        )}


        {(job.address ||
          job.location) && (

          <li>

            <Icon
              name="map-pin"
              size={15}
            />

            {[
              job.address,
              job.location,
            ]
              .filter(Boolean)
              .join(', ')}

          </li>

        )}


        {job.name && (

          <li className="partner-job-contact">

            <Icon
              name="user"
              size={15}
            />

            {job.name}

            {job.phone && (
              <>
                {' · '}

                <a
                  href={`tel:${job.phone}`}
                >
                  {job.phone}
                </a>
              </>
            )}

          </li>

        )}

      </ul>


      {error && (

        <div
          role="alert"
          className="alert alert-error"
        >

          <Icon
            name="info"
            size={18}
          />

          <span>
            {error}
          </span>

        </div>

      )}


      {!done && (

        <div className="partner-job-foot">

          {step ? (

            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                onAdvance(job)
              }
              disabled={busy}
            >
              {busy
                ? 'Saving…'
                : step.label}
            </button>

          ) : (

            <span className="partner-job-wait">
              Waiting on Supplybase for
              the next step.
            </span>

          )}

        </div>

      )}

    </div>
  );
}
=======
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
>>>>>>> main

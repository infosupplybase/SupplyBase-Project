import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Icon from '../components/ui/Icon';
import { SITE_URL, SUPPORT_PHONE } from '../config';
import { useAuth } from '../context/AuthContext';
import api, { friendlyError } from '../lib/api';
import {
  isFinished,
  jobStatusLabel,
  jobStatusTone,
} from '../lib/bookingStatus';


/* ============================================================
   NEXT JOB STEP
   ============================================================ */

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


/* ============================================================
   DATE FORMAT
   ============================================================ */

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

      {/* =====================================================
          MAIN HERO
          ===================================================== */}

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


          {/* RIGHT TRANSPARENT IMAGE */}

          <div className="partner-hero-image-wrap">

            {/* Old circle intentionally removed */}

            <img
              src="/assets/partners/partner-hero.png"
              alt="Supplybase service professionals"
              className="partner-hero-image"
            />

          </div>

        </div>

      </div>


      {/* =====================================================
          WHATSAPP JOIN BOX
          ===================================================== */}

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

                <span className="partner-arrow">
                  
                </span>

              </div>

              <input
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target.value
                      .replace(/\D/g, '')
                      .slice(0, 10)
                  )
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


/* ============================================================
   DASHBOARD
   ============================================================ */

export default function Dashboard() {
  const {
    user,
    logout,
    refreshUser,
  } = useAuth();

  const navigate = useNavigate();


  /* ==========================================================
     STATE
     ========================================================== */

  const [profile, setProfile] = useState(undefined);
  const [jobs, setJobs] = useState(null);

  const [error, setError] = useState('');

  const [busyJob, setBusyJob] = useState(null);

  const [jobError, setJobError] = useState({});

  const [checking, setChecking] = useState(false);


  /* ==========================================================
     USER ROLE
     ========================================================== */

  const isProfessional =
    user.role === 'PROFESSIONAL';

  const isAdmin =
    user.role === 'ADMIN';


  /* ==========================================================
     LOAD APPLICATION PROFILE
     ========================================================== */

  const loadProfile = useCallback(async () => {
    try {
      const application = await api.application();

      setProfile(application);
      setError('');

    } catch (err) {

      if (err && err.status === 404) {
        setProfile(null);
      } else {
        setError(friendlyError(err));
      }

    }
  }, []);


  useEffect(() => {
    loadProfile();
  }, [loadProfile]);


  /* ==========================================================
     REFRESH ROLE AFTER APPROVAL
     ========================================================== */

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


  /* ==========================================================
     LOAD JOBS
     ========================================================== */

  const loadJobs = useCallback(async () => {

    try {

      const result = await api.jobs();

      setJobs(result);

    } catch (err) {

      setError(friendlyError(err));

    }

  }, []);


  useEffect(() => {

    if (isProfessional) {
      loadJobs();
    }

  }, [
    isProfessional,
    loadJobs,
  ]);


  /* ==========================================================
     CHECK APPLICATION STATUS
     ========================================================== */

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


  /* ==========================================================
     ADVANCE JOB
     ========================================================== */

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

    setJobError((current) => ({
      ...current,
      [job.id]: '',
    }));


    try {

      const updated = await api.advanceJob(
        job.id,
        step.status
      );


      setJobs((list) =>
        list.map((item) =>
          item.id === updated.id
            ? updated
            : item
        )
      );

    } catch (err) {

      setJobError((current) => ({
        ...current,
        [job.id]: friendlyError(err),
      }));

    } finally {

      setBusyJob(null);

    }
  };


  /* ==========================================================
     SIGN OUT
     ========================================================== */

  const handleSignOut = async () => {

    await logout();

    navigate('/login', {
      replace: true,
    });

  };


  /* ==========================================================
     SIGN OUT + APPLY
     ========================================================== */

  const handleSignOutAndApply = async () => {

    await logout();

    navigate('/join', {
      replace: true,
    });

  };


  /* ==========================================================
     USER FIRST NAME
     ========================================================== */

  const firstName =
    (user.fullName || '').split(' ')[0];


  const loading =
    profile === undefined &&
    !error;


  /* ==========================================================
     DASHBOARD BODY
     ========================================================== */

  let body;


  /* LOADING */

  if (loading) {

    body = (
      <p className="question-hint">
        Loading your partner account…
      </p>
    );

  }


  /* ADMIN */

  else if (isAdmin) {

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

  }


  /* PROFESSIONAL */

  else if (isProfessional) {

    body = (
      <JobsSection
        jobs={jobs}
        busyJob={busyJob}
        jobError={jobError}
        onAdvance={handleAdvance}
      />
    );

  }


  /* NO APPLICATION */

  else if (profile === null) {

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

  }


  /* PENDING */

  else if (
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

  }


  /* REJECTED */

  else if (
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

  }


  /* SUSPENDED */

  else if (
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

  }


  /* APPROVED / WAITING ROLE */

  else {

    body = (
      <p className="question-hint">
        Your application is approved — setting up
        your access…
      </p>
    );

  }


  /* ==========================================================
     PAGE
     ========================================================== */

  return (
    <div className="partner-shell">

      {/* ======================================================
          HERO
          ====================================================== */}

      <PartnerHero />


      {/* ======================================================
          DASHBOARD HEADING
          ====================================================== */}

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


      {/* ======================================================
          DASHBOARD BODY
          ====================================================== */}

      <div className="partner-body">

        <div className="container">

          <div className="partner-layout">


            {/* =================================================
                MAIN
                ================================================= */}

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


            {/* =================================================
                SIDEBAR
                ================================================= */}

            <aside className="partner-side">


              {/* ACCOUNT CARD */}

              <div className="partner-side-card">

                <h3>
                  Your account
                </h3>

                <dl className="partner-summary">

                  <div>

                    <dt>
                      Name
                    </dt>

                    <dd>
                      {user.fullName}
                    </dd>

                  </div>


                  <div>

                    <dt>
                      Mobile
                    </dt>

                    <dd>
                      {user.phone || '—'}
                    </dd>

                  </div>


                  <div>

                    <dt>
                      Email
                    </dt>

                    <dd>
                      {user.email}
                    </dd>

                  </div>

                </dl>

              </div>


              {/* APPLICATION CARD */}

              {profile && (

                <div className="partner-side-card">

                  <h3>
                    Application
                  </h3>

                  <dl className="partner-summary">


                    <div>

                      <dt>
                        Status
                      </dt>

                      <dd>
                        {profile.status.charAt(0) +
                          profile.status
                            .slice(1)
                            .toLowerCase()}
                      </dd>

                    </div>


                    <div>

                      <dt>
                        Trade
                      </dt>

                      <dd>
                        {profile.tradeLabel || '—'}
                      </dd>

                    </div>


                    <div>

                      <dt>
                        Experience
                      </dt>

                      <dd>
                        {profile.experienceYears == null
                          ? '—'
                          : `${profile.experienceYears} yrs`}
                      </dd>

                    </div>


                    <div>

                      <dt>
                        City
                      </dt>

                      <dd>
                        {profile.city || '—'}
                      </dd>

                    </div>


                    {profile.serviceAreas && (

                      <div>

                        <dt>
                          Areas
                        </dt>

                        <dd>
                          {profile.serviceAreas}
                        </dd>

                      </div>

                    )}


                    {profile.languages && (

                      <div>

                        <dt>
                          Languages
                        </dt>

                        <dd>
                          {profile.languages}
                        </dd>

                      </div>

                    )}


                    <div>

                      <dt>
                        Applied
                      </dt>

                      <dd>
                        {formatDate(profile.appliedAt)}
                      </dd>

                    </div>

                  </dl>

                </div>

              )}

            </aside>

          </div>

        </div>

      </div>

    </div>
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
      (job) => !isFinished(job.status)
    );


  const finished =
    jobs.filter(
      (job) => isFinished(job.status)
    );


  /* NO JOBS */

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

      {/* ======================================================
          ACTIVE JOBS
          ====================================================== */}

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
              busy={busyJob === job.id}
              error={jobError[job.id]}
              onAdvance={onAdvance}
            />

          ))}

        </div>

      )}


      {/* ======================================================
          FINISHED JOBS
          ====================================================== */}

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

      {/* ======================================================
          JOB TOP
          ====================================================== */}

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
          {jobStatusLabel(job.status)}
        </span>

      </div>


      {/* ======================================================
          JOB META
          ====================================================== */}

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


      {/* ======================================================
          ERROR
          ====================================================== */}

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


      {/* ======================================================
          JOB ACTION
          ====================================================== */}

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

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import api, { friendlyError } from '../lib/api';
import {
  isFinished,
  jobStatusLabel,
  jobStatusTone,
} from '../lib/bookingStatus';

const STATUS_STEPS = [
  {
    status: 'SITE_VISIT_SCHEDULED',
    label: 'Site visit scheduled',
    description: 'The site visit has been scheduled.',
  },
  {
    status: 'SITE_VISIT_COMPLETED',
    label: 'Site visit completed',
    description: 'The site visit has been completed.',
  },
  {
    status: 'WORK_SCHEDULED',
    label: 'Work scheduled',
    description: 'The work has been scheduled.',
  },
  {
    status: 'WORK_IN_PROGRESS',
    label: 'Work in progress',
    description: 'Work is currently being carried out.',
  },
  {
    status: 'WORK_COMPLETED',
    label: 'Work completed',
    description: 'The assigned work has been completed.',
  },
];

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
    : '—';

export default function PartnerJobDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadJob = async () => {
      try {
        setLoading(true);
        setError('');

        const jobs = await api.jobs();

        const foundJob = jobs.find(
          (item) => String(item.id) === String(jobId)
        );

        if (!foundJob) {
          throw new Error('Job not found.');
        }

        if (mounted) {
          setJob(foundJob);
        }
      } catch (err) {
        if (mounted) {
          setError(friendlyError(err));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadJob();

    return () => {
      mounted = false;
    };
  }, [jobId]);

  const handleAdvance = async () => {
    if (!job) return;

    const nextStep = NEXT_STEP[job.status];

    if (!nextStep) return;

    if (nextStep.confirm && !window.confirm(nextStep.confirm)) {
      return;
    }

    try {
      setBusy(true);
      setError('');

      await api.advanceJob(job.id, nextStep.status);

      setJob((current) => ({
        ...current,
        status: nextStep.status,
      }));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <main className="partner-job-details-page">
        <div className="partner-job-details-loading">
          Loading job details...
        </div>
      </main>
    );
  }

  if (error && !job) {
    return (
      <main className="partner-job-details-page">
        <button
          type="button"
          className="partner-back-button"
          onClick={() => navigate('/')}
        >
          <Icon name="arrow-left" size={18} />
          Back to dashboard
        </button>

        <div className="alert alert-error" role="alert">
          <Icon name="info" size={18} />
          <span>{error}</span>
        </div>
      </main>
    );
  }

  if (!job) return null;

  const currentStepIndex = STATUS_STEPS.findIndex(
    (step) => step.status === job.status
  );

  const nextStep = NEXT_STEP[job.status];
  const done = isFinished(job.status);

  return (
    <main className="partner-job-details-page">
      {/* Header */}
      <div className="partner-job-details-header">
        <button
          type="button"
          className="partner-back-button"
          onClick={() => navigate('/')}
        >
          <Icon name="arrow-left" size={18} />
          Back to dashboard
        </button>

        <div className="partner-job-heading">
          <div>
            <span className="partner-job-number">
              {job.bookingNumber || job.reference || `Job #${job.id}`}
            </span>

            <h1>{job.serviceLabel || 'Service'}</h1>
          </div>

          <span
            className={`partner-status partner-status-${jobStatusTone(
              job.status
            )}`}
          >
            {jobStatusLabel(job.status)}
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div role="alert" className="alert alert-error">
          <Icon name="info" size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="partner-job-details-grid">
        {/* Left column */}
        <section className="partner-job-details-main">
          {/* Job information */}
          <div className="partner-details-card">
            <div className="partner-details-card-header">
              <div>
                <span className="partner-details-eyebrow">
                  Job information
                </span>
                <h2>Booking details</h2>
              </div>

              <Icon name="calendar" size={22} />
            </div>

            <div className="partner-details-info-grid">
              <div className="partner-detail-item">
                <span>Service</span>
                <strong>{job.serviceLabel || '—'}</strong>
              </div>

              <div className="partner-detail-item">
                <span>Booking number</span>
                <strong>
                  {job.bookingNumber || job.reference || '—'}
                </strong>
              </div>

              <div className="partner-detail-item">
                <span>Preferred date</span>
                <strong>{formatDate(job.preferredDate)}</strong>
              </div>

              <div className="partner-detail-item">
                <span>Preferred time</span>
                <strong>{job.preferredSlot || '—'}</strong>
              </div>

              <div className="partner-detail-item partner-detail-full">
                <span>Location</span>
                <strong>
                  {[job.address, job.location]
                    .filter(Boolean)
                    .join(', ') || '—'}
                </strong>
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="partner-details-card">
            <div className="partner-details-card-header">
              <div>
                <span className="partner-details-eyebrow">
                  Customer
                </span>
                <h2>Customer information</h2>
              </div>

              <Icon name="user" size={22} />
            </div>

            <div className="partner-customer-details">
              <div className="partner-customer-avatar">
                {(job.name || 'C').charAt(0).toUpperCase()}
              </div>

              <div className="partner-customer-content">
                <strong>{job.name || 'Customer'}</strong>

                {job.phone && (
                  <a href={`tel:${job.phone}`}>
                    <Icon name="phone" size={16} />
                    {job.phone}
                  </a>
                )}

                {job.address && (
                  <span>
                    <Icon name="map-pin" size={16} />
                    {job.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status timeline */}
          <div className="partner-details-card">
            <div className="partner-details-card-header">
              <div>
                <span className="partner-details-eyebrow">
                  Progress
                </span>
                <h2>Job status</h2>
              </div>

              <Icon name="clock" size={22} />
            </div>

            <div className="partner-job-timeline">
              {STATUS_STEPS.map((step, index) => {
                const completed =
                  currentStepIndex >= 0 && index < currentStepIndex;

                const current =
                  index === currentStepIndex;

                return (
                  <div
                    key={step.status}
                    className={`partner-timeline-item ${
                      completed ? 'completed' : ''
                    } ${current ? 'current' : ''}`}
                  >
                    <div className="partner-timeline-marker">
                      {completed ? (
                        <Icon name="check" size={16} />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>

                    <div className="partner-timeline-content">
                      <strong>{step.label}</strong>
                      <p>{step.description}</p>

                      {current && (
                        <span className="partner-timeline-current">
                          Current status
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right column */}
        <aside className="partner-job-details-sidebar">
          <div className="partner-details-card partner-action-card">
            <span className="partner-details-eyebrow">
              Next action
            </span>

            <h2>
              {done
                ? 'Job completed'
                : nextStep
                ? nextStep.label
                : 'Waiting for next step'}
            </h2>

            <p>
              {done
                ? 'This job has been marked as completed.'
                : nextStep
                ? 'Update the job status when you complete the current step.'
                : 'Supplybase will provide the next step when it is ready.'}
            </p>

            {!done && nextStep && (
              <button
                type="button"
                className="btn btn-primary partner-action-button"
                onClick={handleAdvance}
                disabled={busy}
              >
                {busy ? 'Saving…' : nextStep.label}
              </button>
            )}
          </div>

          <div className="partner-details-card">
            <span className="partner-details-eyebrow">
              Current status
            </span>

            <div className="partner-current-status">
              <span
                className={`partner-status partner-status-${jobStatusTone(
                  job.status
                )}`}
              >
                {jobStatusLabel(job.status)}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
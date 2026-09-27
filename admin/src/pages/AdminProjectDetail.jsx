import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import PageHeader from '../components/admin/PageHeader';
import StatusBadge from '../components/admin/StatusBadge';
import Drawer from '../components/admin/Drawer';
import { EmptyState, ErrorBanner } from '../components/admin/TableStates';
import { useToast } from '../components/admin/Toast';
import api, { friendlyError } from '../lib/api';
import { formatAmount, formatDate, label } from '../lib/format';
import { StageProgress, projectTone } from './AdminProjects';

const PROJECT_STATUSES = ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
const STAGE_STATUSES = [
  { value: 'PENDING', text: 'Not started' },
  { value: 'IN_PROGRESS', text: 'In progress' },
  { value: 'DONE', text: 'Done' },
];

const toneForStage = (status) => {
  if (status === 'DONE') return 'success';
  if (status === 'IN_PROGRESS') return 'accent';
  return 'neutral';
};

const stageText = (status) => (STAGE_STATUSES.find((s) => s.value === status) || {}).text || label(status);

const emptyStage = { stageNo: '', title: '', description: '', status: 'PENDING', startedOn: '', completedOn: '' };

/** One project: its details, its status, and the stages the client follows. */
export default function AdminProjectDetail() {
  const { id } = useParams();
  const { notify } = useToast();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);

  const [stageOpen, setStageOpen] = useState(false);
  const [stageIsNew, setStageIsNew] = useState(true);
  const [stageForm, setStageForm] = useState(emptyStage);
  const [stageSaving, setStageSaving] = useState(false);
  const [stageError, setStageError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api
      .project(id)
      .then(setProject)
      .catch((err) => setError(friendlyError(err)))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (e) => {
    const status = e.target.value;
    if (status === 'CANCELLED' && !window.confirm('Mark this project as cancelled? The client will see it as cancelled.')) {
      return;
    }
    setStatusSaving(true);
    try {
      const updated = await api.admin.projects.setStatus(id, status);
      setProject(updated);
      notify(`Project marked ${label(status).toLowerCase()}`);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setStatusSaving(false);
    }
  };

  const openNewStage = () => {
    const nextNo = project && project.stages.length ? Math.max(...project.stages.map((s) => s.stageNo)) + 1 : 1;
    setStageForm({ ...emptyStage, stageNo: nextNo });
    setStageIsNew(true);
    setStageError('');
    setStageOpen(true);
  };

  const openEditStage = (stage) => {
    setStageForm({
      stageNo: stage.stageNo,
      title: stage.title,
      description: stage.description || '',
      status: stage.status,
      startedOn: stage.startedOn || '',
      completedOn: stage.completedOn || '',
    });
    setStageIsNew(false);
    setStageError('');
    setStageOpen(true);
  };

  const updateStage = (field) => (e) => setStageForm((f) => ({ ...f, [field]: e.target.value }));

  const handleStageSave = async (e) => {
    e.preventDefault();
    if (!stageForm.title.trim()) {
      setStageError('Please give the stage a title.');
      return;
    }
    if (stageForm.startedOn && stageForm.completedOn && stageForm.completedOn < stageForm.startedOn) {
      setStageError('The completed date is before the started date.');
      return;
    }
    setStageSaving(true);
    setStageError('');
    try {
      const updated = await api.admin.projects.upsertStage(id, {
        stageNo: Number(stageForm.stageNo),
        title: stageForm.title.trim(),
        description: stageForm.description.trim() || undefined,
        status: stageForm.status,
        startedOn: stageForm.startedOn || undefined,
        completedOn: stageForm.completedOn || undefined,
      });
      setProject(updated);
      setStageOpen(false);
      notify(`Stage ${stageForm.stageNo} saved`);
    } catch (err) {
      setStageError(friendlyError(err));
    } finally {
      setStageSaving(false);
    }
  };

  if (loading && !project) {
    return (
      <div className="admin-loading" style={{ minHeight: '50vh', background: 'none' }}>
        <span className="admin-spinner" aria-hidden="true" />
        <p>Loading project…</p>
      </div>
    );
  }

  if (!project) {
    return (
      <>
        <Link to="/projects" className="admin-back-link">
          <Icon name="arrow-left" size={15} />
          All projects
        </Link>
        <ErrorBanner onRetry={load}>{error || 'That project could not be found.'}</ErrorBanner>
      </>
    );
  }

  const stages = [...project.stages].sort((a, b) => a.stageNo - b.stageNo);

  return (
    <div>
      <Link to="/projects" className="admin-back-link">
        <Icon name="arrow-left" size={15} />
        All projects
      </Link>

      <PageHeader
        icon="building"
        eyebrow={`${project.code} · ${project.category || 'Uncategorised'}`}
        title={project.name}
        subtitle={project.description || 'No description yet.'}
        actions={
          <div className="field" style={{ minWidth: 200 }}>
            <label htmlFor="pj-status" className="sr-only">
              Project status
            </label>
            <select id="pj-status" className="admin-filter" value={project.status} onChange={handleStatusChange} disabled={statusSaving}>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  Status: {label(s)}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <ErrorBanner>{error}</ErrorBanner>

      <div className="admin-panel" style={{ marginBottom: 24 }}>
        <div className="admin-panel-body" style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <StatusBadge tone={projectTone(project.status)}>{label(project.status)}</StatusBadge>
          <div style={{ flex: '1 1 260px' }}>
            <StageProgress stages={project.stages} large />
          </div>
        </div>
      </div>

      <dl className="admin-detail-list admin-detail-grid">
        <div>
          <dt>Client</dt>
          <dd>{project.clientName || 'Not linked yet'}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{project.location || '—'}</dd>
        </div>
        <div>
          <dt>Area</dt>
          <dd>{project.area || '—'}</dd>
        </div>
        <div>
          <dt>Contract value</dt>
          <dd>{formatAmount(project.contractValue)}</dd>
        </div>
        <div>
          <dt>Start date</dt>
          <dd>{formatDate(project.startDate)}</dd>
        </div>
        <div>
          <dt>Expected end</dt>
          <dd>{formatDate(project.expectedEndDate)}</dd>
        </div>
      </dl>

      <section className="admin-section">
        <div className="admin-section-head">
          <h2>Stages</h2>
          <button type="button" className="btn btn-primary btn-sm" onClick={openNewStage}>
            <Icon name="plus" size={16} />
            ADD STAGE
          </button>
        </div>
        <p className="admin-form-hint" style={{ marginTop: -8 }}>
          The client sees these on their dashboard as &ldquo;where things stand&rdquo;. Click a stage to update it.
        </p>

        {stages.length ? (
          <div className="admin-stage-list">
            {stages.map((stage) => (
              <button key={stage.stageNo} type="button" className="admin-stage-item" onClick={() => openEditStage(stage)}>
                <span className="admin-stage-num" aria-label={`Stage ${stage.stageNo}`}>
                  {stage.stageNo}
                </span>
                <span className="admin-stage-title">{stage.title}</span>
                {stage.description && <span className="admin-stage-desc">{stage.description}</span>}
                <span className="admin-stage-dates">
                  {[
                    stage.startedOn ? `Started ${formatDate(stage.startedOn)}` : null,
                    stage.completedOn ? `Completed ${formatDate(stage.completedOn)}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || (stage.status === 'PENDING' ? 'Not started yet' : 'No dates recorded')}
                </span>
                <StatusBadge tone={toneForStage(stage.status)}>{stageText(stage.status)}</StatusBadge>
              </button>
            ))}
          </div>
        ) : (
          <div className="admin-panel">
            <EmptyState icon="layers" title="No stages yet">
              Break the project into steps — design, civil work, finishing, handover — so the client can follow along.
            </EmptyState>
          </div>
        )}
      </section>

      <Drawer
        open={stageOpen}
        onClose={() => setStageOpen(false)}
        title={stageIsNew ? 'New stage' : `Stage ${stageForm.stageNo}`}
      >
        <form onSubmit={handleStageSave} noValidate>
          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="st-title">
              Title <span className="req">*</span>
            </label>
            <input id="st-title" type="text" value={stageForm.title} onChange={updateStage('title')} placeholder="e.g. Civil work" autoFocus />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="st-desc">What happens in this stage</label>
            <textarea id="st-desc" rows={3} value={stageForm.description} onChange={updateStage('description')} />
          </div>

          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="field">
              <label htmlFor="st-status">Progress</label>
              <select id="st-status" value={stageForm.status} onChange={updateStage('status')}>
                {STAGE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.text}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="st-no">Order</label>
              <input id="st-no" type="number" min="1" value={stageForm.stageNo} onChange={updateStage('stageNo')} disabled={!stageIsNew} />
            </div>
          </div>

          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="field">
              <label htmlFor="st-started">Started on</label>
              <input id="st-started" type="date" value={stageForm.startedOn} onChange={updateStage('startedOn')} />
            </div>
            <div className="field">
              <label htmlFor="st-completed">Completed on</label>
              <input id="st-completed" type="date" value={stageForm.completedOn} onChange={updateStage('completedOn')} min={stageForm.startedOn || undefined} />
            </div>
          </div>

          {stageIsNew && stages.some((s) => s.stageNo === Number(stageForm.stageNo)) && (
            <div role="alert" className="alert alert-warning">
              <Icon name="alert" size={18} />
              <span>Stage {stageForm.stageNo} already exists — saving will replace it.</span>
            </div>
          )}

          {stageError && (
            <div role="alert" className="alert alert-error">
              <Icon name="alert" size={18} />
              <span>{stageError}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={stageSaving}>
            {stageSaving ? 'SAVING…' : 'SAVE STAGE'}
          </button>
        </form>
      </Drawer>
    </div>
  );
}

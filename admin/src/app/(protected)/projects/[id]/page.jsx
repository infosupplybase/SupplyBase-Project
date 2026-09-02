'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Icon from '../../../../components/ui/Icon';
import StatusBadge from '../../../../components/admin/StatusBadge';
import Drawer from '../../../../components/admin/Drawer';
import api, { friendlyError } from '../../../../lib/api';

const PROJECT_STATUSES = ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
const STAGE_STATUSES = ['PENDING', 'IN_PROGRESS', 'DONE'];

const label = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const toneForProject = (status) => {
  if (status === 'CANCELLED') return 'danger';
  if (status === 'COMPLETED') return 'success';
  if (status === 'ON_HOLD') return 'warning';
  return 'accent';
};

const toneForStage = (status) => {
  if (status === 'DONE') return 'success';
  if (status === 'IN_PROGRESS') return 'accent';
  return 'neutral';
};

const emptyStage = { stageNo: '', title: '', description: '', status: 'PENDING', startedOn: '', completedOn: '' };

export default function AdminProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);

  const [stageOpen, setStageOpen] = useState(false);
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
    setStatusSaving(true);
    try {
      const updated = await api.admin.projects.setStatus(id, status);
      setProject(updated);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setStatusSaving(false);
    }
  };

  const openNewStage = () => {
    const nextNo = project && project.stages.length ? Math.max(...project.stages.map((s) => s.stageNo)) + 1 : 1;
    setStageForm({ ...emptyStage, stageNo: nextNo });
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
    setStageSaving(true);
    setStageError('');
    try {
      const payload = {
        stageNo: Number(stageForm.stageNo),
        title: stageForm.title.trim(),
        description: stageForm.description.trim() || undefined,
        status: stageForm.status,
        startedOn: stageForm.startedOn || undefined,
        completedOn: stageForm.completedOn || undefined,
      };
      const updated = await api.admin.projects.upsertStage(id, payload);
      setProject(updated);
      setStageOpen(false);
    } catch (err) {
      setStageError(friendlyError(err));
    } finally {
      setStageSaving(false);
    }
  };

  if (loading) return <p style={{ color: 'var(--grey-500)' }}>Loading…</p>;

  if (error && !project) {
    return (
      <div role="alert" className="alert alert-error">
        <Icon name="info" size={18} />
        <span>{error}</span>
      </div>
    );
  }

  if (!project) return null;

  const stages = [...project.stages].sort((a, b) => a.stageNo - b.stageNo);

  return (
    <div>
      <Link href="/projects" className="admin-back-link">
        <Icon name="arrow-left" size={15} />
        All projects
      </Link>

      <div className="admin-header">
        <div>
          <h1>{project.name}</h1>
          <p>
            {project.code} · {project.category || 'Uncategorised'}
          </p>
        </div>
        <select className="admin-filter" value={project.status} onChange={handleStatusChange} disabled={statusSaving}>
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div role="alert" className="alert alert-error">
          <Icon name="info" size={18} />
          <span>{error}</span>
        </div>
      )}

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
          <dd>{project.contractValue != null ? `₹${project.contractValue}` : '—'}</dd>
        </div>
        <div>
          <dt>Start date</dt>
          <dd>{project.startDate || '—'}</dd>
        </div>
        <div>
          <dt>Expected end</dt>
          <dd>{project.expectedEndDate || '—'}</dd>
        </div>
        {project.description && (
          <div style={{ gridColumn: '1 / -1' }}>
            <dt>Description</dt>
            <dd>{project.description}</dd>
          </div>
        )}
      </dl>

      <div className="admin-header" style={{ marginTop: 32 }}>
        <div>
          <h2 style={{ margin: 0 }}>STAGES</h2>
          <p>What the client sees as "where things stand" on their dashboard.</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={openNewStage}>
          <Icon name="plus" size={16} />
          ADD STAGE
        </button>
      </div>

      {stages.length ? (
        <div className="admin-stage-list">
          {stages.map((stage) => (
            <button key={stage.stageNo} type="button" className="admin-stage-item" onClick={() => openEditStage(stage)}>
              <span className="admin-stage-num">STAGE {stage.stageNo}</span>
              <span className="admin-stage-title">{stage.title}</span>
              {stage.description && <span className="admin-stage-desc">{stage.description}</span>}
              <span className="admin-stage-dates">
                {stage.startedOn ? `Started ${stage.startedOn}` : 'Not started'}
                {stage.completedOn ? ` · Completed ${stage.completedOn}` : ''}
              </span>
              <StatusBadge tone={toneForStage(stage.status)}>{label(stage.status)}</StatusBadge>
            </button>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--grey-500)' }}>No stages yet.</p>
      )}

      <Drawer
        open={stageOpen}
        onClose={() => setStageOpen(false)}
        title={`Stage ${stageForm.stageNo || ''}`}
      >
        <form onSubmit={handleStageSave}>
          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="st-no">
              Stage number <span className="req">*</span>
            </label>
            <input id="st-no" type="number" min="1" value={stageForm.stageNo} onChange={updateStage('stageNo')} />
            <span className="field-hint">Saving with a number that already exists updates that stage instead of adding a new one.</span>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="st-title">
              Title <span className="req">*</span>
            </label>
            <input id="st-title" type="text" value={stageForm.title} onChange={updateStage('title')} />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="st-desc">Description</label>
            <textarea id="st-desc" rows={3} value={stageForm.description} onChange={updateStage('description')} />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="st-status">Status</label>
            <select id="st-status" value={stageForm.status} onChange={updateStage('status')}>
              {STAGE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="field">
              <label htmlFor="st-started">Started on</label>
              <input id="st-started" type="date" value={stageForm.startedOn} onChange={updateStage('startedOn')} />
            </div>
            <div className="field">
              <label htmlFor="st-completed">Completed on</label>
              <input id="st-completed" type="date" value={stageForm.completedOn} onChange={updateStage('completedOn')} />
            </div>
          </div>

          {stageError && (
            <div role="alert" className="alert alert-error">
              <Icon name="info" size={18} />
              <span>{stageError}</span>
            </div>
          )}

          <button type="submit" className="btn btn-dark btn-block" disabled={stageSaving}>
            {stageSaving ? 'SAVING…' : 'SAVE STAGE'}
          </button>
        </form>
      </Drawer>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import PageHeader from '../components/admin/PageHeader';
import StatusBadge from '../components/admin/StatusBadge';
import Pagination from '../components/admin/Pagination';
import Drawer from '../components/admin/Drawer';
import ClientPicker from '../components/admin/ClientPicker';
import { ErrorBanner, TableEmpty, TableLoading } from '../components/admin/TableStates';
import rowProps from '../components/admin/rowProps';
import { useToast } from '../components/admin/Toast';
import { usePageParam } from '../hooks/useQueryParam';
import api, { friendlyError } from '../lib/api';
import { formatAmount, formatDate, label } from '../lib/format';

export const projectTone = (status) => {
  if (status === 'CANCELLED') return 'danger';
  if (status === 'COMPLETED') return 'success';
  if (status === 'ON_HOLD') return 'warning';
  return 'accent';
};

/** "2 of 5 stages done" with a bar — how far along a project is at a glance. */
export function StageProgress({ stages, large = false }) {
  if (!stages || stages.length === 0) {
    return <span className="admin-table-sub">No stages yet</span>;
  }
  const done = stages.filter((s) => s.status === 'DONE').length;
  const pct = Math.round((done / stages.length) * 100);
  return (
    <span className={`admin-progress${large ? ' large' : ''}`}>
      <span className="admin-progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Stages done">
        <span className="admin-progress-fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="admin-progress-text">
        {done} of {stages.length} stages done
      </span>
    </span>
  );
}

const emptyForm = {
  name: '',
  client: null,
  category: '',
  location: '',
  area: '',
  description: '',
  contractValue: '',
  startDate: '',
  expectedEndDate: '',
};

/** Client projects — what each client sees on their dashboard as stages and status. */
export default function AdminProjects() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const [page, setPage] = usePageParam();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api.admin.projects
      .list({ page })
      .then(setData)
      .catch((err) => setError(friendlyError(err)))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm(emptyForm);
    setSaveError('');
    setCreating(true);
  };

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setSaveError('Please give the project a name.');
      return;
    }
    if (form.startDate && form.expectedEndDate && form.expectedEndDate < form.startDate) {
      setSaveError('The expected end date is before the start date.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const created = await api.admin.projects.create({
        name: form.name.trim(),
        clientUserId: form.client ? form.client.id : undefined,
        category: form.category.trim() || undefined,
        location: form.location.trim() || undefined,
        area: form.area.trim() || undefined,
        description: form.description.trim() || undefined,
        contractValue: form.contractValue === '' ? undefined : Number(form.contractValue),
        startDate: form.startDate || undefined,
        expectedEndDate: form.expectedEndDate || undefined,
      });
      setCreating(false);
      notify(`Project ${created.code} created`);
      navigate(`/projects/${created.id}`);
    } catch (err) {
      setSaveError(err && err.fieldErrors ? Object.values(err.fieldErrors)[0] : friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        icon="building"
        title="Projects"
        subtitle="Bigger jobs run in stages. The client follows each project's stages and status on their dashboard."
        actions={
          <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
            <Icon name="plus" size={16} />
            NEW PROJECT
          </button>
        }
      />

      <ErrorBanner onRetry={load}>{error}</ErrorBanner>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Client</th>
              <th>Location</th>
              <th>Contract value</th>
              <th>Timeline</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableLoading columns={6} />
            ) : data && data.content.length ? (
              data.content.map((row) => (
                <tr key={row.id} {...rowProps(() => navigate(`/projects/${row.id}`), `Open project ${row.name}`)}>
                  <td>
                    <span className="admin-cell-main">{row.name}</span>
                    <span className="admin-table-sub">
                      <span className="admin-mono">{row.code}</span>
                      {row.category ? ` · ${row.category}` : ''}
                    </span>
                  </td>
                  <td>{row.clientName || <span className="admin-table-sub">Not linked</span>}</td>
                  <td>{row.location || '—'}</td>
                  <td>{formatAmount(row.contractValue)}</td>
                  <td>
                    {row.startDate ? formatDate(row.startDate) : '—'}
                    <span className="admin-table-sub">
                      {row.expectedEndDate ? `to ${formatDate(row.expectedEndDate)}` : 'No end date'}
                    </span>
                  </td>
                  <td>
                    <StatusBadge tone={projectTone(row.status)}>{label(row.status)}</StatusBadge>
                    <StageProgress stages={row.stages} />
                  </td>
                </tr>
              ))
            ) : (
              <TableEmpty columns={6} icon="building" title="No projects yet">
                Create one for a bigger job — interiors, construction, renovation — so the client can follow it stage by stage.
              </TableEmpty>
            )}
          </tbody>
        </table>
      </div>

      <Pagination data={data} onChange={setPage} />

      <Drawer open={creating} onClose={() => setCreating(false)} title="New project">
        <form onSubmit={handleCreate} noValidate>
          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="pj-name">
              Project name <span className="req">*</span>
            </label>
            <input
              id="pj-name"
              type="text"
              value={form.name}
              onChange={update('name')}
              placeholder="e.g. 3 BHK interiors — Bandra"
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <ClientPicker
              value={form.client}
              onChange={(client) => setForm((f) => ({ ...f, client }))}
              hint="Optional. The client sees this project on their dashboard once linked."
            />
          </div>

          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="field">
              <label htmlFor="pj-category">Category</label>
              <input id="pj-category" type="text" value={form.category} onChange={update('category')} placeholder="e.g. Interior" />
            </div>
            <div className="field">
              <label htmlFor="pj-area">Area</label>
              <input id="pj-area" type="text" value={form.area} onChange={update('area')} placeholder="e.g. 1,200 sq ft" />
            </div>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="pj-location">Location</label>
            <input id="pj-location" type="text" value={form.location} onChange={update('location')} placeholder="Area, city" />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="pj-description">Description</label>
            <textarea id="pj-description" rows={3} value={form.description} onChange={update('description')} />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="pj-value">Contract value (₹)</label>
            <input
              id="pj-value"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={form.contractValue}
              onChange={update('contractValue')}
            />
          </div>

          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="field">
              <label htmlFor="pj-start">Start date</label>
              <input id="pj-start" type="date" value={form.startDate} onChange={update('startDate')} />
            </div>
            <div className="field">
              <label htmlFor="pj-end">Expected end date</label>
              <input id="pj-end" type="date" value={form.expectedEndDate} onChange={update('expectedEndDate')} min={form.startDate || undefined} />
            </div>
          </div>

          {saveError && (
            <div role="alert" className="alert alert-error">
              <Icon name="alert" size={18} />
              <span>{saveError}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
            {saving ? 'CREATING…' : 'CREATE PROJECT'}
          </button>
        </form>
      </Drawer>
    </div>
  );
}

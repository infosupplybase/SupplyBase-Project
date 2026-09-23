import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import StatusBadge from '../components/admin/StatusBadge';
import Pagination from '../components/admin/Pagination';
import Drawer from '../components/admin/Drawer';
import api, { friendlyError } from '../lib/api';

const label = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const toneFor = (status) => {
  if (status === 'CANCELLED') return 'danger';
  if (status === 'COMPLETED') return 'success';
  if (status === 'ON_HOLD') return 'warning';
  return 'accent';
};

const emptyForm = {
  name: '',
  clientUserId: '',
  category: '',
  location: '',
  area: '',
  description: '',
  contractValue: '',
  startDate: '',
  expectedEndDate: '',
};

/** Numeric field: '' stays '', otherwise becomes a Number for the request body. */
const numberOrBlank = (value) => (value === '' ? '' : Number(value));

export default function AdminProjects() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
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
    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        name: form.name.trim(),
        clientUserId: form.clientUserId === '' ? undefined : numberOrBlank(form.clientUserId),
        category: form.category.trim() || undefined,
        location: form.location.trim() || undefined,
        area: form.area.trim() || undefined,
        description: form.description.trim() || undefined,
        contractValue: form.contractValue === '' ? undefined : numberOrBlank(form.contractValue),
        startDate: form.startDate || undefined,
        expectedEndDate: form.expectedEndDate || undefined,
      };
      const created = await api.admin.projects.create(payload);
      setCreating(false);
      navigate(`/projects/${created.id}`);
    } catch (err) {
      if (err && err.fieldErrors) {
        setSaveError(Object.values(err.fieldErrors)[0] || friendlyError(err));
      } else {
        setSaveError(friendlyError(err));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>PROJECTS</h1>
          <p>What the client dashboard shows — stages, timeline, status.</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
          <Icon name="plus" size={16} />
          NEW PROJECT
        </button>
      </div>

      {error && (
        <div role="alert" className="alert alert-error">
          <Icon name="info" size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Client</th>
              <th>Location</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="admin-table-empty">
                  Loading…
                </td>
              </tr>
            ) : data && data.content.length ? (
              data.content.map((row) => (
                <tr key={row.id} className="admin-table-row" onClick={() => navigate(`/projects/${row.id}`)}>
                  <td>{row.code}</td>
                  <td>
                    {row.name}
                    <br />
                    <span className="admin-table-sub">{row.category || '—'}</span>
                  </td>
                  <td>{row.clientName || '—'}</td>
                  <td>{row.location || '—'}</td>
                  <td>
                    <StatusBadge tone={toneFor(row.status)}>{label(row.status)}</StatusBadge>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="admin-table-empty">
                  No projects yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && <Pagination page={data.number} totalPages={data.totalPages} onChange={setPage} />}

      <Drawer open={creating} onClose={() => setCreating(false)} title="New project">
        <form onSubmit={handleCreate}>
          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="pj-name">
              Project name <span className="req">*</span>
            </label>
            <input id="pj-name" type="text" value={form.name} onChange={update('name')} />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="pj-client">Client's account ID</label>
            <input
              id="pj-client"
              type="number"
              min="1"
              value={form.clientUserId}
              onChange={update('clientUserId')}
              placeholder="Leave blank to link later"
            />
            <span className="field-hint">
              There is no client picker yet — ask the client to sign in and check their account, or
              look the ID up directly. Leave blank and this shows with no client until then.
            </span>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="pj-category">Category</label>
            <input id="pj-category" type="text" value={form.category} onChange={update('category')} />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="pj-location">Location</label>
            <input id="pj-location" type="text" value={form.location} onChange={update('location')} />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="pj-area">Area</label>
            <input id="pj-area" type="text" value={form.area} onChange={update('area')} placeholder="e.g. 1,200 sq ft" />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="pj-description">Description</label>
            <textarea id="pj-description" rows={3} value={form.description} onChange={update('description')} />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="pj-value">Contract value (₹)</label>
            <input id="pj-value" type="number" min="0" step="0.01" value={form.contractValue} onChange={update('contractValue')} />
          </div>

          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="field">
              <label htmlFor="pj-start">Start date</label>
              <input id="pj-start" type="date" value={form.startDate} onChange={update('startDate')} />
            </div>
            <div className="field">
              <label htmlFor="pj-end">Expected end date</label>
              <input id="pj-end" type="date" value={form.expectedEndDate} onChange={update('expectedEndDate')} />
            </div>
          </div>

          {saveError && (
            <div role="alert" className="alert alert-error">
              <Icon name="info" size={18} />
              <span>{saveError}</span>
            </div>
          )}

          <button type="submit" className="btn btn-dark btn-block" disabled={saving}>
            {saving ? 'CREATING…' : 'CREATE PROJECT'}
          </button>
        </form>
      </Drawer>
    </div>
  );
}

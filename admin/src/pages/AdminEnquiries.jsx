import { useCallback, useEffect, useState } from 'react';
import Icon from '../components/ui/Icon';
import StatusBadge from '../components/admin/StatusBadge';
import Pagination from '../components/admin/Pagination';
import Drawer from '../components/admin/Drawer';
import api, { friendlyError } from '../lib/api';

const STATUSES = ['NEW', 'CONTACTED', 'QUOTED', 'WON', 'LOST'];

const label = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const toneFor = (status) => {
  if (status === 'WON') return 'success';
  if (status === 'LOST') return 'danger';
  if (status === 'QUOTED') return 'warning';
  return 'accent';
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/** The quote and contact form's landing page for staff — work the list, update status and notes. */
export default function AdminEnquiries() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ status: '', adminNotes: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api.admin.enquiries
      .list({ status: statusFilter, page })
      .then(setData)
      .catch((err) => setError(friendlyError(err)))
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  const openRow = (enquiry) => {
    setSelected(enquiry);
    setForm({ status: enquiry.status, adminNotes: enquiry.adminNotes || '' });
    setSaveError('');
  };

  const closeDrawer = () => setSelected(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      await api.admin.enquiries.update(selected.id, form);
      closeDrawer();
      load();
    } catch (err) {
      setSaveError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>ENQUIRIES</h1>
          <p>Everyone who filled the quote or contact form.</p>
        </div>
        <select
          className="admin-filter"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
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

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Name</th>
              <th>Interested in</th>
              <th>Source</th>
              <th>Status</th>
              <th>Received</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="admin-table-empty">
                  Loading…
                </td>
              </tr>
            ) : data && data.content.length ? (
              data.content.map((row) => (
                <tr key={row.id} className="admin-table-row" onClick={() => openRow(row)}>
                  <td>{row.reference}</td>
                  <td>
                    {row.name}
                    <br />
                    <span className="admin-table-sub">{row.phone}</span>
                  </td>
                  <td>{row.projectType || row.serviceSlug || '—'}</td>
                  <td>{label(row.source)}</td>
                  <td>
                    <StatusBadge tone={toneFor(row.status)}>{label(row.status)}</StatusBadge>
                  </td>
                  <td>{formatDate(row.createdAt)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="admin-table-empty">
                  No enquiries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && <Pagination page={data.number} totalPages={data.totalPages} onChange={setPage} />}

      <Drawer open={Boolean(selected)} onClose={closeDrawer} title={selected ? `Enquiry ${selected.reference}` : ''}>
        {selected && (
          <>
            <dl className="admin-detail-list">
              <div>
                <dt>Name</dt>
                <dd>{selected.name}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{selected.phone}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{selected.email || '—'}</dd>
              </div>
              <div>
                <dt>Project type</dt>
                <dd>{selected.projectType || '—'}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{selected.location || '—'}</dd>
              </div>
              <div>
                <dt>Budget</dt>
                <dd>{selected.budgetRange || '—'}</dd>
              </div>
              <div>
                <dt>Message</dt>
                <dd>{selected.description || '—'}</dd>
              </div>
            </dl>

            <form onSubmit={handleSave}>
              <div className="field" style={{ marginBottom: 16 }}>
                <label htmlFor="enq-status">Status</label>
                <select
                  id="enq-status"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {label(s)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field" style={{ marginBottom: 16 }}>
                <label htmlFor="enq-notes">Internal notes</label>
                <textarea
                  id="enq-notes"
                  rows={4}
                  value={form.adminNotes}
                  onChange={(e) => setForm((f) => ({ ...f, adminNotes: e.target.value }))}
                  placeholder="Not visible to the customer"
                />
              </div>

              {saveError && (
                <div role="alert" className="alert alert-error">
                  <Icon name="info" size={18} />
                  <span>{saveError}</span>
                </div>
              )}

              <button type="submit" className="btn btn-dark btn-block" disabled={saving}>
                {saving ? 'SAVING…' : 'SAVE CHANGES'}
              </button>
            </form>
          </>
        )}
      </Drawer>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import Icon from '../components/ui/Icon';
import StatusBadge from '../components/admin/StatusBadge';
import Pagination from '../components/admin/Pagination';
import Drawer from '../components/admin/Drawer';
import api, { friendlyError } from '../lib/api';

const STATUSES = [
  'PAYMENT_PENDING',
  'BOOKING_REQUESTED',
  'CONFIRMED',
  'ASSIGNMENT_PENDING',
  'PROFESSIONAL_ASSIGNED',
  'SITE_VISIT_SCHEDULED',
  'SITE_VISIT_COMPLETED',
  'QUOTATION_CREATED',
  'QUOTATION_SENT',
  'CUSTOMER_APPROVED',
  'WORK_SCHEDULED',
  'WORK_IN_PROGRESS',
  'WORK_COMPLETED',
  'CANCELLED',
];
const TYPES = ['SERVICE', 'PROJECT'];

const label = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const toneFor = (status) => {
  if (status === 'CANCELLED') return 'danger';
  if (status === 'WORK_COMPLETED') return 'success';
  if (['PAYMENT_PENDING', 'BOOKING_REQUESTED', 'ASSIGNMENT_PENDING'].includes(status)) return 'warning';
  return 'accent';
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/**
 * Two ways to look at bookings: the filtered list staff work through day to
 * day, and the day sheet — every visit requested for one date, in slot order
 * — for planning who goes where tomorrow.
 */
export default function AdminBookings() {
  const [mode, setMode] = useState('list'); // 'list' | 'day'
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const [date, setDate] = useState(todayIso());

  const [data, setData] = useState(null);
  const [dayRows, setDayRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ status: '', adminNotes: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [professionals, setProfessionals] = useState([]);
  const [assignId, setAssignId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');

  useEffect(() => {
    api.admin.users
      .list({ role: 'PROFESSIONAL', size: 100 })
      .then((result) => setProfessionals(result.content))
      .catch(() => {}); // the assign control just stays empty if this fails
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    if (mode === 'day') {
      api.admin.bookings
        .forDate(date)
        .then(setDayRows)
        .catch((err) => setError(friendlyError(err)))
        .finally(() => setLoading(false));
    } else {
      api.admin.bookings
        .list({ status: statusFilter, type: typeFilter, page })
        .then(setData)
        .catch((err) => setError(friendlyError(err)))
        .finally(() => setLoading(false));
    }
  }, [mode, date, statusFilter, typeFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = mode === 'day' ? dayRows || [] : data ? data.content : [];

  const openRow = (booking) => {
    setSelected(booking);
    setForm({ status: booking.status, adminNotes: booking.adminNotes || '' });
    setSaveError('');
    setAssignId('');
    setAssignError('');
  };

  const closeDrawer = () => setSelected(null);

  const canAssign = selected && ['CONFIRMED', 'ASSIGNMENT_PENDING'].includes(selected.status);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignId) return;
    setAssigning(true);
    setAssignError('');
    try {
      const updated = await api.admin.bookings.assign(selected.id, Number(assignId));
      setSelected(updated);
      setForm((f) => ({ ...f, status: updated.status }));
      setAssignId('');
      load();
    } catch (err) {
      setAssignError(friendlyError(err));
    } finally {
      setAssigning(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      await api.admin.bookings.update(selected.id, form);
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
          <h1>BOOKINGS</h1>
          <p>Site visits and project bookings from the booking wizard.</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-tabs">
          <button
            type="button"
            className={`admin-tab ${mode === 'list' ? 'active' : ''}`}
            onClick={() => setMode('list')}
          >
            All bookings
          </button>
          <button
            type="button"
            className={`admin-tab ${mode === 'day' ? 'active' : ''}`}
            onClick={() => setMode('day')}
          >
            Day sheet
          </button>
        </div>

        {mode === 'day' ? (
          <input
            type="date"
            className="admin-filter"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        ) : (
          <>
            <select
              className="admin-filter"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All types</option>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {label(t)}
                </option>
              ))}
            </select>
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
          </>
        )}
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
              <th>Booking</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Visit</th>
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
            ) : rows.length ? (
              rows.map((row) => (
                <tr key={row.id} className="admin-table-row" onClick={() => openRow(row)}>
                  <td>
                    {row.bookingNumber}
                    <br />
                    <span className="admin-table-sub">{label(row.bookingType)}</span>
                  </td>
                  <td>
                    {row.name}
                    <br />
                    <span className="admin-table-sub">{row.phone}</span>
                  </td>
                  <td>{row.serviceLabel || '—'}</td>
                  <td>
                    {formatDate(row.preferredDate)}
                    <br />
                    <span className="admin-table-sub">{row.preferredSlot || '—'}</span>
                  </td>
                  <td>
                    <StatusBadge tone={toneFor(row.status)}>{label(row.status)}</StatusBadge>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="admin-table-empty">
                  {mode === 'day' ? 'No visits requested for this date.' : 'No bookings yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {mode === 'list' && data && (
        <Pagination page={data.number} totalPages={data.totalPages} onChange={setPage} />
      )}

      <Drawer
        open={Boolean(selected)}
        onClose={closeDrawer}
        title={selected ? `Booking ${selected.bookingNumber}` : ''}
      >
        {selected && (
          <>
            <dl className="admin-detail-list">
              <div>
                <dt>Customer</dt>
                <dd>{selected.name}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{selected.phone}</dd>
              </div>
              <div>
                <dt>WhatsApp</dt>
                <dd>{selected.whatsapp || '—'}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{selected.email || '—'}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{selected.address || selected.location || '—'}</dd>
              </div>
              <div>
                <dt>Property type</dt>
                <dd>{selected.propertyType || '—'}</dd>
              </div>
              <div>
                <dt>Area</dt>
                <dd>{selected.areaSqft ? `${selected.areaSqft} sq ft` : '—'}</dd>
              </div>
              <div>
                <dt>Work</dt>
                <dd>{selected.workDetail || selected.workNature || selected.workOption || '—'}</dd>
              </div>
              <div>
                <dt>Materials</dt>
                <dd>{label(selected.materialSupplier)}</dd>
              </div>
              <div>
                <dt>Budget</dt>
                <dd>{selected.budgetRange || '—'}</dd>
              </div>
              <div>
                <dt>Preferred visit</dt>
                <dd>
                  {formatDate(selected.preferredDate)} — {selected.preferredSlot || '—'}
                </dd>
              </div>
              <div>
                <dt>Assigned professional</dt>
                <dd>
                  {selected.assignedProfessionalName
                    ? `${selected.assignedProfessionalName} — ${selected.assignedProfessionalPhone}`
                    : 'Not yet assigned'}
                </dd>
              </div>
              {selected.attachmentsPending && (
                <div>
                  <dt>Attachments</dt>
                  <dd>Customer said files would follow separately.</dd>
                </div>
              )}
            </dl>

            {canAssign && (
              <form onSubmit={handleAssign} style={{ marginBottom: 20 }}>
                <div className="field" style={{ marginBottom: 10 }}>
                  <label htmlFor="bk-assign">
                    {selected.assignedProfessionalName ? 'Reassign to' : 'Assign a professional'}
                  </label>
                  <select
                    id="bk-assign"
                    value={assignId}
                    onChange={(e) => setAssignId(e.target.value)}
                  >
                    <option value="">Select a professional…</option>
                    {professionals.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} — {p.phone}
                      </option>
                    ))}
                  </select>
                </div>

                {assignError && (
                  <div role="alert" className="alert alert-error" style={{ marginBottom: 10 }}>
                    <Icon name="info" size={18} />
                    <span>{assignError}</span>
                  </div>
                )}

                <button type="submit" className="btn btn-outline btn-block" disabled={assigning || !assignId}>
                  {assigning ? 'ASSIGNING…' : 'ASSIGN'}
                </button>
              </form>
            )}

            <form onSubmit={handleSave}>
              <div className="field" style={{ marginBottom: 16 }}>
                <label htmlFor="bk-status">Status</label>
                <select
                  id="bk-status"
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
                <label htmlFor="bk-notes">Internal notes</label>
                <textarea
                  id="bk-notes"
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

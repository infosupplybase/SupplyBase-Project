'use client';

import { useCallback, useEffect, useState } from 'react';
import Icon from '../../../components/ui/Icon';
import StatusBadge from '../../../components/admin/StatusBadge';
import Pagination from '../../../components/admin/Pagination';
import Drawer from '../../../components/admin/Drawer';
import api, { friendlyError } from '../../../lib/api';

const PAYMENT_TYPES = ['ADVANCE', 'MILESTONE', 'INVOICE'];

const label = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const toneFor = (status) => {
  if (status === 'PAID') return 'success';
  if (status === 'FAILED' || status === 'CANCELLED') return 'danger';
  if (status === 'PENDING') return 'warning';
  return 'accent';
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const emptyForm = {
  userId: '',
  projectId: '',
  stageId: '',
  paymentType: 'ADVANCE',
  description: '',
  amount: '',
  dueDate: '',
};

export default function AdminPayments() {
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
    api.admin.payments
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
    if (!form.userId || !form.description.trim() || !form.amount) {
      setSaveError('Client account ID, description and amount are all required.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        userId: Number(form.userId),
        projectId: form.projectId === '' ? undefined : Number(form.projectId),
        stageId: form.stageId === '' ? undefined : Number(form.stageId),
        paymentType: form.paymentType,
        description: form.description.trim(),
        amount: Number(form.amount),
        dueDate: form.dueDate || undefined,
      };
      await api.admin.payments.create(payload);
      setCreating(false);
      load();
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
          <h1>PAYMENTS</h1>
          <p>Advances, milestones and invoices raised against a client.</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
          <Icon name="plus" size={16} />
          RAISE PAYMENT
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
              <th>Reference</th>
              <th>Type</th>
              <th>Description</th>
              <th>Project</th>
              <th>Amount</th>
              <th>Due</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="admin-table-empty">
                  Loading…
                </td>
              </tr>
            ) : data && data.content.length ? (
              data.content.map((row) => (
                <tr key={row.id}>
                  <td>{row.reference}</td>
                  <td>{label(row.paymentType)}</td>
                  <td>{row.description}</td>
                  <td>{row.projectName || '—'}</td>
                  <td>{row.amountDisplay}</td>
                  <td>{formatDate(row.dueDate)}</td>
                  <td>
                    <StatusBadge tone={toneFor(row.status)}>{label(row.status)}</StatusBadge>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="admin-table-empty">
                  No payments raised yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && <Pagination page={data.number} totalPages={data.totalPages} onChange={setPage} />}

      <Drawer open={creating} onClose={() => setCreating(false)} title="Raise a payment">
        <form onSubmit={handleCreate}>
          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="pay-user">
              Client's account ID <span className="req">*</span>
            </label>
            <input id="pay-user" type="number" min="1" value={form.userId} onChange={update('userId')} />
            <span className="field-hint">
              There is no client picker yet — ask the client for their account, or look the ID up
              directly.
            </span>
          </div>

          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="field">
              <label htmlFor="pay-project">Project ID (optional)</label>
              <input id="pay-project" type="number" min="1" value={form.projectId} onChange={update('projectId')} />
            </div>
            <div className="field">
              <label htmlFor="pay-stage">Stage ID (optional)</label>
              <input id="pay-stage" type="number" min="1" value={form.stageId} onChange={update('stageId')} />
            </div>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="pay-type">
              Type <span className="req">*</span>
            </label>
            <select id="pay-type" value={form.paymentType} onChange={update('paymentType')}>
              {PAYMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {label(t)}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="pay-desc">
              Description <span className="req">*</span>
            </label>
            <input id="pay-desc" type="text" value={form.description} onChange={update('description')} placeholder="e.g. 40% advance — interior work" />
          </div>

          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="field">
              <label htmlFor="pay-amount">
                Amount (₹) <span className="req">*</span>
              </label>
              <input id="pay-amount" type="number" min="1" step="0.01" value={form.amount} onChange={update('amount')} />
            </div>
            <div className="field">
              <label htmlFor="pay-due">Due date (optional)</label>
              <input id="pay-due" type="date" value={form.dueDate} onChange={update('dueDate')} />
            </div>
          </div>

          {saveError && (
            <div role="alert" className="alert alert-error">
              <Icon name="info" size={18} />
              <span>{saveError}</span>
            </div>
          )}

          <button type="submit" className="btn btn-dark btn-block" disabled={saving}>
            {saving ? 'RAISING…' : 'RAISE PAYMENT'}
          </button>
        </form>
      </Drawer>
    </div>
  );
}

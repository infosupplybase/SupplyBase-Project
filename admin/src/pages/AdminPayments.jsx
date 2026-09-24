import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { formatDate, label, timeAgo } from '../lib/format';

const PAYMENT_TYPES = [
  { value: 'ADVANCE', help: 'Paid before work starts' },
  { value: 'MILESTONE', help: 'Paid when a stage is reached' },
  { value: 'INVOICE', help: 'Final or itemised bill' },
];

const toneFor = (status) => {
  if (status === 'PAID') return 'success';
  if (status === 'FAILED' || status === 'CANCELLED' || status === 'REFUNDED') return 'danger';
  if (status === 'PENDING') return 'warning';
  return 'accent';
};

const emptyForm = {
  client: null,
  projectId: '',
  stageId: '',
  paymentType: 'ADVANCE',
  description: '',
  amount: '',
  dueDate: '',
};

/** Money asked of clients — advances, milestones and invoices — and whether each has been paid. */
export default function AdminPayments() {
  const { notify } = useToast();
  const [page, setPage] = usePageParam();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [viewing, setViewing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [projects, setProjects] = useState([]);
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
    api.admin.projects
      .list({ size: 100 })
      .then((p) => setProjects(p.content))
      .catch(() => setProjects([]));
  };

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const stages = useMemo(() => {
    const project = projects.find((p) => String(p.id) === String(form.projectId));
    return project ? [...project.stages].sort((a, b) => a.stageNo - b.stageNo) : [];
  }, [projects, form.projectId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.client) {
      setSaveError('Choose the client this payment is for.');
      return;
    }
    if (!form.description.trim()) {
      setSaveError('Add a description the client will understand, e.g. "40% advance — interior work".');
      return;
    }
    if (!(Number(form.amount) >= 1)) {
      setSaveError('Enter an amount of at least ₹1.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const created = await api.admin.payments.create({
        userId: form.client.id,
        projectId: form.projectId === '' ? undefined : Number(form.projectId),
        stageId: form.stageId === '' ? undefined : Number(form.stageId),
        paymentType: form.paymentType,
        description: form.description.trim(),
        amount: Number(form.amount),
        dueDate: form.dueDate || undefined,
      });
      setCreating(false);
      notify(`${created.amountDisplay} raised for ${form.client.fullName || 'the client'}`);
      load();
    } catch (err) {
      setSaveError(err && err.fieldErrors ? Object.values(err.fieldErrors)[0] : friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        icon="rupee"
        title="Payments"
        subtitle="Money you ask clients for — advances, milestones and invoices. The client pays it from their dashboard."
        actions={
          <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
            <Icon name="plus" size={16} />
            RAISE PAYMENT
          </button>
        }
      />

      <ErrorBanner onRetry={load}>{error}</ErrorBanner>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Payment</th>
              <th>Type</th>
              <th>Project</th>
              <th>Amount</th>
              <th>Due</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableLoading columns={6} />
            ) : data && data.content.length ? (
              data.content.map((row) => (
                <tr key={row.id} {...rowProps(() => setViewing(row), `Open payment ${row.reference}`)}>
                  <td>
                    <span className="admin-cell-main">{row.description}</span>
                    <span className="admin-table-sub admin-mono">{row.reference}</span>
                  </td>
                  <td>{label(row.paymentType)}</td>
                  <td>{row.projectName || '—'}</td>
                  <td>
                    <strong>{row.amountDisplay}</strong>
                  </td>
                  <td>{formatDate(row.dueDate)}</td>
                  <td>
                    <StatusBadge tone={toneFor(row.status)}>{label(row.status)}</StatusBadge>
                  </td>
                </tr>
              ))
            ) : (
              <TableEmpty columns={6} icon="rupee" title="No payments raised yet">
                Raise an advance, milestone or invoice and the client can pay it from their dashboard.
              </TableEmpty>
            )}
          </tbody>
        </table>
      </div>

      <Pagination data={data} onChange={setPage} />

      <Drawer open={Boolean(viewing)} onClose={() => setViewing(null)} title={viewing ? viewing.reference : ''}>
        {viewing && (
          <>
            <div className="admin-modal-top">
              <StatusBadge tone={toneFor(viewing.status)}>{label(viewing.status)}</StatusBadge>
              <span className="admin-table-sub" style={{ marginTop: 0 }}>
                Raised {timeAgo(viewing.createdAt)}
              </span>
            </div>
            <dl className="admin-detail-list">
              <div>
                <dt>Description</dt>
                <dd>{viewing.description}</dd>
              </div>
              <div>
                <dt>Amount</dt>
                <dd>
                  <strong>{viewing.amountDisplay}</strong> {viewing.currency && viewing.currency !== 'INR' ? viewing.currency : ''}
                </dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{label(viewing.paymentType)}</dd>
              </div>
              <div>
                <dt>Project</dt>
                <dd>{viewing.projectName || '—'}</dd>
              </div>
              <div>
                <dt>Due</dt>
                <dd>{formatDate(viewing.dueDate)}</dd>
              </div>
              <div>
                <dt>Paid</dt>
                <dd>{viewing.paidAt ? formatDate(viewing.paidAt) : 'Not yet'}</dd>
              </div>
              {viewing.razorpayOrderId && (
                <div>
                  <dt>Razorpay order</dt>
                  <dd className="admin-mono">{viewing.razorpayOrderId}</dd>
                </div>
              )}
            </dl>
          </>
        )}
      </Drawer>

      <Drawer open={creating} onClose={() => setCreating(false)} title="Raise a payment">
        <form onSubmit={handleCreate} noValidate>
          <div style={{ marginBottom: 16 }}>
            <ClientPicker
              required
              value={form.client}
              onChange={(client) => setForm((f) => ({ ...f, client }))}
              hint="The client pays this from their dashboard on the website."
            />
          </div>

          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="field">
              <label htmlFor="pay-project">Project (optional)</label>
              <select
                id="pay-project"
                value={form.projectId}
                onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value, stageId: '' }))}
              >
                <option value="">Not for a project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.name}
                    {p.clientName ? ` (${p.clientName})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="pay-stage">Stage (optional)</label>
              <select id="pay-stage" value={form.stageId} onChange={update('stageId')} disabled={!stages.length}>
                <option value="">{form.projectId && !stages.length ? 'This project has no stages' : 'Any stage'}</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.stageNo}. {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="pay-type">
              Type <span className="req">*</span>
            </label>
            <select id="pay-type" value={form.paymentType} onChange={update('paymentType')}>
              {PAYMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {label(t.value)} — {t.help}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="pay-desc">
              Description <span className="req">*</span>
            </label>
            <input
              id="pay-desc"
              type="text"
              maxLength={255}
              value={form.description}
              onChange={update('description')}
              placeholder="e.g. 40% advance — interior work"
            />
            <span className="field-hint">The client sees this exactly as written.</span>
          </div>

          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="field">
              <label htmlFor="pay-amount">
                Amount (₹) <span className="req">*</span>
              </label>
              <input id="pay-amount" type="number" inputMode="decimal" min="1" step="0.01" value={form.amount} onChange={update('amount')} />
            </div>
            <div className="field">
              <label htmlFor="pay-due">Due date (optional)</label>
              <input id="pay-due" type="date" value={form.dueDate} onChange={update('dueDate')} />
            </div>
          </div>

          {saveError && (
            <div role="alert" className="alert alert-error">
              <Icon name="alert" size={18} />
              <span>{saveError}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
            {saving ? 'RAISING…' : 'RAISE PAYMENT'}
          </button>
        </form>
      </Drawer>
    </div>
  );
}

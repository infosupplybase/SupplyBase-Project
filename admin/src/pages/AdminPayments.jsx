import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import PageHeader from '../components/admin/PageHeader';
import DataTable from '../components/admin/DataTable';
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

/** A booking fee that was paid although the booking was then cancelled: staff may owe a refund. */
const paidOnCancelledBooking = (p) => p.status === 'PAID' && p.bookingStatus === 'CANCELLED';

const emptyRefund = { amount: '', reason: '' };

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
  const [refund, setRefund] = useState(emptyRefund);
  const [refunding, setRefunding] = useState(false);
  const [refundError, setRefundError] = useState('');

  const openPayment = (row) => {
    setRefund(emptyRefund);
    setRefundError('');
    setViewing(row);
  };

  const handleRefund = async (e) => {
    e.preventDefault();
    if (!refund.reason.trim()) {
      setRefundError('Say why it is being refunded. It is kept with the refund.');
      return;
    }
    let amountPaise;
    if (refund.amount !== '') {
      const rupees = Number(refund.amount);
      if (!(rupees > 0) || rupees > Number(viewing.amount)) {
        setRefundError(`Enter an amount between ₹1 and ${viewing.amountDisplay}, or leave it empty to refund it all.`);
        return;
      }
      amountPaise = Math.round(rupees * 100);
    }
    const what = amountPaise ? `₹${(amountPaise / 100).toLocaleString('en-IN')}` : `the full ${viewing.amountDisplay}`;
    if (!window.confirm(`Refund ${what} to ${viewing.clientName || 'the client'} through Razorpay? This cannot be undone.`)) return;

    setRefunding(true);
    setRefundError('');
    try {
      await api.admin.payments.refund(viewing.id, { amountPaise, reason: refund.reason.trim() });
      notify(`Refund of ${what} requested. The payment shows Refunded once Razorpay confirms a full refund.`);
      setViewing(null);
      load();
    } catch (err) {
      setRefundError(err && err.fieldErrors ? Object.values(err.fieldErrors)[0] : friendlyError(err));
    } finally {
      setRefunding(false);
    }
  };

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

      <DataTable label="Payments">
          <thead>
            <tr>
              <th>Payment</th>
              <th>Client</th>
              <th>Type</th>
              <th>Booking / project</th>
              <th>Amount</th>
              <th>Due</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableLoading columns={7} />
            ) : data && data.content.length ? (
              data.content.map((row) => (
                <tr key={row.id} {...rowProps(() => openPayment(row), `Open payment ${row.reference}`)}>
                  <td>
                    <span className="admin-cell-main">{row.description}</span>
                    <span className="admin-table-sub admin-mono">{row.reference}</span>
                  </td>
                  <td>
                    <span className="admin-cell-main">{row.clientName || '—'}</span>
                    {row.clientPhone && <span className="admin-table-sub">{row.clientPhone}</span>}
                  </td>
                  <td>{label(row.paymentType)}</td>
                  <td>
                    {row.bookingNumber ? (
                      <>
                        <span className="admin-cell-main admin-mono">{row.bookingNumber}</span>
                        <span className="admin-table-sub">
                          {paidOnCancelledBooking(row) ? 'Booking cancelled · refund?' : label(row.bookingStatus)}
                        </span>
                      </>
                    ) : (
                      row.projectName || '—'
                    )}
                  </td>
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
              <TableEmpty columns={7} icon="rupee" title="No payments raised yet">
                Raise an advance, milestone or invoice and the client can pay it from their dashboard.
              </TableEmpty>
            )}
          </tbody>
      </DataTable>

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
                <dt>Client</dt>
                <dd>
                  {viewing.clientName || '—'}
                  {viewing.clientPhone ? ` · ${viewing.clientPhone}` : ''}
                </dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{label(viewing.paymentType)}</dd>
              </div>
              {viewing.bookingNumber ? (
                <div>
                  <dt>Booking</dt>
                  <dd>
                    <Link to={`/bookings?open=${viewing.bookingId}`} className="admin-mono">
                      {viewing.bookingNumber}
                    </Link>{' '}
                    ({label(viewing.bookingStatus)})
                  </dd>
                </div>
              ) : (
                <div>
                  <dt>Project</dt>
                  <dd>{viewing.projectName || '—'}</dd>
                </div>
              )}
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

            {paidOnCancelledBooking(viewing) && (
              <div role="status" className="alert alert-warning" style={{ marginTop: 16 }}>
                <Icon name="alert" size={18} />
                <span>This fee was paid but the booking is cancelled. Refund it unless the customer is rebooking.</span>
              </div>
            )}

            {viewing.refundable && (
              <form onSubmit={handleRefund} noValidate style={{ marginTop: 20 }}>
                <h3 className="admin-form-section-title">Refund</h3>
                <div className="field" style={{ marginBottom: 12 }}>
                  <label htmlFor="refund-amount">Amount (₹, optional)</label>
                  <input
                    id="refund-amount"
                    type="number"
                    inputMode="decimal"
                    min="1"
                    step="0.01"
                    max={viewing.amount}
                    value={refund.amount}
                    onChange={(e) => setRefund((r) => ({ ...r, amount: e.target.value }))}
                    placeholder={`Leave empty for the full ${viewing.amountDisplay}`}
                  />
                </div>
                <div className="field" style={{ marginBottom: 12 }}>
                  <label htmlFor="refund-reason">
                    Reason <span className="req">*</span>
                  </label>
                  <input
                    id="refund-reason"
                    type="text"
                    maxLength={300}
                    value={refund.reason}
                    onChange={(e) => setRefund((r) => ({ ...r, reason: e.target.value }))}
                    placeholder="e.g. Booking cancelled by the customer"
                  />
                </div>
                {refundError && (
                  <div role="alert" className="alert alert-error">
                    <Icon name="alert" size={18} />
                    <span>{refundError}</span>
                  </div>
                )}
                <button type="submit" className="btn btn-outline btn-block" disabled={refunding}>
                  {refunding ? 'REQUESTING REFUND…' : 'REFUND THROUGH RAZORPAY'}
                </button>
                <span className="field-hint">
                  Razorpay sends the money back to the card or UPI it came from. The status changes to Refunded once Razorpay
                  confirms a full refund.
                </span>
              </form>
            )}
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

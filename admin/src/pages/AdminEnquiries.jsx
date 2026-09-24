import { useCallback, useEffect, useState } from 'react';
import Icon from '../components/ui/Icon';
import PageHeader from '../components/admin/PageHeader';
import StatusBadge from '../components/admin/StatusBadge';
import Pagination from '../components/admin/Pagination';
import Drawer from '../components/admin/Drawer';
import { ErrorBanner, TableEmpty, TableLoading } from '../components/admin/TableStates';
import rowProps from '../components/admin/rowProps';
import { useToast } from '../components/admin/Toast';
import { useAttention } from '../context/AttentionContext';
import useQueryParam, { usePageParam } from '../hooks/useQueryParam';
import api, { friendlyError } from '../lib/api';
import { formatDate, label, telHref, timeAgo, whatsappHref } from '../lib/format';

/** The enquiry pipeline, in order, with what each step means. */
const STATUSES = [
  { value: 'NEW', help: 'Not contacted yet' },
  { value: 'CONTACTED', help: 'Spoken to, working on it' },
  { value: 'QUOTED', help: 'Quotation sent' },
  { value: 'WON', help: 'Became a job' },
  { value: 'LOST', help: 'Did not go ahead' },
];

const toneFor = (status) => {
  if (status === 'NEW') return 'warning';
  if (status === 'WON') return 'success';
  if (status === 'LOST') return 'danger';
  return 'accent';
};

/** The quote and contact form's landing page for staff — work the list, update status and notes. */
export default function AdminEnquiries() {
  const { notify } = useToast();
  const { refresh: refreshCounts } = useAttention();

  const [statusFilter, setStatusFilter] = useQueryParam('status');
  const [openId, setOpenId] = useQueryParam('open');
  const [page, setPage] = usePageParam();

  const [data, setData] = useState(null);
  const [tabCounts, setTabCounts] = useState(null);
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

    // How many are in each step of the pipeline, for the tabs.
    Promise.all([
      api.admin.enquiries.list({ size: 1 }),
      ...STATUSES.map((s) => api.admin.enquiries.list({ status: s.value, size: 1 })),
    ])
      .then(([all, ...byStatus]) => {
        const next = { '': all.totalElements };
        STATUSES.forEach((s, i) => {
          next[s.value] = byStatus[i].totalElements;
        });
        setTabCounts(next);
      })
      .catch(() => {});
  }, [statusFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!openId) {
      setSelected(null);
      return undefined;
    }
    let cancelled = false;
    setSaveError('');
    api.admin.enquiries
      .get(openId)
      .then((enquiry) => {
        if (cancelled) return;
        setSelected(enquiry);
        setForm({ status: enquiry.status, adminNotes: enquiry.adminNotes || '' });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(friendlyError(err));
        setOpenId('');
      });
    return () => {
      cancelled = true;
    };
  }, [openId, setOpenId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      await api.admin.enquiries.update(selected.id, form);
      notify(`Enquiry ${selected.reference} marked ${label(form.status).toLowerCase()}`);
      setOpenId('');
      refreshCounts();
      load();
    } catch (err) {
      setSaveError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const tabs = [{ value: '', text: 'All' }, ...STATUSES.map((s) => ({ value: s.value, text: label(s.value) }))];

  return (
    <div>
      <PageHeader
        icon="chat"
        title="Enquiries"
        subtitle="Everyone who filled the quote or contact form on the website. Call them, then move each one along the pipeline."
      />

      <div className="admin-tabs" role="tablist" aria-label="Enquiry status">
        {tabs.map((t) => (
          <button
            key={t.value || 'all'}
            type="button"
            role="tab"
            aria-selected={statusFilter === t.value}
            className={`admin-tab ${statusFilter === t.value ? 'active' : ''}`}
            onClick={() => setStatusFilter(t.value)}
          >
            {t.text}
            {tabCounts && <span className="admin-tab-count">{tabCounts[t.value] ?? 0}</span>}
          </button>
        ))}
      </div>

      <ErrorBanner onRetry={load}>{error}</ErrorBanner>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Person</th>
              <th>Interested in</th>
              <th>Location</th>
              <th>Source</th>
              <th>Status</th>
              <th>Received</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableLoading columns={6} />
            ) : data && data.content.length ? (
              data.content.map((row) => (
                <tr key={row.id} {...rowProps(() => setOpenId(String(row.id)), `Open enquiry from ${row.name}`)}>
                  <td>
                    <span className="admin-cell-main">{row.name}</span>
                    <span className="admin-table-sub">{row.phone}</span>
                  </td>
                  <td>
                    {row.projectType || row.serviceSlug || '—'}
                    <span className="admin-table-sub admin-mono">{row.reference}</span>
                  </td>
                  <td>{row.location || '—'}</td>
                  <td>{label(row.source)}</td>
                  <td>
                    <StatusBadge tone={toneFor(row.status)}>{label(row.status)}</StatusBadge>
                  </td>
                  <td>
                    {timeAgo(row.createdAt)}
                    <span className="admin-table-sub">{formatDate(row.createdAt)}</span>
                  </td>
                </tr>
              ))
            ) : (
              <TableEmpty
                columns={6}
                icon="chat"
                title={statusFilter ? `No "${label(statusFilter)}" enquiries` : 'No enquiries yet'}
              >
                {statusFilter
                  ? 'Nothing at this step of the pipeline right now.'
                  : 'Quote and contact form submissions from the website land here.'}
              </TableEmpty>
            )}
          </tbody>
        </table>
      </div>

      <Pagination data={data} onChange={setPage} />

      <Drawer open={Boolean(openId)} onClose={() => setOpenId('')} title={selected ? selected.name : 'Enquiry'}>
        {!selected ? (
          <p className="admin-picker-status">Loading…</p>
        ) : (
          <>
            <div className="admin-modal-top">
              <StatusBadge tone={toneFor(selected.status)}>{label(selected.status)}</StatusBadge>
              <span className="admin-table-sub" style={{ marginTop: 0 }}>
                {selected.reference} · {timeAgo(selected.createdAt)} via {label(selected.source).toLowerCase()}
              </span>
            </div>

            <dl className="admin-detail-list" style={{ marginBottom: 12 }}>
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
                <dt>Service</dt>
                <dd>{selected.serviceSlug || '—'}</dd>
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
                <dd style={{ whiteSpace: 'pre-wrap' }}>{selected.description || '—'}</dd>
              </div>
            </dl>

            <div className="admin-contact-actions" style={{ marginBottom: 24 }}>
              {telHref(selected.phone) && (
                <a href={telHref(selected.phone)}>
                  <Icon name="phone" size={15} /> Call
                </a>
              )}
              {whatsappHref(selected.phone) && (
                <a
                  href={whatsappHref(selected.phone, `Hello ${selected.name}, this is Supplybase about your enquiry.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="whatsapp" size={15} /> WhatsApp
                </a>
              )}
              {selected.email && (
                <a href={`mailto:${selected.email}`}>
                  <Icon name="mail" size={15} /> Email
                </a>
              )}
            </div>

            <form onSubmit={handleSave}>
              <div className="field" style={{ marginBottom: 16 }}>
                <label htmlFor="enq-status">Where is it now?</label>
                <select
                  id="enq-status"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {label(s.value)} — {s.help}
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
                  placeholder="What was said, what happens next. Only staff see this."
                />
              </div>

              {saveError && (
                <div role="alert" className="alert alert-error">
                  <Icon name="alert" size={18} />
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

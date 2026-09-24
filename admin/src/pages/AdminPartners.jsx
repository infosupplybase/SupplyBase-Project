import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { bookingTone, formatDate, formatDay, label, telHref, whatsappHref } from '../lib/format';
import { formatRupees } from '../lib/money';

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];
const TAB_TEXT = { '': 'All', PENDING: 'To review', APPROVED: 'Approved', REJECTED: 'Rejected', SUSPENDED: 'Suspended' };

const toneForPartner = (status) => {
  if (status === 'APPROVED') return 'success';
  if (status === 'PENDING') return 'warning';
  return 'danger';
};

/**
 * The moves an admin can make from each status. Mirrors
 * PartnerService.ALLOWED_MOVES on the server, which is what actually
 * enforces it — these buttons only offer what the API will accept.
 *   needsNote: the server requires a reason for it, and shows it to the partner.
 */
const ACTIONS = {
  PENDING: [
    { to: 'APPROVED', text: 'APPROVE PARTNER', style: 'btn-primary', icon: 'check-circle', done: 'approved' },
    { to: 'REJECTED', text: 'REJECT', style: 'btn-danger', needsNote: true, icon: 'close', done: 'rejected' },
  ],
  APPROVED: [{ to: 'SUSPENDED', text: 'SUSPEND PARTNER', style: 'btn-danger', needsNote: true, icon: 'lock', done: 'suspended' }],
  SUSPENDED: [{ to: 'APPROVED', text: 'REINSTATE PARTNER', style: 'btn-primary', icon: 'check-circle', done: 'reinstated' }],
  REJECTED: [{ to: 'APPROVED', text: 'APPROVE INSTEAD', style: 'btn-primary', icon: 'check-circle', done: 'approved' }],
};

/**
 * Partners — the professionals ("labour") who work SupplyBase's jobs.
 * Approving is what makes an account a PROFESSIONAL (so they can be assigned
 * bookings and see their jobs); rejecting or suspending takes that away.
 */
export default function AdminPartners() {
  const { notify } = useToast();
  const { refresh: refreshCounts } = useAttention();

  const [status, setStatus] = useQueryParam('status');
  const [q, setQ] = useQueryParam('q');
  const [openId, setOpenId] = useQueryParam('open');
  const [page, setPage] = usePageParam();
  const [qInput, setQInput] = useState(q);

  const [data, setData] = useState(null);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState('');
  const [actionError, setActionError] = useState('');

  // Debounce the free-text box before it becomes the ?q= filter.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (qInput.trim() !== q) setQ(qInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [qInput, q, setQ]);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([api.admin.partners.list({ status, q, page }), api.admin.partners.counts()])
      .then(([list, c]) => {
        setData(list);
        setCounts(c);
      })
      .catch((err) => setError(friendlyError(err)))
      .finally(() => setLoading(false));
  }, [status, q, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!openId) {
      setSelected(null);
      return undefined;
    }
    let cancelled = false;
    setNote('');
    setActionError('');
    setSelected(null);
    api.admin.partners
      .get(openId)
      .then((p) => !cancelled && setSelected(p))
      .catch((err) => {
        if (cancelled) return;
        setError(friendlyError(err));
        setOpenId('');
      });
    return () => {
      cancelled = true;
    };
  }, [openId, setOpenId]);

  const handleAction = async (action) => {
    if (action.needsNote && !note.trim()) {
      setActionError('Please give a reason — the partner will see it.');
      return;
    }
    setSaving(action.to);
    setActionError('');
    try {
      const updated = await api.admin.partners.review(selected.userId, action.to, note.trim() || null);
      setSelected(updated);
      setNote('');
      notify(`${updated.fullName} ${action.done}`);
      refreshCounts();
      load();
    } catch (err) {
      setActionError(friendlyError(err));
    } finally {
      setSaving('');
    }
  };

  const total = counts ? STATUSES.reduce((sum, s) => sum + (counts[s] || 0), 0) : null;
  const tabs = ['', ...STATUSES];

  return (
    <div>
      <PageHeader
        icon="helmet"
        title="Partners"
        subtitle="Professionals who applied to work with Supplybase. Approve them to start assigning jobs, and see what each one has earned."
      />

      <div className="admin-toolbar">
        <div className="admin-tabs" role="tablist" aria-label="Partner status">
          {tabs.map((s) => (
            <button
              key={s || 'all'}
              type="button"
              role="tab"
              aria-selected={status === s}
              className={`admin-tab ${status === s ? 'active' : ''}`}
              onClick={() => setStatus(s)}
            >
              {TAB_TEXT[s]}
              {counts && <span className="admin-tab-count">{s ? counts[s] || 0 : total}</span>}
            </button>
          ))}
        </div>
        <span className="admin-toolbar-spacer" />
        <div className="admin-search-input">
          <Icon name="search" size={17} />
          <input
            type="search"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Search name, email or phone"
            aria-label="Search partners"
          />
        </div>
      </div>

      <ErrorBanner onRetry={load}>{error}</ErrorBanner>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Partner</th>
              <th>Trade</th>
              <th>Jobs</th>
              <th>Status</th>
              <th>Applied</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableLoading columns={5} />
            ) : data && data.content.length ? (
              data.content.map((row) => (
                <tr key={row.userId} {...rowProps(() => setOpenId(String(row.userId)), `Open partner ${row.fullName}`)}>
                  <td>
                    <span className="admin-cell-main">{row.fullName || '—'}</span>
                    <span className="admin-table-sub">{[row.phone, row.email].filter(Boolean).join(' · ')}</span>
                  </td>
                  <td>
                    {row.tradeLabel || '—'}
                    <span className="admin-table-sub">
                      {[row.city, row.experienceYears != null ? `${row.experienceYears} yrs` : null]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </span>
                  </td>
                  <td>
                    <strong>{row.activeJobs}</strong> active
                    <span className="admin-table-sub">{row.completedJobs} completed</span>
                  </td>
                  <td>
                    <StatusBadge tone={toneForPartner(row.status)}>{label(row.status)}</StatusBadge>
                  </td>
                  <td>{formatDate(row.appliedAt)}</td>
                </tr>
              ))
            ) : (
              <TableEmpty columns={5} icon="helmet" title={status || q ? 'No partners match' : 'No partner applications yet'}>
                {status || q
                  ? 'Try another tab, or clear the search.'
                  : 'Professionals apply on the partner portal; their applications appear here for review.'}
              </TableEmpty>
            )}
          </tbody>
        </table>
      </div>

      <Pagination data={data} onChange={setPage} />

      <Drawer open={Boolean(openId)} onClose={() => setOpenId('')} title={selected ? selected.fullName : 'Partner'}>
        {!selected ? (
          <p className="admin-picker-status">Loading partner…</p>
        ) : (
          <>
            <div className="admin-modal-top">
              <StatusBadge tone={toneForPartner(selected.status)}>{label(selected.status)}</StatusBadge>
              <span className="admin-table-sub" style={{ marginTop: 0 }}>
                {selected.tradeLabel || 'No trade'} · applied {formatDate(selected.appliedAt)}
              </span>
            </div>

            <dl className="admin-detail-list" style={{ marginBottom: 12 }}>
              <div>
                <dt>Phone</dt>
                <dd>{selected.phone || '—'}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>
                  {selected.email || '—'}
                  {selected.emailVerified === false && <span className="admin-table-sub">Not verified yet</span>}
                </dd>
              </div>
              <div>
                <dt>Experience</dt>
                <dd>{selected.experienceYears != null ? `${selected.experienceYears} years` : '—'}</dd>
              </div>
              <div>
                <dt>City</dt>
                <dd>{selected.city || '—'}</dd>
              </div>
              {selected.serviceAreas && (
                <div>
                  <dt>Areas</dt>
                  <dd>{selected.serviceAreas}</dd>
                </div>
              )}
              {selected.languages && (
                <div>
                  <dt>Languages</dt>
                  <dd>{selected.languages}</dd>
                </div>
              )}
              {selected.reviewNote && (
                <div>
                  <dt>Note to partner</dt>
                  <dd>{selected.reviewNote}</dd>
                </div>
              )}
            </dl>

            <div className="admin-contact-actions" style={{ marginBottom: 24 }}>
              {telHref(selected.phone) && (
                <a href={telHref(selected.phone)}>
                  <Icon name="phone" size={15} /> Call
                </a>
              )}
              {whatsappHref(selected.phone) && (
                <a href={whatsappHref(selected.phone, `Hello ${selected.fullName}, this is Supplybase.`)} target="_blank" rel="noopener noreferrer">
                  <Icon name="whatsapp" size={15} /> WhatsApp
                </a>
              )}
            </div>

            {selected.earnings && (
              <section className="admin-form-section">
                <h3 className="admin-form-section-title">
                  <Icon name="rupee" size={16} />
                  Earnings
                </h3>
                <div className="admin-kpi-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                  {[
                    ['Earned', selected.earnings.earnedPaise],
                    ['Paid out', selected.earnings.paidPaise],
                    ['Still to pay', selected.earnings.pendingPaise],
                    ['This month', selected.earnings.thisMonthPaise],
                  ].map(([text, value]) => (
                    <div key={text} className="admin-kpi" style={{ padding: 14 }}>
                      <span className="admin-kpi-label">{text}</span>
                      <span className="admin-kpi-value" style={{ fontSize: 22 }}>
                        {formatRupees(value)}
                      </span>
                    </div>
                  ))}
                </div>
                {selected.earnings.awaitingPayoutJobs > 0 && (
                  <p className="admin-form-hint" style={{ margin: '12px 0 0' }}>
                    {selected.earnings.awaitingPayoutJobs} completed job
                    {selected.earnings.awaitingPayoutJobs === 1 ? ' has' : 's have'} no payout set yet — open the job
                    below and enter the amount.
                  </p>
                )}
              </section>
            )}

            <section className="admin-form-section">
              <h3 className="admin-form-section-title">
                <Icon name="calendar" size={16} />
                Jobs ({(selected.jobs || []).length})
              </h3>
              {!selected.jobs || selected.jobs.length === 0 ? (
                <p className="admin-form-hint" style={{ margin: 0 }}>
                  No jobs assigned yet. Assign one from a confirmed booking.
                </p>
              ) : (
                <ul className="admin-answers">
                  {selected.jobs.map((job) => (
                    <li key={job.bookingId}>
                      <Link to={`/bookings?open=${job.bookingId}`} className="admin-list-item" style={{ padding: '12px 14px' }}>
                        <span className="admin-list-main">
                          <strong>
                            {job.bookingNumber} · {job.serviceLabel || 'Service'}
                          </strong>
                          <span>
                            {[job.customerName, job.location, job.preferredDate && formatDay(job.preferredDate)]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                          <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                            <StatusBadge tone={bookingTone(job.status)}>{label(job.status)}</StatusBadge>
                            {job.payoutPaise != null && (
                              <StatusBadge tone={job.paidAt ? 'success' : 'warning'}>
                                {formatRupees(job.payoutPaise)} · {job.paidAt ? 'Paid' : 'Not paid'}
                              </StatusBadge>
                            )}
                          </span>
                        </span>
                        <Icon name="chevron-right" size={16} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {ACTIONS[selected.status] && (
              <section className="admin-form-section">
                <h3 className="admin-form-section-title">
                  <Icon name="shield" size={16} />
                  Decision
                </h3>

                {selected.status === 'APPROVED' && selected.activeJobs > 0 && (
                  <div role="alert" className="alert alert-warning">
                    <Icon name="alert" size={18} />
                    <span>
                      This partner still has {selected.activeJobs} open job{selected.activeJobs === 1 ? '' : 's'}.
                      Suspending stops new assignments but does not reassign the jobs they have.
                    </span>
                  </div>
                )}

                <div className="field" style={{ marginBottom: 12 }}>
                  <label htmlFor="partner-note">
                    Note to the partner{' '}
                    {ACTIONS[selected.status].some((a) => a.needsNote) ? '(needed to reject or suspend)' : '(optional)'}
                  </label>
                  <textarea
                    id="partner-note"
                    rows={3}
                    maxLength={500}
                    value={note}
                    onChange={(e) => {
                      setNote(e.target.value);
                      setActionError('');
                    }}
                    placeholder="The partner sees this on their dashboard."
                  />
                </div>

                {actionError && (
                  <div role="alert" className="alert alert-error">
                    <Icon name="alert" size={18} />
                    <span>{actionError}</span>
                  </div>
                )}

                <div className="btn-row">
                  {ACTIONS[selected.status].map((action) => (
                    <button
                      key={action.to}
                      type="button"
                      className={`btn ${action.style}`}
                      style={{ flex: 1 }}
                      onClick={() => handleAction(action)}
                      disabled={Boolean(saving)}
                    >
                      <Icon name={action.icon} size={16} />
                      {saving === action.to ? 'SAVING…' : action.text}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}

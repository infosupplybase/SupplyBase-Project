import { useCallback, useEffect, useState } from 'react';
import Icon from '../components/ui/Icon';
import StatusBadge from '../components/admin/StatusBadge';
import Pagination from '../components/admin/Pagination';
import Drawer from '../components/admin/Drawer';
import api, { friendlyError } from '../lib/api';
import { formatRupees } from '../lib/money';

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];

const label = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const toneForPartner = (status) => {
  if (status === 'APPROVED') return 'success';
  if (status === 'PENDING') return 'warning';
  return 'danger';
};

const toneForJob = (status) => {
  if (status === 'WORK_COMPLETED') return 'success';
  if (status === 'CANCELLED') return 'danger';
  return 'accent';
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

/**
 * The moves an admin can make from each status. Mirrors
 * PartnerService.ALLOWED_MOVES on the server, which is what actually
 * enforces it — these buttons only offer what the API will accept.
 *   needsNote: the server requires a reason for it, and shows it to the partner.
 */
const ACTIONS = {
  PENDING: [
    { to: 'APPROVED', text: 'APPROVE PARTNER', style: 'btn-dark' },
    { to: 'REJECTED', text: 'REJECT APPLICATION', style: 'btn-outline', needsNote: true },
  ],
  APPROVED: [{ to: 'SUSPENDED', text: 'SUSPEND PARTNER', style: 'btn-outline', needsNote: true }],
  SUSPENDED: [{ to: 'APPROVED', text: 'REINSTATE PARTNER', style: 'btn-dark' }],
  REJECTED: [{ to: 'APPROVED', text: 'APPROVE INSTEAD', style: 'btn-dark' }],
};

/**
 * Partners — the professionals ("labour") who work SupplyBase's jobs.
 *
 * The list is filterable by application status and searchable; each row opens
 * a drawer with everything they submitted, the jobs they have been given, and
 * the decision controls. Approving is what makes an account a PROFESSIONAL
 * (so they can be assigned bookings and see their jobs); rejecting or
 * suspending takes that away again.
 */
export default function AdminPartners() {
  const [status, setStatus] = useState('');
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);

  const [data, setData] = useState(null);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState('');
  const [actionError, setActionError] = useState('');

  // Debounce the free-text box before it becomes a `q` query param.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(qInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [qInput]);

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

  const openRow = async (row) => {
    setSelected(row);
    setNote('');
    setActionError('');
    setDrawerLoading(true);
    try {
      setSelected(await api.admin.partners.get(row.userId));
    } catch (err) {
      setActionError(friendlyError(err));
    } finally {
      setDrawerLoading(false);
    }
  };

  const closeDrawer = () => setSelected(null);

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
      load();
    } catch (err) {
      setActionError(friendlyError(err));
    } finally {
      setSaving('');
    }
  };

  const total = counts ? STATUSES.reduce((sum, s) => sum + (counts[s] || 0), 0) : null;
  const tabLabel = (text, n) => (n == null ? text : `${text} (${n})`);

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>PARTNERS</h1>
          <p>Professionals who have applied to work with SupplyBase, and the jobs they&rsquo;ve been given.</p>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tab ${status === '' ? 'active' : ''}`}
          onClick={() => {
            setStatus('');
            setPage(0);
          }}
        >
          {tabLabel('All', total)}
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={`admin-tab ${status === s ? 'active' : ''}`}
            onClick={() => {
              setStatus(s);
              setPage(0);
            }}
          >
            {tabLabel(label(s), counts ? counts[s] || 0 : null)}
          </button>
        ))}
      </div>

      <div className="admin-toolbar">
        <input
          type="text"
          className="admin-filter"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder="Search name, email or phone…"
          style={{ minWidth: 260 }}
        />
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
              <th>Partner</th>
              <th>Trade</th>
              <th>Jobs</th>
              <th>Status</th>
              <th>Applied</th>
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
                <tr key={row.userId} className="admin-table-row" onClick={() => openRow(row)}>
                  <td>
                    {row.fullName || '—'}
                    <br />
                    <span className="admin-table-sub">
                      {row.phone || '—'} · {row.email}
                    </span>
                  </td>
                  <td>
                    {row.tradeLabel || '—'}
                    <br />
                    <span className="admin-table-sub">
                      {[row.city, row.experienceYears != null ? `${row.experienceYears} yrs` : null]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </span>
                  </td>
                  <td>
                    {row.activeJobs} active
                    <br />
                    <span className="admin-table-sub">{row.completedJobs} completed</span>
                  </td>
                  <td>
                    <StatusBadge tone={toneForPartner(row.status)}>{label(row.status)}</StatusBadge>
                  </td>
                  <td>{formatDate(row.appliedAt)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="admin-table-empty">
                  {status || q ? 'No partners match.' : 'No partner applications yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && <Pagination page={data.number} totalPages={data.totalPages} onChange={setPage} />}

      <Drawer open={Boolean(selected)} onClose={closeDrawer} title={selected ? selected.fullName : ''}>
        {selected && (
          <>
            <div style={{ marginBottom: 16 }}>
              <StatusBadge tone={toneForPartner(selected.status)}>{label(selected.status)}</StatusBadge>
            </div>

            <dl className="admin-detail-list">
              <div>
                <dt>Phone</dt>
                <dd>{selected.phone || '—'}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{selected.email || '—'}</dd>
              </div>
              <div>
                <dt>Trade</dt>
                <dd>{selected.tradeLabel || '—'}</dd>
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
              <div>
                <dt>Applied</dt>
                <dd>{formatDate(selected.appliedAt)}</dd>
              </div>
              {selected.reviewedAt && (
                <div>
                  <dt>Last reviewed</dt>
                  <dd>{formatDate(selected.reviewedAt)}</dd>
                </div>
              )}
              {selected.reviewNote && (
                <div>
                  <dt>Note to partner</dt>
                  <dd>{selected.reviewNote}</dd>
                </div>
              )}
              {selected.emailVerified === false && (
                <div>
                  <dt>Email</dt>
                  <dd>Not verified yet</dd>
                </div>
              )}
            </dl>

            {!drawerLoading && selected.earnings && (
              <>
                <h3 className="admin-form-section-title" style={{ marginTop: 24 }}>
                  Earnings
                </h3>
                <dl className="admin-detail-list">
                  <div>
                    <dt>Earned (completed jobs)</dt>
                    <dd>{formatRupees(selected.earnings.earnedPaise)}</dd>
                  </div>
                  <div>
                    <dt>Paid out</dt>
                    <dd>{formatRupees(selected.earnings.paidPaise)}</dd>
                  </div>
                  <div>
                    <dt>Still to pay</dt>
                    <dd>
                      <strong>{formatRupees(selected.earnings.pendingPaise)}</strong>
                    </dd>
                  </div>
                  <div>
                    <dt>This month</dt>
                    <dd>{formatRupees(selected.earnings.thisMonthPaise)}</dd>
                  </div>
                  {selected.earnings.awaitingPayoutJobs > 0 && (
                    <div>
                      <dt>Completed, no payout set</dt>
                      <dd>
                        {selected.earnings.awaitingPayoutJobs} job
                        {selected.earnings.awaitingPayoutJobs === 1 ? '' : 's'} — set the amount in Bookings
                      </dd>
                    </div>
                  )}
                </dl>
              </>
            )}

            <h3 className="admin-form-section-title" style={{ marginTop: 24 }}>
              Jobs ({drawerLoading ? '…' : (selected.jobs || []).length})
            </h3>
            {drawerLoading ? (
              <p className="admin-table-sub">Loading…</p>
            ) : !selected.jobs || selected.jobs.length === 0 ? (
              <p className="admin-table-sub">No jobs assigned to this partner yet.</p>
            ) : (
              <ul className="admin-stage-list">
                {selected.jobs.map((job) => (
                  <li key={job.bookingId} className="admin-stage-item">
                    <div className="admin-stage-title">
                      {job.bookingNumber} · {job.serviceLabel || 'Service'}
                    </div>
                    <div className="admin-stage-desc">
                      {[job.customerName, job.location, job.preferredDate && formatDate(job.preferredDate)]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                    <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <StatusBadge tone={toneForJob(job.status)}>{label(job.status)}</StatusBadge>
                      {job.payoutPaise != null && (
                        <StatusBadge tone={job.paidAt ? 'success' : 'warning'}>
                          {formatRupees(job.payoutPaise)} · {job.paidAt ? 'Paid' : 'Not paid'}
                        </StatusBadge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="admin-form-section" style={{ marginTop: 24 }}>
              <h3 className="admin-form-section-title">Decision</h3>

              {selected.status === 'APPROVED' && selected.activeJobs > 0 && (
                <div role="alert" className="alert alert-warning" style={{ marginBottom: 12 }}>
                  <Icon name="info" size={18} />
                  <span>
                    This partner still has {selected.activeJobs} open job{selected.activeJobs === 1 ? '' : 's'}.
                    Suspending them stops new assignments but doesn&rsquo;t reassign the ones they have.
                  </span>
                </div>
              )}

              <div className="field" style={{ marginBottom: 12 }}>
                <label htmlFor="partner-note">
                  Note to partner {ACTIONS[selected.status] && ACTIONS[selected.status].some((a) => a.needsNote) ? '(required to reject or suspend)' : '(optional)'}
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
                  placeholder="Shown to the partner on their dashboard."
                />
              </div>

              {actionError && (
                <div role="alert" className="alert alert-error" style={{ marginBottom: 12 }}>
                  <Icon name="info" size={18} />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="btn-row">
                {(ACTIONS[selected.status] || []).map((action) => (
                  <button
                    key={action.to}
                    type="button"
                    className={`btn ${action.style} btn-block`}
                    onClick={() => handleAction(action)}
                    disabled={Boolean(saving) || drawerLoading}
                  >
                    {saving === action.to ? 'SAVING…' : action.text}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}

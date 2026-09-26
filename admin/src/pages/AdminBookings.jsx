import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '../components/ui/Icon';
import PageHeader from '../components/admin/PageHeader';
import DataTable from '../components/admin/DataTable';
import StatusBadge from '../components/admin/StatusBadge';
import Pagination from '../components/admin/Pagination';
import Modal from '../components/admin/Modal';
import PartnerPayoutSection from '../components/admin/PartnerPayoutSection';
import { ErrorBanner, TableEmpty, TableLoading } from '../components/admin/TableStates';
import rowProps from '../components/admin/rowProps';
import { useToast } from '../components/admin/Toast';
import { useAttention } from '../context/AttentionContext';
import useQueryParam, { usePageParam } from '../hooks/useQueryParam';
import api, { friendlyError } from '../lib/api';
import { formatRupees } from '../lib/money';
import {
  BOOKING_STATUS_HELP,
  bookingTone,
  formatDate,
  formatDay,
  hoursUntilAutoCancel,
  label,
  telHref,
  timeAgo,
  todayIso,
  whatsappHref,
} from '../lib/format';

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

/** The filters staff reach for most, as one-click chips. `count` names an AttentionContext number. */
const QUICK_FILTERS = [
  { status: '', text: 'All bookings' },
  { status: 'PAYMENT_PENDING', text: 'New — to confirm', count: 'paymentPending' },
  { status: 'BOOKING_REQUESTED', text: 'Requested', count: 'requested', hideWhenZero: true },
  { status: 'CONFIRMED', text: 'Needs a partner', count: 'confirmed' },
  { status: 'ASSIGNMENT_PENDING', text: 'Assignment pending', count: 'assignmentPending', hideWhenZero: true },
  { status: 'WORK_IN_PROGRESS', text: 'Work in progress' },
  { status: 'WORK_COMPLETED', text: 'Completed' },
];

const FINAL = ['WORK_COMPLETED', 'CANCELLED'];

/** "Cancels in 5 h" for a booking the server will auto-cancel; nothing otherwise. */
function ExpiryChip({ booking }) {
  const hours = hoursUntilAutoCancel(booking);
  if (hours == null) return null;
  return (
    <span
      className={`admin-expiry${hours <= 6 ? ' urgent' : ''}`}
      title="Unconfirmed bookings are cancelled automatically 24 hours after they are made"
    >
      <Icon name="clock" size={12} />
      {hours === 0 ? 'Cancelling now' : `Cancels in ${hours} h`}
    </span>
  );
}

/**
 * Two ways to look at bookings: the filtered list staff work through day to
 * day, and the day sheet — every visit requested for one date, in slot order.
 * Filters and the open booking live in the URL, so the dashboard can link
 * straight to "bookings that need a partner", and a refresh keeps your place.
 */
export default function AdminBookings() {
  const { notify } = useToast();
  const { counts, refresh: refreshCounts } = useAttention();

  const [mode, setMode] = useQueryParam('mode', 'list');
  const [statusFilter, setStatusFilter] = useQueryParam('status');
  const [typeFilter, setTypeFilter] = useQueryParam('type');
  const [date, setDate] = useQueryParam('date', todayIso());
  const [openId, setOpenId] = useQueryParam('open');
  const [page, setPage] = usePageParam();

  const [data, setData] = useState(null);
  const [dayRows, setDayRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
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
    const request =
      mode === 'day'
        ? api.admin.bookings.forDate(date).then(setDayRows)
        : api.admin.bookings.list({ status: statusFilter, type: typeFilter, page }).then(setData);
    request.catch((err) => setError(friendlyError(err))).finally(() => setLoading(false));
  }, [mode, date, statusFilter, typeFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  /* The open booking is in the URL (?open=12), so a dashboard link or a
     shared link opens it directly. The full record is fetched because the
     list rows do not carry the customer's answers. */
  useEffect(() => {
    if (!openId) {
      setSelected(null);
      return undefined;
    }
    let cancelled = false;
    setDetailLoading(true);
    setSaveError('');
    setAssignId('');
    setAssignError('');
    api
      .booking(openId)
      .then((booking) => {
        if (cancelled) return;
        setSelected(booking);
        setForm({ status: booking.status, adminNotes: booking.adminNotes || '' });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(friendlyError(err));
        setOpenId('');
      })
      .finally(() => !cancelled && setDetailLoading(false));
    return () => {
      cancelled = true;
    };
  }, [openId, setOpenId]);

  const rows = mode === 'day' ? dayRows || [] : data ? data.content : [];
  const closeModal = () => setOpenId('');

  const isFinal = selected && FINAL.includes(selected.status);
  const canAssign = selected && ['CONFIRMED', 'ASSIGNMENT_PENDING'].includes(selected.status);

  const cartTotal = useMemo(() => {
    if (!selected || !selected.answers) return null;
    const priced = selected.answers.filter((a) => a.lineTotalPaise != null);
    return priced.length ? priced.reduce((sum, a) => sum + a.lineTotalPaise, 0) : null;
  }, [selected]);

  // Update responses from assign/update carry no answers; keep the ones we fetched.
  const afterChange = (updated, message) => {
    setSelected((current) => ({ ...updated, answers: current ? current.answers : updated.answers }));
    setForm({ status: updated.status, adminNotes: updated.adminNotes || '' });
    notify(message);
    refreshCounts();
    load();
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignId) return;
    setAssigning(true);
    setAssignError('');
    try {
      const updated = await api.admin.bookings.assign(selected.id, Number(assignId));
      setAssignId('');
      afterChange(updated, `Assigned to ${updated.assignedProfessionalName}`);
    } catch (err) {
      setAssignError(friendlyError(err));
    } finally {
      setAssigning(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (
      form.status === 'CANCELLED' &&
      selected.status !== 'CANCELLED' &&
      !window.confirm('Cancel this booking? A cancelled booking cannot be reopened, and its time slot is released.')
    ) {
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const updated = await api.admin.bookings.update(selected.id, form);
      afterChange(updated, `Booking ${updated.bookingNumber} saved`);
    } catch (err) {
      setSaveError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const address = selected ? [selected.address, selected.location, selected.pincode].filter(Boolean).join(', ') : '';

  return (
    <div>
      <PageHeader
        icon="calendar"
        title="Bookings"
        subtitle="Every site visit and project booked on the website. Open one to confirm it, assign a partner and move it along."
      />

      <div className="admin-toolbar">
        <div className="admin-tabs" role="tablist" aria-label="View">
          <button
            type="button"
            role="tab"
            aria-selected={mode !== 'day'}
            className={`admin-tab ${mode !== 'day' ? 'active' : ''}`}
            onClick={() => setMode('')}
          >
            <Icon name="layers" size={15} />
            All bookings
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'day'}
            className={`admin-tab ${mode === 'day' ? 'active' : ''}`}
            onClick={() => setMode('day')}
          >
            <Icon name="calendar" size={15} />
            Day sheet
          </button>
        </div>

        <span className="admin-toolbar-spacer" />

        {mode === 'day' ? (
          <input
            type="date"
            className="admin-filter"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Date"
          />
        ) : (
          <>
            <select
              className="admin-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Booking type"
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
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Status"
            >
              <option value="">Any status</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {mode !== 'day' && (
        <div className="admin-chips" aria-label="Quick filters">
          {QUICK_FILTERS.map((f) => {
            const n = f.count && counts ? counts[f.count] : null;
            if (f.hideWhenZero && !n && statusFilter !== f.status) return null;
            return (
              <button
                key={f.status || 'all'}
                type="button"
                className={`admin-chip ${statusFilter === f.status ? 'active' : ''}`}
                aria-pressed={statusFilter === f.status}
                onClick={() => setStatusFilter(f.status)}
              >
                {f.text}
                {n > 0 && <span className="admin-chip-count">{n}</span>}
              </button>
            );
          })}
        </div>
      )}

      <ErrorBanner onRetry={load}>{error}</ErrorBanner>

      <DataTable label="Bookings">
          <thead>
            <tr>
              <th>{mode === 'day' ? 'Time' : 'Booking'}</th>
              <th>Customer</th>
              <th>Service</th>
              <th>{mode === 'day' ? 'Booking' : 'Visit'}</th>
              <th>Partner</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableLoading columns={6} />
            ) : rows.length ? (
              rows.map((row) => (
                <tr key={row.id} {...rowProps(() => setOpenId(String(row.id)), `Open booking ${row.bookingNumber}`)}>
                  {mode === 'day' ? (
                    <td>
                      <strong>{row.preferredSlot || '—'}</strong>
                    </td>
                  ) : (
                    <td>
                      <strong>{row.bookingNumber}</strong>
                      <span className="admin-table-sub">
                        {label(row.bookingType)} · {timeAgo(row.createdAt)}
                      </span>
                    </td>
                  )}
                  <td>
                    <span className="admin-cell-main">{row.name}</span>
                    <span className="admin-table-sub">{row.phone}</span>
                  </td>
                  <td>
                    {row.serviceLabel || '—'}
                    {row.location && <span className="admin-table-sub">{row.location}</span>}
                  </td>
                  {mode === 'day' ? (
                    <td>
                      <span className="admin-mono">{row.bookingNumber}</span>
                    </td>
                  ) : (
                    <td>
                      {formatDay(row.preferredDate)}
                      <span className="admin-table-sub">{row.preferredSlot || '—'}</span>
                    </td>
                  )}
                  <td>{row.assignedProfessionalName || <span className="admin-table-sub">Not assigned</span>}</td>
                  <td>
                    <StatusBadge tone={bookingTone(row.status)}>{label(row.status)}</StatusBadge>
                    <div>
                      <ExpiryChip booking={row} />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <TableEmpty
                columns={6}
                icon="calendar"
                title={
                  mode === 'day'
                    ? `No visits on ${formatDate(date)}`
                    : statusFilter
                      ? `No bookings are "${label(statusFilter)}"`
                      : 'No bookings yet'
                }
              >
                {mode === 'day'
                  ? 'Pick another date above, or switch to All bookings.'
                  : statusFilter
                    ? 'Nothing is waiting in this status. Choose "All bookings" to see everything.'
                    : 'Bookings made on the website will appear here.'}
              </TableEmpty>
            )}
          </tbody>
      </DataTable>

      {mode !== 'day' && <Pagination data={data} onChange={setPage} />}

      <Modal open={Boolean(openId)} onClose={closeModal} title={selected ? `Booking ${selected.bookingNumber}` : 'Booking'}>
        {detailLoading && !selected && <p className="admin-picker-status">Loading booking…</p>}

        {selected && (
          <>
            <div className="admin-modal-top">
              <StatusBadge tone={bookingTone(selected.status)}>{label(selected.status)}</StatusBadge>
              <span className="admin-table-sub" style={{ marginTop: 0 }}>
                {label(selected.bookingType)} booking · made {timeAgo(selected.createdAt)}
              </span>
              <ExpiryChip booking={selected} />
            </div>

            {BOOKING_STATUS_HELP[selected.status] && (
              <div className="admin-status-help">
                <Icon name="info" size={18} />
                <span>{BOOKING_STATUS_HELP[selected.status]}</span>
              </div>
            )}

            <section className="admin-form-section">
              <h3 className="admin-form-section-title">
                <Icon name="user" size={16} />
                Customer
              </h3>
              <dl className="admin-detail-list" style={{ marginBottom: 0 }}>
                <div>
                  <dt>Name</dt>
                  <dd>{selected.name}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{selected.phone}</dd>
                </div>
                {selected.whatsapp && selected.whatsapp !== selected.phone && (
                  <div>
                    <dt>WhatsApp</dt>
                    <dd>{selected.whatsapp}</dd>
                  </div>
                )}
                <div>
                  <dt>Email</dt>
                  <dd>{selected.email || '—'}</dd>
                </div>
                <div>
                  <dt>Address</dt>
                  <dd>{address || '—'}</dd>
                </div>
              </dl>
              <div className="admin-contact-actions">
                {telHref(selected.phone) && (
                  <a href={telHref(selected.phone)}>
                    <Icon name="phone" size={15} /> Call
                  </a>
                )}
                {whatsappHref(selected.whatsapp || selected.phone) && (
                  <a
                    href={whatsappHref(
                      selected.whatsapp || selected.phone,
                      `Hello ${selected.name}, this is Supplybase about your booking ${selected.bookingNumber}.`
                    )}
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
                {address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon name="map-pin" size={15} /> Map
                  </a>
                )}
              </div>
            </section>

            <section className="admin-form-section">
              <h3 className="admin-form-section-title">
                <Icon name="layers" size={16} />
                What the customer asked for
              </h3>
              <dl className="admin-detail-list">
                <div>
                  <dt>Service</dt>
                  <dd>{selected.serviceLabel}</dd>
                </div>
                <div>
                  <dt>Visit</dt>
                  <dd>
                    {formatDay(selected.preferredDate)} · {selected.preferredSlot || 'no time chosen'}
                  </dd>
                </div>
                {selected.propertyType && (
                  <div>
                    <dt>Property</dt>
                    <dd>{selected.propertyType}</dd>
                  </div>
                )}
                {selected.areaSqft && (
                  <div>
                    <dt>Area</dt>
                    <dd>{selected.areaSqft} sq ft</dd>
                  </div>
                )}
                {selected.budgetRange && (
                  <div>
                    <dt>Budget</dt>
                    <dd>{selected.budgetRange}</dd>
                  </div>
                )}
                {selected.workDetail && (
                  <div>
                    <dt>Notes</dt>
                    <dd>{selected.workDetail}</dd>
                  </div>
                )}
                {selected.attachmentsPending && (
                  <div>
                    <dt>Photos</dt>
                    <dd>The customer said they would send photos separately.</dd>
                  </div>
                )}
              </dl>

              {selected.answers && selected.answers.length > 0 ? (
                <ul className="admin-answers">
                  {selected.answers.map((a, i) => (
                    <li key={`${a.questionText}-${i}`} className="admin-answer">
                      <span className="admin-answer-q">{a.questionText}</span>
                      <span className="admin-answer-a">
                        {a.answerLabel}
                        {a.quantity > 1 ? ` × ${a.quantity}` : ''}
                      </span>
                      <span className="admin-answer-price">
                        {a.lineTotalPaise != null ? formatRupees(a.lineTotalPaise) : ''}
                      </span>
                    </li>
                  ))}
                  {cartTotal != null && (
                    <li className="admin-answer-total">
                      <span>Items total</span>
                      <span>{formatRupees(cartTotal)}</span>
                    </li>
                  )}
                </ul>
              ) : (
                <p className="admin-form-hint" style={{ margin: 0 }}>
                  No wizard answers were stored for this booking.
                </p>
              )}
            </section>

            <section className="admin-form-section">
              <h3 className="admin-form-section-title">
                <Icon name="helmet" size={16} />
                Partner
              </h3>
              <div className="field" style={{ marginBottom: canAssign ? 16 : 0 }}>
                <span className="admin-field-label">Assigned partner</span>
                <div className="admin-readonly">
                  {selected.assignedProfessionalName
                    ? `${selected.assignedProfessionalName} — ${selected.assignedProfessionalPhone || 'no phone'}`
                    : 'Not assigned yet'}
                </div>
              </div>

              {canAssign ? (
                <form onSubmit={handleAssign}>
                  <div className="field" style={{ marginBottom: 12 }}>
                    <label htmlFor="bk-assign">
                      {selected.assignedProfessionalName ? 'Reassign to' : 'Assign a partner'}
                    </label>
                    <select id="bk-assign" value={assignId} onChange={(e) => setAssignId(e.target.value)}>
                      <option value="">Choose an approved partner…</option>
                      {professionals.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.fullName} — {p.phone || p.email}
                        </option>
                      ))}
                    </select>
                    {professionals.length === 0 && (
                      <span className="field-hint">No approved partners yet — approve one on the Partners page.</span>
                    )}
                  </div>

                  {assignError && (
                    <div role="alert" className="alert alert-error">
                      <Icon name="alert" size={18} />
                      <span>{assignError}</span>
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary" disabled={assigning || !assignId}>
                    <Icon name="helmet" size={16} />
                    {assigning ? 'ASSIGNING…' : 'ASSIGN PARTNER'}
                  </button>
                </form>
              ) : (
                !selected.assignedProfessionalName &&
                !isFinal && (
                  <p className="admin-form-hint" style={{ margin: '10px 0 0' }}>
                    Confirm the booking first — a partner can be assigned once it is Confirmed.
                  </p>
                )
              )}
            </section>

            {selected.assignedProfessionalId && (
              <section className="admin-form-section">
                <h3 className="admin-form-section-title">
                  <Icon name="rupee" size={16} />
                  Partner payout
                </h3>
                {/* Keyed on the partner: reassigning clears the payout, so reload it. */}
                <PartnerPayoutSection key={selected.assignedProfessionalId} booking={selected} />
              </section>
            )}

            <section className="admin-form-section">
              <h3 className="admin-form-section-title">
                <Icon name="check-circle" size={16} />
                Status &amp; notes
              </h3>
              {isFinal ? (
                <p className="admin-form-hint" style={{ margin: 0 }}>
                  This booking is {label(selected.status).toLowerCase()} and can no longer be changed.
                  {selected.adminNotes ? ` Notes: ${selected.adminNotes}` : ''}
                </p>
              ) : (
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
                    {form.status !== selected.status && BOOKING_STATUS_HELP[form.status] && (
                      <span className="field-hint">After saving: {BOOKING_STATUS_HELP[form.status]}</span>
                    )}
                  </div>

                  <div className="field" style={{ marginBottom: 16 }}>
                    <label htmlFor="bk-notes">Internal notes</label>
                    <textarea
                      id="bk-notes"
                      rows={3}
                      value={form.adminNotes}
                      onChange={(e) => setForm((f) => ({ ...f, adminNotes: e.target.value }))}
                      placeholder="Only staff see this"
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
              )}
            </section>
          </>
        )}
      </Modal>
    </div>
  );
}

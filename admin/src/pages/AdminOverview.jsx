import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import PageHeader from '../components/admin/PageHeader';
import StatusBadge from '../components/admin/StatusBadge';
import { EmptyState, ErrorBanner } from '../components/admin/TableStates';
import { useAttention } from '../context/AttentionContext';
import { useAuth } from '../context/AuthContext';
import api, { friendlyError } from '../lib/api';
import { bookingTone, label, timeAgo, todayIso } from '../lib/format';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

/** One "needs your attention" card. With nothing waiting it turns green and says so. */
function AttentionCard({ count, icon, tone, title, description, to, cta, clearText }) {
  const clear = count === 0;
  return (
    <Link to={to} className={`admin-attn admin-attn-${clear ? 'clear' : tone}`}>
      <span className="admin-attn-top">
        <span className="admin-attn-icon" aria-hidden="true">
          <Icon name={clear ? 'check-circle' : icon} size={21} />
        </span>
        <span className="admin-attn-count">{count == null ? '—' : count}</span>
      </span>
      <span className="admin-attn-title">{title}</span>
      <span className="admin-attn-desc">{clear ? clearText : description}</span>
      <span className="admin-attn-cta">
        {clear ? 'View all' : cta}
        <Icon name="arrow-right" size={14} />
      </span>
    </Link>
  );
}

/**
 * The admin's front page: what needs doing now, what is happening today, and
 * how many of everything there are. Every card links to the list it counts,
 * already filtered.
 */
export default function AdminOverview() {
  const { user } = useAuth();
  const { counts, refresh } = useAttention();

  const [today, setToday] = useState(null);
  const [recentEnquiries, setRecentEnquiries] = useState(null);
  const [totals, setTotals] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    refresh();
    Promise.all([
      api.admin.bookings.forDate(todayIso()),
      api.admin.enquiries.list({ size: 5 }),
      api.admin.bookings.list({ size: 1 }),
      api.admin.projects.list({ size: 1 }),
      api.admin.payments.list({ size: 1 }),
      api.admin.bookings.list({ status: 'WORK_COMPLETED', size: 1 }),
    ])
      .then(([day, enquiries, bookings, projects, payments, completed]) => {
        setToday(day.filter((b) => b.status !== 'CANCELLED'));
        setRecentEnquiries(enquiries.content);
        setTotals({
          enquiries: enquiries.totalElements,
          bookings: bookings.totalElements,
          projects: projects.totalElements,
          payments: payments.totalElements,
          completed: completed.totalElements,
        });
      })
      .catch((err) => setError(friendlyError(err)));
  }, [refresh]);

  useEffect(() => {
    load();
  }, [load]);

  const c = counts || {};
  const firstName = (user.fullName || '').split(' ')[0];
  const activePartners = c.partnerCounts ? c.partnerCounts.APPROVED || 0 : null;

  return (
    <div>
      <PageHeader
        icon="dashboard"
        eyebrow={`${greeting()}${firstName ? `, ${firstName}` : ''}`}
        title="Dashboard"
        subtitle="What needs doing now, what is happening today, and how things stand."
        actions={
          <button type="button" className="btn btn-ghost btn-sm" onClick={load}>
            <Icon name="refresh" size={16} />
            REFRESH
          </button>
        }
      />

      <ErrorBanner onRetry={load}>{error}</ErrorBanner>

      <section className="admin-section" aria-labelledby="attn-title">
        <div className="admin-section-head">
          <h2 id="attn-title">Needs your attention</h2>
          <span className="admin-hide-phone">Work these from left to right</span>
        </div>
        <div className="admin-attention-grid">
          <AttentionCard
            count={counts ? c.toConfirm : null}
            icon="alert"
            tone="danger"
            title="New bookings to confirm"
            description="Check and confirm them. Unconfirmed bookings are cancelled automatically 24 hours after they are made."
            clearText="No new bookings waiting. New ones appear here first."
            to="/bookings?status=PAYMENT_PENDING"
            cta="Confirm now"
          />
          <AttentionCard
            count={counts ? c.needPartner : null}
            icon="helmet"
            tone="warning"
            title="Bookings needing a partner"
            description="Confirmed visits with nobody assigned yet. Open one and pick a partner."
            clearText="Every confirmed booking has a partner."
            to="/bookings?status=CONFIRMED"
            cta="Assign partners"
          />
          <AttentionCard
            count={counts ? c.newEnquiries : null}
            icon="chat"
            tone="accent"
            title="New enquiries"
            description="People who filled the quote or contact form and have not been contacted yet."
            clearText="Every enquiry has been followed up."
            to="/enquiries?status=NEW"
            cta="Call them back"
          />
          <AttentionCard
            count={counts ? c.pendingPartners : null}
            icon="users"
            tone="accent"
            title="Partner applications"
            description="Professionals waiting for you to approve or reject their application."
            clearText="No applications waiting for review."
            to="/partners?status=PENDING"
            cta="Review"
          />
        </div>
      </section>

      <div className="admin-dash-columns">
        <section className="admin-panel" aria-labelledby="today-title">
          <div className="admin-panel-head">
            <h2 id="today-title">
              <Icon name="calendar" size={17} />
              Today&rsquo;s visits
            </h2>
            <Link to="/bookings?mode=day">
              Day sheet <Icon name="arrow-right" size={13} />
            </Link>
          </div>
          {!today ? (
            <p className="admin-picker-status">Loading today&rsquo;s visits…</p>
          ) : today.length === 0 ? (
            <EmptyState icon="calendar" title="No visits today">
              Visits customers booked for today will be listed here in time order.
            </EmptyState>
          ) : (
            <ul className="admin-list">
              {today.map((b) => (
                <li key={b.id}>
                  <Link to={`/bookings?open=${b.id}&mode=day`} className="admin-list-item">
                    <span className="admin-list-time">{b.preferredSlot || '—'}</span>
                    <span className="admin-list-main">
                      <strong>{b.name}</strong>
                      <span>
                        {b.serviceLabel}
                        {b.location ? ` · ${b.location}` : ''}
                        {b.assignedProfessionalName ? ` · ${b.assignedProfessionalName}` : ' · No partner yet'}
                      </span>
                    </span>
                    <StatusBadge tone={bookingTone(b.status)}>{label(b.status)}</StatusBadge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-panel" aria-labelledby="enq-title">
          <div className="admin-panel-head">
            <h2 id="enq-title">
              <Icon name="chat" size={17} />
              Latest enquiries
            </h2>
            <Link to="/enquiries">
              All enquiries <Icon name="arrow-right" size={13} />
            </Link>
          </div>
          {!recentEnquiries ? (
            <p className="admin-picker-status">Loading…</p>
          ) : recentEnquiries.length === 0 ? (
            <EmptyState icon="chat" title="No enquiries yet">
              Quote and contact form submissions from the website land here.
            </EmptyState>
          ) : (
            <ul className="admin-list">
              {recentEnquiries.map((e) => (
                <li key={e.id}>
                  <Link to={`/enquiries?open=${e.id}`} className="admin-list-item">
                    <span className="admin-list-main">
                      <strong>{e.name}</strong>
                      <span>
                        {e.projectType || e.serviceSlug || 'General enquiry'} · {timeAgo(e.createdAt)}
                      </span>
                    </span>
                    <StatusBadge tone={e.status === 'NEW' ? 'warning' : e.status === 'WON' ? 'success' : e.status === 'LOST' ? 'danger' : 'accent'}>
                      {label(e.status)}
                    </StatusBadge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="admin-section" aria-labelledby="glance-title">
        <div className="admin-section-head">
          <h2 id="glance-title">At a glance</h2>
          <span>All-time totals</span>
        </div>
        <div className="admin-kpi-grid">
          {[
            { key: 'bookings', label: 'Bookings', icon: 'calendar', to: '/bookings', value: totals?.bookings },
            { key: 'completed', label: 'Jobs completed', icon: 'check-circle', to: '/bookings?status=WORK_COMPLETED', value: totals?.completed },
            { key: 'enquiries', label: 'Enquiries', icon: 'chat', to: '/enquiries', value: totals?.enquiries },
            { key: 'partners', label: 'Active partners', icon: 'helmet', to: '/partners?status=APPROVED', value: activePartners },
            { key: 'projects', label: 'Projects', icon: 'building', to: '/projects', value: totals?.projects },
            { key: 'payments', label: 'Payments raised', icon: 'rupee', to: '/payments', value: totals?.payments },
          ].map((k) => (
            <Link key={k.key} to={k.to} className="admin-kpi">
              <span className="admin-kpi-icon" aria-hidden="true">
                <Icon name={k.icon} size={20} />
              </span>
              <span className="admin-kpi-value">{k.value == null ? '—' : k.value}</span>
              <span className="admin-kpi-label">{k.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import api, { friendlyError } from '../lib/api';

const cards = [
  { key: 'enquiries', label: 'Enquiries', icon: 'chat', to: '/enquiries' },
  { key: 'bookings', label: 'Bookings', icon: 'calendar', to: '/bookings' },
  { key: 'projects', label: 'Projects', icon: 'building', to: '/projects' },
  { key: 'payments', label: 'Payments', icon: 'rupee', to: '/payments' },
  { key: 'partners', label: 'Partners', icon: 'helmet', to: '/partners' },
  { key: 'pendingPartners', label: 'Partner applications to review', icon: 'clock', to: '/partners' },
];

/**
 * Landing page for the admin panel. Just counts and quick links — the API has
 * no dashboard-summary endpoint, so each count is the `totalElements` of that
 * list's first page rather than a dedicated stat call. (Partners have their
 * own counts endpoint, which is where the pending number comes from.)
 */
export default function AdminOverview() {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.admin.enquiries.list({ size: 1 }),
      api.admin.bookings.list({ size: 1 }),
      api.admin.projects.list({ size: 1 }),
      api.admin.payments.list({ size: 1 }),
      api.admin.partners.counts(),
    ])
      .then(([enquiries, bookings, projects, payments, partners]) => {
        if (cancelled) return;
        setCounts({
          enquiries: enquiries.totalElements,
          bookings: bookings.totalElements,
          projects: projects.totalElements,
          payments: payments.totalElements,
          partners: Object.values(partners).reduce((sum, n) => sum + n, 0),
          pendingPartners: partners.PENDING || 0,
        });
      })
      .catch((err) => !cancelled && setError(friendlyError(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>OVERVIEW</h1>
          <p>Everything coming through the site, in one place.</p>
        </div>
      </div>

      {error && (
        <div role="alert" className="alert alert-error">
          <Icon name="info" size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="admin-stat-grid">
        {cards.map((card) => (
          <Link key={card.key} to={card.to} className="admin-stat-card">
            <span className="admin-stat-icon">
              <Icon name={card.icon} size={22} />
            </span>
            <span className="admin-stat-value">{loading ? '—' : (counts[card.key] ?? 0)}</span>
            <span className="admin-stat-label">{card.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

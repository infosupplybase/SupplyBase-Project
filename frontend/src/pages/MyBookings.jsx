import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import Reveal from '../components/ui/Reveal';
import AccountTabs from '../components/account/AccountTabs';
import AccountSidebar from '../components/account/AccountSidebar';
import api, { friendlyError } from '../lib/api';
import { bookingStatusLabel, bookingStatusTone } from '../lib/bookingStatus';

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

/**
 * /dashboard/bookings — every booking the signed-in client has ever made,
 * newest first, with its real current status. Separate page from Profile so
 * "Bookings" and "Profile" in the bottom nav each land somewhere real,
 * instead of both pointing at the same generic welcome screen.
 */
export default function MyBookings() {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .myBookings()
      .then((data) => {
        if (!cancelled) setBookings(data);
      })
      .catch((err) => {
        if (!cancelled) setError(friendlyError(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = bookings
    ? [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    : null;

  return (
    <>
      <PageHero
        eyebrow="YOUR ACCOUNT"
        title="MY BOOKINGS"
        text="Every site visit and service request you've made with Supplybase, in one place."
        image="/assets/services/service-hero.jpg"
        breadcrumbs={[{ label: 'My Account', to: '/dashboard' }, { label: 'Bookings' }]}
      />

      <section className="section">
        <div className="container">
          <div className="service-layout">
            <div>
              <AccountTabs />

              {!bookings && !error && <p className="question-hint">Loading your bookings…</p>}

              {error && (
                <div role="alert" className="alert alert-error">
                  <Icon name="info" size={18} />
                  <span>{error}</span>
                </div>
              )}

              {sorted && sorted.length === 0 && (
                <div className="acct-empty">
                  <Icon name="calendar" size={32} />
                  <h3>No bookings yet</h3>
                  <p>Once you request a service, it will show up here with its status.</p>
                  <Link to="/services" className="btn btn-primary">
                    Browse Services
                  </Link>
                </div>
              )}

              {sorted && sorted.length > 0 && (
                <div className="acct-booking-list">
                  {sorted.map((b, i) => (
                    <Reveal key={b.id} delay={i * 40}>
                      <Link to={`/dashboard/bookings/${b.id}`} className="acct-booking-card acct-booking-card-link">
                        <div className="acct-booking-top">
                          <div>
                            <span className="acct-booking-number">{b.bookingNumber || b.reference}</span>
                            <h3>{b.serviceLabel || b.serviceSlug}</h3>
                          </div>
                          <span className={`acct-status acct-status-${bookingStatusTone(b.status)}`}>
                            {bookingStatusLabel(b.status)}
                          </span>
                        </div>

                        <ul className="acct-booking-meta">
                          {b.preferredDate && (
                            <li>
                              <Icon name="calendar" size={15} />
                              {formatDate(b.preferredDate)}
                              {b.preferredSlot ? ` · ${b.preferredSlot}` : ''}
                            </li>
                          )}
                          {(b.location || b.address) && (
                            <li>
                              <Icon name="map-pin" size={15} />
                              {b.location || b.address}
                            </li>
                          )}
                          {b.assignedProfessionalName && (
                            <li>
                              <Icon name="user" size={15} />
                              {b.assignedProfessionalName}
                              {b.assignedProfessionalPhone ? ` · ${b.assignedProfessionalPhone}` : ''}
                            </li>
                          )}
                        </ul>

                        <span className="acct-booking-view">
                          View details
                          <Icon name="arrow-right" size={15} />
                        </span>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              )}
            </div>

            <AccountSidebar />
          </div>
        </div>
      </section>
    </>
  );
}

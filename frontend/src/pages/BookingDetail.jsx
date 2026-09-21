import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import Reveal from '../components/ui/Reveal';
import AccountSidebar from '../components/account/AccountSidebar';
import api, { ApiError, friendlyError } from '../lib/api';
import { bookingStatusLabel, bookingStatusTone } from '../lib/bookingStatus';
import { formatRupees } from '../lib/money';

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

/**
 * Cart-style questions (pick as many services as you like) store one
 * BookingAnswer row per item, all sharing the same questionText — e.g.
 * three "Select a service" rows for three different plumbing jobs. Grouping
 * consecutive answers by questionText turns that into one heading with a
 * list underneath, instead of repeating the question three times.
 */
const groupAnswers = (answers) => {
  const groups = [];
  for (const a of answers) {
    const last = groups[groups.length - 1];
    if (last && last.questionText === a.questionText) {
      last.items.push(a);
    } else {
      groups.push({ questionText: a.questionText, items: [a] });
    }
  }
  return groups;
};

const MATERIAL_SUPPLIER_LABELS = {
  SUPPLYBASE: 'Supplybase provides the material',
  CUSTOMER: 'Customer provides the material',
  UNDECIDED: 'Not decided yet',
};

/**
 * /dashboard/bookings/:id — one booking in full.
 *
 * The "Work Information" section reads `booking.answers`, the real
 * per-question answers recorded by the booking wizard (BookingService.
 * storeAnswers on the backend). The booking record itself also carries a
 * legacy workNature/workOption/workDetail trio that the wizard never
 * actually fills in — this page does not read those, since showing them
 * is exactly what left the section blank before.
 */
export default function BookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setBooking(null);
    setError('');
    setNotFound(false);
    api
      .booking(id)
      .then((data) => {
        if (!cancelled) setBooking(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setError(friendlyError(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const workMeta = booking
    ? [
        booking.propertyType && { label: 'Property Type', value: booking.propertyType },
        booking.areaSqft && { label: 'Area', value: `${booking.areaSqft} sq. ft.` },
        booking.budgetRange && { label: 'Budget Range', value: booking.budgetRange },
        booking.materialSupplier && {
          label: 'Material',
          value: MATERIAL_SUPPLIER_LABELS[booking.materialSupplier] || booking.materialSupplier,
        },
      ].filter(Boolean)
    : [];

  const hasWorkInfo = workMeta.length > 0 || (booking && booking.answers && booking.answers.length > 0);

  return (
    <>
      <PageHero
        eyebrow="YOUR ACCOUNT"
        title="BOOKING DETAILS"
        text="Everything Supplybase has on file for this service request."
        image="/assets/services/service-hero.jpg"
        breadcrumbs={[
          { label: 'My Account', to: '/dashboard' },
          { label: 'Bookings', to: '/dashboard/bookings' },
          { label: booking?.bookingNumber || 'Details' },
        ]}
      />

      <section className="section">
        <div className="container">
          <div className="service-layout">
            <div>
              <Link to="/dashboard/bookings" className="bkd-back">
                <Icon name="arrow-left" size={16} />
                Back to My Bookings
              </Link>

              {!booking && !error && !notFound && (
                <p className="question-hint">Loading this booking…</p>
              )}

              {error && (
                <div role="alert" className="alert alert-error">
                  <Icon name="info" size={18} />
                  <span>{error}</span>
                </div>
              )}

              {notFound && (
                <div className="acct-empty">
                  <Icon name="info" size={32} />
                  <h3>We couldn't find that booking</h3>
                  <p>It may belong to a different account, or the link may be out of date.</p>
                  <Link to="/dashboard/bookings" className="btn btn-primary">
                    Back to My Bookings
                  </Link>
                </div>
              )}

              {booking && (
                <Reveal>
                  <div className="bkd-header">
                    <div className="bkd-header-top">
                      <div>
                        <span className="acct-booking-number">
                          {booking.bookingNumber || booking.reference}
                        </span>
                        <h2>{booking.serviceLabel || booking.serviceSlug}</h2>
                      </div>
                      <span className={`acct-status acct-status-${bookingStatusTone(booking.status)}`}>
                        {bookingStatusLabel(booking.status)}
                      </span>
                    </div>

                    <ul className="acct-booking-meta">
                      <li>
                        <Icon name="calendar" size={15} />
                        Booked on {formatDate(booking.createdAt)}
                      </li>
                      {booking.preferredDate && (
                        <li>
                          <Icon name="calendar" size={15} />
                          Preferred visit: {formatDate(booking.preferredDate)}
                          {booking.preferredSlot ? ` · ${booking.preferredSlot}` : ''}
                        </li>
                      )}
                      {booking.assignedProfessionalName && (
                        <li>
                          <Icon name="user" size={15} />
                          {booking.assignedProfessionalName}
                          {booking.assignedProfessionalPhone ? ` · ${booking.assignedProfessionalPhone}` : ''}
                        </li>
                      )}
                    </ul>
                  </div>
                </Reveal>
              )}

              {booking && (
                <Reveal delay={60}>
                  <div className="bkd-section">
                    <div className="bkd-section-head">
                      <span className="bkd-section-num">02</span>
                      <h3>Contact Information</h3>
                    </div>
                    <dl className="summary-list">
                      {booking.name && (
                        <div>
                          <dt>Name</dt>
                          <dd>{booking.name}</dd>
                        </div>
                      )}
                      {booking.phone && (
                        <div>
                          <dt>Phone</dt>
                          <dd>{booking.phone}</dd>
                        </div>
                      )}
                      {booking.whatsapp && booking.whatsapp !== booking.phone && (
                        <div>
                          <dt>WhatsApp</dt>
                          <dd>{booking.whatsapp}</dd>
                        </div>
                      )}
                      {booking.email && (
                        <div>
                          <dt>Email</dt>
                          <dd>{booking.email}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </Reveal>
              )}

              {booking && (
                <Reveal delay={120}>
                  <div className="bkd-section">
                    <div className="bkd-section-head">
                      <span className="bkd-section-num">03</span>
                      <h3>Work Information</h3>
                    </div>

                    {!hasWorkInfo && (
                      <p className="bkd-empty-note">
                        No additional work details were captured for this booking.
                      </p>
                    )}

                    {workMeta.length > 0 && (
                      <dl className="summary-list">
                        {workMeta.map((row) => (
                          <div key={row.label}>
                            <dt>{row.label}</dt>
                            <dd>{row.value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}

                    {booking.answers && booking.answers.length > 0 && (
                      <div className="bkd-answers">
                        {groupAnswers(booking.answers).map((group, gi) => (
                          <div className="bkd-answer-group" key={`${group.questionText}-${gi}`}>
                            <span className="bkd-answer-q">{group.questionText}</span>
                            <ul className="bkd-answer-items">
                              {group.items.map((a, i) => (
                                <li key={`${a.answerLabel}-${i}`}>
                                  <span>
                                    {a.answerLabel}
                                    {a.quantity > 1 ? ` × ${a.quantity}` : ''}
                                  </span>
                                  {a.lineTotalPaise ? (
                                    <span className="bkd-line-price">
                                      {formatRupees(a.lineTotalPaise / 100)}
                                    </span>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Reveal>
              )}

              {booking && (booking.address || booking.location) && (
                <Reveal delay={180}>
                  <div className="bkd-section">
                    <div className="bkd-section-head">
                      <span className="bkd-section-num">04</span>
                      <h3>Address</h3>
                    </div>
                    <div className="bkd-address">
                      <Icon name="map-pin" size={18} />
                      <p>
                        {booking.address}
                        {booking.address && booking.location ? ', ' : ''}
                        {booking.location}
                      </p>
                    </div>
                  </div>
                </Reveal>
              )}
            </div>

            <AccountSidebar />
          </div>
        </div>
      </section>
    </>
  );
}

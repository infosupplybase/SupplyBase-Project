import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import api, { friendlyError } from '../lib/api';
import { bookingStatusLabel, bookingStatusTone } from '../lib/bookingStatus';

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const serviceImages = {
  'interior-design': '/assets/services/interior-design.webp',
  'interior-by-choice': '/assets/services/interior-by-choice.png',
  painting: '/assets/services/painting.jpg',
  waterproofing: '/assets/services/waterproofing.avif',
  'pop-ceiling-design': '/assets/services/pop-ceiling-design.jpg',
  plumbing: '/assets/services/plumber.jpg',
  electrical: '/assets/services/electrician.avif',
  'other-services': '/assets/services/other-services.webp',
};

/**
 * ⚠️ Keep these option values exactly matching the TimeSlot enum
 *    constants in the backend (TimeSlot.java).
 */
const TIME_SLOTS = [
  { value: 'MORNING', label: 'Morning (9 AM – 12 PM)' },
  { value: 'AFTERNOON', label: 'Afternoon (12 PM – 3 PM)' },
  { value: 'EVENING', label: 'Evening (3 PM – 6 PM)' },
];

export default function BookingDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [form, setForm] = useState({
    preferredDate: '',
    preferredSlot: '',
    location: '',
  });

  useEffect(() => {
    let cancelled = false;
    api
      .getBooking(id)
      .then((data) => {
        if (cancelled) return;
        setBooking(data);
        setForm({
          preferredDate: data.preferredDate
            ? new Date(data.preferredDate).toISOString().slice(0, 10)
            : '',
          preferredSlot: data.preferredSlot || '',
          location: data.location || data.address || '',
        });
      })
      .catch((err) => {
        if (!cancelled) setError(friendlyError(err));
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      const updated = await api.updateBooking(id, form);
      setBooking(updated);
      setIsEditing(false);
    } catch (err) {
      setSaveError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <section className="section">
        <div className="container">
          <div role="alert" className="alert alert-error">
            <Icon name="info" size={18} />
            <span>{error}</span>
          </div>
          <Link
            to="/dashboard/bookings"
            className="btn btn-primary"
            style={{ marginTop: 16, display: 'inline-block' }}
          >
            Back to Bookings
          </Link>
        </div>
      </section>
    );
  }

  if (!booking) {
    return (
      <section className="section">
        <div className="container">
          <p className="question-hint">Loading booking details…</p>
        </div>
      </section>
    );
  }

  const image =
    serviceImages[booking.serviceSlug] || '/assets/services/service-hero.jpg';
  const statusTone = bookingStatusTone(booking.status);
  const statusLabel = bookingStatusLabel(booking.status);

  return (
    <>
      <PageHero
        eyebrow="YOUR BOOKING"
        title={booking.serviceLabel || booking.serviceSlug}
        text={`Booking ${booking.bookingNumber || booking.reference}`}
        image="/assets/hero-house.svg"
        breadcrumbs={[
          { label: 'My Account', to: '/dashboard' },
          { label: 'Bookings', to: '/dashboard/bookings' },
          { label: 'Details' },
        ]}
      />

      <section className="section">
        <div className="container booking-detail-layout">

          {/* LEFT: MAIN DETAILS */}
          <div className="booking-detail-main">

            <div className="booking-detail-statusbar">
              <span className={`acct-status acct-status-${statusTone}`}>
                <span className="acct-status-dot" />
                {statusLabel}
              </span>
              <span className="booking-detail-ref">
                #{booking.bookingNumber || booking.reference}
              </span>
            </div>

            <div className="booking-detail-hero">
              <img
                src={image}
                alt={booking.serviceLabel || booking.serviceSlug}
                onError={(e) => {
                  e.currentTarget.src = '/assets/services/service-hero.jpg';
                }}
              />
            </div>

            <div className="booking-detail-grid">
              <InfoBlock
                icon="calendar"
                label="PREFERRED DATE"
                value={formatDate(booking.preferredDate)}
              />
              <InfoBlock
                icon="clock"
                label="TIME SLOT"
                value={booking.preferredSlot || '—'}
              />
              <InfoBlock
                icon="map-pin"
                label="LOCATION"
                value={booking.location || booking.address || '—'}
              />
              <InfoBlock
                icon="user"
                label="PROFESSIONAL"
                value={booking.assignedProfessionalName || 'Will be assigned'}
              />
              {booking.assignedProfessionalPhone && (
                <InfoBlock
                  icon="phone"
                  label="CONTACT"
                  value={booking.assignedProfessionalPhone}
                />
              )}
              <InfoBlock
                icon="rupee"
                label="AMOUNT"
                value={
                  booking.visitFeePaise
                    ? `₹${(booking.visitFeePaise / 100).toLocaleString('en-IN')}`
                    : 'To be quoted'
                }
              />
            </div>

          </div>

          {/* RIGHT: EDIT PANEL */}
          <aside className="booking-detail-side">
            <div className="booking-edit-card">
              <div className="booking-edit-head">
                <h3>{isEditing ? 'Edit Booking' : 'Booking Summary'}</h3>
                {!isEditing && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Icon name="settings" size={14} /> Edit
                  </button>
                )}
              </div>

              {!isEditing ? (
                <ul className="booking-edit-summary">
                  <li><strong>Date:</strong> {formatDate(booking.preferredDate)}</li>
                  <li><strong>Slot:</strong> {booking.preferredSlot || '—'}</li>
                  <li><strong>Location:</strong> {booking.location || booking.address || '—'}</li>
                </ul>
              ) : (
                <form onSubmit={handleSave} className="booking-edit-form">
                  <label>
                    <span>Preferred Date</span>
                    <input
                      type="date"
                      name="preferredDate"
                      value={form.preferredDate}
                      onChange={handleChange}
                      required
                    />
                  </label>

                  <label>
                    <span>Time Slot</span>
                    <select
                      name="preferredSlot"
                      value={form.preferredSlot}
                      onChange={handleChange}
                    >
                      <option value="">Select a slot</option>
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot.value} value={slot.value}>
                          {slot.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Location</span>
                    <input
                      type="text"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      placeholder="Flat / Building / Area"
                    />
                  </label>

                  {saveError && (
                    <div role="alert" className="alert alert-error">
                      <Icon name="info" size={16} />
                      <span>{saveError}</span>
                    </div>
                  )}

                  <div className="booking-edit-actions">
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setIsEditing(false)}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={saving}
                    >
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </aside>

        </div>
      </section>
    </>
  );
}

function InfoBlock({ icon, label, value }) {
  return (
    <div className="booking-detail-block">
      <span className="booking-detail-block-icon">
        <Icon name={icon} size={17} />
      </span>
      <div>
        <span className="booking-detail-block-label">{label}</span>
        <span className="booking-detail-block-value">{value}</span>
      </div>
    </div>
  );
}
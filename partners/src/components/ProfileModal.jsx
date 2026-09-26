import { useEffect, useState } from 'react';
import Icon from './ui/Icon';
import { useAuth } from '../context/AuthContext';
import api, { friendlyError } from '../lib/api';

/**
 * ProfileModal — edit partner profile in a floating card.
 * Opens when `open` is true, closes via `onClose`, backdrop click or Esc.
 */
export default function ProfileModal({ open, onClose }) {
  const { user, refreshUser } = useAuth();

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    primaryTrade: '',
    experienceYears: '',
    city: '',
    serviceAreas: '',
    languages: '',
  });

  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /* Load data on open */
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      setSuccess('');

      setForm((f) => ({
        ...f,
        fullName: user?.fullName || '',
        phone: user?.phone || '',
        email: user?.email || '',
      }));

      try {
        const app = await api.application();
        if (!cancelled && app) {
          setForm((f) => ({
            ...f,
            primaryTrade: app.primaryTrade || '',
            experienceYears: app.experienceYears || '',
            city: app.city || '',
            serviceAreas: app.serviceAreas || '',
            languages: app.languages || '',
          }));
        }
      } catch {
        // no application — fine
      }

      try {
        const list = await api.services();
        if (!cancelled) {
          setTrades(list.filter((c) => !c.parentSlug && c.active !== false));
        }
      } catch {
        // ignore
      }

      if (!cancelled) setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, saving, onClose]);

  if (!open) return null;

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.fullName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      await api.updateProfile({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        primaryTrade: form.primaryTrade,
        experienceYears: Number(form.experienceYears) || 0,
        city: form.city.trim(),
        serviceAreas: form.serviceAreas.trim(),
        languages: form.languages.trim(),
      });

      if (refreshUser) await refreshUser();

      setSuccess('Profile updated successfully');

      // Auto-close after a short success message
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="profile-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="profile-modal" role="dialog" aria-modal="true">
        {/* ---------- HEADER ---------- */}
        <div className="profile-modal-head">
          <div>
            <span className="profile-modal-eyebrow">YOUR ACCOUNT</span>
            <h2 className="profile-modal-title">Edit Profile</h2>
            <p className="profile-modal-sub">
              Update your personal and professional details.
            </p>
          </div>

          <button
            type="button"
            className="profile-modal-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* ---------- BODY ---------- */}
        <form className="profile-modal-body" onSubmit={handleSubmit} noValidate>
          {loading ? (
            <p className="question-hint" style={{ padding: '40px 0', textAlign: 'center' }}>
              Loading your profile…
            </p>
          ) : (
            <>
              {/* Personal Info */}
              <div className="profile-modal-section">
                <h3 className="profile-modal-section-title">Personal Information</h3>

                <div className="profile-modal-grid">
                  <div className="profile-field">
                    <label htmlFor="pm-fullName">
                      Full Name <span className="req">*</span>
                    </label>
                    <input
                      id="pm-fullName"
                      type="text"
                      value={form.fullName}
                      onChange={update('fullName')}
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="profile-field">
                    <label htmlFor="pm-phone">Mobile Number</label>
                    <input
                      id="pm-phone"
                      type="tel"
                      value={form.phone}
                      onChange={update('phone')}
                      placeholder="98765 43210"
                      inputMode="numeric"
                    />
                  </div>

                  <div className="profile-field profile-field-full">
                    <label htmlFor="pm-email">Email Address</label>
                    <input
                      id="pm-email"
                      type="email"
                      value={form.email}
                      onChange={update('email')}
                      placeholder="name@domain.com"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Info */}
              <div className="profile-modal-section">
                <h3 className="profile-modal-section-title">Professional Information</h3>

                <div className="profile-modal-grid">
                  <div className="profile-field">
                    <label htmlFor="pm-primaryTrade">Primary Trade</label>
                    <select
                      id="pm-primaryTrade"
                      value={form.primaryTrade}
                      onChange={update('primaryTrade')}
                    >
                      <option value="">Choose your trade</option>
                      {trades.map((t) => (
                        <option key={t.slug} value={t.slug}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="profile-field">
                    <label htmlFor="pm-experienceYears">Years of Experience</label>
                    <input
                      id="pm-experienceYears"
                      type="number"
                      min="0"
                      max="60"
                      value={form.experienceYears}
                      onChange={update('experienceYears')}
                      placeholder="5"
                      inputMode="numeric"
                    />
                  </div>

                  <div className="profile-field">
                    <label htmlFor="pm-city">City</label>
                    <input
                      id="pm-city"
                      type="text"
                      value={form.city}
                      onChange={update('city')}
                      placeholder="Thane"
                    />
                  </div>

                  <div className="profile-field">
                    <label htmlFor="pm-serviceAreas">Service Areas</label>
                    <input
                      id="pm-serviceAreas"
                      type="text"
                      value={form.serviceAreas}
                      onChange={update('serviceAreas')}
                      placeholder="Thane West, Kalyan"
                    />
                  </div>

                  <div className="profile-field profile-field-full">
                    <label htmlFor="pm-languages">Languages You Speak</label>
                    <input
                      id="pm-languages"
                      type="text"
                      value={form.languages}
                      onChange={update('languages')}
                      placeholder="Hindi, Marathi, English"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div role="alert" className="alert alert-error">
                  <Icon name="info" size={18} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div role="status" className="alert alert-success">
                  <Icon name="check-circle" size={18} />
                  <span>{success}</span>
                </div>
              )}
            </>
          )}

          {/* ---------- FOOTER ---------- */}
          <div className="profile-modal-foot">
            <button
              type="button"
              className="profile-modal-btn-outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="profile-modal-btn-primary"
              disabled={saving || loading}
            >
              {saving ? 'Saving…' : 'Save Changes'}
              {!saving && <Icon name="arrow-right" size={15} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
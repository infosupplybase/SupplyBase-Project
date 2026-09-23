import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import { useAuth } from '../context/AuthContext';
import api, { friendlyError } from '../lib/api';
import '../styles/profile.css';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

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

  /* Load user + application data */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // Basic info from auth context
        setForm((f) => ({
          ...f,
          fullName: user?.fullName || '',
          phone: user?.phone || '',
          email: user?.email || '',
        }));

        // Professional info from application
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
        } catch (err) {
          // no application — fine
        }

        // Load trades list
        try {
          const list = await api.services();
          if (!cancelled) {
            setTrades(list.filter((c) => !c.parentSlug && c.active !== false));
          }
        } catch (err) {
          // ignore
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

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

      // Refresh the auth context so navbar shows updated name
      if (refreshUser) await refreshUser();

      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="container">
          <p className="question-hint">Loading your profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container">

        {/* Header */}
        <div className="profile-header">
          <Link to="/" className="profile-back">
            <Icon name="arrow-right" size={16} style={{ transform: 'rotate(180deg)' }} />
            Back to dashboard
          </Link>

          <span className="profile-eyebrow">YOUR ACCOUNT</span>
          <h1 className="profile-title">Profile</h1>
          <p className="profile-sub">
            Update your personal and professional information.
          </p>
        </div>

        {/* Form */}
        <form className="profile-form" onSubmit={handleSubmit} noValidate>

          {/* ============= PERSONAL INFO ============= */}
          <div className="profile-section">
            <div className="profile-section-head">
              <h2>Personal Information</h2>
              <p>Basic details about you.</p>
            </div>

            <div className="profile-grid">
              <div className="profile-field">
                <label htmlFor="pf-fullName">
                  Full Name <span className="req">*</span>
                </label>
                <input
                  id="pf-fullName"
                  type="text"
                  value={form.fullName}
                  onChange={update('fullName')}
                  placeholder="Your full name"
                />
              </div>

              <div className="profile-field">
                <label htmlFor="pf-phone">Mobile Number</label>
                <input
                  id="pf-phone"
                  type="tel"
                  value={form.phone}
                  onChange={update('phone')}
                  placeholder="98765 43210"
                  inputMode="numeric"
                />
              </div>

              <div className="profile-field">
                <label htmlFor="pf-email">Email Address</label>
                <input
                  id="pf-email"
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  placeholder="name@domain.com"
                />
              </div>
            </div>
          </div>

          {/* ============= PROFESSIONAL INFO ============= */}
          <div className="profile-section">
            <div className="profile-section-head">
              <h2>Professional Information</h2>
              <p>Your work details — helps us match you with the right jobs.</p>
            </div>

            <div className="profile-grid">
              <div className="profile-field">
                <label htmlFor="pf-primaryTrade">Primary Trade</label>
                <select
                  id="pf-primaryTrade"
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
                <label htmlFor="pf-experienceYears">Years of Experience</label>
                <input
                  id="pf-experienceYears"
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
                <label htmlFor="pf-city">City</label>
                <input
                  id="pf-city"
                  type="text"
                  value={form.city}
                  onChange={update('city')}
                  placeholder="Thane"
                />
              </div>

              <div className="profile-field profile-field-full">
                <label htmlFor="pf-serviceAreas">
                  Service Areas
                  <span className="profile-hint">Optional — localities you can travel to.</span>
                </label>
                <input
                  id="pf-serviceAreas"
                  type="text"
                  value={form.serviceAreas}
                  onChange={update('serviceAreas')}
                  placeholder="Thane West, Kalyan, Dombivli"
                />
              </div>

              <div className="profile-field profile-field-full">
                <label htmlFor="pf-languages">
                  Languages You Speak
                  <span className="profile-hint">Optional.</span>
                </label>
                <input
                  id="pf-languages"
                  type="text"
                  value={form.languages}
                  onChange={update('languages')}
                  placeholder="Hindi, Marathi, English"
                />
              </div>
            </div>
          </div>

          {/* ============= ERROR / SUCCESS ============= */}
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

          {/* ============= ACTIONS ============= */}
          <div className="profile-actions">
            <Link to="/" className="profile-btn-outline">
              Cancel
            </Link>
            <button
              type="submit"
              className="profile-btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save Changes'}
              {!saving && <Icon name="arrow-right" size={16} />}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
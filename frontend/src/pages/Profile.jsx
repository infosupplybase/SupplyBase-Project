import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import Reveal from '../components/ui/Reveal';
import AccountTabs from '../components/account/AccountTabs';
import AccountSidebar from '../components/account/AccountSidebar';
import { useAuth, friendlyError } from '../context/AuthContext';
import api from '../lib/api';
import { isValidPhone } from '../lib/bookingDetails';

const ROLE_LABELS = {
  CUSTOMER: 'Client',
  ADMIN: 'Admin',
  PROFESSIONAL: 'Professional',
};

/**
 * /dashboard/profile — the signed-in client's own account: edit name/phone,
 * see verification status, request a password reset email, sign out.
 * Separate page from Bookings so the bottom nav's two account tabs each go
 * somewhere real instead of both landing on one generic welcome screen.
 */
export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: user?.fullName || '', phone: user?.phone || '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  const [verifySending, setVerifySending] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState('');

  const [resetSending, setResetSending] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveMessage('');
    setSaveError('');

    const nextErrors = {};
    if (!form.fullName.trim()) nextErrors.fullName = 'Please enter your name';
    if (!form.phone.trim()) nextErrors.phone = 'Please enter your phone number';
    else if (!isValidPhone(form.phone)) nextErrors.phone = 'Enter a 10-digit mobile number';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      await api.updateProfile(form.fullName, form.phone.trim());
      await refreshUser();
      setSaveMessage('Your profile has been updated.');
    } catch (err) {
      setSaveError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSendVerification = async () => {
    setVerifyMessage('');
    setVerifySending(true);
    try {
      await api.sendVerificationEmail();
      setVerifyMessage('Verification email sent — check your inbox.');
    } catch (err) {
      setVerifyMessage(friendlyError(err));
    } finally {
      setVerifySending(false);
    }
  };

  const handleResetPassword = async () => {
    setResetMessage('');
    setResetSending(true);
    try {
      await api.forgotPassword(user.email);
      setResetMessage('A password reset link has been emailed to you.');
    } catch (err) {
      setResetMessage(friendlyError(err));
    } finally {
      setResetSending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <>
      <PageHero
        eyebrow="YOUR ACCOUNT"
        title="MY PROFILE"
        text="Your details, how we reach you, and your account security."
        image="/assets/hero-house.svg"
        breadcrumbs={[{ label: 'My Account', to: '/dashboard' }, { label: 'Profile' }]}
      />

      <section className="section">
        <div className="container">
          <div className="service-layout">
            <div>
              <AccountTabs />

              <Reveal>
                <span className="eyebrow">ACCOUNT DETAILS</span>
                <div className="rule" />
                <h2 style={{ marginBottom: 20 }}>YOUR INFORMATION</h2>

                <form className="form-grid" onSubmit={handleSave} noValidate>
                  <div className={`field ${errors.fullName ? 'error' : ''}`}>
                    <label htmlFor="p-name">
                      Full Name <span className="req">*</span>
                    </label>
                    <input id="p-name" type="text" value={form.fullName} onChange={update('fullName')} />
                    {errors.fullName && <span className="field-error">{errors.fullName}</span>}
                  </div>

                  <div className={`field ${errors.phone ? 'error' : ''}`}>
                    <label htmlFor="p-phone">
                      Phone Number <span className="req">*</span>
                    </label>
                    <input id="p-phone" type="tel" value={form.phone} onChange={update('phone')} />
                    {errors.phone && <span className="field-error">{errors.phone}</span>}
                  </div>

                  <div className="field">
                    <label htmlFor="p-email">Email</label>
                    <input id="p-email" type="email" value={user.email} disabled />
                    <span className="field-hint">Email cannot be changed here — contact us if it needs to change.</span>
                  </div>

                  <div className="field">
                    <label>Account Type</label>
                    <input type="text" value={ROLE_LABELS[user.role] || user.role} disabled />
                  </div>

                  <div className="field full" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    {saveMessage && (
                      <span style={{ color: 'var(--success)', fontSize: '0.9rem' }}>
                        <Icon name="check-circle" size={16} /> {saveMessage}
                      </span>
                    )}
                    {saveError && <span className="field-error">{saveError}</span>}
                  </div>
                </form>
              </Reveal>

              <Reveal delay={80}>
                <div className="acct-security-card">
                  <h4>Email Verification</h4>
                  {user.emailVerified ? (
                    <p className="acct-verified">
                      <Icon name="check-circle" size={17} /> Your email is verified.
                    </p>
                  ) : (
                    <>
                      <p>Your email is not verified yet.</p>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={handleSendVerification}
                        disabled={verifySending}
                      >
                        {verifySending ? 'Sending…' : 'Resend Verification Email'}
                      </button>
                      {verifyMessage && <p className="form-hint">{verifyMessage}</p>}
                    </>
                  )}
                </div>

                {user.hasPassword && (
                  <div className="acct-security-card">
                    <h4>Password</h4>
                    <p>Get a link by email to set a new password.</p>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handleResetPassword}
                      disabled={resetSending}
                    >
                      {resetSending ? 'Sending…' : 'Reset Your Password'}
                    </button>
                    {resetMessage && <p className="form-hint">{resetMessage}</p>}
                  </div>
                )}

                <button type="button" className="btn btn-outline btn-block" onClick={handleLogout}>
                  <Icon name="lock" size={16} />
                  SIGN OUT
                </button>
              </Reveal>
            </div>

            <AccountSidebar />
          </div>
        </div>
      </section>
    </>
  );
}

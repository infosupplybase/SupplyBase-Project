import { useState } from 'react';
import Icon from '../ui/Icon';
import { IDLE_MINUTES } from '../../context/AuthContext';
import api, { friendlyError } from '../../lib/api';

/** "ravi.kumar@gmail.com" -> "ra•••••••@gmail.com", so the full address is not on screen. */
export const maskEmail = (email) => {
  const [name, domain] = String(email || '').split('@');
  if (!domain) return email || '';
  const keep = name.slice(0, Math.min(2, name.length));
  return `${keep}${'•'.repeat(Math.max(3, name.length - keep.length))}@${domain}`;
};

/**
 * Account safety in plain words: how long this device stays signed in, a way
 * to reset the password (a link to their email — the portal never shows or
 * asks for the old one), a sign-out button, and the two rules that keep
 * partners and customers safe.
 */
export default function SecurityCard({ user, remembered, onSignOut }) {
  const [state, setState] = useState({ busy: false, sent: false, error: '' });

  const sendReset = async () => {
    setState({ busy: true, sent: false, error: '' });
    try {
      await api.forgotPassword(user.email);
      setState({ busy: false, sent: true, error: '' });
    } catch (err) {
      setState({ busy: false, sent: false, error: friendlyError(err) });
    }
  };

  return (
    <div className="pp-card pp-security">
      <h3>
        <Icon name="shield" size={18} /> Account safety
      </h3>

      <div className="pp-device">
        <span className="pp-device-icon" aria-hidden="true">
          <Icon name={remembered ? 'lock' : 'clock'} size={18} />
        </span>
        <p>
          <strong>{remembered ? 'Kept signed in on this device' : 'Signed in for this visit only'}</strong>
          <span>
            {remembered
              ? 'Only choose this on your own phone. Sign out if anyone else uses it.'
              : `You are signed out when you close the browser, or after ${IDLE_MINUTES} minutes without activity.`}
          </span>
        </p>
      </div>

      <div className="pp-security-actions">
        <button type="button" className="btn btn-outline btn-block" onClick={sendReset} disabled={state.busy || state.sent}>
          <Icon name="key" size={17} />
          {state.busy ? 'Sending…' : state.sent ? 'Reset link sent' : 'Change password'}
        </button>
        <button type="button" className="btn btn-dark btn-block" onClick={onSignOut}>
          <Icon name="logout" size={17} /> Sign out
        </button>
      </div>

      {state.sent && (
        <p className="pp-security-msg" role="status">
          We sent a link to {maskEmail(user.email)}. Open it to choose a new password.
        </p>
      )}
      {state.error && (
        <p className="pp-security-msg is-error" role="alert">
          {state.error}
        </p>
      )}

      <ul className="pp-tips">
        <li>
          <Icon name="check" size={15} strokeWidth={2.4} />
          Never share your password or an OTP with anyone, even someone who says they are from Supplybase.
        </li>
        <li>
          <Icon name="check" size={15} strokeWidth={2.4} />
          Use customers&apos; numbers and addresses only for their job, and never share them.
        </li>
      </ul>
    </div>
  );
}

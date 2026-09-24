import Icon from '../ui/Icon';
import { PARTNER_PHONE, PARTNER_PHONE_RAW } from '../../config';

/**
 * The partner desk: a WhatsApp chat and a phone call, on the partner number
 * (not the customer line). Shown to everyone signed in, whatever their status.
 */
export default function SupportCard({ firstName }) {
  const text = `Hello Supplybase, ${firstName ? `this is ${firstName}. ` : ''}I need help with my partner account.`;

  return (
    <div className="partner-side-card pd-support">
      <h3>Partner support</h3>
      <p>Questions about a job, a payout or your account? Talk to the partner desk.</p>

      <a
        className="btn btn-primary btn-block"
        href={`https://wa.me/${PARTNER_PHONE_RAW}?text=${encodeURIComponent(text)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon name="whatsapp" size={17} /> WhatsApp us
      </a>

      <a className="btn btn-outline btn-block" href={`tel:+${PARTNER_PHONE_RAW}`}>
        <Icon name="phone" size={17} /> {PARTNER_PHONE}
      </a>
    </div>
  );
}

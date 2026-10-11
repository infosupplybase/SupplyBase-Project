import { useState } from 'react';
import Icon from '../ui/Icon';
import { activeServices } from '../../data/services';
import useServiceCatalogue from '../../hooks/useServiceCatalogue';
import { projectTypes, budgetRanges, contact } from '../../data/siteConfig';
import { buildEnquiryMessage, whatsappHref, mailtoWith, telHref } from '../../lib/contact';
import { trackEvent } from '../../lib/analytics';
import api from '../../lib/api';

/**
 * QuoteForm — enquiry form.
 *
 * Every submission does two independent things: it saves to the backend
 * (so the office can see it in the admin panel even if the customer never
 * presses send in WhatsApp/email), and it still hands the completed enquiry
 * to WhatsApp or email with every field pre-filled, exactly as before.
 *
 * The backend save must never block the WhatsApp/email hand-off — that is
 * the part the customer actually sees succeed, so a failed save here is
 * logged and swallowed rather than shown as an error.
 */
const submitToBackend = async (payload, source) => {
  try {
    await api.createEnquiry({
      name: payload.name,
      phone: payload.phone,
      email: payload.email || null,
      projectType: payload.projectType || null,
      service: payload.service || null,
      location: payload.location || null,
      budget: payload.budget || null,
      description: payload.description,
      source,
    });
  } catch (err) {
    console.error('Failed to save enquiry to the backend', err);
  }
};

/**
 * A 10-digit number once the "+91" the placeholder suggests, a leading 0 and
 * any spaces or dashes are taken off. Landlines are fine here (an office
 * enquiry may give one), so unlike the booking form it does not insist on a
 * mobile number.
 */
const isValidEnquiryPhone = (value) => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.length === 10;
};

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  projectType: '',
  service: '',
  location: '',
  budget: '',
  description: '',
};

export default function QuoteForm({ defaultService = '', compact = false, source = 'QUOTE_FORM' }) {
  const [form, setForm] = useState({ ...emptyForm, service: defaultService });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(null); // null | 'whatsapp' | 'email'

  // Same services, same order as the rest of the site; the static list only
  // fills in until the catalogue arrives.
  const { services } = useServiceCatalogue(activeServices);

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    // Letters in any script, plus the spaces, dots, apostrophes and hyphens
    // real names carry (D'Souza, S. Kumar, Anne-Marie).
    if (!form.name.trim()) next.name = 'Please enter your name';
    else if (!/^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u.test(form.name.trim())) next.name = 'Please enter a valid name';
    // Accepts the "+91" the placeholder suggests, spaces and a leading 0.
    if (!form.phone.trim()) next.phone = 'Please enter your phone number';
    else if (!isValidEnquiryPhone(form.phone)) next.phone = 'Please enter a valid 10-digit phone number';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = 'Please enter a valid email address';
    if (!form.projectType) next.projectType = 'Please select a project type';
    if (!form.description.trim()) next.description = 'Please enter your project description';
    else if (form.description.trim().length < 20)
      next.description = 'Please describe your project in a little more detail';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (channel) => (e) => {
    e.preventDefault();
    if (!validate()) {
      const firstError = document.querySelector('.field.error input, .field.error select, .field.error textarea');
      if (firstError) firstError.focus();
      return;
    }

    const payload = { ...form, fileNames: files.map((f) => f.name) };
    const message = buildEnquiryMessage(payload);

    // Open WhatsApp / the email app first, while the click still counts as
    // the user's own action: a window opened after an `await` is treated as
    // a pop-up and blocked (Safari on iPhone always does), which left people
    // on "Thank you" with nothing sent. The backend save runs alongside.
    if (channel === 'email') {
      window.location.href = mailtoWith(`Project enquiry — ${form.name}`, message);
    } else {
      window.open(whatsappHref(message), '_blank', 'noopener');
    }
    submitToBackend(form, source);
    trackEvent('generate_lead', { lead_source: 'quote_form', method: channel, service: form.service || 'none' });
    setSent(channel);
  };

  const reset = () => {
    setForm({ ...emptyForm, service: defaultService });
    setFiles([]);
    setErrors({});
    setSent(null);
  };

  if (sent) {
    return (
      <div
  className="
    form-card
    !bg-white/25
    backdrop-blur-xl
    !border-white/20
    !shadow-[0_10px_35px_rgba(0,0,0,0.10)]
  "
>
        <div className="form-success">
          <div className="form-success-icon">
            <Icon name="check" size={34} strokeWidth={2} />
          </div>
          <h3>Thank you, {form.name.split(' ')[0]}.</h3>
          <p style={{ color: 'var(--grey-600)', maxWidth: '48ch', margin: '0 auto 20px' }}>
            {sent === 'whatsapp'
              ? 'Your enquiry has been prepared in WhatsApp with all your details filled in. Press send in WhatsApp to deliver it to our team.'
              : 'Your enquiry has been prepared in your email app with all your details filled in. Press send to deliver it to our team.'}
            {files.length > 0 && ' Please attach your images or plans to that message before sending.'}
          </p>
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <a href={telHref} className="btn btn-dark">
              <Icon name="phone" size={17} />
              CALL {contact.phoneDisplay}
            </a>
            <button type="button" className="btn btn-ghost" onClick={reset}>
              SEND ANOTHER ENQUIRY
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
  className="
    form-card
    !bg-white/10
    backdrop-blur-xl
    !border-white/40
    !shadow-[0_10px_35px_rgba(0,0,0,0.10)]
  "
  onSubmit={handleSubmit('whatsapp')}
  noValidate
>
      <div className="form-grid">
        <div className={`field ${errors.name ? 'error' : ''}`}>
          <label htmlFor="q-name">
            Full Name <span className="req">*</span>
          </label>
          <input id="q-name" autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'q-name-error' : undefined} type="text" value={form.name} onChange={update('name')} placeholder="Your name" />
          {errors.name && <span className="field-error" id="q-name-error">{errors.name}</span>}
        </div>

        <div className={`field ${errors.phone ? 'error' : ''}`}>
          <label htmlFor="q-phone">
            Phone Number <span className="req">*</span>
          </label>
          <input id="q-phone" autoComplete="tel" inputMode="tel" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'q-phone-error' : undefined} type="tel" value={form.phone} onChange={update('phone')} placeholder="+91 " />
          {errors.phone && <span className="field-error" id="q-phone-error">{errors.phone}</span>}
        </div>

        <div className={`field ${errors.email ? 'error' : ''}`}>
          <label htmlFor="q-email">Email</label>
          <input id="q-email" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'q-email-error' : undefined} type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" />
          {errors.email && <span className="field-error" id="q-email-error">{errors.email}</span>}
        </div>

        <div className={`field ${errors.projectType ? 'error' : ''}`}>
          <label htmlFor="q-type">
            Project Type <span className="req">*</span>
          </label>
          <select id="q-type" aria-invalid={!!errors.projectType} aria-describedby={errors.projectType ? 'q-type-error' : undefined} value={form.projectType} onChange={update('projectType')}>
            <option value="">Select project type</option>
            {projectTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.projectType && <span className="field-error" id="q-type-error">{errors.projectType}</span>}
        </div>

        <div className="field">
          <label htmlFor="q-service">Service Required</label>
          <select id="q-service" value={form.service} onChange={update('service')}>
            <option value="">Select a service</option>
            {services.map((service) => (
              <option key={service.slug} value={service.name}>
                {service.name}
              </option>
            ))}
            <option value="Not sure yet">Not sure yet</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="q-location">Project Location</label>
          <input
            id="q-location"
            type="text"
            value={form.location}
            onChange={update('location')}
            placeholder="Area, city"
          />
        </div>

        {!compact && (
          <div className="field">
            <label htmlFor="q-budget">Approximate Budget</label>
            <select id="q-budget" value={form.budget} onChange={update('budget')}>
              <option value="">Select a range</option>
              {budgetRanges.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={`field full ${errors.description ? 'error' : ''}`}>
          <label htmlFor="q-desc">
            Project Description <span className="req">*</span>
          </label>
          <textarea
            id="q-desc"
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? 'q-desc-error' : undefined}
            value={form.description}
            onChange={update('description')}
            placeholder="Tell us about the property, the scope of work and your expected timeline."
          />
          {errors.description && <span className="field-error" id="q-desc-error">{errors.description}</span>}
        </div>

        {!compact && (
          <div className="field full">
            <label htmlFor="q-files">Upload Images / Plans</label>
            <label className="file-drop" htmlFor="q-files">
              <Icon name="upload" size={26} />
              <span>
                {files.length
                  ? `${files.length} file${files.length > 1 ? 's' : ''} selected`
                  : 'Click to select drawings, plans or site photos'}
              </span>
              <input
                id="q-files"
                type="file"
                multiple
                accept="image/*,.pdf,.dwg"
                className="sr-only"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />
            </label>
            {files.length > 0 && (
              <ul className="file-list">
                {files.map((file) => (
                  <li key={file.name}>• {file.name}</li>
                ))}
              </ul>
            )}
            <span className="field-hint">
              Files stay on your device — attach them to the WhatsApp or email message that opens next.
            </span>
          </div>
        )}
      </div>

      <div className="btn-row" style={{ marginTop: 22 }}>
        <button type="submit" className="btn btn-whatsapp btn-lg">
          <Icon name="whatsapp" size={18} />
          SEND VIA WHATSAPP
        </button>
        <button type="button" className="btn btn-dark btn-lg" onClick={handleSubmit('email')}>
          <Icon name="mail" size={18} />
          SEND BY EMAIL
        </button>
      </div>

      
    </form>
  );
}

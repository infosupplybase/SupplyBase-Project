import { contact, company } from '../data/siteConfig';

/** tel: link built from the official number in siteConfig. */
export const telHref = `tel:+${contact.phoneRaw}`;

/** mailto: link built from the official email in siteConfig. */
export const mailtoHref = `mailto:${contact.email}`;

/**
 * WhatsApp link. Pass a message to pre-fill the chat.
 */
export const whatsappHref = (message) => {
  const text =
    message ||
    `Hello ${company.name}, I would like to discuss a project.`;
  return `https://wa.me/${contact.phoneRaw}?text=${encodeURIComponent(text)}`;
};

/** mailto: link with a subject and body pre-filled. */
export const mailtoWith = (subject, body) =>
  `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

/**
 * Builds the enquiry text used by the quote form for both WhatsApp and email.
 * Keeping it in one place means both channels always send the same information.
 */
export const buildEnquiryMessage = (form) => {
  const lines = [
    `New enquiry — ${company.name}`,
    '',
    `Name: ${form.name || '-'}`,
    `Phone: ${form.phone || '-'}`,
    `Email: ${form.email || '-'}`,
    `Project Type: ${form.projectType || '-'}`,
    `Service Required: ${form.service || '-'}`,
    `Project Location: ${form.location || '-'}`,
    `Approximate Budget: ${form.budget || '-'}`,
    '',
    'Project Description:',
    form.description || '-',
  ];
  if (form.fileNames && form.fileNames.length) {
    lines.push('', `Attachments to send: ${form.fileNames.join(', ')}`);
  }
  return lines.join('\n');
};

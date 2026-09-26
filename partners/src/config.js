/**
 * Things that differ per deployment, or that the portal borrows from the main
 * Supplybase site rather than duplicating.
 */

/**
 * The customer-facing website. The portal links out to it for the Terms and
 * Privacy Policy, "book a service", and the logo — those live there, and
 * copying legal text into a second app would let the two drift apart.
 * Set VITE_SITE_URL to change it; no trailing slash.
 */
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://www.supplybase.co.in').replace(/\/$/, '');

/**
 * Supplybase's partner desk — the number partners (and people wanting to
 * become partners) call and WhatsApp. It is a different number from the
 * customer line on the main website (+91 77095 88422), so do not swap them.
 *
 * `PARTNER_PHONE_RAW` is digits with the country code and no "+", which is the
 * form wa.me and tel: links need; a wa.me link without the 91 does not open a
 * chat with an Indian number.
 */
export const PARTNER_PHONE = '+91 83569 28520';
export const PARTNER_PHONE_RAW = '918356928520';

/** Shown to a partner whose application was declined or whose access is paused. */
export const SUPPORT_PHONE = PARTNER_PHONE;

export const COMPANY_NAME = 'Supplybase';

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

/** Shown to a partner whose application was declined or whose access is paused. */
export const SUPPORT_PHONE = '+91 77095 88422';

export const COMPANY_NAME = 'Supplybase';

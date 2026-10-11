/**
 * Sends a conversion event to Google Analytics 4, when GA4 is running
 * (public/ga4.js starts it; it does not on some pages and may be blocked).
 * Never pass names, phone numbers, emails, addresses or messages here:
 * only what kind of thing happened.
 */
export function trackEvent(name, params = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', name, params);
    }
  } catch {
    // Analytics must never break the page.
  }
}

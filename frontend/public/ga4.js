// Google Analytics 4 (Google tag), loaded from <head> in index.html on every
// page. It lives in its own file rather than inline because the site's
// Content-Security-Policy (vercel.json) blocks inline scripts.
//
// To change the GA4 property, edit MEASUREMENT_ID below; nothing else needs
// touching. Page changes inside the app are counted by GA4's enhanced
// measurement ("page changes based on browser history events"), which is on
// by default for a web data stream.
(function () {
  var MEASUREMENT_ID = 'G-V3NXRZJG5J';

  // Google's placeholder ID: do nothing until the real one is filled in.
  if (!/^G-[A-Z0-9]+$/.test(MEASUREMENT_ID) || MEASUREMENT_ID === 'G-XXXXXXXXXX') return;

  // Password-reset and email-verification links carry a secret ?token= in
  // the address, and GA4 sends the full address with every hit. These pages
  // are only ever opened from an emailed link (a full page load), so not
  // starting GA here keeps those tokens out of Google Analytics.
  if (/^\/(reset-password|verify-email)\/?$/.test(window.location.pathname)) return;

  var loader = document.createElement('script');
  loader.async = true;
  loader.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
  document.head.appendChild(loader);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID);

  // Contact taps anywhere on the site: call, WhatsApp and email links.
  // Only the kind of link and the page are sent, never the number or text.
  // (The quote form and paid bookings send their own events from the app.)
  document.addEventListener('click', function (event) {
    var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!link) return;
    var href = link.getAttribute('href') || '';
    var method = /^tel:/i.test(href) ? 'phone'
      : /^https:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(href) ? 'whatsapp'
      : /^mailto:/i.test(href) ? 'email'
      : null;
    if (!method) return;
    window.gtag('event', 'contact_click', { method: method, page_path: window.location.pathname });
  }, true);
})();

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
})();

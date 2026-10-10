/**
 * Build step: one HTML file per public page, plus sitemap.xml.
 *
 * The site is a single-page app, so before this every address was served
 * the same index.html: the home page's title, description, canonical link
 * and link preview, until JavaScript ran. Search engines and link previews
 * (WhatsApp, Facebook) that read the first HTML saw every page as the home
 * page.
 *
 * After `vite build`, this writes dist/<path>/index.html for each page in
 * `indexable` (src/data/seo.js) with that page's own title, description,
 * canonical link, preview tags, structured data and a short no-JavaScript
 * summary. Vercel serves a real file ahead of the rewrites in vercel.json,
 * so /services/painting gets dist/services/painting/index.html; deeper
 * booking steps still fall through to the app as before. The React app
 * itself is unchanged and takes over as soon as it loads.
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { indexable, SITE_URL, SITE_NAME } from '../src/data/seo.js';
import { serviceSeoContent, relatedServiceLinks, SERVICE_AREAS } from '../src/data/serviceSeoContent.js';

const LOGO = '/assets/brand/logo-full.jpg';
const PHONE_DISPLAY = '+91 91373 06446';
const PHONE_TEL = '+919137306446';
const EMAIL = 'info.supplybase@gmail.com';

/** Breadcrumb trail names, by path. */
const crumbNames = {
  '/services': 'Services',
  '/interior-by-choice': 'Interior by Choice',
  '/about': 'About Us',
  '/contact': 'Contact Us',
  '/quote': 'Get a Quote',
  '/privacy-policy': 'Privacy Policy',
  '/terms': 'Terms & Conditions',
};

/** Home page banner: the first slide, preloaded so it starts downloading
    with the HTML instead of after the app's JavaScript (the page's LCP). */
const HOME_PRELOAD = [
  '<link rel="preload" as="image" href="/assets/home-slider/4.webp" media="(max-width: 767px)" fetchpriority="high" />',
  '<link rel="preload" as="image" href="/assets/home-slider/1.webp" media="(min-width: 768px)" fetchpriority="high" />',
].join('\n    ');

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const jsonLd = (data) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

const serviceSlug = (path) => path.replace(/^\/services\//, '');

function breadcrumbs(path, meta) {
  if (path === '/') return null;
  const items = [{ name: 'Home', url: SITE_URL + '/' }];
  if (path.startsWith('/services/')) {
    items.push({ name: 'Services', url: SITE_URL + '/services' });
    const content = serviceSeoContent[serviceSlug(path)];
    items.push({ name: content ? content.name : meta.title.split(' | ')[0], url: SITE_URL + path });
  } else {
    items.push({ name: crumbNames[path] || meta.title.split(' | ')[0], url: SITE_URL + path });
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

function serviceSchema(path, content, meta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: content.name,
    serviceType: content.serviceType,
    description: meta.description,
    url: SITE_URL + path,
    provider: { '@id': SITE_URL + '/#business' },
    areaServed: SERVICE_AREAS.map((name) => ({ '@type': 'City', name })),
  };
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL + '/',
  publisher: { '@id': SITE_URL + '/#business' },
};

/** The no-JavaScript summary for a page: its heading, what it is about and
    links onward, so the first HTML is not an empty shell. */
function noscriptBody(path, meta) {
  const content = serviceSeoContent[serviceSlug(path)];
  const services = Object.values(relatedServiceLinks)
    .map((l) => `<a href="${l.path}">${esc(l.label)}</a>`)
    .join(' - ');
  const parts = [];
  if (content) {
    parts.push(`<h1 style="font-size: 24px">${esc(content.h1)}</h1>`);
    parts.push(`<p>${esc(content.intro)}</p>`);
    parts.push(`<h2 style="font-size: 18px">${esc(content.includesTitle)}</h2>`);
    parts.push(`<ul>${content.includes.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`);
  } else {
    parts.push(`<h1 style="font-size: 24px">${esc(meta.title.split(' | ')[path === '/' ? 1 : 0] || meta.title)}</h1>`);
    parts.push(`<p>${esc(meta.description)}</p>`);
  }
  parts.push(
    `<p>We serve ${esc(SERVICE_AREAS.join(', '))}, every day from 9:00 AM to 9:00 PM. ` +
      `This website needs JavaScript to book a visit. Please turn it on, or reach us directly: ` +
      `call or WhatsApp <a href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a> or write to ` +
      `<a href="mailto:${EMAIL}">${EMAIL}</a>.</p>`
  );
  parts.push(`<p>Our services: ${services}</p>`);
  parts.push(
    `<p><a href="/">Home</a> - <a href="/services">All services</a> - <a href="/about">About us</a> - ` +
      `<a href="/contact">Contact us</a> - <a href="/quote">Get a quote</a></p>`
  );
  return parts.join('\n        ');
}

function setTag(html, pattern, replacement, label) {
  if (!pattern.test(html)) throw new Error(`prerender: could not find ${label} in index.html`);
  return html.replace(pattern, replacement);
}

export function renderPage(template, path) {
  const meta = indexable[path];
  const url = SITE_URL + (path === '/' ? '/' : path);
  const image = SITE_URL + (meta.image || LOGO);
  let html = template;

  html = setTag(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(meta.title)}</title>`, 'title');
  html = setTag(html, /(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${esc(meta.description)}$2`, 'description');
  html = setTag(html, /(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`, 'canonical');
  html = setTag(html, /(<meta property="og:title" content=")[^"]*(")/, `$1${esc(meta.title)}$2`, 'og:title');
  html = setTag(html, /(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${esc(meta.description)}$2`, 'og:description');
  html = setTag(html, /(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`, 'og:url');
  html = setTag(html, /(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(meta.title)}$2`, 'twitter:title');
  html = setTag(html, /(<meta\s+name="twitter:description"\s+content=")[^"]*(")/, `$1${esc(meta.description)}$2`, 'twitter:description');

  if (meta.image) {
    // A photo instead of the square logo: drop the logo's fixed size and alt.
    html = setTag(html, /(<meta property="og:image" content=")[^"]*(")/, `$1${image}$2`, 'og:image');
    html = html.replace(/\s*<meta property="og:image:(width|height|alt)"[^>]*>/g, '');
    html = setTag(html, /(<meta name="twitter:image" content=")[^"]*(")/, `$1${image}$2`, 'twitter:image');
    html = html.replace('<meta name="twitter:card" content="summary" />', '<meta name="twitter:card" content="summary_large_image" />');
  }

  const extra = [];
  if (path === '/') {
    extra.push(HOME_PRELOAD);
    extra.push(jsonLd(websiteSchema));
  }
  const content = serviceSeoContent[serviceSlug(path)];
  if (path.startsWith('/services/') && content) extra.push(jsonLd(serviceSchema(path, content, meta)));
  const crumbs = breadcrumbs(path, meta);
  if (crumbs) extra.push(jsonLd(crumbs));
  html = setTag(html, /<\/head>/, `    ${extra.join('\n    ')}\n  </head>`, '</head>');

  html = setTag(
    html,
    /(<noscript>\s*<div[^>]*>)[\s\S]*?(<\/div>\s*<\/noscript>)/,
    `$1\n        ${noscriptBody(path, meta)}\n      $2`,
    'noscript block'
  );
  return html;
}

export function sitemap() {
  const urls = Object.keys(indexable).map((path) => {
    const priority = path === '/' ? '1.0' : path === '/services' ? '0.9' : path.startsWith('/services/') ? '0.8' : ['/privacy-policy', '/terms'].includes(path) ? '0.2' : '0.6';
    return `  <url><loc>${SITE_URL}${path === '/' ? '/' : path}</loc><priority>${priority}</priority></url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Written by the build from \`indexable\` in src/data/seo.js. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
}

/** Vite plugin: runs once the bundle is written. */
export function prerenderPages() {
  return {
    name: 'prerender-pages',
    apply: 'build',
    writeBundle(options) {
      const dir = options.dir;
      const template = readFileSync(join(dir, 'index.html'), 'utf8');

      // Unknown addresses: the app's own "Page not found" screen, never indexed.
      const notFound = setTag(template, /<meta name="theme-color"/, '<meta name="robots" content="noindex" />\n    <meta name="theme-color"', 'theme-color');
      writeFileSync(join(dir, '404.html'), notFound);

      for (const path of Object.keys(indexable)) {
        const html = renderPage(template, path);
        const out = path === '/' ? join(dir, 'index.html') : join(dir, path.slice(1), 'index.html');
        mkdirSync(join(out, '..'), { recursive: true });
        writeFileSync(out, html);
      }
      writeFileSync(join(dir, 'sitemap.xml'), sitemap());
    },
  };
}

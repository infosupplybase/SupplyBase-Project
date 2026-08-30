# Supplybase Projects — Website

**ONE PARTNER. COMPLETE PROJECT.**

A React + Vite website for Supplybase Projects — construction, architectural design, interior design and turnkey project execution.

---

## 1. Run it

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install       # first time only
npm run dev       # starts the dev server at http://localhost:5173
npm run build     # production build into /dist
npm run preview   # preview the production build locally
```

## 2. Deploy it

For the production website/API split, follow [`DEPLOYMENT.md`](DEPLOYMENT.md).
It covers Vercel for React and Render/Railway for Spring Boot, including the
environment variables that must be set on each platform.

The build output is a static site, so it works on Vercel, Netlify, Render or any static host.

- **Vercel:** import the repo → framework preset *Vite* → deploy. Nothing else to configure.
- **Netlify:** build command `npm run build`, publish directory `dist`.
- **Any other host:** upload the contents of `dist/` and add a rewrite rule sending all paths to `index.html` (needed for client-side routing). A ready-made `vercel.json` is included for that.

---

## 3. The first three things to change

### a) Your logo — already done ✅

Your real logo is in place. Because the original is square (and square shapes don't fit in a website header), it was cut into pieces and rebuilt into these files:

| File | Used on |
|---|---|
| `public/assets/brand/logo.png` | header, mobile menu, login — house and name side by side |
| `public/assets/brand/logo-stacked.png` | footer — house above the name |
| `public/assets/brand/favicon.png` | browser tab icon |
| `public/assets/brand/logo-full.jpg` | the picture shown when someone shares your link |

The black background was removed so the logo sits cleanly on any colour. If you ever get a proper logo file from a designer, replace these keeping the same names.

### b) Your photographs

Every image is a placeholder. Replace the files in `public/assets/` keeping the same names and nothing in the code has to change:

```
public/assets/hero-house.svg          ← your 3D architectural render (the main hero image)
public/assets/services/*.svg          ← one image per service category
public/assets/projects/*.svg          ← one image per project
```

If you use `.jpg` instead of `.svg`, update the path in the matching data file (`src/data/services.js`, `src/data/projects.js`) or in `src/components/home/Hero.jsx`.

### c) Your real projects

`src/data/projects.js` contains **sample projects** to show the layout. Replace them with your completed work — name, location, area, duration, description, scope and images.

---

## 4. Everything is data-driven

You should almost never need to touch a component to change content.

| What you want to change | File |
|---|---|
| Phone, email, address, working hours, service areas | `src/data/siteConfig.js` |
| Statistics (100+ projects, 30+ professionals…) | `src/data/siteConfig.js` → `stats` |
| Social media links (empty = hidden) | `src/data/siteConfig.js` → `social` |
| Trust bar, why-us points, how-it-works steps | `src/data/siteConfig.js` |
| Quote form dropdowns (project types, budgets) | `src/data/siteConfig.js` |
| Booking services, property types, time slots | `src/data/booking.js` |
| Services, sub-services, FAQs, process | `src/data/services.js` |
| Projects | `src/data/projects.js` |
| Colours, fonts, spacing | `src/styles/base.css` (CSS variables at the top) |

**Adding a service:** copy one object in `src/data/services.js`, change the values, and it appears automatically in the home page grid, the services page, the header mega menu, the footer, the quote form dropdown, and gets its own page at `/services/<slug>`.

**Adding a project:** same idea in `src/data/projects.js` → it appears on the home page (if `featured: true`), the projects page, its category filter, the related-projects strip on every service it lists, and gets a page at `/projects/<slug>`.

---

## 5. Routes

| Path | Page |
|---|---|
| `/` | Home |
| `/services` | All services |
| `/services/:slug` | Service detail — one template, all 10 services |
| `/projects` | Projects with category filtering |
| `/projects/:slug` | Project detail |
| `/materials` | Materials and brands we use |
| `/book` | Book a site visit (`?type=service` or `?type=project`) |
| `/about` | About Us |
| `/contact` | Contact + enquiry form |
| `/quote` | Get a Quote (`?service=<slug>` pre-selects a service) |
| `/login` | Login |
| `/dashboard` | Client account page — only opens once signed in |
| `/privacy-policy`, `/terms` | Legal pages |
| anything else | 404 page |

---

## 6. How the quote form works right now

**There is no backend, and the site does not pretend there is one.**

The form validates what you type, then hands the completed enquiry to **WhatsApp** or **email** with every field already filled in. You (or your client) press send in your own app. Nothing is stored on a server and no email is sent automatically.

Selected files stay on the user's device — the form lists their names in the message and asks the user to attach them.

**To connect a real backend later:** open `src/components/forms/QuoteForm.jsx`. There is a `submitToBackend` function at the top with a commented example and a `USE_BACKEND` flag. Fill in your API call and flip the flag — nothing else changes.

---

## 7. Setting up login

Login is real and secure, and it is handled by **our own backend** in
`backend/` — not by any third party. Start that first: see
[backend/README.md](backend/README.md).

### Step 1 — Point the website at the API (1 min)

Copy `.env.example` to `.env`. For local work the defaults are already right:

```
VITE_API_URL=http://localhost:8080
```

Everything prefixed `VITE_` is compiled into the JavaScript a browser
downloads, so treat it as public. Nothing secret belongs in this file —
secrets live in `backend/.env`, which never reaches a browser.

### Step 2 — Adding "Continue with Google" (10 min, optional)

Skip this and the site still works; the Google button simply does not appear
and people sign in with email and password.

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and
   create a project (or pick an existing one).
2. **APIs & Services → OAuth consent screen.** Choose **External**, fill in the
   app name, your support email and a logo, then save.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID.**
   - Application type: **Web application**
   - **Authorised JavaScript origins:** `http://localhost:5173` for local work,
     plus your live address (e.g. `https://supplybase.co.in`) when you deploy
   - Leave "Authorised redirect URIs" empty — this sign-in method does not use one
4. Copy the **Client ID**. It ends in `.apps.googleusercontent.com`.
5. Put the *same* value in **both** files:

   ```
   .env             VITE_GOOGLE_CLIENT_ID=<your client id>
   backend/.env     GOOGLE_CLIENT_ID=<your client id>
   ```

   They must match. The backend refuses any Google token that was not issued
   for exactly this client id, so a mismatch rejects every sign-in.

6. Restart both `npm run dev` and the backend.

There is no client *secret* anywhere in this flow. Google signs a token, the
browser passes it on, and the backend verifies the signature against Google's
public keys — nothing on our side needs to prove who it is.

### Step 3 — Create your first admin (2 min)

Anyone can register, and everyone who registers is a **client**. A person can
never make themselves staff. Promote your own account by hand, once:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
```

### Signing in with a phone number

The sign-in box takes an email address **or** a ten-digit mobile number in the
same field — which one it is comes from what was typed, not from a toggle
someone has to set first. `+91 98765 43210`, `098765 43210` and `9876543210`
are all the same number as far as the API is concerned.

A phone number is required to register and must be unique, because it
identifies an account. Someone who signs up with Google has no number (Google
does not give us one), so they sign in with Google or with their email.

### What happens when someone signs in

Whether they used a password or Google, the API issues the same pair of
tokens, so the rest of the site never has to care which route they took. They
land on `/dashboard`.

### Signing in with Google when you already have an account

If the email on the Google account matches an existing account, Google is
linked to it and they keep their projects and payments. It does not create a
second, empty account.

### One thing that is missing

There is **no self-service password reset yet.** The old Firebase setup had
one; the new backend does not, and the "Forgot password?" link honestly says
to call you instead of pretending an email was sent. Building it needs a
reset-token table and an email template — ask when you want it.

Someone who only ever signs in with Google has no password at all, so there is
nothing for them to reset.

## 8. Project structure

```
public/assets/         images (replace these)
src/
  data/                ← all site content lives here
    siteConfig.js
    services.js
    projects.js
  context/AuthContext.jsx   who is signed in
  lib/api.js                every call to the backend, plus token handling
  components/
    layout/            Navbar, ServiceMegaMenu, MobileMenu, Footer, Layout,
                       FloatingActions, ScrollToTop, ProtectedRoute
    ui/                Icon, Reveal, SectionHeading, PageHero, Breadcrumbs, Faq, CtaBand
    home/              Hero, TrustBar, ServiceCard, ServiceGrid, ProcessSection, StatsSection
    projects/          ProjectCard, ProjectGrid, ProjectFilter
    forms/             QuoteForm, ContactSection
  pages/               one file per route
  styles/              base.css (tokens), components.css, pages.css
  lib/contact.js       tel / mailto / WhatsApp link builders
scripts/               placeholder image generator (optional)
```

Icons are inline SVG in `src/components/ui/Icon.jsx` — no icon library, nothing extra to install. To add one, add a new entry to the `paths` object.

---

## 9. Before you go live

- [ ] Replace the logo files with your real artwork
- [ ] Replace every placeholder image with real photos and renders
- [ ] Replace the sample projects in `src/data/projects.js`
- [ ] Fill in your social media URLs in `src/data/siteConfig.js`
- [ ] Confirm the statistics in `src/data/siteConfig.js` are accurate
- [ ] Update the address in `siteConfig.js` if you want the full office address shown
- [ ] Set up login (section 7) if you want the client portal working
- [ ] Add a Google OAuth client id if you want "Continue with Google" (section 7)
- [ ] Point `VITE_API_URL` at your deployed API, not localhost
- [ ] Have a professional review `src/pages/Legal.jsx` — the privacy policy and terms are starting drafts, not legal advice

Contact details already in place everywhere: **+91 77095 88422** and **info.supplybase@gmail.com**.

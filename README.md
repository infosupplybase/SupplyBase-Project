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
| `/services/:slug` | Service detail — one template, all 11 services |
| `/projects` | Projects with category filtering |
| `/projects/:slug` | Project detail |
| `/about` | About Us |
| `/why-us` | Why Us |
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

Login is real and secure. It is handled by **Firebase**, a free Google service. Nobody can sign in until you do this, and until then the login page politely says so. Takes about 20 minutes, once.

### Step 1 — Make a Firebase project (5 min)

1. Go to [firebase.google.com](https://firebase.google.com) and sign in with your Google account
2. Click **Go to console** → **Create a project**
3. Name it `supplybase-projects` → Continue
4. Turn **off** Google Analytics (you don't need it) → Create project

### Step 2 — Switch on email login (2 min)

1. In the left menu click **Build → Authentication → Get started**
2. Choose **Email/Password**
3. Turn on the first switch (leave "Email link" off) → **Save**

### Step 3 — Get your keys (3 min)

1. Click the **gear icon → Project settings**
2. Scroll down to **Your apps** → click the **web icon** `</>`
3. Nickname it `website` → **Register app**
4. You'll see a block of code with `apiKey`, `authDomain` and so on. Keep this page open.

### Step 4 — Put the keys in the project (2 min)

In your project folder, make a copy of the file `.env.example` and rename the copy to `.env`. Then paste each value from Firebase into it:

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=supplybase-projects.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=supplybase-projects
VITE_FIREBASE_STORAGE_BUCKET=supplybase-projects.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

Restart `npm run dev` after saving, so it picks up the new file.

### Step 5 — Create your first user (2 min)

Back in Firebase: **Authentication → Users → Add user**. Type an email and a password, click Add. That's it — sign in on your website with those details.

There is no public "sign up" button on purpose. This is a client portal, so **you** create the accounts and give people their details. To add a client later, repeat this step.

### Step 6 — When the site is live (3 min)

Two things to do after deploying:

1. **Vercel → your project → Settings → Environment Variables** — add the same six `VITE_FIREBASE_...` values there, then redeploy. (The `.env` file stays on your computer and is never uploaded, which is correct.)
2. **Firebase → Authentication → Settings → Authorised domains → Add domain** — add your website address (e.g. `supplybaseprojects.com`). Without this, Firebase blocks sign-in from your live site.

### What it costs

Nothing. Firebase's free plan covers far more sign-ins than a business your size will ever use.

### What happens after signing in

The person lands on `/dashboard`, a welcome page that greets them by name. When you're ready for it to show real project information — current stage, site photos, drawings, payment stages — that all goes in `src/pages/Dashboard.jsx`.

**A note on roles:** the old Customer / Admin / Project Manager tabs have been removed. Telling those three apart needs a small database alongside login, which is a separate job — worth doing when there is actually something different for each of them to see.

---

## 8. Project structure

```
public/assets/         images (replace these)
src/
  data/                ← all site content lives here
    siteConfig.js
    services.js
    projects.js
  context/AuthContext.jsx   who is signed in
  lib/firebase.js           login keys (read from .env)
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
- [ ] Have a professional review `src/pages/Legal.jsx` — the privacy policy and terms are starting drafts, not legal advice

Contact details already in place everywhere: **+91 77095 88422** and **info.supplybase@gmail.com**.

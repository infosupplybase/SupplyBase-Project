# Supplybase Projects

**ONE PARTNER. COMPLETE PROJECT.**


Construction, architectural design, interior design and turnkey project execution — as three independent apps:

| Folder | What it is | Stack |
|---|---|---|
| [`frontend/`](frontend) | The public website and client dashboard | React + Vite |
| [`admin/`](admin) | The staff back-office — enquiries, bookings, projects, payments | React + Vite |
| [`backend/`](backend) | The API both of the above talk to | Java 21, Spring Boot |

Each one has its own `package.json` (or `pom.xml`) and runs independently — there is no monorepo tooling tying them together, and no folder needs the others present to `npm install` and start.

---

## 1. Run it

You need [Node.js](https://nodejs.org) 18 or newer, **Java 21+** and a **MySQL 8** database.

```bash
# 1. the API (see backend/README.md for full setup — database, .env, first admin)
cd backend && ./mvnw spring-boot:run        # http://localhost:8080

# 2. the website
cd frontend && npm install && npm run dev   # http://localhost:5173

# 3. the admin panel (optional — only needed if you're working on the back-office)
cd admin && npm install && npm run dev      # http://localhost:3001
```

`frontend` and `admin` each read their own `.env` — copy `.env.example` to `.env` in each folder first. Neither app can do anything useful without the backend running.

## 2. Deploy it

For the production setup, follow [`DEPLOYMENT.md`](DEPLOYMENT.md). It covers deploying `frontend/` and `admin/` as two separate static-site projects, and `backend/` to Render or Railway, including every environment variable each platform needs.

---

## 3. The first three things to change

### a) Your logo — already done ✅

Your real logo is in place, in both `frontend/public/assets/brand/` and (just the one file it needs) `admin/public/assets/brand/`:

| File | Used on |
|---|---|
| `brand/logo.png` | header, mobile menu, login — house and name side by side |
| `brand/logo-stacked.png` | footer — house above the name (`frontend` only) |
| `brand/favicon.png` | browser tab icon |
| `brand/logo-full.jpg` | the picture shown when someone shares your link (`frontend` only) |

The black background was removed so the logo sits cleanly on any colour. If you ever get a proper logo file from a designer, replace these keeping the same names in both folders.

### b) Your photographs

Every image is a placeholder. Replace the files in `frontend/public/assets/` keeping the same names and nothing in the code has to change:

```
frontend/public/assets/hero-house.svg          ← your 3D architectural render (the main hero image)
frontend/public/assets/services/*.svg          ← one image per service category
frontend/public/assets/projects/*.svg          ← one image per project
```

If you use `.jpg` instead of `.svg`, update the path in the matching data file (`frontend/src/data/services.js`, `frontend/src/data/projects.js`) or in `frontend/src/components/home/Hero.jsx`.

### c) Your real projects

`frontend/src/data/projects.js` contains **sample projects** to show the layout. Replace them with your completed work — name, location, area, duration, description, scope and images.

---

## 4. Everything is data-driven

You should almost never need to touch a component to change content on the website.

| What you want to change | File |
|---|---|
| Phone, email, address, working hours, service areas | `frontend/src/data/siteConfig.js` |
| Statistics (100+ projects, 30+ professionals…) | `frontend/src/data/siteConfig.js` → `stats` |
| Social media links (empty = hidden) | `frontend/src/data/siteConfig.js` → `social` |
| Trust bar, why-us points, how-it-works steps | `frontend/src/data/siteConfig.js` |
| Quote form dropdowns (project types, budgets) | `frontend/src/data/siteConfig.js` |
| Booking services, property types, time slots | `frontend/src/data/booking.js` |
| Services, sub-services, FAQs, process | `frontend/src/data/services.js` |
| Projects | `frontend/src/data/projects.js` |
| Colours, fonts, spacing | `frontend/src/styles/base.css` (CSS variables at the top) |

**Adding a service:** copy one object in `services.js`, change the values, and it appears automatically in the home page grid, the services page, the header mega menu, the footer, the quote form dropdown, and gets its own page at `/services/<slug>`.

**Adding a project:** same idea in `projects.js` → it appears on the home page (if `featured: true`), the projects page, its category filter, the related-projects strip on every service it lists, and gets a page at `/projects/<slug>`.

---

## 5. Routes

### `frontend/` (public site)

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

### `admin/` (staff back-office, `ADMIN` role only)

| Path | Page |
|---|---|
| `/login` | Staff sign in |
| `/` | Overview — live counts across enquiries, bookings, projects, payments |
| `/enquiries` | Work the quote/contact form list |
| `/bookings` | Site-visit bookings, plus a day-sheet view |
| `/projects`, `/projects/:id` | Projects and their stage timeline |
| `/payments` | Advances, milestones and invoices |

---

## 6. How the quote form works right now

**The quote form does not post anywhere on the backend.** It validates what you type, then hands the completed enquiry to **WhatsApp** or **email** with every field already filled in. You (or your client) press send in your own app. Nothing is stored on a server and no email is sent automatically from this particular form.

Selected files stay on the user's device — the form lists their names in the message and asks the user to attach them.

**To connect a real backend later:** open `frontend/src/components/forms/QuoteForm.jsx`. There is a `submitToBackend` function at the top with a commented example and a `USE_BACKEND` flag. Fill in your API call and flip the flag — nothing else changes.

(The booking wizard and enquiry endpoints elsewhere on the site already post to the real API — see `frontend/src/lib/api.js`.)

---

## 7. Setting up login

Login is real and secure, and it is handled by **our own backend** in
`backend/` — not by any third party. Start that first: see
[backend/README.md](backend/README.md).

### Step 1 — Point both frontend apps at the API (1 min)

In `frontend/`, copy `.env.example` to `.env`. For local work the defaults are already right:

```
VITE_API_URL=http://localhost:8080
```

In `admin/`, `.env` is the same, one value:

```
VITE_API_URL=http://localhost:8080
```

Everything prefixed `VITE_` is compiled into the JavaScript a browser
downloads, so treat it as public. Nothing secret belongs in either file —
secrets live in `backend/.env`, which never reaches a browser.

### Step 2 — Adding "Continue with Google" (10 min, optional)

Skip this and the site still works; the Google button simply does not appear
and people sign in with email and password. (The admin app never shows a
Google button at all — staff accounts are promoted by hand, never
self-registered.)

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
   frontend/.env    VITE_GOOGLE_CLIENT_ID=<your client id>
   backend/.env     GOOGLE_CLIENT_ID=<your client id>
   ```

   They must match. The backend refuses any Google token that was not issued
   for exactly this client id, so a mismatch rejects every sign-in.

6. Restart the frontend dev server and the backend.

There is no client *secret* anywhere in this flow. Google signs a token, the
browser passes it on, and the backend verifies the signature against Google's
public keys — nothing on our side needs to prove who it is.

### Step 3 — Create your first admin (2 min)

Anyone can register on the website, and everyone who registers there is a
**CUSTOMER**. A person can never make themselves staff, and there is no
public registration in `admin/` at all. Promote your own account by hand,
once:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
```

Or, for a fresh deployment, set `BOOTSTRAP_ADMIN_EMAIL`/`BOOTSTRAP_ADMIN_PASSWORD`
on the backend once — see [backend/README.md](backend/README.md) — and it
creates that first admin account for you on startup, no SQL needed.

Then sign in at the admin app's `/login` with that account.

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

### Password reset

There is now a real self-service flow — a "Forgot password?" link on
`/login` emails a reset link (built from `FRONTEND_URL` on the backend, see
[backend/README.md](backend/README.md)). Someone who only ever signs in with
Google has no password at all, so there is nothing for them to reset.

## 8. Project structure

```
frontend/
  public/assets/          images (replace these)
  src/
    data/                 ← all site content lives here
      siteConfig.js, services.js, projects.js, booking.js, materials.js, ...
    context/AuthContext.jsx   who is signed in
    lib/api.js                every call to the backend, plus token handling
    lib/contact.js            tel / mailto / WhatsApp link builders
    components/
      layout/              Navbar, ServiceMegaMenu, MobileMenu, Footer, Layout,
                           FloatingActions, ScrollToTop, ProtectedRoute
      ui/                  Icon, Reveal, SectionHeading, PageHero, Breadcrumbs, Faq, CtaBand
      home/, services/, projects/, materials/, booking/, forms/, stats/, why/, HeroSlider/
    pages/                 one file per route
    styles/                base.css (tokens), components.css, pages.css
  scripts/                 placeholder image generator (optional)

admin/
  public/assets/brand/     logo + favicon only — this app needs nothing else
  src/
    components/
      AdminRoute.jsx        the guard — signed in + ADMIN role, else redirected to /login
      AdminLayout.jsx        sidebar shell, wraps every page below it
      admin/                StatusBadge, Pagination, Drawer
      ui/Icon.jsx
    context/AuthContext.jsx  trimmed — login/logout/me only, no register or Google
    lib/api.js               trimmed — token handling + admin.* endpoints only
    pages/                   Login, AdminOverview, AdminEnquiries, AdminBookings,
                             AdminProjects, AdminProjectDetail, AdminPayments
    styles/                  its own copy of the shared tokens/reset/buttons/forms, plus admin.css

backend/
  see backend/README.md
```

Icons are inline SVG in `Icon.jsx` in both apps — no icon library, nothing extra to install. To add one, add a new entry to the `paths` object (in both places if both apps need it).

---

## 9. Before you go live

- [ ] Replace the logo files with your real artwork (in both `frontend/public/` and `admin/public/`)
- [ ] Replace every placeholder image with real photos and renders
- [ ] Replace the sample projects in `frontend/src/data/projects.js`
- [ ] Fill in your social media URLs in `frontend/src/data/siteConfig.js`
- [ ] Confirm the statistics in `siteConfig.js` are accurate
- [ ] Update the address in `siteConfig.js` if you want the full office address shown
- [ ] Set up login (section 7) if you want the client portal and admin panel working
- [ ] Add a Google OAuth client id if you want "Continue with Google" (section 7)
- [ ] Point `VITE_API_URL` (both apps) at your deployed API, not localhost
- [ ] Have a professional review `frontend/src/pages/Legal.jsx` — the privacy policy and terms are starting drafts, not legal advice

Contact details already in place everywhere: **+91 77095 88422** and **info.supplybase@gmail.com**.

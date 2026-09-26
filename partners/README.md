# Supplybase Partners

The professionals' ("labour") portal. A separate React + Vite app, like `admin/`:
it has its own `package.json`, builds on its own, and deploys as its own Vercel
project. It talks to the same `backend/` API.

| Path | Page |
|---|---|
| `/login` | Partner sign in |
| `/join` | Apply to become a partner |
| `/` | Dashboard — application status, then (once approved) numbers, jobs and earnings |

## The dashboard for an approved partner

- **Four numbers** at the top: active jobs, jobs completed, earned this month, payout pending.
- **Jobs** — active or finished, soonest visit first, with a "next up" flag. Each job shows a
  five-step bar (Assigned → Site visit → Quotation → Work → Done), **what to do now in plain
  words**, when and where, the customer, what they asked for (no prices), what the job pays,
  big Directions / Call / WhatsApp buttons, and the one next step the partner may take.
  Marking work completed asks first, in the app's own dialog.
- **Earnings** — what is waiting to be paid, total earned, paid, this month, and each completed
  job with its payout and whether it has been paid.
- **Account** — their details, account safety (how long this device stays signed in, a
  change-password link, sign out) and the partner desk.

On a wide screen Jobs and Earnings are tabs and Account is the sidebar; on a phone all three are
in a bar fixed to the bottom of the screen. The section is in the URL (`?tab=earnings`).

**Earnings are set by Supplybase, per job.** An admin enters what a job pays in the admin
app (**Bookings → a booking → Partner payout**) and marks it paid after paying the partner.
"Earned" means the job is completed *and* has a payout; a completed job with no amount yet
shows "to be confirmed", never ₹0. The customer never sees any of it. Money is stored in
paise; the API is `GET /api/professional/earnings` (partner) and
`PATCH /api/admin/bookings/{id}/payout` (admin).

## The partner phone number

`src/config.js` holds the partner desk number (`PARTNER_PHONE`, `PARTNER_PHONE_RAW`). It is a
**different number from the customer line** on the main website. The raw form includes the
country code (`91…`) because `wa.me` links need it.

## How access works

Anyone can apply at `/join`. That creates an ordinary login plus a **pending**
application — it does **not** give access to any jobs. An admin approves the
application in the admin app (**Partners** page), which is what makes the
account a professional. The dashboard shows the right thing for each state:
under review, not approved or paused (with the admin's reason), or — once
approved — the jobs assigned to them, with the next step they may take on each.

The server decides all of this. The buttons in the dashboard only offer what the
API will accept; the API refuses everything else.

## Security

- **Sign-in length.** By default a sign-in lasts until the browser is closed (tokens in
  `sessionStorage`) and ends after 30 minutes with no activity. Ticking *Keep me signed in on
  this device* keeps it in `localStorage` instead, for the partner's own phone.
- **Ended sessions.** If the API stops accepting the session (expired, signed out elsewhere,
  account disabled) the portal signs out and the sign-in page says why. Signing out in one tab
  signs out the others. Signing out revokes the refresh token on the server.
- **Customer privacy.** The API sends a customer's phone, WhatsApp and street address only
  while the job is open; finished and cancelled jobs keep the name and area only. API
  answers are never stored in the browser's HTTP cache.
- **Passwords** on the apply form need letters and a number and must not contain the
  applicant's phone, email or name.
- **Headers** (`vercel.json`): a Content-Security-Policy that allows scripts only from this
  site and API calls only to `https://api.supplybase.co.in`, no framing, `nosniff`, a strict
  referrer policy and no camera/microphone/location. **If the API moves to another domain,
  update `connect-src` in `vercel.json` too**, or every API call will be blocked.

## Run it locally

```bash
cd partners
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:8080
npm run dev               # http://localhost:3002
```

The backend must be running. Its default local CORS setting already allows any
`localhost` port. In production, add this app's exact origin to the API's
`CORS_ORIGINS` — see `DEPLOYMENT.md`, section 4b.

## Environment

| Name | Purpose |
|---|---|
| `VITE_API_URL` | Where the API lives. No trailing slash. |
| `VITE_SITE_URL` | *(optional)* The customer website, for the Terms/Privacy links and the logo. Defaults to `https://www.supplybase.co.in`. |

`VITE_` values are compiled into public browser JavaScript — never put a secret
in them.

## Why some code is copied from `frontend/` and `admin/`

This app deploys from its own folder, so it cannot import from the others. The
design tokens, form/button styles, the dark sign-in card, the icon set and the
API client are copies. That is deliberate (the same way `admin/` copies the
site's): a change to one does not silently break another. The cost is that a
visual change meant for all of them has to be made in each.

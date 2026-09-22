# Supplybase Partners

The professionals' ("labour") portal. A separate React + Vite app, like `admin/`:
it has its own `package.json`, builds on its own, and deploys as its own Vercel
project. It talks to the same `backend/` API.

| Path | Page |
|---|---|
| `/login` | Partner sign in |
| `/join` | Apply to become a partner |
| `/` | Dashboard — application status, then assigned jobs |

## How access works

Anyone can apply at `/join`. That creates an ordinary login plus a **pending**
application — it does **not** give access to any jobs. An admin approves the
application in the admin app (**Partners** page), which is what makes the
account a professional. The dashboard shows the right thing for each state:
under review, not approved or paused (with the admin's reason), or — once
approved — the jobs assigned to them, with the next step they may take on each.

The server decides all of this. The buttons in the dashboard only offer what the
API will accept; the API refuses everything else.

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

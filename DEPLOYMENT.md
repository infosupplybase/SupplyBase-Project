# Deploy Supplybase Projects

Three independent deployments, all pointed at the same API:

- `frontend/` (the public website) → **Vercel**
- `admin/` (the staff back-office) → **Vercel**, as a second, separate project
- `backend/` (Java/Spring Boot API) → **Render** or **Railway**

They share one MySQL database but are intentionally separate services — each
frontend app can be redeployed, scaled or taken down without touching the
other two.

## 1. Prepare MySQL

Create a hosted MySQL 8 database. Keep these values from its provider:

- host and port
- database name
- username and password

Do not create tables manually. Flyway creates and upgrades the schema whenever
the API starts.

## 2. Deploy the Spring Boot API

### Render

1. Push this repository to GitHub.
2. In Render, choose **New → Blueprint** and select the repository.
3. Render reads [`render.yaml`](render.yaml), builds `backend/Dockerfile`, and
   creates the `supplybase-api` service.
4. Add the required environment variables below, then deploy.
5. Open `https://YOUR-API-HOST/actuator/health`. A healthy API returns an
   `UP` status.

### Railway

1. Create a new Railway project from the same GitHub repository.
2. Set the service root directory to `backend`.
3. Railway detects `backend/Dockerfile`; deploy it.
4. Add the same environment variables listed below.
5. Copy the public API URL after the deployment is healthy.

### Required API environment variables

| Name | Value |
| --- | --- |
| `DB_HOST` | Hosted MySQL hostname |
| `DB_PORT` | Usually `3306` |
| `DB_NAME` | Database name |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | A unique random secret of 32+ bytes |
| `CORS_ORIGINS` | Exact frontend origins, comma-separated |

For the JWT secret, generate a new production-only value, for example with
`openssl rand -base64 48`. Never reuse the development secret.

Optional variables are documented in [`backend/.env.example`](backend/.env.example):
Google sign-in, Razorpay, and email. Keep `RAZORPAY_KEY_SECRET`, webhook secret,
database password and mail password on the API host only.

Set production CORS to the exact origins **of both frontend apps**, for example:

```text
CORS_ORIGINS=https://supplybase-projects.vercel.app,https://admin.supplybase.co.in,https://www.supplybase.co.in,https://supplybase.co.in
```

Do not include `localhost` or wildcard origins in production.

## 3. Deploy the website (`frontend/`) to Vercel

1. In Vercel, import the same GitHub repository as a **new project**.
2. Set the project's **Root Directory** to `frontend`. Select the **Vite**
   framework preset — nothing else to configure, Vercel already knows the
   build command (`npm run build`) and output directory (`dist`).
3. Add these Vercel environment variables:

| Name | Value |
| --- | --- |
| `VITE_API_URL` | `https://YOUR-API-HOST` — no trailing slash |
| `VITE_GOOGLE_CLIENT_ID` | Optional public Google client ID |

4. Deploy. The included `frontend/vercel.json` keeps client-side routes such
   as `/services/plumbing` working on a direct visit or refresh — Vite builds
   a static site, so without that rewrite rule Vercel would 404 anything that
   isn't `/`.
5. Add the final Vercel URL to the API's `CORS_ORIGINS` value and redeploy the
   API once.

## 4. Deploy the admin panel (`admin/`) to Vercel

A **second, separate** Vercel project — do not put this on the same project
as the website; they're different apps with different builds.

1. In Vercel, import the same GitHub repository again as another new project.
2. Set the project's **Root Directory** to `admin`. Framework preset: **Vite**,
   same as the website.
3. Add the one environment variable this app needs:

| Name | Value |
| --- | --- |
| `VITE_API_URL` | `https://YOUR-API-HOST` — same value as the website's |

4. Deploy — it needs its own `vercel.json` rewrite rule too, same reason as
   the website's (a static build, client-side routes need the fallback).
5. Add this app's final Vercel URL to the API's `CORS_ORIGINS` value
   (alongside the website's) and redeploy the API once.
6. Consider restricting who can even load this URL — a custom subdomain like
   `admin.supplybase.co.in` kept out of search engines (`admin/index.html`
   already sets `robots: noindex, nofollow`) is enough for most teams; add IP
   allow-listing or Vercel's password protection if you want more.

`VITE_` values (in either app) are bundled into public browser JavaScript.
Never add database, JWT, Razorpay secret, webhook, or mail credentials to
either Vercel project — those stay in the API's environment only.

## 5. Before going live

- Add both Vercel (or custom) domains to `CORS_ORIGINS`.
- Add the website's domain to the Google OAuth authorised JavaScript origins
  if Google sign-in is enabled (the admin app never shows a Google button, so
  it needs no entry there).
- Point Razorpay's production webhook to
  `https://YOUR-API-HOST/api/payments/webhook` after payment verification is
  enabled.
- Confirm the health endpoint returns `UP` and test registration/login from
  the deployed website, and staff sign-in from the deployed admin app.
- Use HTTPS-only production URLs.

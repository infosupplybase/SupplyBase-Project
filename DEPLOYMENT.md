# Deploy Supplybase Projects

The React website is deployed to **Vercel**. The Java/Spring Boot API is
deployed separately to **Render** or **Railway**. They share one MySQL database
but are intentionally separate services.

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

Set production CORS to the exact origins, for example:

```text
CORS_ORIGINS=https://supplybase-projects.vercel.app,https://www.supplybase.co.in,https://supplybase.co.in
```

Do not include `localhost` or wildcard origins in production.

## 3. Deploy the React website to Vercel

1. In Vercel, import the same GitHub repository.
2. Select the **Vite** framework preset.
3. Set build command to `npm run build` and output directory to `dist`.
4. Add these Vercel environment variables:

| Name | Value |
| --- | --- |
| `VITE_API_URL` | `https://YOUR-API-HOST` — no trailing slash |
| `VITE_GOOGLE_CLIENT_ID` | Optional public Google client ID |

5. Deploy the site. The included `vercel.json` keeps React routes such as
   `/booking/plumbing` working on direct visits.
6. Add the final Vercel URL to the API's `CORS_ORIGINS` value and redeploy the
   API once.

`VITE_` values are bundled into public browser JavaScript. Never add database,
JWT, Razorpay secret, webhook, or mail credentials to Vercel.

## 4. Before going live

- Add Vercel and custom domains to `CORS_ORIGINS`.
- Add the Vercel/custom domains to the Google OAuth authorised JavaScript
  origins if Google sign-in is enabled.
- Point Razorpay's production webhook to
  `https://YOUR-API-HOST/api/payments/webhook` after payment verification is
  enabled.
- Confirm the health endpoint returns `UP` and test registration/login from
  the deployed Vercel site.
- Use HTTPS-only production URLs.

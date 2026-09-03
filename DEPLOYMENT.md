# Deploy Supplybase Projects

Three independent deployments, all pointed at the same API:

- `frontend/` (the public website) → **Vercel**
- `admin/` (the staff back-office) → **Vercel**, as a second, separate project
- `backend/` (Java/Spring Boot API) → **Render** or **Railway**

They share one MySQL database but are intentionally separate services — each
frontend app can be redeployed, scaled or taken down without touching the
other two.

Sections 1–5 below cover that path (a managed MySQL provider + Render/Railway
for the API). If you'd rather run the API and its database yourself on a
single VPS instead — for example a Hostinger VPS/Cloud Hosting plan — skip to
**section 6**.

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

## 6. Self-host on a VPS (e.g. Hostinger)

An alternative to sections 1–5 — everything on one server you control, MySQL
included. Needs a VPS/Cloud Hosting plan with root SSH access (not a shared
or "Business/WordPress" plan — those can't run Docker or a custom Java app),
and Ubuntu 22.04 or 24.04.

The pieces this uses: [`backend/docker-compose.prod.yml`](backend/docker-compose.prod.yml)
(runs MySQL and the API as containers, MySQL never exposed outside that
compose network) and [`backend/nginx/supplybase-api.conf`](backend/nginx/supplybase-api.conf)
(a reverse proxy in front of the API, so nginx — not Spring Boot — is what
actually faces the internet and terminates HTTPS).

### a) One-time server setup

SSH into the VPS as root (or a sudo user), then:

```bash
apt update && apt upgrade -y

# Docker + the Compose plugin
curl -fsSL https://get.docker.com | sh

# nginx + Let's Encrypt
apt install -y nginx certbot python3-certbot-nginx

# Firewall: only SSH, HTTP and HTTPS are ever reachable from the internet.
# MySQL and the API itself are deliberately not in this list — they're only
# reachable from nginx/Docker on this same machine.
apt install -y ufw
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

### b) Point your domain at the VPS

At your domain registrar (or Hostinger's own DNS panel if it's registered
there), add an **A record** — `api` (or whatever subdomain you want) pointing
at the VPS's IP address. DNS can take a few minutes to propagate; confirm
with `dig api.yourdomain.com` before moving on to the certbot step below.

### c) Get the code onto the server

```bash
cd /opt
git clone https://github.com/infosupplybase/SupplyBase-Project.git
cd SupplyBase-Project/backend
cp .env.example .env
nano .env   # fill in real values — see the table below
```

| Variable | What to put |
|---|---|
| `DB_NAME` | `supplybase` |
| `DB_USER` | `supplybase` |
| `DB_PASSWORD` | a strong password you generate — this is the app's own database login |
| `DB_ROOT_PASSWORD` | a *different* strong password — MySQL's root account, only ever used by Docker to initialise the database |
| `JWT_SECRET` | generate with `openssl rand -base64 48` |
| `CORS_ORIGINS` | your deployed frontend/admin origins, e.g. `https://www.supplybase.co.in,https://admin.supplybase.co.in` |
| `FRONTEND_URL` | `https://www.supplybase.co.in` |
| `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` | your own admin login — creates that account automatically on first boot |

Leave `GOOGLE_CLIENT_ID`, `RAZORPAY_*`, `MAIL_*`, `ENQUIRY_EMAIL` blank until
you're ready to turn those features on (see sections 7 and beyond of the main
`README.md`/`backend/README.md`).

### d) Start it

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f api   # watch it come up; Ctrl+C to stop watching, it keeps running
```

First run downloads MySQL's image, builds the API's Docker image (Maven +
JDK, so it takes a few minutes), then Flyway creates every table. Once the
logs show `Started BackendApplication`, `curl http://127.0.0.1:8080/actuator/health`
on the server itself should return `{"status":"UP"}`.

### e) Wire up nginx + HTTPS

```bash
cp nginx/supplybase-api.conf /etc/nginx/sites-available/supplybase-api
nano /etc/nginx/sites-available/supplybase-api   # replace api.YOURDOMAIN.com with your real subdomain
ln -s /etc/nginx/sites-available/supplybase-api /etc/nginx/sites-enabled/
nginx -t   # should say "syntax is ok" / "test is successful"
systemctl reload nginx

certbot --nginx -d api.yourdomain.com   # follow its prompts; it edits the config above to add HTTPS and can set up auto-renewal
```

Once that's done, `https://api.yourdomain.com/actuator/health` should return
`UP` from anywhere, not just the server itself.

### f) Updating later

```bash
cd /opt/SupplyBase-Project
git pull
cd backend
docker compose -f docker-compose.prod.yml up -d --build
```

Data survives — it's in named Docker volumes (`supplybase-mysql-data`,
`supplybase-uploads`), not inside the containers themselves.

### g) Backups

Nothing here does this for you yet. At minimum, a daily cron job dumping the
database is worth setting up before real customer data lives on it:

```bash
# /etc/cron.d/supplybase-backup, or crontab -e as root
0 3 * * * docker exec supplybase-mysql sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" supplybase' > /root/backups/supplybase-$(date +\%F).sql
```

Adjust the path, and consider copying those dump files off the server
periodically (e.g. to S3 or another machine) — a backup that lives on the
same disk as the database doesn't protect against the server itself failing.

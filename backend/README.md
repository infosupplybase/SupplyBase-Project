# Supplybase Projects — API

Java 21 · Spring Boot 4.1 · MySQL 8 · Flyway · JWT · Razorpay

The backend for the Supplybase Projects website. It owns four things:

| Area | What it does |
|---|---|
| **Auth** | Accounts, sign-in, roles (`CLIENT` / `MANAGER` / `ADMIN`), JWT access + refresh tokens |
| **Enquiries** | Receives the quote and contact forms, optionally emails staff |
| **Projects** | Projects, their stage timeline and documents — what the client dashboard shows |
| **Payments** | Advances, milestones and invoices, collected through Razorpay |

---

## 1. Run it

You need **Java 21+** and a **MySQL 8** database. Maven is not required — the
project ships the Maven wrapper (`./mvnw`), which fetches Maven itself.

### a) Start MySQL

With Docker:

```bash
docker compose up -d
```

Without Docker, install MySQL 8 and create the database and user by hand:

```sql
CREATE DATABASE supplybase CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'supplybase'@'localhost' IDENTIFIED BY 'choose-a-password';
GRANT ALL PRIVILEGES ON supplybase.* TO 'supplybase'@'localhost';
FLUSH PRIVILEGES;
```

**Do not create any tables.** Flyway does that on first start, from
`src/main/resources/db/migration`.

### b) Set the environment

Copy `.env.example` to `.env` and fill it in. At minimum you need the database
values and a `JWT_SECRET` of at least 32 characters:

```bash
openssl rand -base64 48
```

These are environment variables, not a file Spring reads by itself — export
them in your shell or set them in your IDE's run configuration.

### c) Start the API

```bash
./mvnw spring-boot:run
```

It listens on `http://localhost:8080`. On the first run Flyway creates every
table; on later runs it only applies migrations that have not run yet.

---

## 2. How the pieces fit

## Deploy on Render or Railway

This API includes a production [`Dockerfile`](Dockerfile). Render reads the
repository's `render.yaml`; Railway uses the same Dockerfile when the service
root directory is set to `backend`. Both platforms provide `PORT` automatically
and the application honours it.

Set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`
and exact production `CORS_ORIGINS` in the platform dashboard. Do not upload a
`.env` file or commit it. See the repository-level
[`DEPLOYMENT.md`](../DEPLOYMENT.md) for the complete Vercel + API workflow.

After deployment, `GET /actuator/health` is the health check endpoint. It only
exposes health/status information; it does not expose customer or booking data.

---

### Money is stored in paise

Every amount — `amount_paise`, `contract_value_paise` — is a `BIGINT` in the
minor unit. Never `DECIMAL`, never `double`.

Razorpay's API also works in paise, so the same integer travels from the
database to the gateway and back with no conversion anywhere in between. Only
the display layer divides by 100, and `common/Money.java` is the single place
that does it.

### Two token types, on purpose

**Access tokens** are JWTs: 15 minutes, self-contained, never stored. They
cannot be revoked before they expire, which is exactly why they are short.

**Refresh tokens** are opaque random strings, stored in MySQL as SHA-256
hashes. Being database-backed is what makes "sign out everywhere" possible at
all — you cannot un-issue a JWT, but you can delete a row. They rotate on every
use, so a stolen refresh token is good for at most one call.

### Flyway owns the schema

`spring.jpa.hibernate.ddl-auto` is `validate`, never `update`. Two tools
mutating the same tables is how schemas drift apart between environments. If
the entities and the migrations disagree, the app refuses to start.

---

## 3. The API

Public — no token needed:

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Create a client account |
| `POST` | `/api/auth/login` | Sign in |
| `POST` | `/api/auth/refresh` | Swap a refresh token for a new pair |
| `POST` | `/api/auth/logout` | Revoke a refresh token |
| `POST` | `/api/enquiries` | The quote / contact form posts here |
| `POST` | `/api/payments/webhook` | Razorpay calls this |

Signed in — send `Authorization: Bearer <accessToken>`:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/auth/me` | Who am I |
| `GET` | `/api/projects/mine` | My projects, with their stages |
| `GET` | `/api/projects/{id}` | One project (yours, or any if staff) |
| `GET` | `/api/payments/mine` | What I owe and what I have paid |
| `POST` | `/api/payments/{id}/order` | Start checkout — returns a Razorpay order |
| `POST` | `/api/payments/verify` | Confirm a completed checkout |

Staff only (`ADMIN` or `MANAGER`) — everything under `/api/admin`:

| Method | Path | Purpose |
|---|---|---|
| `GET` `PATCH` | `/api/admin/enquiries[/{id}]` | Work the enquiry list |
| `GET` `POST` | `/api/admin/projects` | List and create projects |
| `PUT` | `/api/admin/projects/{id}/stages` | Add or update a stage |
| `PATCH` | `/api/admin/projects/{id}/status` | Move a project along |
| `GET` `POST` | `/api/admin/payments` | List and raise payments |

### Making the first admin

Registration always creates a `CLIENT` — a self-registering user must never be
able to claim a staff role. Promote the first one directly in MySQL:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
```

---

## 4. Razorpay

### Setting it up

1. Sign up at [razorpay.com](https://razorpay.com) and stay in **Test mode**.
2. **Settings → API Keys → Generate Test Key.** Put the key id and secret in
   `.env` as `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
3. **Settings → Webhooks → Add New Webhook.**
   - URL: `https://your-domain/api/payments/webhook`
   - Secret: any strong string — put the same value in `RAZORPAY_WEBHOOK_SECRET`
   - Events: `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`

The app boots fine without any of these. Payment endpoints return a clear
"online payment is not switched on yet" until the keys are present, so nothing
else breaks in the meantime.

### The payment flow

```
staff raise a payment            POST /api/admin/payments      -> status PENDING
client opens checkout            POST /api/payments/{id}/order -> razorpay order id
client pays in Razorpay's modal
  |
  ├── browser reports success    POST /api/payments/verify     -> signature checked, PAID
  └── Razorpay calls the webhook POST /api/payments/webhook    -> signature checked, PAID
```

**Both paths are deliberate.** The browser callback gives the client an instant
answer. The webhook is the authoritative one, because a closed tab or a dropped
connection kills the callback while the money still moved. Whichever arrives
first wins, and the other becomes a no-op:

- `payments.version` is a JPA `@Version` column, so two concurrent writers
  cannot both turn one `PENDING` into `PAID`.
- `payment_events.razorpay_event_id` is `UNIQUE`. Razorpay retries webhooks,
  and this is what stops a retry of `payment.captured` being applied twice.

**Signatures are the entire security model.** Anyone can POST an order id at
these endpoints. Only an HMAC computed with the key secret proves Razorpay
actually took the money, so both paths verify before touching a row. The
webhook body is read as a raw `String` for the same reason — the HMAC covers
the exact bytes sent, and deserialising then re-serialising would change the
whitespace and break every signature.

The webhook always answers `200`, even when it rejects a request. Razorpay
retries on any non-2xx, and retrying a forged request forever helps nobody.
Rejected events are still written to `payment_events` with
`signature_valid = false`.

### Testing a payment

Razorpay's test cards work in Test mode — card `4111 1111 1111 1111`, any
future expiry, any CVV. To let their webhook reach a local machine, expose it
with a tunnel (`ngrok http 8080`) and use that URL in the webhook settings.

---

## 5. Layout

```
src/main/java/in/supplybase/backend/
  common/     ApiException, GlobalExceptionHandler, Money, Reference
  config/     AppProperties, SecurityConfig
  auth/       User, Role, RefreshToken, JwtService, JwtAuthenticationFilter, AuthService
  enquiry/    Enquiry, EnquiryService, EnquiryController
  project/    Project, ProjectStage, ProjectDocument, ProjectService
  payment/    Payment, PaymentEvent, RazorpayService, PaymentService, webhook
src/main/resources/
  application.yml
  db/migration/   V1__baseline.sql
```

Each feature owns its entities, repositories, service, controller and DTOs.
Nothing outside `payment/` knows Razorpay exists — `RazorpayService` is the
only class that imports the SDK, so changing or adding a gateway is one file.

---

## 6. Notes before going live

- [ ] Set a real `JWT_SECRET` — the development fallback is in source control
- [ ] Switch Razorpay from test keys to live keys
- [ ] Point `CORS_ORIGINS` at the real domain and drop `localhost`
- [ ] Give the app's MySQL user only the privileges it needs, not `ALL`
- [ ] Serve over HTTPS — Bearer tokens over plain HTTP are readable in transit
- [ ] Set `ENQUIRY_EMAIL` so enquiries reach a person, not just the database
- [ ] Add a rate limit in front of `/api/auth/login`; the app does not have one

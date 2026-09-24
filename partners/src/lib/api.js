/**
 * API CLIENT — partners app
 * -------------------------
 * A trimmed copy of the customer site's api.js: token handling plus only the
 * endpoints a partner uses (apply, sign in, who-am-i, their application, their
 * jobs). It is a copy, not an import, because this app deploys on its own.
 *
 * Tokens are stored under their own keys ("sb.partner.*") so being signed in
 * here never collides with the customer site or the admin panel, which keep
 * theirs in different keys — and the three apps are on different origins
 * anyway, so each has its own localStorage.
 */

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');

const ACCESS_KEY = 'sb.partner.accessToken';
const REFRESH_KEY = 'sb.partner.refreshToken';

/* ------------------------------------------------------------ token store */

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);

export function storeTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

/* ---------------------------------------------------------------- errors */

export class ApiError extends Error {
  constructor(status, body) {
    super((body && body.message) || 'Something went wrong. Please try again.');
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = (body && body.fieldErrors) || null;
  }
}

export const friendlyError = (error) => {
  if (error instanceof ApiError) return error.message;
  if (error && error.name === 'TypeError') {
    const base = 'We could not reach the server. Check your connection and try again.';
    return import.meta.env.DEV
      ? `${base} (Tried ${BASE_URL} from ${window.location.origin} — ` +
          `if the server is running, check the port and the CORS origins on the API.)`
      : base;
  }
  return (error && error.message) || 'Something went wrong. Please try again.';
};

/* --------------------------------------------------------------- refresh */

let refreshInFlight = null;

async function refreshTokens() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  if (!refreshInFlight) {
    refreshInFlight = fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) {
          clearTokens();
          return false;
        }
        storeTokens(await response.json());
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

/* --------------------------------------------------------------- request */

async function send(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = getAccessToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  return fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function request(path, options = {}) {
  let response = await send(path, options);

  if (response.status === 401 && options.auth !== false && getRefreshToken()) {
    const refreshed = await refreshTokens();
    if (refreshed) response = await send(path, options);
  }

  if (response.status === 204) return null;

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) throw new ApiError(response.status, payload);
  return payload;
}

/* ------------------------------------------------------------- endpoints */

export const api = {
  /** `identifier` is an email address or a phone number — the API works out which. */
  login: (identifier, password) =>
    request('/api/auth/login', { method: 'POST', auth: false, body: { identifier, password } }),

  logout: (refreshToken) =>
    request('/api/auth/logout', { method: 'POST', auth: false, body: { refreshToken } }),

  me: () => request('/api/auth/me'),

  /** Password reset email — always succeeds, whether or not the account exists. */
  forgotPassword: (identifier) =>
    request('/api/auth/forgot-password', { method: 'POST', auth: false, body: { identifier } }),

  /** The service catalogue; the apply form's trade list is its main categories. */
  services: () => request('/api/catalogue/services', { auth: false }),

  /**
   * A professional applying to join. Creates the login and a PENDING
   * application, and returns tokens. Nobody can ask for a role here — an admin
   * approving the application is what grants it.
   */
  apply: (form) =>
    request('/api/partners/apply', {
      method: 'POST',
      auth: false,
      body: {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        primaryTrade: form.primaryTrade,
        experienceYears: Number(form.experienceYears),
        city: form.city.trim(),
        serviceAreas: form.serviceAreas.trim(),
        languages: form.languages.trim(),
      },
    }),

  /** The signed-in user's own application. 404 (ApiError.status) if they never applied. */
  application: () => request('/api/partners/me'),

      /** Update the signed-in partner's own profile. */
  updateProfile: (data) =>
    request('/api/partners/me', { method: 'PATCH', body: data }),

   /** Jobs assigned to the signed-in professional. */
  jobs: () => request('/api/professional/bookings/mine'),

  /**
   * The signed-in professional's earnings: earned, paid, still to be paid,
   * this month, and the completed jobs behind them. Money is in paise.
   */
  earnings: () => request('/api/professional/earnings'),

  /** Move one of the professional's own jobs to its next status. */
  advanceJob: (id, status) =>
    request(`/api/professional/bookings/${id}/status`, { method: 'PATCH', body: { status } }),

  /**
   * Earnings — tries the dedicated endpoint first, falls back to deriving
   * from jobs if the backend doesn't have one yet.
   */
  earnings: async () => {
    // Try dedicated endpoint first (in case backend adds it later)
    try {
      return await request('/api/professional/earnings');
    } catch (err) {
      // 404 = endpoint doesn't exist → derive from jobs
      if (err && err.status !== 404) throw err;
    }

    // Fallback: derive earnings from completed jobs
    const jobs = await request('/api/professional/bookings/mine');
    return deriveEarningsFromJobs(jobs || []);
  },
};

/**
 * Temporary helper — build an earnings shape from raw jobs until
 * /api/professional/earnings exists on the backend.
 *
 * Uses job.partnerPayout if available; falls back to job.amount / job.jobValue.
 */
function deriveEarningsFromJobs(jobs) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const completed = jobs.filter((j) => j.status === 'WORK_COMPLETED');

  const amountOf = (j) =>
    Number(
      j.partnerPayout ??
        j.partner_payout ??
        j.amount ??
        j.jobValue ??
        j.totalAmount ??
        0
    );

  const thisMonthJobs = completed.filter((j) => {
    const d = j.completedAt || j.preferredDate;
    if (!d) return false;
    const date = new Date(d);
    return date >= monthStart && date <= now;
  });

  const pending = completed.filter(
    (j) => !j.paidAt && !j.paid_at && j.paymentStatus !== 'PAID'
  );

  const transactions = completed
    .map((j) => ({
      id: j.id,
      title: j.serviceLabel || 'Job payment',
      date: j.completedAt || j.preferredDate || '',
      reference: j.bookingNumber || j.reference || '',
      amount: amountOf(j),
      status: j.paidAt || j.paid_at ? 'PAID' : 'PENDING',
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    totalEarned: completed.reduce((sum, j) => sum + amountOf(j), 0),
    thisMonth: thisMonthJobs.reduce((sum, j) => sum + amountOf(j), 0),
    thisMonthJobs: thisMonthJobs.length,
    pending: pending.reduce((sum, j) => sum + amountOf(j), 0),
    pendingJobs: pending.length,
    bankMask: '',
    transactions,
  };
}
export default api;

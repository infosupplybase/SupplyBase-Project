/**
 * API CLIENT
 * ----------
 * Every call to the Supplybase backend goes through here.
 *
 * Tokens are kept in localStorage. That is readable by any script on the page,
 * so it is a real trade-off: an httpOnly cookie could not be read by injected
 * JavaScript, but would need CSRF protection and a shared parent domain
 * between the site and the API. localStorage is the pragmatic choice for a
 * separate API origin — the mitigation is not shipping XSS.
 *
 * The access token is short-lived (15 minutes). When it expires, `request`
 * silently exchanges the refresh token for a new pair and retries once, so
 * nothing above this file has to think about expiry.
 *
 * Every localStorage read/write is guarded for `window` — Next.js renders
 * "use client" components once on the server too, where localStorage does
 * not exist. Guarding here means every caller gets a safe no-op for free
 * instead of having to guard each call site individually.
 */

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '');

const ACCESS_KEY = 'sb.accessToken';
const REFRESH_KEY = 'sb.refreshToken';

/* ------------------------------------------------------------ token store */

export const getAccessToken = () =>
  typeof window === 'undefined' ? null : localStorage.getItem(ACCESS_KEY);
export const getRefreshToken = () =>
  typeof window === 'undefined' ? null : localStorage.getItem(REFRESH_KEY);

export function storeTokens({ accessToken, refreshToken }) {
  if (typeof window === 'undefined') return;
  if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

/* ---------------------------------------------------------------- errors */

/**
 * Carries the backend's error shape so callers can read `fieldErrors` without
 * unpicking a response object.
 */
export class ApiError extends Error {
  constructor(status, body) {
    super((body && body.message) || 'Something went wrong. Please try again.');
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = (body && body.fieldErrors) || null;
  }
}

/**
 * The message to show a person. Network failures need their own wording.
 *
 * A blocked CORS preflight reaches fetch() as an ordinary TypeError, exactly
 * like an offline connection, so in development the API address is appended.
 * "Could not reach the server" while the server is plainly running sends you
 * hunting the wrong problem; naming the URL it tried points straight at a
 * wrong port or a wrong origin. Never shown in production.
 */
export const friendlyError = (error) => {
  if (error instanceof ApiError) return error.message;
  if (error && error.name === 'TypeError') {
    const base = 'We could not reach the server. Check your connection and try again.';
    return process.env.NODE_ENV !== 'production'
      ? `${base} (Tried ${BASE_URL} from ${typeof window === 'undefined' ? '' : window.location.origin} — ` +
        `if the server is running, check the port and the CORS origins on the API.)`
      : base;
  }
  return (error && error.message) || 'Something went wrong. Please try again.';
};

/* --------------------------------------------------------------- refresh */

// One shared promise, so ten calls failing at once trigger one refresh rather
// than ten — and nine of them do not race to invalidate the token the winner
// just rotated to.
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

  // 401 on an authenticated call means the access token aged out. Refresh and
  // retry exactly once — a second 401 is a real rejection, not an expiry.
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

/** Builds a query string, dropping any param that is empty. */
function qs(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  });
  const string = query.toString();
  return string ? `?${string}` : '';
}

export const api = {
  register: (fullName, email, password, phone) =>
    request('/api/auth/register', {
      method: 'POST',
      auth: false,
      body: { fullName, email, password, phone },
    }),

  /** `identifier` is an email address or a phone number — the API works out which. */
  login: (identifier, password) =>
    request('/api/auth/login', { method: 'POST', auth: false, body: { identifier, password } }),

  loginWithGoogle: (credential) =>
    request('/api/auth/google', { method: 'POST', auth: false, body: { credential } }),

  logout: (refreshToken) =>
    request('/api/auth/logout', { method: 'POST', auth: false, body: { refreshToken } }),

  me: () => request('/api/auth/me'),

  myProjects: () => request('/api/projects/mine'),
  project: (id) => request(`/api/projects/${id}`),
  myPayments: () => request('/api/payments/mine'),

  createEnquiry: (payload) =>
    request('/api/enquiries', { method: 'POST', auth: false, body: payload }),

  /* ------------------------------------------------------- catalogue */

  /** The four services. Public — the home page needs it before anyone signs in. */
  services: () => request('/api/catalogue/services', { auth: false }),

  /**
   * One service's questions, in order. The form is drawn from this, so adding
   * an option in the admin screen changes the form with no deploy.
   */
  serviceForm: (slug) => request(`/api/catalogue/services/${slug}/form`, { auth: false }),

  /* ----------------------------------------------------- appointments */

  /** Availability comes from the backend, never from the browser. */
  availableSlots: (slug, from, days = 14) => {
    const query = new URLSearchParams({ service: slug, days: String(days) });
    if (from) query.set('from', from);
    return request(`/api/appointments/available-slots?${query}`, { auth: false });
  },

  /* --------------------------------------------------------- bookings */

  /**
   * auth is left ON deliberately. The endpoint is public, but sending the
   * token when there is one lets the API attach the booking to that account.
   */
  createBooking: (payload) => request('/api/bookings', { method: 'POST', body: payload }),

  myBookings: () => request('/api/bookings/mine'),

  /* ---------------------------------------------------------------- admin */

  /** Everything under here needs an ADMIN account — the API refuses anyone else. */
  admin: {
    enquiries: {
      list: ({ status, page = 0, size = 20 } = {}) =>
        request(`/api/admin/enquiries${qs({ status, page, size })}`),
      get: (id) => request(`/api/admin/enquiries/${id}`),
      update: (id, payload) => request(`/api/admin/enquiries/${id}`, { method: 'PATCH', body: payload }),
    },

    bookings: {
      list: ({ status, type, page = 0, size = 20 } = {}) =>
        request(`/api/admin/bookings${qs({ status, type, page, size })}`),
      /** The day sheet: every visit requested for one date, in slot order. */
      forDate: (date) => request(`/api/admin/bookings/day${qs({ date })}`),
      update: (id, payload) => request(`/api/admin/bookings/${id}`, { method: 'PATCH', body: payload }),
    },

    projects: {
      list: ({ page = 0, size = 20 } = {}) => request(`/api/admin/projects${qs({ page, size })}`),
      create: (payload) => request('/api/admin/projects', { method: 'POST', body: payload }),
      upsertStage: (id, payload) =>
        request(`/api/admin/projects/${id}/stages`, { method: 'PUT', body: payload }),
      /** status is a query param on this one, not a JSON body. */
      setStatus: (id, status) =>
        request(`/api/admin/projects/${id}/status${qs({ status })}`, { method: 'PATCH' }),
    },

    payments: {
      list: ({ page = 0, size = 20 } = {}) => request(`/api/admin/payments${qs({ page, size })}`),
      create: (payload) => request('/api/admin/payments', { method: 'POST', body: payload }),
    },
  },
};

export default api;

/**
 * API CLIENT — admin app
 * ----------------------
 * A trimmed copy of the main site's api.js: token handling plus only the
 * endpoints staff actually use (sign in, who-am-i, one project by id, and
 * everything under /api/admin/*). The public catalogue/booking/enquiry
 * endpoints and Google/registration flows live in the main site, not here.
 *
 * localStorage reads/writes are guarded for `window` — Next.js renders
 * "use client" components once on the server too, where localStorage does
 * not exist. Guarding here means every caller gets a safe no-op for free.
 */

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '');

const ACCESS_KEY = 'sb.admin.accessToken';
const REFRESH_KEY = 'sb.admin.refreshToken';

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
    return process.env.NODE_ENV !== 'production'
      ? `${base} (Tried ${BASE_URL} from ${typeof window === 'undefined' ? '' : window.location.origin} — ` +
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
  /** `identifier` is an email address or a phone number — the API works out which. */
  login: (identifier, password) =>
    request('/api/auth/login', { method: 'POST', auth: false, body: { identifier, password } }),

  logout: (refreshToken) =>
    request('/api/auth/logout', { method: 'POST', auth: false, body: { refreshToken } }),

  me: () => request('/api/auth/me'),

  project: (id) => request(`/api/projects/${id}`),

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
      forDate: (date) => request(`/api/admin/bookings/day${qs({ date })}`),
      update: (id, payload) => request(`/api/admin/bookings/${id}`, { method: 'PATCH', body: payload }),
    },

    projects: {
      list: ({ page = 0, size = 20 } = {}) => request(`/api/admin/projects${qs({ page, size })}`),
      create: (payload) => request('/api/admin/projects', { method: 'POST', body: payload }),
      upsertStage: (id, payload) =>
        request(`/api/admin/projects/${id}/stages`, { method: 'PUT', body: payload }),
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

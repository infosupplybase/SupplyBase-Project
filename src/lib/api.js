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
 */

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');

const ACCESS_KEY = 'sb.accessToken';
const REFRESH_KEY = 'sb.refreshToken';

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

/** The message to show a person. Network failures need their own wording. */
export const friendlyError = (error) => {
  if (error instanceof ApiError) return error.message;
  if (error && error.name === 'TypeError') {
    return 'We could not reach the server. Check your connection and try again.';
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
  myPayments: () => request('/api/payments/mine'),

  createEnquiry: (payload) =>
    request('/api/enquiries', { method: 'POST', auth: false, body: payload }),

  /**
   * auth is left ON deliberately. The endpoint is public, but sending the
   * token when there is one lets the API attach the booking to that account.
   */
  createBooking: (payload) => request('/api/bookings', { method: 'POST', body: payload }),

  myBookings: () => request('/api/bookings/mine'),
};

export default api;

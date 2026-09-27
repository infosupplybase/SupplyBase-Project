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
 * anyway, so each has its own storage.
 */

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');

export const ACCESS_KEY = 'sb.partner.accessToken';
export const REFRESH_KEY = 'sb.partner.refreshToken';

/** Fired on window when the server stops accepting this session (see request()). */
export const SESSION_EXPIRED_EVENT = 'sb:partner-session-expired';

/* ------------------------------------------------------------ token store */

/*
 * Where the tokens live decides how long a sign-in lasts on this device:
 *
 *   sessionStorage — the default. Gone when the browser (or this tab) is
 *                    closed, so a partner who signs in on a shared or
 *                    borrowed phone does not leave the account open on it.
 *   localStorage   — only when the partner ticks "Keep me signed in on this
 *                    device" at sign-in; survives restarts, for their own phone.
 *
 * Reads check both, so a refresh keeps the tokens in whichever one they were
 * put in. Every access is wrapped: storage can throw (private mode, blocked
 * site data), and a throw here must mean "not signed in", not a blank page.
 */
const stores = () => {
  const list = [];
  try {
    list.push(window.sessionStorage);
  } catch {
    /* unavailable */
  }
  try {
    list.push(window.localStorage);
  } catch {
    /* unavailable */
  }
  return list;
};

const read = (key) => {
  for (const store of stores()) {
    try {
      const value = store.getItem(key);
      if (value) return value;
    } catch {
      /* unreadable */
    }
  }
  return null;
};

const storeHolding = (key) =>
  stores().find((store) => {
    try {
      return Boolean(store.getItem(key));
    } catch {
      return false;
    }
  });

export const getAccessToken = () => read(ACCESS_KEY);
export const getRefreshToken = () => read(REFRESH_KEY);

/** True when this device was asked to keep the partner signed in. */
export const isRemembered = () => {
  try {
    return Boolean(window.localStorage.getItem(REFRESH_KEY));
  } catch {
    return false;
  }
};

/**
 * `remember` picks the store on sign-in. Left out (a token refresh), the new
 * tokens go where the old ones were.
 */
export function storeTokens({ accessToken, refreshToken }, remember) {
  let target;
  if (remember === undefined) {
    target = storeHolding(REFRESH_KEY) || stores()[0];
  } else {
    clearTokens();
    try {
      target = remember ? window.localStorage : window.sessionStorage;
    } catch {
      target = null;
    }
  }
  if (!target) return;
  try {
    if (accessToken) target.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) target.setItem(REFRESH_KEY, refreshToken);
  } catch {
    /* storage full or blocked: the sign-in lasts only until reload */
  }
}

export function clearTokens() {
  for (const store of stores()) {
    try {
      store.removeItem(ACCESS_KEY);
      store.removeItem(REFRESH_KEY);
    } catch {
      /* nothing to clear */
    }
  }
}

/** Tell the app the session is over: tokens are dropped and it returns to sign-in. */
function endSession() {
  clearTokens();
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
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
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
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
    // Jobs carry customers' phone numbers and addresses: never keep a copy
    // of an API answer in the browser's HTTP cache.
    cache: 'no-store',
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
  });
}

export async function request(path, options = {}) {
  const hadSession = options.auth !== false && Boolean(getAccessToken() || getRefreshToken());
  let response = await send(path, options);

  if (response.status === 401 && options.auth !== false && getRefreshToken()) {
    const refreshed = await refreshTokens();
    if (refreshed) response = await send(path, options);
  }

  // Signed in a moment ago and the server no longer accepts it (signed out
  // elsewhere, password changed, account disabled, refresh expired): end the
  // session here too rather than leave a dashboard of failing requests.
  if (response.status === 401 && hadSession) endSession();

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
};

export default api;

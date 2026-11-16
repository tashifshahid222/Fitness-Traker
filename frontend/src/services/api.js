import axios from 'axios';

export const API_BASE_URL = import.meta.env.DEV
  ? '/api/v1'
  : import.meta.env.VITE_API_URL || '/api/v1';

export const AUTH_EXPIRED_EVENT = 'auth:unauthorized';

let accessToken = null;
let refreshPromise = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  if (config.url?.includes('/auth/')) config.headers['X-CSRF-Protection'] = '1';
  return config;
});

const isAuthRequest = (url = '') => /\/auth\/(login|register|refresh)(?:$|\?)/.test(url);

export const refreshAccessToken = (config = {}) => {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh', {}, { suppressAuthExpiredEvent: false, ...config })
      .then((response) => {
        const token = response.data.data.accessToken;
        if (!token) return null;
        setAccessToken(token);
        return token;
      })
      .catch((error) => {
        setAccessToken(null);
        if (!config.suppressAuthExpiredEvent) {
          window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
        }
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const config = error.config;
    const url = config?.url || '';

    if (status !== 401 || !config) return Promise.reject(error);

    if (url.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (isAuthRequest(url)) return Promise.reject(error);
    if (config.skipAuthRefresh || !accessToken) return Promise.reject(error);

    if (config._authRetry) {
      setAccessToken(null);
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      return Promise.reject(error);
    }

    config._authRetry = true;
    try {
      const token = await refreshAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
      return api.request(config);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

const unwrap = (response) => response.data;

const http = {
  get: (path, config) => api.get(path, config).then(unwrap),
  post: (path, body, config) => api.post(path, body, config).then(unwrap),
  put: (path, body, config) => api.put(path, body, config).then(unwrap),
  patch: (path, body, config) => api.patch(path, body, config).then(unwrap),
  del: (path, config) => api.delete(path, config).then(unwrap),
};

// True when a request never reached the server: offline, DNS failure, CORS
// block, or a client-side timeout. Axios leaves `response` undefined in these
// cases, whereas server-side errors always carry a response.
export function isNetworkError(error) {
  if (!error) return false;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;

  const code = error.code;
  if (code === 'ECONNABORTED' || code === 'ETIMEDOUT' || code === 'ERR_NETWORK') return true;

  return !error.response && Boolean(error.request || error.isAxiosError);
}

export function extractError(error, fallback = 'Something went wrong') {
  const data = error?.response?.data;
  const errors = data?.errors;
  const hasFieldErrors = Array.isArray(errors)
    ? errors.length > 0
    : Boolean(errors) && typeof errors === 'object' && Object.keys(errors).length > 0;
  const message = data?.message || error?.message || fallback;
  if (hasFieldErrors && message === 'Validation failed') return '';
  return message;
}

export function extractFieldErrors(error) {
  const errors = error?.response?.data?.errors;
  if (!errors) return {};
  if (Array.isArray(errors)) {
    const map = {};
    errors.forEach((e) => {
      if (e?.field && e?.message) map[e.field] = e.message;
    });
    return map;
  }
  return errors;
}

export { http };
export default api;

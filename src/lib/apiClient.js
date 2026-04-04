import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// ── Axios instance ────────────────────────────────────────────
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// ── Token helpers ─────────────────────────────────────────────
export const tokenStorage = {
  getAccess:   ()  => localStorage.getItem('sh_access'),
  getRefresh:  ()  => localStorage.getItem('sh_refresh'),
  setTokens:   (a, r) => { localStorage.setItem('sh_access', a); if (r) localStorage.setItem('sh_refresh', r); },
  clearTokens: ()  => { localStorage.removeItem('sh_access'); localStorage.removeItem('sh_refresh'); },
};

// ── Request interceptor — attach Authorization header ─────────
api.interceptors.request.use(
  config => {
    const token = tokenStorage.getAccess();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  err => Promise.reject(err),
);

// ── Response interceptor — auto-refresh on 401 ───────────────
let refreshing = false;
let queue = [];

const processQueue = (err, token = null) => {
  queue.forEach(p => err ? p.reject(err) : p.resolve(token));
  queue = [];
};

api.interceptors.response.use(
  res => res.data,   // unwrap .data so callers get the payload directly
  async err => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      const refresh = tokenStorage.getRefresh();
      if (!refresh) { tokenStorage.clearTokens(); window.location.href = '/'; return Promise.reject(err); }

      if (refreshing) {
        return new Promise((resolve, reject) => queue.push({ resolve, reject }))
          .then(token => { orig.headers.Authorization = `Bearer ${token}`; return api(orig); });
      }

      orig._retry = true;
      refreshing = true;

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: refresh });
        const { accessToken, refreshToken } = res.data.data;
        tokenStorage.setTokens(accessToken, refreshToken);
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        orig.headers.Authorization = `Bearer ${accessToken}`;
        return api(orig);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        tokenStorage.clearTokens();
        window.location.href = '/';
        return Promise.reject(refreshErr);
      } finally {
        refreshing = false;
      }
    }

    // Unwrap error message for consumers
    const msg = err.response?.data?.message || err.message || 'Something went wrong';
    return Promise.reject(new Error(Array.isArray(msg) ? msg.join(', ') : msg));
  },
);

export default api;

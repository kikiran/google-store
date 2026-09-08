import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

let refreshPromise: Promise<boolean> | null = null;

function getSessionKey(): string | null {
  return localStorage.getItem('nova_guest_session');
}

api.interceptors.request.use((config) => {
  if (config.method === 'get' && config.url?.startsWith('/cart')) {
    const sk = getSessionKey();
    if (sk) {
      const hasQuery = config.url.includes('?');
      config.url += (hasQuery ? '&' : '?') + 'sessionKey=' + encodeURIComponent(sk);
    }
  }
  return config;
});

const skipRefreshUrls = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (err.response?.status === 401 && !originalRequest._retry && !skipRefreshUrls.some((u) => originalRequest.url?.includes(u))) {
      originalRequest._retry = true;
      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            await api.post('/auth/refresh');
            return true;
          } catch {
            return false;
          } finally {
            refreshPromise = null;
          }
        })();
      }
      const ok = await refreshPromise;
      if (ok) {
        return api(originalRequest);
      }
      window.dispatchEvent(new CustomEvent('nova:unauthorized'));
    }
    return Promise.reject(err);
  },
);

export function handleApiError(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  if (axios.isAxiosError(err) && err.response?.data?.message) {
    return err.response.data.message;
  }
  return 'Something went wrong. Please try again.';
}

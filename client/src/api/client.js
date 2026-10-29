import axios from 'axios';

// По умолчанию API доступен по относительному пути /api: в разработке его проксирует Vite,
// в продакшене — Vercel (rewrites) или nginx. Так refresh-cookie остаётся «своей» для браузера.
export const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // отправлять httpOnly cookie с refresh-токеном
  timeout: 15000,
});

// Access-токен хранится только в памяти (не в localStorage), чтобы его нельзя было украсть через XSS
let accessToken = null;
let onAuthLost = () => {};

export function setAccessToken(token) {
  accessToken = token;
}

export function setOnAuthLost(handler) {
  onAuthLost = handler;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// Один общий запрос обновления токена, даже если несколько запросов получили 401 одновременно
let refreshPromise = null;

export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = api.post('/auth/refresh')
      .then((res) => {
        setAccessToken(res.data.data.accessToken);
        return res.data.data;
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

// Access-токен живёт 15 минут. При 401 пробуем обновить его по refresh-cookie и повторить запрос.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isAuthCall = original?.url?.startsWith('/auth/');
    if (status === 401 && original && !original._retried && !isAuthCall && accessToken) {
      original._retried = true;
      try {
        await refreshSession();
        return api(original);
      } catch {
        setAccessToken(null);
        onAuthLost();
      }
    }
    return Promise.reject(error);
  },
);

// Текст ошибки для пользователя из ответа API ({ error: { message, details } })
export function getErrorMessage(error, fallback = 'Что-то пошло не так') {
  if (!error) return fallback;
  if (error.code === 'ECONNABORTED') return 'Сервер не ответил вовремя. Попробуйте ещё раз';
  if (!error.response) return 'Нет связи с сервером';
  const apiError = error.response.data?.error;
  if (!apiError) return fallback;
  return apiError.details?.length ? `${apiError.message}: ${apiError.details.join('; ')}` : apiError.message;
}

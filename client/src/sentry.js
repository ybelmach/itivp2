import * as Sentry from '@sentry/react';

// Sentry включается, только если при сборке задан VITE_SENTRY_DSN
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_RELEASE || 'dev',
    sendDefaultPii: false,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
    // Трассировка (заголовки sentry-trace) только для запросов к своему API
    tracePropagationTargets: [/^\/api/],
    // Не отправляем в Sentry ошибки сети и отменённые запросы — это не баги приложения
    ignoreErrors: ['Network Error', 'canceled', 'Request aborted'],
  });
}

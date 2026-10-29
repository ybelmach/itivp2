// Sentry подключается до загрузки express и остальных модулей,
// чтобы автоматически инструментировать HTTP-запросы и Express
const Sentry = require('@sentry/node');
const { sentryDsn, env, release, isTest } = require('./config/env');

const SENSITIVE_HEADERS = ['authorization', 'cookie', 'set-cookie'];

if (sentryDsn && !isTest) {
  Sentry.init({
    dsn: sentryDsn,
    environment: env,
    release,
    // IP, cookie и тела запросов не отправляются
    sendDefaultPii: false,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    beforeSend(event) {
      const request = event.request;
      if (request) {
        delete request.cookies;
        delete request.data;
        if (request.headers) {
          for (const h of Object.keys(request.headers)) {
            if (SENSITIVE_HEADERS.includes(h.toLowerCase())) request.headers[h] = '[REDACTED]';
          }
        }
      }
      return event;
    },
  });
}

module.exports = Sentry;

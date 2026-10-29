require('dotenv').config({ quiet: true });

// Переменные окружения, без которых сервер не запустится
const required = ['DATABASE_URL', 'JWT_SECRET'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  throw new Error(`Не заданы переменные окружения: ${missing.join(', ')}. См. .env.example`);
}

const list = (value) => (value || '').split(',').map((s) => s.trim()).filter(Boolean);

// TRUST_PROXY: число прокси перед приложением (Render, Vercel, nginx) или true/false.
// Нужно, чтобы req.ip и rate limit видели настоящий IP клиента, а не адрес прокси.
function parseTrustProxy(value) {
  if (value === undefined || value === '') return false;
  if (value === 'true') return true;
  if (value === 'false') return false;
  const n = Number(value);
  return Number.isNaN(n) ? value : n;
}

const env = process.env.NODE_ENV || 'development';

module.exports = {
  env,
  isProduction: env === 'production',
  isTest: env === 'test',
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  // Облачные БД (Neon, Supabase) требуют TLS
  databaseSsl: process.env.DATABASE_SSL === 'true',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS) || 7,
  corsOrigins: list(process.env.CORS_ORIGINS),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 100,
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  release: process.env.APP_RELEASE || process.env.RENDER_GIT_COMMIT || 'dev',

  // Мониторинг. Каждый сервис включается, только если задан его ключ.
  sentryDsn: process.env.SENTRY_DSN || '',
  betterStackToken: process.env.BETTERSTACK_SOURCE_TOKEN || '',
  betterStackHost: process.env.BETTERSTACK_INGESTING_HOST || '',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
  logLevel: process.env.LOG_LEVEL || (env === 'test' ? 'error' : 'info'),
};

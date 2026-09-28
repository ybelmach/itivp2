require('dotenv').config();

// Переменные окружения, без которых сервер не запустится
const required = ['DATABASE_URL', 'JWT_SECRET'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  throw new Error(`Не заданы переменные окружения: ${missing.join(', ')}. См. .env.example`);
}

const list = (value) => (value || '').split(',').map((s) => s.trim()).filter(Boolean);

module.exports = {
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS) || 7,
  corsOrigins: list(process.env.CORS_ORIGINS),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 100,
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
};

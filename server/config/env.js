require('dotenv').config();

// Переменные окружения, без которых сервер не запустится
const required = ['DATABASE_URL', 'JWT_SECRET'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  throw new Error(`Не заданы переменные окружения: ${missing.join(', ')}. См. .env.example`);
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
};

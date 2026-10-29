// Переменные окружения для тестов. DATABASE_URL задаётся снаружи (CI или локальный Docker),
// по умолчанию — отдельная тестовая база в контейнере из docker-compose.yml
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
  || process.env.DATABASE_URL
  || 'postgres://study:study@localhost:5432/study_materials_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-'.padEnd(64, 'x');
process.env.RATE_LIMIT_MAX = '10000';
process.env.AUTH_RATE_LIMIT_MAX = '10000';
process.env.CORS_ORIGINS = 'http://localhost:5173';
// Внешние сервисы в тестах не используются
delete process.env.SENTRY_DSN;
delete process.env.BETTERSTACK_SOURCE_TOKEN;
delete process.env.TELEGRAM_BOT_TOKEN;

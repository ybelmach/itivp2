const Sentry = require('@sentry/node');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { corsOrigins, rateLimitMax, trustProxy } = require('./config/env');
const authRouter = require('./routes/auth.routes');
const materialsRouter = require('./routes/materials.routes');
const favoritesRouter = require('./routes/favorites.routes');
const usersRouter = require('./routes/users.routes');
const adminRouter = require('./routes/admin.routes');
const monitoringRouter = require('./routes/monitoring.routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const HttpError = require('./utils/HttpError');
const { logger, logSecurityEvent } = require('./utils/logger');
const { metricsMiddleware } = require('./utils/metrics');

const app = express();

// За прокси (Render, Vercel, nginx) берём IP клиента из X-Forwarded-For
app.set('trust proxy', trustProxy);
app.disable('x-powered-by');

// Счётчики запросов и времени ответа для /metrics
app.use(metricsMiddleware);

// Журнал запросов: 5xx и 4xx отдельно, чтобы неверные запросы было легко найти в логах
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const meta = {
      method: req.method,
      url: req.originalUrl.split('?')[0],
      status: res.statusCode,
      durationMs: Date.now() - start,
      ip: req.ip,
      userId: req.user ? req.user.id : undefined,
    };
    if (res.statusCode >= 500) logger.warn('request_failed', meta);
    else if (res.statusCode >= 400) logger.warn('bad_request', meta);
    else logger.http('request', meta);
  });
  next();
});

// Заголовки безопасности. API отдаёт только JSON, поэтому CSP запрещает всё,
// а X-Frame-Options: DENY запрещает встраивать ответы во фреймы
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
  },
  frameguard: { action: 'deny' },
}));

// CORS только для доменов из белого списка CORS_ORIGINS.
// Запросы без заголовка Origin (Postman, curl, сервер-сервер) не ограничиваются браузерной политикой CORS.
app.use((req, res, next) => {
  const origin = req.get('Origin');
  if (origin && !corsOrigins.includes(origin)) {
    logSecurityEvent('cors_origin_rejected', req, { origin });
  }
  next();
});
app.use(cors({
  origin: (origin, callback) => callback(null, !origin || corsOrigins.includes(origin)),
  credentials: true, // нужно для cookie с refresh-токеном
}));

// /health и /metrics — до rate limit: их часто опрашивают мониторинг и страница метрик.
// Доступны и в корне (для UptimeRobot), и под /api (через прокси фронтенда).
app.use(monitoringRouter);
app.use('/api', monitoringRouter);

// Глобальный лимит: не более RATE_LIMIT_MAX запросов за 15 минут с одного IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: rateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res, next) => {
    logSecurityEvent('rate_limit_exceeded', req);
    next(new HttpError(429, 'Слишком много запросов. Повторите позже'));
  },
}));

// Парсинг тела запроса. Ограничение размера защищает от DoS большими телами
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.json({
    name: 'Study Materials API',
    description: 'Платформа для обмена учебными материалами (лекции, презентации, книги)',
    docs: 'см. API.md',
    health: '/health',
    metrics: '/metrics',
  });
});

app.use('/api/auth', authRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/users', usersRouter);
app.use('/api/admin', adminRouter);

// 404 для неизвестных маршрутов
app.use(notFound);

// Sentry получает необработанные ошибки (статус 500 и выше) до нашего обработчика.
// Без SENTRY_DSN обработчик ничего не отправляет.
Sentry.setupExpressErrorHandler(app);

// Глобальный обработчик ошибок (должен быть последним)
app.use(errorHandler);

module.exports = app;

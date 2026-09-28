const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { corsOrigins, rateLimitMax } = require('./config/env');
const authRouter = require('./routes/auth.routes');
const materialsRouter = require('./routes/materials.routes');
const usersRouter = require('./routes/users.routes');
const adminRouter = require('./routes/admin.routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const HttpError = require('./utils/HttpError');
const { logSecurityEvent } = require('./utils/logger');

const app = express();

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

// Простое логирование запросов
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start} ms)`);
  });
  next();
});

app.get('/', (req, res) => {
  res.json({
    name: 'Study Materials API',
    description: 'Платформа для обмена учебными материалами (лекции, презентации, книги)',
    docs: 'см. API.md',
  });
});

app.use('/api/auth', authRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/users', usersRouter);
app.use('/api/admin', adminRouter);

// 404 для неизвестных маршрутов
app.use(notFound);

// Глобальный обработчик ошибок (должен быть последним)
app.use(errorHandler);

module.exports = app;

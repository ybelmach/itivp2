const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { corsOrigins } = require('./config/env');

const authRouter = require('./routes/auth.routes');
const materialsRouter = require('./routes/materials.routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Заголовки безопасности
app.use(helmet());
// CORS: браузер пропустит ответы только для адресов фронтенда из CORS_ORIGINS
app.use(cors({ origin: corsOrigins }));
// Не более 100 запросов за 15 минут с одного IP
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: 'draft-7', legacyHeaders: false }));

// Парсинг тела запроса в форматах JSON и URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// 404 для неизвестных маршрутов
app.use(notFound);

// Глобальный обработчик ошибок (должен быть последним)
app.use(errorHandler);

module.exports = app;

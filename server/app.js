const express = require('express');

const materialsRouter = require('./routes/materials.routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

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
    endpoints: {
      list: 'GET /api/materials',
      getOne: 'GET /api/materials/:id',
      create: 'POST /api/materials',
      update: 'PUT /api/materials/:id',
      remove: 'DELETE /api/materials/:id',
    },
  });
});

app.use('/api/materials', materialsRouter);

// 404 для неизвестных маршрутов
app.use(notFound);

// Глобальный обработчик ошибок (должен быть последним)
app.use(errorHandler);

module.exports = app;

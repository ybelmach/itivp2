const { UniqueConstraintError, ValidationError } = require('sequelize');

// Глобальный обработчик ошибок. Express распознаёт его по четырём аргументам.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || err.statusCode || 500;
  let message = err.message;
  let details = err.details;

  // Ошибка разбора тела запроса (например, невалидный JSON) от express.json()
  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Некорректный JSON в теле запроса';
  }

  // Ошибки ограничений БД, не пойманные валидацией на входе
  if (err instanceof UniqueConstraintError) {
    status = 409;
    message = 'Запись с такими данными уже существует';
    details = undefined;
  } else if (err instanceof ValidationError) {
    status = 400;
    message = 'Ошибка валидации данных';
    details = err.errors.map((e) => `${e.path}: ${e.message}`);
  }

  // Детали внутренних ошибок пишутся в лог, но не отдаются клиенту
  if (status >= 500) {
    console.error(err);
    message = 'Внутренняя ошибка сервера';
    details = undefined;
  }

  const error = { status, message };
  if (details) error.details = details;

  res.status(status).json({ error });
}

module.exports = errorHandler;

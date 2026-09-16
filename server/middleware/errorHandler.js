// Глобальный обработчик ошибок. Express распознаёт его по четырём аргументам.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || err.statusCode || 500;
  let message = err.message;

  // Ошибка разбора тела запроса (например, невалидный JSON) от express.json()
  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Некорректный JSON в теле запроса';
  }

  if (status >= 500) {
    console.error(err);
    message = 'Внутренняя ошибка сервера';
  }

  const error = { status, message };
  if (err.details) error.details = err.details;

  res.status(status).json({ error });
}

module.exports = errorHandler;

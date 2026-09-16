const HttpError = require('../utils/HttpError');

function notFound(req, res, next) {
  next(HttpError.notFound(`Маршрут ${req.method} ${req.originalUrl} не найден`));
}

module.exports = notFound;

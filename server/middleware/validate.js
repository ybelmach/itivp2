const HttpError = require('../utils/HttpError');

// Проверяет req[source] по схеме Joi. Неизвестные поля отбрасываются,
// в req[source] кладётся очищенное значение.
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      const details = error.details.map((d) => `${d.path.join('.')}: ${d.message}`);
      return next(HttpError.badRequest('Ошибка валидации данных', details));
    }
    // В Express 5 req.query — геттер, поэтому сохраняем результат отдельно
    if (source === 'query') req.validatedQuery = value;
    else req[source] = value;
    next();
  };
}

module.exports = validate;

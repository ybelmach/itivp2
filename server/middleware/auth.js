const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const { User } = require('../models');
const HttpError = require('../utils/HttpError');

// Проверяет заголовок Authorization: Bearer <token> и кладёт пользователя в req.user
async function authenticate(req, res, next) {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw HttpError.unauthorized();
  }

  let payload;
  try {
    payload = jwt.verify(token, jwtSecret);
  } catch {
    throw HttpError.unauthorized('Токен недействителен или истёк');
  }

  // Пользователь мог быть удалён или его роль изменена после выдачи токена
  const user = await User.findByPk(payload.sub);
  if (!user) {
    throw HttpError.unauthorized('Токен недействителен или истёк');
  }
  req.user = user;
  next();
}

// Пропускает только пользователей с одной из перечисленных ролей
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw HttpError.forbidden();
    }
    next();
  };
}

module.exports = { authenticate, requireRole };

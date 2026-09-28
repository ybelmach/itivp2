const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const { User } = require('../models');
const HttpError = require('../utils/HttpError');
const { logSecurityEvent } = require('../utils/logger');
const { trackPrivilegedActions } = require('../utils/audit');

// Проверяет заголовок Authorization: Bearer <token> и кладёт пользователя в req.user
async function authenticate(req, res, next) {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw HttpError.unauthorized();
  }

  let payload;
  try {
    payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
  } catch (err) {
    // Истёкший токен — обычная ситуация, поддельный — подозрительная
    if (err.name !== 'TokenExpiredError') {
      logSecurityEvent('invalid_token', req, { reason: err.message });
    }
    throw HttpError.unauthorized('Токен недействителен или истёк');
  }

  // Пользователь мог быть удалён или его роль изменена после выдачи токена,
  // поэтому роль всегда берётся из БД, а не из токена
  const user = await User.findByPk(payload.sub);
  if (!user) {
    throw HttpError.unauthorized('Токен недействителен или истёк');
  }
  req.user = user;
  trackPrivilegedActions(req, res);
  next();
}

// Пропускает пользователей с ролью не ниже requiredRole (user < moderator < admin)
function roleGuard(requiredRole) {
  return (req, res, next) => {
    if (!User.hasRoleAtLeast(req.user.role, requiredRole)) {
      logSecurityEvent('access_denied_role', req, { role: req.user.role, requiredRole });
      throw HttpError.forbidden();
    }
    next();
  };
}

module.exports = { authenticate, roleGuard };

const express = require('express');
const rateLimit = require('express-rate-limit');

const controller = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { registerSchema, loginSchema } = require('../validators/auth.validators');
const { authRateLimitMax } = require('../config/env');
const { logSecurityEvent } = require('../utils/logger');
const HttpError = require('../utils/HttpError');

const router = express.Router();

// Отдельный, более строгий лимит для входа и регистрации (перебор паролей, массовая регистрация)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: authRateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res, next) => {
    logSecurityEvent('auth_rate_limit_exceeded', req);
    next(new HttpError(429, 'Слишком много попыток. Повторите позже'));
  },
});

router.post('/register', authLimiter, validate(registerSchema), controller.register);
router.post('/login', authLimiter, validate(loginSchema), controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.get('/me', authenticate, controller.me);

module.exports = router;

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn, refreshTokenTtlDays, isProduction } = require('../config/env');
const { User } = require('../models');
const HttpError = require('../utils/HttpError');
const { logSecurityEvent } = require('../utils/logger');

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

const REFRESH_COOKIE = 'refreshToken';
const refreshCookieOptions = {
  httpOnly: true, // недоступна из JavaScript на странице
  secure: isProduction, // только по HTTPS в продакшене
  sameSite: 'strict', // не отправляется с запросами с чужих сайтов (CSRF)
  path: '/api/auth', // отправляется только на маршруты аутентификации
};

// Хеш-заглушка, чтобы время ответа для несуществующего email не отличалось
const DUMMY_HASH = bcrypt.hashSync('dummy-password', BCRYPT_ROUNDS);

function issueAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn, algorithm: 'HS256' });
}

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

// Создаёт новый refresh-токен, сохраняет его хеш в БД и кладёт токен в httpOnly cookie.
// Старый токен при этом перестаёт действовать (ротация).
async function issueRefreshToken(user, res) {
  const token = crypto.randomBytes(48).toString('base64url');
  const expiresAt = new Date(Date.now() + refreshTokenTtlDays * 24 * 60 * 60 * 1000);
  await user.update({ refreshTokenHash: sha256(token), refreshTokenExpiresAt: expiresAt });
  res.cookie(REFRESH_COOKIE, token, { ...refreshCookieOptions, expires: expiresAt });
}

function toPublic(user) {
  const { id, email, role, createdAt, updatedAt } = user;
  return { id, email, role, createdAt, updatedAt };
}

async function sendTokens(user, res) {
  await issueRefreshToken(user, res);
  res.status(200).json({
    data: {
      accessToken: issueAccessToken(user),
      tokenType: 'Bearer',
      expiresIn: jwtExpiresIn,
      user: toPublic(user),
    },
  });
}

// POST /api/auth/register
async function register(req, res) {
  const { email, password } = req.body;

  const exists = await User.findOne({ where: { email } });
  if (exists) {
    throw HttpError.conflict('Пользователь с таким email уже зарегистрирован');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  // Роль при регистрации всегда user, из тела запроса она не берётся
  const user = await User.create({ email, passwordHash, role: 'user' }, { fields: ['email', 'passwordHash', 'role'] });

  res.status(201).json({ data: toPublic(user) });
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.scope('withSecrets').findOne({ where: { email } });

  if (user && user.lockUntil && user.lockUntil > new Date()) {
    logSecurityEvent('login_while_locked', req, { email, lockUntil: user.lockUntil });
    const minutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
    throw new HttpError(423, `Слишком много неудачных попыток входа. Попробуйте через ${minutes} мин.`);
  }

  // bcrypt.compare сравнивает хеши за постоянное время; для неизвестного email
  // сравниваем с заглушкой, чтобы по времени ответа нельзя было перебирать email
  const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);

  if (!user || !ok) {
    if (user) {
      const attempts = user.failedLoginAttempts + 1;
      const locked = attempts >= MAX_FAILED_ATTEMPTS;
      await user.update({
        failedLoginAttempts: locked ? 0 : attempts,
        lockUntil: locked ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null,
      });
      logSecurityEvent(locked ? 'account_locked' : 'login_failed', req, { email, attempts });
    } else {
      logSecurityEvent('login_failed', req, { email, reason: 'unknown email' });
    }
    // Одинаковый ответ для неизвестного email и неверного пароля
    throw HttpError.unauthorized('Неверный email или пароль');
  }

  if (user.failedLoginAttempts > 0 || user.lockUntil) {
    await user.update({ failedLoginAttempts: 0, lockUntil: null });
  }
  await sendTokens(user, res);
}

// POST /api/auth/refresh — новый access-токен по refresh-токену из cookie
async function refresh(req, res) {
  const token = req.cookies[REFRESH_COOKIE];
  if (!token) {
    throw HttpError.unauthorized('Refresh-токен отсутствует');
  }

  const user = await User.scope('withSecrets').findOne({ where: { refreshTokenHash: sha256(token) } });
  if (!user || user.refreshTokenExpiresAt < new Date()) {
    // Неизвестный токен: истёк, уже был использован (ротация) или подделан
    logSecurityEvent('invalid_refresh_token', req, { found: Boolean(user) });
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
    throw HttpError.unauthorized('Refresh-токен недействителен');
  }

  await sendTokens(user, res);
}

// POST /api/auth/logout — отзывает refresh-токен
async function logout(req, res) {
  const token = req.cookies[REFRESH_COOKIE];
  if (token) {
    await User.update(
      { refreshTokenHash: null, refreshTokenExpiresAt: null },
      { where: { refreshTokenHash: sha256(token) } },
    );
  }
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
  res.status(204).end();
}

// GET /api/auth/me
function me(req, res) {
  res.status(200).json({ data: toPublic(req.user) });
}

module.exports = { register, login, refresh, logout, me, toPublic };

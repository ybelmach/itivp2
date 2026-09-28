const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const { User } = require('../models');
const HttpError = require('../utils/HttpError');

const BCRYPT_ROUNDS = 12;

function issueToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });
}

function toPublic(user) {
  const { id, email, role, createdAt, updatedAt } = user;
  return { id, email, role, createdAt, updatedAt };
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
  const user = await User.create({ email, passwordHash, role: 'user' });

  res.status(201).json({ data: toPublic(user) });
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.scope('withPassword').findOne({ where: { email } });
  const ok = user && await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    // Одинаковый ответ для неизвестного email и неверного пароля
    throw HttpError.unauthorized('Неверный email или пароль');
  }

  res.status(200).json({
    data: {
      accessToken: issueToken(user),
      tokenType: 'Bearer',
      expiresIn: jwtExpiresIn,
      user: toPublic(user),
    },
  });
}

// GET /api/auth/me
function me(req, res) {
  res.status(200).json({ data: toPublic(req.user) });
}

module.exports = { register, login, me, toPublic };

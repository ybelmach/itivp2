const bcrypt = require('bcrypt');
const request = require('supertest');
const app = require('../app');
const { sequelize, User, Material } = require('../models');

const PASSWORD = 'Password123!';

// Пересоздаёт таблицы и заводит по пользователю на каждую роль
async function resetDb() {
  await sequelize.sync({ force: true });
  const passwordHash = await bcrypt.hash(PASSWORD, 4);
  const [admin, moderator, user, user2] = await User.bulkCreate([
    { email: 'admin@test.io', passwordHash, role: 'admin' },
    { email: 'moderator@test.io', passwordHash, role: 'moderator' },
    { email: 'user@test.io', passwordHash, role: 'user' },
    { email: 'user2@test.io', passwordHash, role: 'user' },
  ]);
  return { admin, moderator, user, user2 };
}

async function login(email) {
  const res = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
  if (res.status !== 200) throw new Error(`login failed for ${email}: ${res.status}`);
  return res.body.data.accessToken;
}

function materialPayload(overrides = {}) {
  return {
    title: 'Лекция по тестированию',
    type: 'lecture',
    subject: 'Интернет-технологии',
    author: 'Иванов И.И.',
    description: 'Jest и supertest',
    fileUrl: 'https://example.com/test.pdf',
    tags: ['Jest', 'testing'],
    ...overrides,
  };
}

async function createMaterial(ownerId, overrides = {}) {
  return Material.create({ ...materialPayload(overrides), ownerId });
}

module.exports = {
  app, request, sequelize, resetDb, login, materialPayload, createMaterial, PASSWORD,
};

const {
  app, request, sequelize, resetDb, login,
} = require('./helpers');

beforeAll(resetDb);
afterAll(() => sequelize.close());

describe('GET /health', () => {
  test('200 и статус БД, доступен в корне и под /api', async () => {
    for (const path of ['/health', '/api/health']) {
      const res = await request(app).get(path);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.checks.database.status).toBe('up');
      expect(res.headers['cache-control']).toBe('no-store');
    }
  });
});

describe('GET /metrics', () => {
  test('отдаёт uptime, память и счётчик запросов', async () => {
    await request(app).get('/api/materials');
    await request(app).get('/api/unknown-route');
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    const m = res.body.data;
    expect(m.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(m.process.memory.heapUsedMb).toBeGreaterThan(0);
    expect(m.requests.total).toBeGreaterThanOrEqual(2);
    expect(m.requests.byStatus['4xx']).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(m.history)).toBe(true);
  });
});

describe('GET /api/debug/error', () => {
  test('без токена — 401', async () => {
    const res = await request(app).get('/api/debug/error');
    expect(res.status).toBe(401);
  });

  test('обычному пользователю — 403', async () => {
    const token = await login('user@test.io');
    const res = await request(app).get('/api/debug/error').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('администратору — 500 без деталей исключения', async () => {
    const token = await login('admin@test.io');
    const res = await request(app).get('/api/debug/error').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body.error.message).toBe('Внутренняя ошибка сервера');
    expect(JSON.stringify(res.body)).not.toMatch(/Sentry|stack/);
  });
});

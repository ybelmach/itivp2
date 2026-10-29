const {
  app, request, sequelize, resetDb, login,
} = require('./helpers');

beforeAll(resetDb);
afterAll(() => sequelize.close());

describe('auth', () => {
  test('регистрация: роль всегда user, пароль не возвращается', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ email: 'New@Test.io', password: 'Student123!', role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ email: 'new@test.io', role: 'user' });
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  test('слабый пароль — 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'weak@test.io', password: 'password' });
    expect(res.status).toBe(400);
  });

  test('повторный email — 409', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'user@test.io', password: 'Student123!' });
    expect(res.status).toBe(409);
  });

  test('вход выдаёт access-токен и httpOnly cookie с refresh-токеном', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'user@test.io', password: 'Password123!' });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    const cookie = res.headers['set-cookie'].join(';');
    expect(cookie).toMatch(/refreshToken=/);
    expect(cookie).toMatch(/HttpOnly/);
  });

  test('неверный пароль — 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'user@test.io', password: 'Wrong123!' });
    expect(res.status).toBe(401);
  });

  test('GET /auth/me с токеном и без', async () => {
    const token = await login('moderator@test.io');
    const ok = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(ok.status).toBe(200);
    expect(ok.body.data.role).toBe('moderator');

    const anon = await request(app).get('/api/auth/me');
    expect(anon.status).toBe(401);
  });

  test('refresh по cookie выдаёт новый токен, старый cookie после ротации недействителен', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'user2@test.io', password: 'Password123!' });
    const first = await request(app).post('/api/auth/login').send({ email: 'user2@test.io', password: 'Password123!' });
    const oldCookie = first.headers['set-cookie'];

    const refreshed = await request(app).post('/api/auth/refresh').set('Cookie', oldCookie);
    expect(refreshed.status).toBe(200);

    const reused = await request(app).post('/api/auth/refresh').set('Cookie', oldCookie);
    expect(reused.status).toBe(401);
  });
});

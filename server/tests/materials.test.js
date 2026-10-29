const {
  app, request, sequelize, resetDb, login, materialPayload, createMaterial,
} = require('./helpers');

let users;
let tokens;

beforeAll(async () => {
  users = await resetDb();
  tokens = {
    admin: await login('admin@test.io'),
    moderator: await login('moderator@test.io'),
    user: await login('user@test.io'),
    user2: await login('user2@test.io'),
  };
});
afterAll(() => sequelize.close());

const auth = (role) => ({ Authorization: `Bearer ${tokens[role]}` });

describe('materials CRUD', () => {
  let id;

  test('гость не может создать материал — 401', async () => {
    const res = await request(app).post('/api/materials').send(materialPayload());
    expect(res.status).toBe(401);
  });

  test('user создаёт материал; лишние поля и HTML отбрасываются', async () => {
    const res = await request(app).post('/api/materials').set(auth('user'))
      .send(materialPayload({ title: '<b>Jest</b> на практике', ownerId: users.admin.id, id: 999 }));
    expect(res.status).toBe(201);
    expect(res.headers.location).toMatch(/\/api\/materials\/\d+$/);
    expect(res.body.data.title).toBe('Jest на практике');
    expect(res.body.data.ownerId).toBe(users.user.id);
    expect(res.body.data.tags).toEqual(['jest', 'testing']);
    id = res.body.data.id;
  });

  test('невалидные данные — 400 с деталями', async () => {
    const res = await request(app).post('/api/materials').set(auth('user'))
      .send(materialPayload({ type: 'video', fileUrl: 'ftp://x' }));
    expect(res.status).toBe(400);
    expect(res.body.error.details.length).toBeGreaterThanOrEqual(2);
  });

  test('чтение по id и 404 для несуществующего', async () => {
    expect((await request(app).get(`/api/materials/${id}`)).status).toBe(200);
    expect((await request(app).get('/api/materials/99999')).status).toBe(404);
    expect((await request(app).get('/api/materials/abc')).status).toBe(400);
  });

  test('чужой user не может редактировать — 403, модератор может — 200', async () => {
    const body = materialPayload({ title: 'Изменено' });
    expect((await request(app).put(`/api/materials/${id}`).set(auth('user2')).send(body)).status).toBe(403);
    const res = await request(app).put(`/api/materials/${id}`).set(auth('moderator')).send(body);
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Изменено');
  });

  test('удаляет только admin', async () => {
    expect((await request(app).delete(`/api/materials/${id}`).set(auth('user'))).status).toBe(403);
    expect((await request(app).delete(`/api/materials/${id}`).set(auth('admin'))).status).toBe(204);
    expect((await request(app).get(`/api/materials/${id}`)).status).toBe(404);
  });
});

describe('список, поиск и пагинация', () => {
  beforeAll(async () => {
    for (let i = 1; i <= 7; i += 1) {
      await createMaterial(users.user.id, { title: `Книга ${i}`, type: 'book', tags: ['pagination'] });
    }
    await createMaterial(users.user2.id, { title: 'Презентация React', type: 'presentation', tags: ['react'] });
  });

  test('фильтр по типу и поиск', async () => {
    const books = await request(app).get('/api/materials?type=book');
    expect(books.body.data.every((m) => m.type === 'book')).toBe(true);

    const search = await request(app).get('/api/materials?search=react');
    expect(search.body.count).toBe(1);
    expect(search.body.data[0].title).toBe('Презентация React');
  });

  test('фильтр по владельцу', async () => {
    const res = await request(app).get(`/api/materials?ownerId=${users.user2.id}`);
    expect(res.body.data.every((m) => m.ownerId === users.user2.id)).toBe(true);
  });

  test('page и limit', async () => {
    const res = await request(app).get('/api/materials?type=book&limit=3&page=3&sort=title');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 7, page: 3, limit: 3, pages: 3, count: 1 });
    expect(res.body.data[0].title).toBe('Книга 7');
  });

  test('limit больше 100 — 400', async () => {
    expect((await request(app).get('/api/materials?limit=1000')).status).toBe(400);
  });
});

describe('избранное', () => {
  let materialId;

  beforeAll(async () => {
    materialId = (await createMaterial(users.admin.id, { title: 'Для избранного' })).id;
  });

  test('без входа — 401', async () => {
    expect((await request(app).get('/api/favorites')).status).toBe(401);
    expect((await request(app).put(`/api/materials/${materialId}/favorite`)).status).toBe(401);
  });

  test('добавление идемпотентно, список у каждого свой', async () => {
    expect((await request(app).put(`/api/materials/${materialId}/favorite`).set(auth('user'))).status).toBe(204);
    expect((await request(app).put(`/api/materials/${materialId}/favorite`).set(auth('user'))).status).toBe(204);

    const mine = await request(app).get('/api/favorites').set(auth('user'));
    expect(mine.body.count).toBe(1);
    expect(mine.body.data[0]).toMatchObject({ id: materialId, title: 'Для избранного' });

    const other = await request(app).get('/api/favorites').set(auth('user2'));
    expect(other.body.count).toBe(0);
  });

  test('несуществующий материал — 404, удаление из избранного — 204', async () => {
    expect((await request(app).put('/api/materials/99999/favorite').set(auth('user'))).status).toBe(404);
    expect((await request(app).delete(`/api/materials/${materialId}/favorite`).set(auth('user'))).status).toBe(204);
    const mine = await request(app).get('/api/favorites').set(auth('user'));
    expect(mine.body.count).toBe(0);
  });
});

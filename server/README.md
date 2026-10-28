# Study Materials API

REST API платформы для обмена учебными материалами: лекциями, презентациями и книгами.
Node.js + Express.js, PostgreSQL + Sequelize, аутентификация по JWT.

Документация по эндпоинтам — в [API.md](API.md).

## Запуск

Нужны Node.js 20+ и Docker (или свой PostgreSQL).

```bash
cd server
npm install
cp .env.example .env    # задать JWT_SECRET, при необходимости DATABASE_URL
npm run db:up           # PostgreSQL в Docker на localhost:5432
npm run seed            # таблицы и тестовые данные
npm run dev             # http://localhost:3000
```

Для облачной БД (Neon, Supabase) достаточно указать её строку подключения в `DATABASE_URL`.

Переменные окружения (`.env`):

| Переменная | Назначение |
|---|---|
| `PORT` | порт сервера, по умолчанию 3000 |
| `DATABASE_URL` | строка подключения к PostgreSQL |
| `JWT_SECRET` | секрет подписи JWT |
| `JWT_EXPIRES_IN` | срок жизни токена, по умолчанию `1h` |
| `CORS_ORIGINS` | адреса фронтенда через запятую, по умолчанию `http://localhost:5173` |

Тестовые пользователи после `npm run seed` (пароль `Password123!`):

| Email | Роль |
|---|---|
| `admin@example.com` | admin |
| `user@example.com` | user |

## Тестирование

- `postman_collection.json` — импортировать в Postman и запустить папки по порядку (Collection Runner). Запросы логина сохраняют токены в переменные коллекции.
- `requests.http` — те же запросы для расширения VS Code REST Client.

## Структура

```
server/
├── server.js              # подключение к БД и запуск сервера
├── app.js                 # middleware (helmet, CORS, rate limit), маршруты, обработчики ошибок
├── config/                # переменные окружения, подключение Sequelize
├── models/                # User, Material и связь между ними
├── validators/            # Joi-схемы входных данных
├── middleware/            # validate, authenticate / requireRole, 404, обработчик ошибок
├── controllers/           # обработчики запросов
├── routes/                # маршруты /api/auth и /api/materials
├── scripts/seed.js        # тестовые данные
└── utils/HttpError.js     # ошибка с HTTP-статусом
```

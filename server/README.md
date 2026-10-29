# Study Materials API

REST API платформы для обмена учебными материалами: лекциями, презентациями и книгами.
Node.js + Express.js, PostgreSQL + Sequelize, аутентификация по JWT с refresh-токеном,
роли `user` / `moderator` / `admin`, защита от распространённых уязвимостей (OWASP Top 10).

Документация по эндпоинтам — в [API.md](API.md).

## Запуск

Нужны Node.js 22+ и Docker (или свой PostgreSQL).

```bash
cd server
npm install
cp .env.example .env    # задать JWT_SECRET, при необходимости DATABASE_URL
npm run db:up           # PostgreSQL в Docker на localhost:5432
npm run seed            # таблицы и тестовые данные
npm run dev             # http://localhost:3000
```

Для облачной БД (Neon, Supabase) достаточно указать её строку подключения в `DATABASE_URL`.

Тестовые пользователи после `npm run seed` (пароль `Password123!`):

| Email | Роль |
|---|---|
| `admin@example.com` | admin |
| `moderator@example.com` | moderator |
| `user@example.com` | user |
| `user2@example.com` | user |

## Меры безопасности

| Мера | Где в коде |
|---|---|
| Хеширование паролей bcrypt (12 раундов), проверка сложности пароля (буквы разного регистра, цифра, спецсимвол) | `controllers/auth.controller.js`, `validators/auth.validators.js` |
| JWT access-токен (15 мин) + refresh-токен в httpOnly cookie с ротацией | `controllers/auth.controller.js` |
| Роли и `roleGuard(requiredRole)`, проверка владельца записи | `middleware/auth.js`, `controllers/materials.controller.js` |
| Блокировка на 15 минут после 5 неудачных входов | `controllers/auth.controller.js` |
| Валидация всех входных данных (Joi), удаление HTML-тегов | `middleware/validate.js`, `validators/` |
| Защита от mass assignment: `stripUnknown` в Joi + белый список полей в Sequelize | `validators/`, контроллеры |
| Защита от SQL-инъекций: параметризованные запросы Sequelize | `models/`, контроллеры |
| helmet: CSP, `X-Frame-Options: DENY`, `nosniff` и др. | `app.js` |
| Rate limiting: общий (100 / 15 мин) и для входа и регистрации (20 / 15 мин) | `app.js`, `routes/auth.routes.js` |
| Ограничение размера тела запроса (10 КБ) | `app.js` |
| CORS только для доменов из `CORS_ORIGINS` | `app.js` |
| Журнал подозрительных действий (`logs/security.log`) | `utils/logger.js` |
| Журнал аудита действий администратора и модератора | `utils/audit.js`, `GET /api/admin/audit-log` |
| Ответы об ошибках без деталей реализации | `middleware/errorHandler.js` |

## Мониторинг и логи

| Что | Где в коде |
|---|---|
| `GET /health` (сервер + БД, 200/503) и `GET /metrics` (uptime, память, CPU, счётчики запросов) | `routes/monitoring.routes.js`, `utils/metrics.js` |
| Sentry: необработанные исключения, без cookie, заголовков авторизации и тел запросов | `instrument.js`, `app.js` |
| Логи winston: JSON в продакшене, отправка в Better Stack при заданном `BETTERSTACK_SOURCE_TOKEN` | `utils/logger.js` |
| Маскировка паролей, токенов, cookie и хешей в логах | `utils/logger.js` (`redact`) |
| Ошибки уровня `error` → Telegram (не чаще раза в минуту на одинаковое сообщение) | `utils/logger.js`, `utils/telegram.js` |
| Корректное завершение по SIGTERM, перехват `unhandledRejection` / `uncaughtException` | `server.js` |
| Тестовая ошибка для Sentry: `GET /api/debug/error` (только admin) | `routes/monitoring.routes.js` |

## Тестирование

- `npm run lint` — ESLint.
- `npm test` — Jest + supertest, 26 тестов (auth, материалы, пагинация, избранное, мониторинг, маскировка логов).
  Нужна пустая тестовая БД: по умолчанию `postgres://study:study@localhost:5432/study_materials_test`,
  другую можно задать через `TEST_DATABASE_URL`. Быстро поднять:
  `docker run -d --rm -p 55432:5432 -e POSTGRES_USER=study -e POSTGRES_PASSWORD=study -e POSTGRES_DB=study_materials_test postgres:17-alpine`
  и запускать `TEST_DATABASE_URL=postgres://study:study@localhost:55432/study_materials_test npm test`.

- `postman_collection.json` — импортировать в Postman и запустить целиком через Collection Runner. Перед запуском перезапустить сервер и выполнить `npm run seed`: так сбрасываются счётчики rate limit и блокировки входа. Запросы логина сохраняют токены в переменные коллекции.
- `node scripts/rate-limit-demo.js` — 25 запросов на вход подряд; после 20-го сервер отвечает `429`. Лучше запускать на только что перезапущенном сервере.
- `requests.http` — те же запросы для расширения VS Code REST Client.

## Структура

```
server/
├── server.js              # подключение к БД и запуск сервера
├── app.js                 # helmet, CORS, rate limit, лимит тела, маршруты, обработчики ошибок
├── config/                # переменные окружения, подключение Sequelize
├── instrument.js          # инициализация Sentry (подключается первой)
├── Dockerfile             # образ для деплоя на VM
├── models/                # User, Material, AuditLog, Favorite
├── validators/            # Joi-схемы входных данных
├── middleware/            # validate, authenticate / roleGuard, 404, обработчик ошибок
├── controllers/           # обработчики запросов
├── routes/                # /api/auth, /api/materials, /api/favorites, /api/users, /api/admin, /health, /metrics
├── scripts/               # seed.js — тестовые данные, rate-limit-demo.js
├── tests/                 # Jest + supertest
├── utils/                 # HttpError, логгер, метрики, Telegram, аудит, санитизация
└── logs/security.log      # создаётся при работе, не коммитится
```

# Study Materials API — документация

Базовый URL: `http://localhost:3000/api`

Все ответы — JSON. Успешный ответ: `{ "data": ... }`. Ошибка:

```json
{ "error": { "status": 400, "message": "Ошибка валидации данных", "details": ["email: некорректный email"] } }
```

Защищённые маршруты требуют заголовок `Authorization: Bearer <accessToken>`.
Access-токен живёт 15 минут, refresh-токен — 7 дней в httpOnly cookie.

## Роли

| Роль | Права |
|---|---|
| гость | чтение материалов и статистики |
| `user` | + создание материалов, редактирование **своих** материалов |
| `moderator` | + редактирование **любых** материалов, просмотр списка пользователей |
| `admin` | + удаление материалов, смена ролей, удаление пользователей, журнал аудита |

При регистрации всегда назначается роль `user`; поле `role` в теле запроса игнорируется.
Роль проверяется по БД при каждом запросе, поэтому её смена действует сразу, без перевыпуска токена.

## Коды ошибок

| Код | Когда |
|---|---|
| 400 | ошибка валидации, некорректный JSON |
| 401 | нет токена, токен недействителен или истёк; неверный логин или пароль |
| 403 | недостаточно прав |
| 404 | ресурс не найден |
| 409 | email уже зарегистрирован |
| 413 | тело запроса больше 10 КБ |
| 423 | учётная запись временно заблокирована после 5 неудачных попыток входа |
| 429 | превышен лимит запросов |
| 500 | внутренняя ошибка; подробности только в логе сервера |

## Аутентификация

### POST /auth/register

Тело: `{ "email": "student@example.com", "password": "Student123!" }`

- `email` — корректный email, приводится к нижнему регистру, уникален;
- `password` — от 8 до 72 символов, строчная и заглавная буквы, цифра и спецсимвол.

| Код | Когда |
|---|---|
| 201 | пользователь создан, в ответе `{ id, email, role, createdAt, updatedAt }` |
| 400 | ошибка валидации |
| 409 | email уже зарегистрирован |

### POST /auth/login

Тело: `{ "email": "user@example.com", "password": "Password123!" }`

```json
{ "data": { "accessToken": "eyJ...", "tokenType": "Bearer", "expiresIn": "15m", "user": { "id": 3, "email": "user@example.com", "role": "user" } } }
```

Вместе с ответом сервер ставит cookie `refreshToken` (`HttpOnly; SameSite=Strict; Path=/api/auth`, в продакшене также `Secure`).

| Код | Когда |
|---|---|
| 200 | успешный вход |
| 400 | ошибка валидации |
| 401 | неверный email или пароль (одинаковое сообщение в обоих случаях) |
| 423 | 5 неудачных попыток подряд → блокировка на 15 минут |
| 429 | более 20 запросов к `/auth/login` и `/auth/register` с одного IP за 15 минут |

### POST /auth/refresh

Без тела: refresh-токен берётся из cookie. Возвращает новый access-токен (формат как у `/auth/login`) и **заменяет** refresh-токен (ротация): старый после этого недействителен. `401` — cookie нет, токен истёк, отозван или уже использован.

### POST /auth/logout

Отзывает refresh-токен и удаляет cookie. Всегда `204`.

### GET /auth/me 🔒

Возвращает текущего пользователя. `401` — нет токена, токен поддельный или истёк.

## Материалы

### Модель

| Поле | Тип | Правила |
|---|---|---|
| `id` | integer | создаётся сервером |
| `title` | string | обязательное, 1–200 символов |
| `type` | enum | `lecture`, `presentation`, `book` |
| `subject` | string | обязательное |
| `author` | string | обязательное (автор материала) |
| `description` | string | необязательное, до 5000 символов |
| `fileUrl` | string | обязательное, http(s) URL |
| `tags` | string[] | до 20 тегов, приводятся к нижнему регистру |
| `ownerId` | integer | пользователь, загрузивший материал; задаётся сервером |
| `owner` | object | `{ id, email }` владельца |
| `createdAt`, `updatedAt` | date | задаются сервером |

Поля `id`, `ownerId`, `createdAt`, `updatedAt` из тела запроса не принимаются.
HTML-теги в текстовых полях (`title`, `subject`, `author`, `description`, `tags`) удаляются.

### Маршруты

| Метод | URL | Доступ | Успех | Ошибки |
|---|---|---|---|---|
| GET | `/materials` | все | 200 | 400 |
| GET | `/materials/stats` | все | 200 | — |
| GET | `/materials/:id` | все | 200 | 400, 404 |
| POST | `/materials` | user и выше | 201 | 400, 401 |
| PUT | `/materials/:id` | владелец, moderator, admin | 200 | 400, 401, 403, 404 |
| DELETE | `/materials/:id` | admin | 204 | 400, 401, 403, 404 |

### GET /materials

Параметры строки запроса (все необязательные):

- `type` — `lecture` | `presentation` | `book`;
- `subject` — предмет, без учёта регистра;
- `search` — подстрока в названии, описании, авторе или точное совпадение тега;
- `sort` — `createdAt`, `-createdAt` (по умолчанию), `title`, `-title`.

Ответ: `{ "count": 2, "data": [ ... ] }`

### GET /materials/stats

```json
{ "data": { "total": 3, "byType": { "lecture": 1, "presentation": 1, "book": 1 } } }
```

### POST /materials, PUT /materials/:id

```json
{
  "title": "Лекция 2. Express.js",
  "type": "lecture",
  "subject": "Интернет-технологии",
  "author": "Петров П.П.",
  "description": "Маршруты, middleware, обработка ошибок",
  "fileUrl": "https://example.com/files/lecture-2-express.pdf",
  "tags": ["express", "node.js"]
}
```

`PUT` — полная замена: передаются все обязательные поля. Ответ `201` содержит заголовок `Location`.

## Пользователи

| Метод | URL | Доступ | Успех | Ошибки |
|---|---|---|---|---|
| GET | `/users` | moderator, admin | 200 | 401, 403 |
| PATCH | `/users/:id/role` | admin | 200 | 400, 401, 403, 404 |
| DELETE | `/users/:id` | admin | 204 | 400, 401, 403, 404 |

`PATCH /users/:id/role` — тело `{ "role": "moderator" }`. Администратор не может изменить свою роль или удалить себя (`400`). При удалении пользователя удаляются и его материалы.

## Журнал аудита

### GET /admin/audit-log 🔒 admin

Последние 100 записей. Запись создаётся для **каждого** запроса администратора или модератора, включая отклонённые:

```json
{
  "id": 4, "actorId": 1, "actorEmail": "admin@example.com", "actorRole": "admin",
  "action": "user.changeRole", "targetType": "users", "targetId": 4,
  "details": { "email": "user2@example.com", "from": "user", "to": "moderator", "status": 200 },
  "ip": "::1", "createdAt": "2026-09-28T12:09:17.822Z"
}
```

## Журнал безопасности

Подозрительные события пишутся в `logs/security.log` (JSON, по строке на событие) и в консоль:

| Событие | Когда |
|---|---|
| `login_failed` | неверный пароль или неизвестный email |
| `account_locked` | 5-я неудачная попытка подряд |
| `login_while_locked` | попытка входа в заблокированную учётную запись |
| `invalid_token` | поддельный или повреждённый JWT |
| `invalid_refresh_token` | неизвестный, отозванный или повторно использованный refresh-токен |
| `access_denied_role` | запрос к маршруту, требующему более высокой роли |
| `access_denied_not_owner` | попытка изменить чужой материал |
| `rate_limit_exceeded`, `auth_rate_limit_exceeded` | превышен лимит запросов |
| `cors_origin_rejected` | запрос с домена не из белого списка |

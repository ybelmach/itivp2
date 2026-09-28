# Study Materials API — документация

Базовый URL: `http://localhost:3000/api`

Все ответы — JSON. Успешный ответ: `{ "data": ... }`. Ошибка:

```json
{ "error": { "status": 400, "message": "Ошибка валидации данных", "details": ["email: некорректный email"] } }
```

Защищённые маршруты требуют заголовок `Authorization: Bearer <accessToken>`.

## Роли

| Роль | Права |
|---|---|
| гость | чтение материалов и статистики |
| `user` | + создание материалов, редактирование **своих** материалов |
| `admin` | + редактирование любых материалов, удаление материалов |

При регистрации всегда назначается роль `user`; поле `role` в теле запроса игнорируется.

## Аутентификация

### POST /auth/register

Тело: `{ "email": "student@example.com", "password": "Student123!" }`

- `email` — корректный email, приводится к нижнему регистру, уникален;
- `password` — от 8 до 72 символов.

| Код | Когда |
|---|---|
| 201 | пользователь создан, в ответе `{ id, email, role, createdAt, updatedAt }` |
| 400 | ошибка валидации |
| 409 | email уже зарегистрирован |

### POST /auth/login

Тело: `{ "email": "user@example.com", "password": "Password123!" }`

```json
{ "data": { "accessToken": "eyJ...", "tokenType": "Bearer", "expiresIn": "1h", "user": { "id": 2, "email": "user@example.com", "role": "user" } } }
```

| Код | Когда |
|---|---|
| 200 | успешный вход |
| 400 | ошибка валидации |
| 401 | неверный email или пароль (одинаковое сообщение в обоих случаях) |

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

### Маршруты

| Метод | URL | Доступ | Успех | Ошибки |
|---|---|---|---|---|
| GET | `/materials` | все | 200 | 400 |
| GET | `/materials/stats` | все | 200 | — |
| GET | `/materials/:id` | все | 200 | 400, 404 |
| POST | `/materials` | user, admin | 201 | 400, 401 |
| PUT | `/materials/:id` | владелец или admin | 200 | 400, 401, 403, 404 |
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

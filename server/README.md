# Study Materials API (lab21)

REST API для платформы обмена учебными материалами: лекциями, презентациями и книгами.
Написан на Node.js и Express.js. Данные пока хранятся в массиве в памяти.

## Запуск

```bash
cd server
npm install
npm run dev     # режим разработки (nodemon)
npm start       # обычный запуск
```

Сервер работает на `http://localhost:3000`. Порт можно поменять через переменную `PORT`.

## Структура

```
server/
├── server.js              # запуск сервера
├── app.js                 # настройка Express: middleware, маршруты, обработчики ошибок
├── routes/                # маршруты
├── controllers/           # обработчики запросов
├── models/                # хранилище данных (массив в памяти)
├── middleware/            # валидация, 404, глобальный обработчик ошибок
├── utils/HttpError.js     # класс ошибки с HTTP-статусом
├── requests.http          # запросы для VS Code REST Client
└── postman_collection.json
```

## Модель «Материал»

| Поле | Тип | Обязательное |
|---|---|---|
| `id` | number | создаётся сервером |
| `title` | string (до 200 символов) | да |
| `type` | `lecture` \| `presentation` \| `book` | да |
| `subject` | string | да |
| `author` | string | да |
| `description` | string | нет |
| `fileUrl` | http(s) URL | да |
| `tags` | string[] | нет |
| `createdAt`, `updatedAt` | ISO-дата | создаются сервером |

## Маршруты

| Метод | URL | Описание | Успех | Ошибки |
|---|---|---|---|---|
| GET | `/api/materials` | Список материалов, фильтры `?type=`, `?subject=`, `?search=` | 200 | 400 |
| GET | `/api/materials/:id` | Один материал | 200 | 400, 404 |
| POST | `/api/materials` | Создать материал | 201 | 400 |
| PUT | `/api/materials/:id` | Полностью обновить материал | 200 | 400, 404 |
| DELETE | `/api/materials/:id` | Удалить материал | 204 | 400, 404 |

Формат ошибки:

```json
{ "error": { "status": 400, "message": "Ошибка валидации данных", "details": ["title: обязательное непустое поле (строка)"] } }
```

## Пример

```bash
curl -i -X POST http://localhost:3000/api/materials \
  -H "Content-Type: application/json" \
  -d '{"title":"Лекция 2. Express.js","type":"lecture","subject":"Интернет-технологии","author":"Петров П.П.","fileUrl":"https://example.com/lecture-2.pdf","tags":["express"]}'
```

# StudyShare — клиент

React-клиент платформы обмена учебными материалами. Vite + React 19, React Router, TanStack Query, axios, Sentry.

## Запуск

```bash
cd client
npm install
cp .env.example .env     # при необходимости
npm run dev              # http://localhost:5173, /api проксируется на http://localhost:3000
```

Бэкенд должен быть запущен (см. `../server/README.md`). Скрипты: `npm run lint`, `npm test` (Vitest), `npm run build`.

## Страницы и модули

| Модуль | Страницы |
|---|---|
| Каталог материалов | `/` — список с поиском, фильтром по типу, сортировкой и пагинацией; `/materials/:id` — детали; `/materials/new`, `/materials/:id/edit` — форма с валидацией |
| Личный кабинет | `/login`, `/register`, `/favorites` — избранное, `/my` — мои материалы |
| Администрирование | `/admin/users` — пользователи и роли (moderator, admin), `/admin/audit` — журнал аудита (admin) |
| Мониторинг | `/status` — health-check и метрики сервера с автообновлением, кнопки тестовых ошибок Sentry (admin) |

## Оптимизации

- **Debounce поиска** (`hooks/useDebouncedValue.js`): запрос уходит через 400 мс после последнего нажатия, а не на каждую букву.
- **Code splitting** (`router.jsx`): все страницы, кроме каталога, загружаются через `React.lazy` отдельными чанками.
- **Кэширование запросов** (TanStack Query): повторный заход на страницу не делает запрос 30 секунд; при смене страницы списка старые данные остаются на экране (`keepPreviousData`).
- **Предзагрузка** деталей материала при наведении на карточку (`prefetchQuery`).
- **`React.memo`** для карточек материалов: переключение избранного перерисовывает только одну карточку.

## Безопасность

Access-токен хранится только в памяти, refresh-токен — в httpOnly cookie. При ответе `401` axios-перехватчик
один раз обновляет токен и повторяет запрос. API вызывается по относительному пути `/api` через прокси
(Vite, Vercel `rewrites` или nginx), поэтому cookie с `SameSite=Strict` работает и в продакшене.

# StudyShare — платформа обмена учебными материалами

Курсовой проект и лабораторные по дисциплине «Интернет-технологии и веб-программирование», часть 2.
Лекции, презентации и книги: каталог с поиском, избранное, роли user / moderator / admin.

- `server/` — REST API: Node.js, Express 5, PostgreSQL + Sequelize, JWT + refresh-токен, Sentry, winston ([README](server/README.md), [API](server/API.md))
- `client/` — React 19 + Vite, React Router, TanStack Query ([README](client/README.md))
- `deploy/` — docker compose для собственной виртуальной машины
- `.github/workflows/deploy.yml` — CI/CD

## Ссылки

| Что | Где |
|---|---|
| Приложение (frontend) | [https://itivp.ybelmach.ru](https://itivp.ybelmach.ru) |
| API (backend) | [https://itivp.ybelmach.ru/health](https://itivp.ybelmach.ru/health) |
| Метрики сервера | [https://itivp.ybelmach.ru/status](https://itivp.ybelmach.ru/status) |
| Мониторинг uptime (UptimeRobot) | _ссылка на публичную статус-страницу добавляется после публикации монитора_ |
| Ошибки (Sentry) | _ссылка на проект добавляется после создания проекта Sentry_ |
| Логи | Winston JSON в stdout контейнера Docker |
| CI/CD | [GitHub Actions](../../actions/workflows/deploy.yml) |
| Уведомления | E-mail-оповещения UptimeRobot о недоступности мониторов |

Тестовые пользователи (после `npm run seed`, пароль `Password123!`): `admin@example.com`, `moderator@example.com`, `user@example.com`.

## Локальный запуск

Нужны Node.js 22+ и Docker.

```bash
# API
cd server
npm install
cp .env.example .env        # задать JWT_SECRET
npm run db:up               # PostgreSQL в Docker
npm run seed                # таблицы и тестовые данные
npm run dev                 # http://localhost:3000

# Клиент (в другом терминале)
cd client
npm install
npm run dev                 # http://localhost:5173
```

Проверки, которые запускает CI: `npm run lint` и `npm test` в `server/` и `client/`, `npm run build` в `client/`.

## CI/CD

Workflow `.github/workflows/deploy.yml` запускается при push в `main`, `ipr22`, `ipr2`, при pull request в `main` и вручную:

```
server (ESLint → Jest на PostgreSQL) ─┐
                                      ├─► docker (сборка образов) ─► deploy ─► notify (Telegram)
client (ESLint → Vitest → build) ─────┘
```

- `deploy` выполняется только для push. Каждый шаг деплоя включается, если заданы его секреты, поэтому один и тот же workflow
  работает и для Render + Vercel, и для собственной VM.
- `notify` выполняется всегда (`if: always()`) и присылает в Telegram результат каждого этапа и ссылку на запуск.

### Секреты GitHub (Settings → Secrets and variables → Actions)

| Имя | Тип | Для чего |
|---|---|---|
| `RENDER_DEPLOY_HOOK_URL` | secret | Render → Settings → Deploy Hook |
| `BACKEND_URL` | variable | `https://<сервис>.onrender.com` — ожидание новой версии по `/health` |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | secret | деплой фронтенда через Vercel CLI |
| `SENTRY_AUTH_TOKEN` | secret | загрузка source maps фронтенда в Sentry |
| `SENTRY_ORG`, `SENTRY_PROJECT_FRONTEND` | variable | организация и проект Sentry для фронтенда |
| `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `SSH_PORT` | secret | деплой на VM |
| `VM_APP_DIR` | variable | путь к клону репозитория на VM (по умолчанию `~/itivp2_labs`) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | secret | уведомления о сборке |

## Деплой: Render + Vercel + Neon

1. **Neon**: создать проект, скопировать connection string (`…?sslmode=require`).
2. **Render**: New → Blueprint → этот репозиторий (файл `render.yaml`). Указать ветку, задать `DATABASE_URL`, `CORS_ORIGINS`,
   ключи Sentry, Better Stack и Telegram. Автодеплой выключен: деплой запускает GitHub Actions после тестов.
   Скопировать Deploy Hook в секрет `RENDER_DEPLOY_HOOK_URL`.
3. **Vercel**: импортировать репозиторий, Root Directory — `client`. В `client/vercel.json` указать адрес бэкенда в `rewrites`
   (`/api/*` проксируется на Render — так refresh-cookie остаётся на домене фронтенда). Переменные: `VITE_SENTRY_DSN`.
   Отключить автодеплой из Git (Settings → Git → Ignored Build Step: `exit 0`) — деплоит GitHub Actions.
4. Добавить секреты GitHub из таблицы выше и сделать push.

На бесплатном тарифе Render засыпает после 15 минут без запросов. Монитор UptimeRobot раз в 5 минут обращается к `/health`, поэтому сервис не засыпает.

## Деплой на собственную VM

```bash
# на VM (Ubuntu, установлены Docker и git)
git clone <repo> ~/itivp2_labs && cd ~/itivp2_labs/deploy
cp .env.example .env        # DOMAIN, POSTGRES_PASSWORD, JWT_SECRET, ключи мониторинга
docker compose up -d --build
```

Caddy сам выпускает сертификат Let's Encrypt для `DOMAIN` (A-запись домена должна указывать на IP VM, порты 80 и 443 открыты).
Дальше обновления делает GitHub Actions: подключается по SSH и запускает `deploy/deploy.sh <ветка> <commit>`.
Если Docker Hub недоступен, в `.env` можно указать образы из зеркала (`mirror.gcr.io/library/...`).

## Мониторинг

| Что | Как |
|---|---|
| Uptime | UptimeRobot: HTTP-мониторы `/health` бэкенда и главной страницы фронтенда, интервал 5 минут, оповещения в Telegram |
| Ошибки | Sentry: `@sentry/node` в API и `@sentry/react` (ErrorBoundary) в клиенте; source maps загружаются при сборке в CI |
| Логи | winston → Better Stack Logs (JSON): старт и остановка сервера, ошибки, запросы 4xx и 5xx, события безопасности |
| Алерты | ошибки уровня `error` из API → Telegram; падение сервиса → UptimeRobot → Telegram; результат сборки → GitHub Actions → Telegram |
| Метрики | `GET /metrics` и страница `/status` во фронтенде: uptime, память, CPU, запросы, время ответа, графики за 10 минут |

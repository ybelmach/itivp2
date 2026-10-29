const express = require('express');

const { sequelize } = require('../models');
const { snapshot } = require('../utils/metrics');
const { authenticate, roleGuard } = require('../middleware/auth');
const { release } = require('../config/env');

const router = express.Router();

// Проверка БД с таймаутом: зависшее соединение не должно вешать health-check
async function checkDatabase() {
  const started = Date.now();
  try {
    await Promise.race([
      sequelize.authenticate({ logging: false }),
      new Promise((_, reject) => { setTimeout(() => reject(new Error('timeout')), 3000).unref(); }),
    ]);
    return { status: 'up', latencyMs: Date.now() - started };
  } catch {
    return { status: 'down', latencyMs: Date.now() - started };
  }
}

// GET /health — для UptimeRobot и платформы деплоя. 200, если сервер и БД работают, иначе 503
router.get('/health', async (req, res) => {
  const db = await checkDatabase();
  const ok = db.status === 'up';
  res.set('Cache-Control', 'no-store');
  res.status(ok ? 200 : 503).json({
    status: ok ? 'ok' : 'degraded',
    uptimeSeconds: Math.round(process.uptime()),
    release,
    checks: { database: db },
    timestamp: new Date().toISOString(),
  });
});

// GET /metrics — время работы, память, CPU, счётчики запросов
router.get('/metrics', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.status(200).json({ data: { release, ...snapshot() } });
});

// GET /debug/error — намеренная ошибка для проверки Sentry. Только для администратора.
router.get('/debug/error', authenticate, roleGuard('admin'), () => {
  throw new Error('Test error: проверка Sentry (backend)');
});

module.exports = router;

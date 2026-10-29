// Sentry должен инициализироваться раньше express
const Sentry = require('./instrument');
const { port, env, release } = require('./config/env');
const { sequelize } = require('./models');
const app = require('./app');
const { logger, flushLogs } = require('./utils/logger');
const { sendTelegram } = require('./utils/telegram');

let server;

async function shutdown(signal, exitCode = 0) {
  logger.info('server_stopping', { signal });
  const timer = setTimeout(() => process.exit(exitCode), 10_000);
  timer.unref();
  try {
    if (server) await new Promise((resolve) => { server.close(resolve); });
    await sequelize.close();
    await Promise.all([Sentry.flush(2000), flushLogs()]);
  } finally {
    process.exit(exitCode);
  }
}

// Непойманные ошибки: в лог (оттуда в Better Stack и Telegram), в Sentry, затем перезапуск процесса
process.on('unhandledRejection', (reason) => {
  logger.error('unhandled_rejection', { error: reason instanceof Error ? reason : String(reason) });
  Sentry.captureException(reason);
});
process.on('uncaughtException', (err) => {
  logger.error('uncaught_exception', { error: err });
  Sentry.captureException(err);
  shutdown('uncaughtException', 1);
});
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

async function start() {
  await sequelize.authenticate();
  // Создаёт недостающие таблицы и столбцы по описанию моделей
  await sequelize.sync({ alter: true });

  server = app.listen(port, () => {
    logger.info('server_started', { port, env, release, node: process.version });
    if (env === 'production') sendTelegram(`🟢 Study Materials API запущен (release ${release.slice(0, 7)})`);
  });
}

start().catch(async (err) => {
  logger.error('server_start_failed', { error: err });
  Sentry.captureException(err);
  await Promise.all([Sentry.flush(2000), flushLogs()]);
  process.exit(1);
});

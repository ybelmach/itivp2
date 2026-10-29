const fs = require('fs');
const path = require('path');
const winston = require('winston');
const Transport = require('winston-transport');
const {
  isProduction, isTest, logLevel, env, release, betterStackToken, betterStackHost,
} = require('../config/env');
const { sendTelegram, telegramEnabled } = require('./telegram');

const LOG_DIR = path.join(__dirname, '..', 'logs');
fs.mkdirSync(LOG_DIR, { recursive: true });

// Ключи, значения которых никогда не попадают в логи
const SENSITIVE_KEY = /pass(word)?|token|secret|authorization|cookie|dsn|hash/i;

function redact(value, depth = 0) {
  if (depth > 5 || value === null || typeof value !== 'object') return value;
  if (value instanceof Error) return { name: value.name, message: value.message, stack: value.stack };
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  const out = {};
  for (const [key, v] of Object.entries(value)) {
    out[key] = SENSITIVE_KEY.test(key) ? '[REDACTED]' : redact(v, depth + 1);
  }
  return out;
}

// winston-формат: маскирует чувствительные поля в метаданных записи
const redactFormat = winston.format((info) => {
  for (const key of Object.keys(info)) {
    if (typeof key === 'string' && SENSITIVE_KEY.test(key)) info[key] = '[REDACTED]';
    else if (info[key] && typeof info[key] === 'object') info[key] = redact(info[key]);
  }
  return info;
});

// Транспорт, пересылающий ошибки в Telegram. Одинаковые сообщения
// отправляются не чаще раза в минуту, чтобы не заспамить чат.
class TelegramTransport extends Transport {
  constructor(opts = {}) {
    super({ level: 'error', ...opts });
    this.lastSent = new Map();
  }

  log(info, callback) {
    const key = `${info.message}`;
    const now = Date.now();
    if ((this.lastSent.get(key) || 0) + 60_000 < now) {
      this.lastSent.set(key, now);
      const { level, message, timestamp, service, ...meta } = info;
      const details = JSON.stringify(meta).slice(0, 1500);
      sendTelegram(`🔴 [${service}] ${level.toUpperCase()}: ${message}\n${timestamp || ''}\n${details}`);
    }
    callback();
  }
}

function buildTransports(extra = []) {
  const transports = [
    new winston.transports.Console({
      silent: isTest,
      // В продакшене JSON по строке на запись: так логи удобно разбирают Render и Better Stack
      format: isProduction
        ? winston.format.json()
        : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp, category, ...meta }) => {
            const rest = { ...meta };
            delete rest.service;
            delete rest.env;
            delete rest.release;
            const tail = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : '';
            return `${timestamp} [${category || 'app'}] ${level}: ${message}${tail}`;
          }),
        ),
    }),
    ...extra,
  ];

  if (betterStackToken && !isTest) {
    // Подключаем только при наличии токена, чтобы локально пакет не требовался
    const { Logtail } = require('@logtail/node');
    const { LogtailTransport } = require('@logtail/winston');
    const logtail = new Logtail(betterStackToken, betterStackHost ? { endpoint: `https://${betterStackHost}` } : {});
    transports.push(new LogtailTransport(logtail));
  }

  if (telegramEnabled) transports.push(new TelegramTransport());
  return transports;
}

const baseFormat = winston.format.combine(
  redactFormat(),
  winston.format.errors({ stack: true }),
  winston.format.timestamp(),
  winston.format.json(),
);
const defaultMeta = { service: 'study-materials-api', env, release };

// Основной журнал приложения: старт и остановка, запросы, ошибки
const logger = winston.createLogger({
  level: logLevel,
  format: baseFormat,
  defaultMeta: { ...defaultMeta, category: 'app' },
  transports: buildTransports(),
});

// Журнал подозрительных действий: неудачные входы, блокировки, отказ в доступе,
// превышение лимитов, запросы с неразрешённых доменов
const securityLogger = winston.createLogger({
  level: 'info',
  format: baseFormat,
  defaultMeta: { ...defaultMeta, category: 'security' },
  transports: buildTransports([
    new winston.transports.File({ filename: path.join(LOG_DIR, 'security.log'), silent: isTest }),
  ]),
});

// Контекст запроса для записей журнала
function requestContext(req) {
  return {
    ip: req.ip,
    method: req.method,
    url: req.originalUrl,
    userId: req.user ? req.user.id : undefined,
    userAgent: req.get('User-Agent'),
  };
}

function logSecurityEvent(event, req, extra = {}) {
  securityLogger.warn(event, { event, ...requestContext(req), ...extra });
}

// Дожидается отправки буферизованных логов (Better Stack) перед завершением процесса
async function flushLogs() {
  await Promise.all([logger, securityLogger].flatMap((l) => l.transports)
    .filter((t) => typeof t.logtail?.flush === 'function')
    .map((t) => t.logtail.flush().catch(() => {})));
}

module.exports = { logger, securityLogger, logSecurityEvent, requestContext, redact, flushLogs };

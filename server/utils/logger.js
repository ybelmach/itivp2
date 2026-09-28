const path = require('path');
const winston = require('winston');

const LOG_DIR = path.join(__dirname, '..', 'logs');

// Журнал подозрительных действий: неудачные входы, блокировки, отказ в доступе,
// превышение лимитов, запросы с неразрешённых доменов
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({ filename: path.join(LOG_DIR, 'security.log') }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => `${timestamp} [security] ${level}: ${message} ${JSON.stringify(meta)}`),
      ),
    }),
  ],
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

module.exports = { securityLogger, logSecurityEvent };

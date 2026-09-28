const { AuditLog } = require('../models');
const { securityLogger } = require('./logger');

const PRIVILEGED_ROLES = ['admin', 'moderator'];

// Записывает в журнал аудита каждый запрос администратора или модератора
// после отправки ответа. Контроллер может дополнить запись через res.locals.audit.
function trackPrivilegedActions(req, res) {
  if (!PRIVILEGED_ROLES.includes(req.user.role)) return;

  res.on('finish', () => {
    const extra = res.locals.audit || {};
    // К моменту finish Express уже сбросил req.baseUrl и req.params, поэтому разбираем исходный URL
    const path = req.originalUrl.split('?')[0];
    const [, , resource, id] = path.split('/'); // /api/<resource>/<id>/...
    AuditLog.create({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: extra.action || `${req.method} ${path}`,
      targetType: extra.targetType || resource || '',
      targetId: extra.targetId ?? (Number(id) || null),
      details: { status: res.statusCode, ...extra.details },
      ip: req.ip,
    }).catch((err) => securityLogger.error('audit_write_failed', { error: err.message }));
  });
}

module.exports = { trackPrivilegedActions };

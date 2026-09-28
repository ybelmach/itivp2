const { User, Material, AuditLog } = require('../models');
const HttpError = require('../utils/HttpError');
const { toPublic } = require('./auth.controller');

async function findUserOr404(id) {
  const user = await User.findByPk(id);
  if (!user) {
    throw HttpError.notFound(`Пользователь с id=${id} не найден`);
  }
  return user;
}

// GET /api/users — модератор и выше
async function getAll(req, res) {
  const users = await User.findAll({ order: [['id', 'ASC']] });
  res.status(200).json({ count: users.length, data: users.map(toPublic) });
}

// PATCH /api/users/:id/role — только администратор
async function changeRole(req, res) {
  const user = await findUserOr404(req.params.id);
  if (user.id === req.user.id) {
    throw HttpError.badRequest('Нельзя изменить собственную роль');
  }

  const from = user.role;
  await user.update({ role: req.body.role }, { fields: ['role'] });
  res.locals.audit = { action: 'user.changeRole', details: { email: user.email, from, to: user.role } };
  res.status(200).json({ data: toPublic(user) });
}

// DELETE /api/users/:id — только администратор; материалы пользователя удаляются вместе с ним
async function remove(req, res) {
  const user = await findUserOr404(req.params.id);
  if (user.id === req.user.id) {
    throw HttpError.badRequest('Нельзя удалить собственную учётную запись');
  }

  const materials = await Material.count({ where: { ownerId: user.id } });
  await user.destroy();
  res.locals.audit = { action: 'user.delete', details: { email: user.email, role: user.role, materials } };
  res.status(204).end();
}

// GET /api/admin/audit-log — последние 100 записей журнала аудита
async function getAuditLog(req, res) {
  const entries = await AuditLog.findAll({ order: [['id', 'DESC']], limit: 100 });
  res.status(200).json({ count: entries.length, data: entries });
}

module.exports = { getAll, changeRole, remove, getAuditLog };

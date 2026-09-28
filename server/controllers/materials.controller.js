const { Op, fn, col } = require('sequelize');
const { Material, User } = require('../models');
const HttpError = require('../utils/HttpError');

const withOwner = { model: User, as: 'owner', attributes: ['id', 'email'] };

async function findMaterialOr404(id) {
  const material = await Material.findByPk(id, { include: withOwner });
  if (!material) {
    throw HttpError.notFound(`Материал с id=${id} не найден`);
  }
  return material;
}

// GET /api/materials?type=&subject=&search=&sort=
async function getAll(req, res) {
  const { type, subject, search, sort } = req.validatedQuery;

  const where = {};
  if (type) where.type = type;
  if (subject) where.subject = { [Op.iLike]: subject };
  if (search) {
    const pattern = `%${search}%`;
    where[Op.or] = [
      { title: { [Op.iLike]: pattern } },
      { description: { [Op.iLike]: pattern } },
      { author: { [Op.iLike]: pattern } },
      { tags: { [Op.contains]: [search.toLowerCase()] } },
    ];
  }

  const field = sort.replace('-', '');
  const direction = sort.startsWith('-') ? 'DESC' : 'ASC';

  const materials = await Material.findAll({ where, include: withOwner, order: [[field, direction]] });
  res.status(200).json({ count: materials.length, data: materials });
}

// GET /api/materials/stats — количество материалов по типам
async function getStats(req, res) {
  const rows = await Material.findAll({
    attributes: ['type', [fn('COUNT', col('id')), 'count']],
    group: ['type'],
    raw: true,
  });

  const byType = Object.fromEntries(Material.TYPES.map((t) => [t, 0]));
  for (const row of rows) byType[row.type] = Number(row.count);
  const total = Object.values(byType).reduce((sum, n) => sum + n, 0);

  res.status(200).json({ data: { total, byType } });
}

// GET /api/materials/:id
async function getById(req, res) {
  const material = await findMaterialOr404(req.params.id);
  res.status(200).json({ data: material });
}

// POST /api/materials
async function create(req, res) {
  const material = await Material.create({ ...req.body, ownerId: req.user.id });
  const created = await findMaterialOr404(material.id);
  res.status(201).location(`/api/materials/${material.id}`).json({ data: created });
}

// PUT /api/materials/:id — автор записи или администратор
async function update(req, res) {
  const material = await findMaterialOr404(req.params.id);

  const isOwner = material.ownerId === req.user.id;
  if (!isOwner && req.user.role !== 'admin') {
    throw HttpError.forbidden('Редактировать материал может только его автор или администратор');
  }

  await material.update(req.body);
  res.status(200).json({ data: await findMaterialOr404(material.id) });
}

// DELETE /api/materials/:id — только администратор (проверяется в маршруте)
async function remove(req, res) {
  const material = await findMaterialOr404(req.params.id);
  await material.destroy();
  res.status(204).end();
}

module.exports = { getAll, getStats, getById, create, update, remove };

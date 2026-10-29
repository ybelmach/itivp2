const { Favorite, Material, User } = require('../models');
const HttpError = require('../utils/HttpError');

// GET /api/favorites — избранные материалы текущего пользователя, новые сверху
async function getAll(req, res) {
  const favorites = await Favorite.findAll({
    where: { userId: req.user.id },
    include: {
      model: Material,
      as: 'material',
      include: { model: User, as: 'owner', attributes: ['id', 'email'] },
    },
    order: [['createdAt', 'DESC']],
  });
  const data = favorites.filter((f) => f.material).map((f) => ({ ...f.material.toJSON(), favoritedAt: f.createdAt }));
  res.status(200).json({ count: data.length, data });
}

// PUT /api/materials/:id/favorite — добавить в избранное (повторный вызов ничего не меняет)
async function add(req, res) {
  const material = await Material.findByPk(req.params.id);
  if (!material) throw HttpError.notFound(`Материал с id=${req.params.id} не найден`);
  await Favorite.findOrCreate({ where: { userId: req.user.id, materialId: material.id } });
  res.status(204).end();
}

// DELETE /api/materials/:id/favorite — убрать из избранного
async function remove(req, res) {
  await Favorite.destroy({ where: { userId: req.user.id, materialId: req.params.id } });
  res.status(204).end();
}

module.exports = { getAll, add, remove };

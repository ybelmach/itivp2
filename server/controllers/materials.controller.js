const Material = require('../models/material.model');
const HttpError = require('../utils/HttpError');

// GET /api/materials?type=&subject=&search=
function getAll(req, res) {
  const { type, subject, search } = req.query;
  const materials = Material.findAll({ type, subject, search });
  res.status(200).json({ count: materials.length, data: materials });
}

// GET /api/materials/:id
function getById(req, res) {
  const material = Material.findById(req.materialId);
  if (!material) {
    throw HttpError.notFound(`Материал с id=${req.materialId} не найден`);
  }
  res.status(200).json({ data: material });
}

// POST /api/materials
function create(req, res) {
  const material = Material.create(req.materialData);
  res.status(201).location(`/api/materials/${material.id}`).json({ data: material });
}

// PUT /api/materials/:id
function update(req, res) {
  const material = Material.replace(req.materialId, req.materialData);
  if (!material) {
    throw HttpError.notFound(`Материал с id=${req.materialId} не найден`);
  }
  res.status(200).json({ data: material });
}

// DELETE /api/materials/:id
function remove(req, res) {
  const deleted = Material.remove(req.materialId);
  if (!deleted) {
    throw HttpError.notFound(`Материал с id=${req.materialId} не найден`);
  }
  res.status(204).end();
}

module.exports = { getAll, getById, create, update, remove };

const { MATERIAL_TYPES } = require('../models/material.model');
const HttpError = require('../utils/HttpError');

// Проверяет :id в URL — должен быть целым положительным числом
function validateId(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return next(HttpError.badRequest(`Некорректный id: "${req.params.id}". Ожидается целое положительное число`));
  }
  req.materialId = id;
  next();
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// Проверяет тело запроса для POST и PUT (полное представление ресурса)
function validateMaterialBody(req, res, next) {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return next(HttpError.badRequest('Тело запроса должно быть JSON-объектом'));
  }

  const errors = [];
  const { title, type, subject, author, description = '', fileUrl, tags = [] } = body;

  if (!isNonEmptyString(title)) errors.push('title: обязательное непустое поле (строка)');
  else if (title.trim().length > 200) errors.push('title: не более 200 символов');

  if (!MATERIAL_TYPES.includes(type)) errors.push(`type: допустимые значения — ${MATERIAL_TYPES.join(', ')}`);

  if (!isNonEmptyString(subject)) errors.push('subject: обязательное непустое поле (строка)');
  if (!isNonEmptyString(author)) errors.push('author: обязательное непустое поле (строка)');
  if (typeof description !== 'string') errors.push('description: должно быть строкой');

  if (!isNonEmptyString(fileUrl)) {
    errors.push('fileUrl: обязательное поле (ссылка на файл)');
  } else if (!URL.canParse(fileUrl) || !/^https?:$/.test(new URL(fileUrl).protocol)) {
    errors.push('fileUrl: должен быть корректным http(s) URL');
  }

  if (!Array.isArray(tags) || !tags.every(isNonEmptyString)) {
    errors.push('tags: должен быть массивом непустых строк');
  }

  if (errors.length > 0) {
    return next(HttpError.badRequest('Ошибка валидации данных', errors));
  }

  // Оставляем только разрешённые поля, лишние (например, id, createdAt) игнорируются
  req.materialData = {
    title: title.trim(),
    type,
    subject: subject.trim(),
    author: author.trim(),
    description: description.trim(),
    fileUrl: fileUrl.trim(),
    tags: tags.map((t) => t.trim()),
  };
  next();
}

// Проверяет параметры query string для GET /api/materials
function validateListQuery(req, res, next) {
  const { type } = req.query;
  if (type !== undefined && !MATERIAL_TYPES.includes(type)) {
    return next(HttpError.badRequest(`Параметр type: допустимые значения — ${MATERIAL_TYPES.join(', ')}`));
  }
  next();
}

module.exports = { validateId, validateMaterialBody, validateListQuery };

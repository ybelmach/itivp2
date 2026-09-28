const Joi = require('joi');
const Material = require('../models/material.model');
const { stripTags } = require('../utils/sanitize');

// Строка без HTML-тегов
const text = () => Joi.string().trim().custom(stripTags);

const idParamSchema = Joi.object({
  id: Joi.number().integer().min(1).required().messages({
    'number.base': 'id должен быть целым положительным числом',
  }),
});

// Полное представление материала для POST и PUT.
// Поля id, ownerId, createdAt, updatedAt из тела не принимаются.
const materialBodySchema = Joi.object({
  title: text().min(1).max(200).required(),
  type: Joi.string().valid(...Material.TYPES).required(),
  subject: text().min(1).max(255).required(),
  author: text().min(1).max(255).required(),
  description: text().allow('').max(5000).default(''),
  fileUrl: Joi.string().trim().uri({ scheme: ['http', 'https'] }).max(2048).required(),
  tags: Joi.array().items(text().lowercase().min(1).max(50)).max(20).default([]),
});

const listQuerySchema = Joi.object({
  type: Joi.string().valid(...Material.TYPES),
  subject: Joi.string().trim().max(255),
  search: Joi.string().trim().max(100),
  sort: Joi.string().valid('createdAt', '-createdAt', 'title', '-title').default('-createdAt'),
});

module.exports = { idParamSchema, materialBodySchema, listQuerySchema, MATERIAL_FIELDS: Object.keys(materialBodySchema.describe().keys) };

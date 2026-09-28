const express = require('express');

const controller = require('../controllers/materials.controller');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const { idParamSchema, materialBodySchema, listQuerySchema } = require('../validators/material.validators');

const router = express.Router();

// Чтение доступно всем
router.get('/', validate(listQuerySchema, 'query'), controller.getAll);
router.get('/stats', controller.getStats);
router.get('/:id', validate(idParamSchema, 'params'), controller.getById);

// Изменение — только аутентифицированным пользователям
router.post('/', authenticate, validate(materialBodySchema), controller.create);
router.put('/:id', authenticate, validate(idParamSchema, 'params'), validate(materialBodySchema), controller.update);
router.delete('/:id', authenticate, requireRole('admin'), validate(idParamSchema, 'params'), controller.remove);

module.exports = router;

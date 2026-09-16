const express = require('express');

const controller = require('../controllers/materials.controller');
const { validateId, validateMaterialBody, validateListQuery } = require('../middleware/validateMaterial');

const router = express.Router();

router.get('/', validateListQuery, controller.getAll);
router.get('/:id', validateId, controller.getById);
router.post('/', validateMaterialBody, controller.create);
router.put('/:id', validateId, validateMaterialBody, controller.update);
router.delete('/:id', validateId, controller.remove);

module.exports = router;

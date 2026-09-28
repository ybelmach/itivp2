const express = require('express');

const controller = require('../controllers/users.controller');
const validate = require('../middleware/validate');
const { authenticate, roleGuard } = require('../middleware/auth');
const { idParamSchema } = require('../validators/material.validators');
const { changeRoleSchema } = require('../validators/user.validators');

const router = express.Router();

router.use(authenticate);

router.get('/', roleGuard('moderator'), controller.getAll);
router.patch('/:id/role', roleGuard('admin'), validate(idParamSchema, 'params'), validate(changeRoleSchema), controller.changeRole);
router.delete('/:id', roleGuard('admin'), validate(idParamSchema, 'params'), controller.remove);

module.exports = router;

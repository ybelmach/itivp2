const express = require('express');

const controller = require('../controllers/users.controller');
const { authenticate, roleGuard } = require('../middleware/auth');

const router = express.Router();

router.get('/audit-log', authenticate, roleGuard('admin'), controller.getAuditLog);

module.exports = router;

const express = require('express');

const controller = require('../controllers/favorites.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, controller.getAll);

module.exports = router;

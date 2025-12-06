const express = require('express');
const router = express.Router();
const authController = require('./authController');
const authMiddleware = require('./authMiddleware');

router.post('/login', authController.login);
router.get('/me', authMiddleware.optionalAuth, authController.me);

module.exports = router;

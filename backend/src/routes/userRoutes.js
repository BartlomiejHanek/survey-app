const express = require('express');
const router = express.Router();

// User management disabled in simplified app. Return 404 for any user-management calls.
router.use((req, res) => res.status(404).json({ error: 'Not found' }));

module.exports = router;


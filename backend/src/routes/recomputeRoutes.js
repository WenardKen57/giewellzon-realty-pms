const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { recomputeAll } = require('../controllers/recomputeController');

router.post('/properties', requireAuth, requireAdmin, recomputeAll);

module.exports = router;
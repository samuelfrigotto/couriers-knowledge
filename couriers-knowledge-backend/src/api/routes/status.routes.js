// couriers-knowledge-backend/src/api/routes/status.routes.js

const express = require('express');
const router = express.Router();
const statusController = require('../../controllers/status.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

/**
 * POST /api/status/parse
 * Recebe o output do comando status do Dota 2 e retorna dados estruturados
 * Body: { statusOutput: string }
 */
router.post('/parse', authMiddleware.verifyToken, statusController.parseStatus);

module.exports = router;
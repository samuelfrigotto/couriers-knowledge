// backend/src/routes/immortal.routes.js

const express = require('express');
const router = express.Router();
const immortalController = require('../controllers/immortal.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

/**
 * GET /api/immortal/leaderboard/:region
 * Busca dados do leaderboard oficial por região
 */
router.get('/leaderboard/:region', immortalController.getLeaderboard);

/**
 * POST /api/immortal/refresh/:region  
 * Força atualização do leaderboard de uma região
 */
router.post('/refresh/:region', immortalController.refreshLeaderboard);

/**
 * GET /api/immortal/search/:playerName
 * Busca jogador em todas as regiões do leaderboard
 */
router.get('/search/:playerName', immortalController.searchPlayer);

/**
 * GET /api/immortal/status
 * Verifica status Immortal do usuário atual
 */
router.get('/status', immortalController.getUserStatus);

/**
 * POST /api/immortal/update-mmr
 * Atualiza MMR do usuário (desenvolvimento)
 */
router.post('/update-mmr', immortalController.updateUserMMR);

/**
 * GET /api/immortal/cache/status
 * Mostra status do cache dos leaderboards
 */
router.get('/cache/status', immortalController.getCacheStatus);

/**
 * DELETE /api/immortal/cache
 * Limpa todo o cache (use com cuidado)
 */
router.delete('/cache', immortalController.clearCache);

module.exports = router;
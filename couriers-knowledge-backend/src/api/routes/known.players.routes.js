// backend/src/api/routes/knownPlayers.routes.js

const express = require('express');
const router = express.Router();
const knownPlayersController = require('../../controllers/known.players.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const adminMiddleware = require('../../middlewares/adminAuth');

// GET /api/known-players/:region - Buscar todos os players conhecidos de uma região
router.get('/:region', authMiddleware.verifyToken, adminMiddleware.requireAdmin, knownPlayersController.getKnownPlayersByRegion);

// GET /api/known-players/:region/leaderboard - Buscar leaderboard enriquecido
router.get('/:region/leaderboard', authMiddleware.verifyToken, adminMiddleware.requireAdmin, knownPlayersController.getEnrichedLeaderboard);

// POST /api/known-players - Adicionar novo player conhecido
router.post('/', authMiddleware.verifyToken, adminMiddleware.requireAdmin, knownPlayersController.addKnownPlayer);

// PUT /api/known-players/:id - Atualizar player conhecido
router.put('/:id', authMiddleware.verifyToken, adminMiddleware.requireAdmin, knownPlayersController.updateKnownPlayer);

// DELETE /api/known-players/:id - Remover player conhecido
router.delete('/:id', authMiddleware.verifyToken, adminMiddleware.requireAdmin, knownPlayersController.removeKnownPlayer);

// GET /api/known-players/:region/anomalies - Detectar anomalias e players suspeitos
router.get('/:region/anomalies', authMiddleware.verifyToken, adminMiddleware.requireAdmin, knownPlayersController.detectAnomalies);

// POST /api/known-players/mark-observation - Marcar players como "em observação"
router.post('/mark-observation', authMiddleware.verifyToken, adminMiddleware.requireAdmin, knownPlayersController.markPlayersForObservation);

// POST /api/known-players/:region/sync - Sincronizar players conhecidos com leaderboard atual
router.post('/:region/sync', authMiddleware.verifyToken, adminMiddleware.requireAdmin, knownPlayersController.syncWithLeaderboard);

// GET /api/known-players/:region/stats - Buscar estatísticas dos players conhecidos
router.get('/:region/stats', authMiddleware.verifyToken, adminMiddleware.requireAdmin, knownPlayersController.getPlayerStats);

// GET /api/known-players/:region/changes - Buscar mudanças recentes
router.get('/:region/changes', authMiddleware.verifyToken, adminMiddleware.requireAdmin, knownPlayersController.getRecentChanges);

// POST /api/known-players/resolve-steam-id - Resolver SteamID a partir de URL
router.post('/resolve-steam-id', authMiddleware.verifyToken, adminMiddleware.requireAdmin, knownPlayersController.resolveSteamId);

// GET /api/known-players/search/:region/:name - Buscar players por similaridade de nome
router.get('/search/:region/:name', authMiddleware.verifyToken, adminMiddleware.requireAdmin, knownPlayersController.findSimilarPlayers);

module.exports = router;
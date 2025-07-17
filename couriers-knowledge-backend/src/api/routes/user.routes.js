const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
// 1. IMPORTAR O NOVO MIDDLEWARE
const rateLimiter = require('../../middlewares/rateLimiter.middleware');

// Rotas que NÃO precisam do rate limiter (acessam apenas nosso banco)
router.get('/users/me', authMiddleware.verifyToken, userController.getMyProfile);
router.post('/users/me/refresh-names', authMiddleware.verifyToken, userController.refreshEvaluatedPlayerNames);
router.get('/users/me/stats', authMiddleware.verifyToken, userController.getUserStats);

// 2. CRIAR E PROTEGER A NOVA ROTA QUE ACESSA A OPENDOTA
// Note a ordem: primeiro autentica, depois verifica o limite.
router.get('/users/me/match-data', [authMiddleware.verifyToken, rateLimiter], userController.getMatchDataFromOpenDota);

module.exports = router;
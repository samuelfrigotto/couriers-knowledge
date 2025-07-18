// backend/src/routes/friends.routes.js
// Passo 4: Rotas para funcionalidades de amigos

const express = require('express');
const router = express.Router();
const friendsController = require('../../controllers/friends.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

// Todas as rotas de amigos requerem autenticação
router.use(verifyToken);

/**
 * GET /api/friends/status
 * Retorna o status dos amigos: quem já usa o app e quem não usa
 * Resposta: { total_friends, usingApp[], notUsingApp[], statistics }
 */
router.get('/status', friendsController.getFriendsStatus);

/**
 * POST /api/friends/invite
 * Gera um convite para um amigo específico
 * Body: { friend_steam_id: string }
 * Resposta: { message, invite_data }
 */
router.post('/invite', friendsController.inviteFriend);

module.exports = router;
// backend/src/api/routes/immortal.routes.js

const express = require('express');
const router = express.Router();
const immortalController = require('../../controllers/immortal.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.get('/leaderboard/:region', authMiddleware.verifyToken, immortalController.getLeaderboard);

router.post('/refresh/:region', authMiddleware.verifyToken, immortalController.refreshLeaderboard);

router.get('/search/:playerName', authMiddleware.verifyToken, immortalController.searchPlayer);

module.exports = router;
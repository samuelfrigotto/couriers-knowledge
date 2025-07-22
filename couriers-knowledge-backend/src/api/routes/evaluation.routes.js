// SUBSTITUA no arquivo couriers-knowledge-backend/src/api/routes/evaluation.routes.js

const express = require('express');
const router = express.Router();
const evaluationController = require('../../controllers/evaluation.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const { exportLimiter, importLimiter } = require('../../middlewares/importExportLimiter.middleware');

// Rota pública para avaliações compartilhadas
router.get('/share/:id', evaluationController.getSharedEvaluation);

// Rotas protegidas que requerem autenticação
router.post('/evaluations', authMiddleware.verifyToken, evaluationController.createEvaluation);
router.get('/evaluations/me', authMiddleware.verifyToken, evaluationController.getMyEvaluations);
router.get('/evaluations/player/:steamId', authMiddleware.verifyToken, evaluationController.getPlayerEvaluations);
router.put('/evaluations/:id', authMiddleware.verifyToken, evaluationController.updateEvaluation);
router.delete('/evaluations/:id', authMiddleware.verifyToken, evaluationController.deleteEvaluation);
router.get('/evaluations/tags', authMiddleware.verifyToken, evaluationController.getUniqueTags);
router.get('/evaluations/status', authMiddleware.verifyToken, evaluationController.getEvaluationStatus);
router.get('/evaluations/by-name/:playerName', authMiddleware.verifyToken, evaluationController.getEvaluationsByPlayerName);

// Rotas de import/export COM RATE LIMITING
router.post('/evaluations/export', 
  authMiddleware.verifyToken, 
  exportLimiter, 
  evaluationController.exportEvaluations
);

router.post('/evaluations/import', 
  authMiddleware.verifyToken, 
  importLimiter, 
  evaluationController.importEvaluations
);

// Rota para verificar estatísticas de uso
router.get('/evaluations/import-export-stats', 
  authMiddleware.verifyToken, 
  evaluationController.getImportExportStats
);

module.exports = router;
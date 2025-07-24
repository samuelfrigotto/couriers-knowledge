// couriers-knowledge-backend/src/routes/mmrVerificationRoutes.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const MMRVerificationController = require('../../controllers/mmr.verification.controller');



// Rotas para usuários normais
router.post('/submit', authMiddleware.verifyToken,
  MMRVerificationController.uploadMiddleware,
  MMRVerificationController.submitVerification
);

router.get('/my-requests', authMiddleware.verifyToken, MMRVerificationController.getUserRequests);

// Rotas admin (apenas ID 1)
router.get('/admin/all', authMiddleware.verifyToken, MMRVerificationController.getAllRequests);
router.patch('/admin/review/:id',authMiddleware.verifyToken, MMRVerificationController.reviewRequest);

// Rota para servir screenshots
router.get('/screenshot/:filename', authMiddleware.verifyToken, MMRVerificationController.getScreenshot);

module.exports = router;
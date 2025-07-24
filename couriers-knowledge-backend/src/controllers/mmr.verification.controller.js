// couriers-knowledge-backend/src/controllers/mmrVerificationController.js

const db = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configuração do Multer para upload de screenshots
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/mmr-screenshots');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `mmr-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'));
    }
  }
});

class MMRVerificationController {
  
  // Enviar solicitação de verificação (usuários normais)
  static async submitVerification(req, res) {
    try {
      const { claimed_mmr, notes } = req.body;
      const user_id = req.user.id;
      const screenshot_path = req.file ? req.file.filename : null;

      if (!screenshot_path) {
        return res.status(400).json({ error: 'Screenshot é obrigatório' });
      }

      if (!claimed_mmr || claimed_mmr < 0) {
        return res.status(400).json({ error: 'MMR inválido' });
      }

      // Verificar se já existe uma solicitação pendente
      const existingRequest = await db.query(
        'SELECT id FROM mmr_verification_requests WHERE user_id = $1 AND status = $2',
        [user_id, 'pending']
      );

      if (existingRequest.rows.length > 0) {
        return res.status(400).json({ 
          error: 'Você já possui uma solicitação pendente' 
        });
      }

      // Inserir nova solicitação
      const result = await db.query(`
        INSERT INTO mmr_verification_requests 
        (user_id, claimed_mmr, screenshot_path, notes, status, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `, [user_id, claimed_mmr, screenshot_path, notes || null, 'pending']);

      res.status(201).json({
        message: 'Solicitação enviada com sucesso!',
        request: result.rows[0]
      });

    } catch (error) {
      console.error('Erro ao enviar verificação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Listar solicitações do usuário atual
  static async getUserRequests(req, res) {
    try {
      const user_id = req.user.id;

      const result = await db.query(`
        SELECT * FROM mmr_verification_requests 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `, [user_id]);

      res.json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Listar todas as solicitações (apenas admin - ID 1)
  static async getAllRequests(req, res) {
    try {
      // Verificar se é admin
      if (req.user.id !== 1) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const result = await db.query(`
        SELECT 
          mvr.*,
          u.username,
          u.email,
          u.current_mmr,
          u.account_status
        FROM mmr_verification_requests mvr
        JOIN users u ON mvr.user_id = u.id
        ORDER BY 
          CASE WHEN mvr.status = 'pending' THEN 0 ELSE 1 END,
          mvr.created_at DESC
      `);

      res.json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar todas as solicitações:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Aprovar/Rejeitar solicitação (apenas admin - ID 1)
  static async reviewRequest(req, res) {
    try {
      // Verificar se é admin
      if (req.user.id !== 1) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { id } = req.params;
      const { action, admin_notes } = req.body; // action: 'approve' | 'reject'

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'Ação inválida' });
      }

      // Buscar a solicitação
      const requestResult = await db.query(
        'SELECT * FROM mmr_verification_requests WHERE id = $1',
        [id]
      );

      if (requestResult.rows.length === 0) {
        return res.status(404).json({ error: 'Solicitação não encontrada' });
      }

      const request = requestResult.rows[0];

      if (request.status !== 'pending') {
        return res.status(400).json({ error: 'Solicitação já foi revisada' });
      }

      const newStatus = action === 'approve' ? 'approved' : 'rejected';

      // Iniciar transação
      await db.query('BEGIN');

      try {
        // Atualizar status da solicitação
        await db.query(`
          UPDATE mmr_verification_requests 
          SET status = $1, admin_notes = $2, reviewed_by = $3, reviewed_at = NOW()
          WHERE id = $4
        `, [newStatus, admin_notes, req.user.id, id]);

        // Se aprovado, atualizar o usuário
        if (action === 'approve') {
          await db.query(`
            UPDATE users 
            SET current_mmr = $1, account_status = 'Premium'
            WHERE id = $2
          `, [request.claimed_mmr, request.user_id]);
        }

        await db.query('COMMIT');

        res.json({
          message: `Solicitação ${action === 'approve' ? 'aprovada' : 'rejeitada'} com sucesso!`,
          status: newStatus
        });

      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('Erro ao revisar solicitação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Servir screenshot (protegido)
  static async getScreenshot(req, res) {
    try {
      const { filename } = req.params;
      
      // Verificar se é admin ou se é o dono da imagem
      if (req.user.id !== 1) {
        const requestResult = await db.query(
          'SELECT user_id FROM mmr_verification_requests WHERE screenshot_path = $1',
          [filename]
        );

        if (requestResult.rows.length === 0 || requestResult.rows[0].user_id !== req.user.id) {
          return res.status(403).json({ error: 'Acesso negado' });
        }
      }

      const filePath = path.join(__dirname, '../../uploads/mmr-screenshots', filename);
      res.sendFile(filePath);

    } catch (error) {
      console.error('Erro ao servir screenshot:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

// Middleware específico para upload
MMRVerificationController.uploadMiddleware = upload.single('screenshot');

module.exports = MMRVerificationController;
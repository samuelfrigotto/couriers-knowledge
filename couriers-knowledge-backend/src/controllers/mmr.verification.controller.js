// SUBSTITUA COMPLETAMENTE o arquivo:
// couriers-knowledge-backend/src/controllers/mmr.verification.controller.js

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

  // ✅ CORRIGIDO: Listar todas as solicitações (apenas admin - ID 1)
  static async getAllRequests(req, res) {
    try {
      // Verificar se é admin (usar == para compatibilidade string/number)
      if (req.user.id != 1) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Query corrigida com as colunas que realmente existem na tabela users
      const result = await db.query(`
        SELECT 
          mvr.*,
          u.steam_username,
          u.steam_id,
          u.mmr as current_mmr,
          u.account_status,
          u.avatar_url
        FROM mmr_verification_requests mvr
        JOIN users u ON mvr.user_id = u.id
        ORDER BY 
          CASE WHEN mvr.status = 'pending' THEN 0 ELSE 1 END,
          mvr.created_at DESC
      `);

      // Mapear os dados para o formato esperado pelo frontend
      const mappedResults = result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        claimed_mmr: row.claimed_mmr,
        screenshot_path: row.screenshot_path,
        notes: row.notes,
        status: row.status,
        admin_notes: row.admin_notes,
        reviewed_by: row.reviewed_by,
        created_at: row.created_at,
        reviewed_at: row.reviewed_at,
        // Dados do usuário
        username: row.steam_username,
        email: row.steam_username, // Usar steam_username como fallback para email
        current_mmr: row.current_mmr,
        account_status: row.account_status || 'Free',
        avatar_url: row.avatar_url,
        steam_id: row.steam_id
      }));

      res.json(mappedResults);
    } catch (error) {
      console.error('Erro ao buscar todas as solicitações:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // ✅ CORRIGIDO: Aprovar/Rejeitar solicitação (apenas admin - ID 1)
static async reviewRequest(req, res) {
  try {
    // Verificar se é admin (usar == para compatibilidade string/number)
    if (req.user.id != 1) {
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

      // ✅ CORREÇÃO: Se aprovado, verificar se é Immortal (>= 8500 MMR)
      if (action === 'approve') {
        const claimedMMR = request.claimed_mmr;
        
        if (claimedMMR >= 8500) {
          console.log(`🌟 [MMR CONTROLLER] MMR ${claimedMMR} >= 8500 - Definindo como IMMORTAL (mantendo account_status)`);
          
          // Determinar rank Immortal baseado no MMR
          let immortalRank = null;
          let immortalRegion = 'americas'; // padrão
          
          // Lógica de ranking baseada no MMR
          if (claimedMMR >= 10000) {
            immortalRank = Math.max(1, Math.floor((12000 - claimedMMR) / 10));
          } else if (claimedMMR >= 9500) {
            immortalRank = Math.max(50, Math.floor((10500 - claimedMMR) / 10));
          } else if (claimedMMR >= 9000) {
            immortalRank = Math.max(200, Math.floor((10000 - claimedMMR) / 10));
          } else {
            immortalRank = Math.max(500, Math.floor((9500 - claimedMMR) / 5));
          }

          // ✅ APENAS ATUALIZAR MMR E CAMPOS IMMORTAL - NÃO MEXER EM ACCOUNT_STATUS
          await db.query(`
            UPDATE users 
            SET 
              mmr = $1, 
              is_immortal = true,
              immortal_rank = $2,
              immortal_region = $3,
              leaderboard_last_check = NOW()
            WHERE id = $4
          `, [claimedMMR, immortalRank, immortalRegion, request.user_id]);
          
          console.log(`✅ [MMR CONTROLLER] Usuário ${request.user_id} marcado como IMMORTAL rank ${immortalRank} - account_status mantido`);
          
        } else {
          console.log(`📊 [MMR CONTROLLER] MMR ${claimedMMR} < 8500 - Apenas atualizando MMR (não é Immortal)`);
          
          // ✅ APENAS ATUALIZAR MMR - NÃO É IMMORTAL, NÃO DAR PREMIUM
          await db.query(`
            UPDATE users 
            SET 
              mmr = $1,
              is_immortal = false,
              immortal_rank = null,
              immortal_region = null
            WHERE id = $2
          `, [claimedMMR, request.user_id]);
          
          console.log(`✅ [MMR CONTROLLER] Usuário ${request.user_id} MMR atualizado para ${claimedMMR} - account_status mantido`);
        }
      }

      await db.query('COMMIT');

      // ✅ MENSAGEM CORRIGIDA
      let successMessage;
      if (action === 'approve') {
        const claimedMMR = request.claimed_mmr;
        if (claimedMMR >= 8500) {
          successMessage = `Solicitação aprovada! Usuário marcado como IMMORTAL (MMR: ${claimedMMR})`;
        } else {
          successMessage = `Solicitação aprovada! MMR atualizado para ${claimedMMR} (não Immortal)`;
        }
      } else {
        successMessage = 'Solicitação rejeitada com sucesso!';
      }

      res.json({
        message: successMessage,
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


  // ✅ CORRIGIDO: Servir screenshot (protegido com autenticação)
  static async getScreenshot(req, res) {
    try {
      const { filename } = req.params;
      
      // Verificar se é admin ou se é o dono da imagem
      if (req.user.id != 1) {
        const requestResult = await db.query(
          'SELECT user_id FROM mmr_verification_requests WHERE screenshot_path = $1',
          [filename]
        );

        if (requestResult.rows.length === 0 || requestResult.rows[0].user_id != req.user.id) {
          return res.status(403).json({ error: 'Acesso negado' });
        }
      }

      // Construir caminho do arquivo
      const filePath = path.join(__dirname, '../../uploads/mmr-screenshots', filename);
      
      // Verificar se o arquivo existe
      const fs = require('fs');
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Arquivo não encontrado' });
      }

      // ✅ IMPORTANTE: Definir headers corretos para imagens
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache de 1 hora
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200'); // CORS específico
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      // Enviar arquivo
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
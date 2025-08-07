// src/routes/system.js
const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../../middlewares/adminAuth');
const db = require('../../config/database');

/**
 * GET /api/system/version
 * Retorna a versão atual do sistema (público)
 */
router.get('/version', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT version, created_at 
      FROM system_version 
      ORDER BY created_at DESC 
      LIMIT 1
    `);

    const version = rows.length > 0 ? rows[0].version : 'v0.0.30';

    res.json({
      success: true,
      version: version,
      updated_at: rows.length > 0 ? rows[0].created_at : null
    });

  } catch (error) {
    console.error('Erro ao buscar versão:', error);
    res.json({
      success: true,
      version: 'v0.0.30'
    });
  }
});

/**
 * PATCH /api/system/version
 * Atualiza a versão do sistema (apenas admin)
 */
/**
 * PATCH /api/system/version
 * Atualiza a versão do sistema (apenas admin)
 */
router.patch('/version', requireAdmin, async (req, res) => {
  try {
    // --- LÓGICA DE ADMINISTRAÇÃO ADICIONADA CONFORME SOLICITADO ---
    // Verifica se o ID do usuário decodificado do token é '1'.
    // Usamos '!=' para comparar "1" (string do token) com 1 (número).
    if (req.user.id != 1) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Requer permissão de administrador.'
      });
    }

    const { version } = req.body;

    // Validar formato da versão (v0.0.30, v1.2.3, etc)
    if (!version || !version.match(/^v\d+\.\d+\.\d+$/)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de versão inválido. Use o formato: v0.0.30'
      });
    }

    // Inserir nova versão
    const { rows } = await db.query(`
      INSERT INTO system_version (version, created_by)
      VALUES ($1, $2)
      RETURNING version, created_at
    `, [version, req.user.id]);

    // Log ajustado para não causar erro (seu token não tem steam_username)
    console.log(`🔄 Admin (ID: ${req.user.id}) atualizou a versão para: ${version}`);

    res.json({
      success: true,
      version: rows[0].version,
      message: 'Versão atualizada com sucesso!',
      updated_at: rows[0].created_at
    });

  } catch (error) {
    console.error('Erro ao atualizar versão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/system/version-history
 * Retorna histórico de versões (apenas admin)
 */
router.get('/version-history', requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        sv.version, 
        sv.created_at, 
        u.steam_username as created_by_name
      FROM system_version sv
      LEFT JOIN users u ON sv.created_by = u.id
      ORDER BY sv.created_at DESC 
      LIMIT 20
    `);

    res.json({
      success: true,
      history: rows
    });

  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
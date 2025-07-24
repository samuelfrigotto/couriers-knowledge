// backend/src/controllers/immortal.controller.js

const immortalService = require('../services/immortal.service');

/**
 * GET /api/immortal/leaderboard/:region
 * Busca dados do leaderboard oficial
 */
exports.getLeaderboard = async (req, res) => {
  const { region } = req.params;
  
  try {
    // Validar região
    const validRegions = ['americas', 'europe', 'se_asia', 'china'];
    if (!validRegions.includes(region)) {
      return res.status(400).json({
        success: false,
        error: 'Região inválida. Use: americas, europe, se_asia, china'
      });
    }

    console.log(`🔍 Solicitação de leaderboard para região: ${region}`);
    
    const leaderboardData = await immortalService.getLeaderboardData(region);
    
    res.status(200).json(leaderboardData);

  } catch (error) {
    console.error(`❌ Erro ao buscar leaderboard ${region}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

/**
 * POST /api/immortal/refresh/:region
 * Força atualização do leaderboard
 */
exports.refreshLeaderboard = async (req, res) => {
  const { region } = req.params;
  const userId = req.user.id;
  
  try {
    // Validar região
    const validRegions = ['americas', 'europe', 'se_asia', 'china'];
    if (!validRegions.includes(region)) {
      return res.status(400).json({
        success: false,
        error: 'Região inválida'
      });
    }

    console.log(`🔄 Usuário ${userId} solicitou atualização do leaderboard ${region}`);
    
    const leaderboardData = await immortalService.forceUpdate(region);
    
    res.status(200).json({
      ...leaderboardData,
      message: `Leaderboard ${region} atualizado com sucesso`
    });

  } catch (error) {
    console.error(`❌ Erro ao atualizar leaderboard ${region}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar leaderboard',
      message: error.message
    });
  }
};

/**
 * GET /api/immortal/search/:playerName
 * Busca jogador em todas as regiões
 */
exports.searchPlayer = async (req, res) => {
  const { playerName } = req.params;
  
  try {
    if (!playerName || playerName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Nome do jogador deve ter pelo menos 2 caracteres'
      });
    }

    console.log(`🔍 Buscando jogador: ${playerName}`);
    
    const regions = ['americas', 'europe', 'se_asia', 'china'];
    const searchResults = [];
    
    // Buscar em todas as regiões
    for (const region of regions) {
      try {
        const result = await immortalService.findPlayerInRegion(playerName, region);
        if (result) {
          searchResults.push(result);
        }
      } catch (regionError) {
        console.warn(`⚠️ Erro ao buscar em ${region}:`, regionError.message);
      }
    }

    res.status(200).json({
      success: true,
      query: playerName,
      results: searchResults,
      totalFound: searchResults.length
    });

  } catch (error) {
    console.error(`❌ Erro ao buscar jogador ${playerName}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro na busca',
      message: error.message
    });
  }
};

/**
 * GET /api/immortal/status
 * Verifica status Immortal do usuário atual
 */
exports.getUserStatus = async (req, res) => {
  const userId = req.user.id;
  
  try {
    const userQuery = `
      SELECT 
        mmr,
        is_immortal,
        immortal_rank,
        immortal_region,
        leaderboard_last_check
      FROM users 
      WHERE id = $1
    `;
    
    const db = require('../config/database');
    const result = await db.query(userQuery, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }
    
    const user = result.rows[0];
    
    res.status(200).json({
      success: true,
      userId: userId,
      mmr: user.mmr,
      isImmortal: user.is_immortal,
      immortalRank: user.immortal_rank,
      immortalRegion: user.immortal_region,
      lastCheck: user.leaderboard_last_check
    });

  } catch (error) {
    console.error(`❌ Erro ao verificar status do usuário ${userId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * POST /api/immortal/update-mmr
 * Atualiza MMR do usuário (apenas para desenvolvimento)
 */
exports.updateUserMMR = async (req, res) => {
  const userId = req.user.id;
  const { mmr } = req.body;
  
  try {
    // Validar MMR
    if (!mmr || mmr < 0 || mmr > 15000) {
      return res.status(400).json({
        success: false,
        error: 'MMR deve estar entre 0 e 15000'
      });
    }

    const isImmortal = mmr >= 8500;
    
    const db = require('../config/database');
    const updateQuery = `
      UPDATE users 
      SET 
        mmr = $1,
        is_immortal = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING mmr, is_immortal, immortal_rank
    `;
    
    const result = await db.query(updateQuery, [mmr, isImmortal, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }
    
    const updatedUser = result.rows[0];
    
    console.log(`✅ MMR atualizado para usuário ${userId}: ${mmr} (Immortal: ${isImmortal})`);
    
    res.status(200).json({
      success: true,
      message: `MMR atualizado para ${mmr}`,
      user: {
        mmr: updatedUser.mmr,
        isImmortal: updatedUser.is_immortal,
        immortalRank: updatedUser.immortal_rank
      }
    });

  } catch (error) {
    console.error(`❌ Erro ao atualizar MMR do usuário ${userId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * GET /api/immortal/cache/status
 * Mostra status do cache
 */
exports.getCacheStatus = async (req, res) => {
  try {
    const regions = ['americas', 'europe', 'se_asia', 'china'];
    const cacheStatus = {};
    
    for (const region of regions) {
      const cached = immortalService.getCachedData(region);
      cacheStatus[region] = {
        cached: !!cached,
        lastUpdated: cached?.lastUpdated || null,
        playerCount: cached?.totalPlayers || 0
      };
    }
    
    res.status(200).json({
      success: true,
      cacheStatus: cacheStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao verificar status do cache:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * DELETE /api/immortal/cache
 * Limpa todo o cache (admin only)
 */
exports.clearCache = async (req, res) => {
  try {
    immortalService.clearCache();
    
    res.status(200).json({
      success: true,
      message: 'Cache limpo com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};
// backend/src/controllers/immortal.controller.js

const immortalService = require('../services/immortal.service');

/**
 * GET /api/immortal/leaderboard/:region
 */
exports.getLeaderboard = async (req, res) => {
  const { region } = req.params;
  
  try {
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
 */
exports.refreshLeaderboard = async (req, res) => {
  const { region } = req.params;
  
  try {
    const validRegions = ['americas', 'europe', 'se_asia', 'china'];
    if (!validRegions.includes(region)) {
      return res.status(400).json({
        success: false,
        error: 'Região inválida'
      });
    }

    console.log(`🔄 Forçando atualização do leaderboard ${region}`);
    
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
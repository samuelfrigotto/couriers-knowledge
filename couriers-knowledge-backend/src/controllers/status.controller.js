// couriers-knowledge-backend/src/controllers/status.controller.js

const statusParserService = require('../services/statusParser.service');
const steamService = require('../services/steam.service');
const db = require('../config/database');

/**
 * POST /api/status/parse
 * Recebe o output do comando status e retorna dados estruturados + avaliações
 */
exports.parseStatus = async (req, res) => {
  const authorId = req.user.id;
  const { statusOutput } = req.body;
  
  try {
    // 1. Validar input
    const validation = statusParserService.validateStatusInput(statusOutput);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }
    
    // 2. Parse do status
    const parsedData = statusParserService.parseStatusCommand(statusOutput);
    if (!parsedData.success) {
      return res.status(400).json(parsedData);
    }
    
    // 3. Extrair nomes únicos de players humanos
    const humanPlayerNames = parsedData.allPlayers
      .filter(p => !p.isBot)
      .map(p => p.name)
      .filter(name => name && name.trim().length > 0);
    
    if (humanPlayerNames.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum jogador humano encontrado no status'
      });
    }
    
    console.log(`📋 Encontrados ${humanPlayerNames.length} jogadores humanos:`, humanPlayerNames);
    
    // 4. Atualizar nomes na Steam (apenas dos avaliados pelo usuário)
    await updateEvaluatedPlayerNames(authorId);
    
    // 5. Buscar avaliações por nome
    const evaluationsByName = await getEvaluationsByPlayerNames(authorId, humanPlayerNames);
    
    // 6. Enriquecer dados dos players com avaliações
    const enrichedPlayers = enrichPlayersWithEvaluations(parsedData.allPlayers, evaluationsByName);
    
    // 7. Estruturar resposta final
    const response = {
      success: true,
      gameState: {
        raw: parsedData.gameState,
        translated: statusParserService.translateGameState(parsedData.gameState)
      },
      statistics: {
        totalPlayers: parsedData.totalPlayers,
        humanPlayers: parsedData.humanPlayers,
        botPlayers: parsedData.botPlayers,
        evaluatedPlayers: Object.keys(evaluationsByName).length
      },
      teams: {
        radiant: enrichedPlayers.filter(p => p.team === 'radiant'),
        dire: enrichedPlayers.filter(p => p.team === 'dire')
      },
      evaluationsSummary: {
        totalFound: Object.values(evaluationsByName).reduce((sum, evals) => sum + evals.length, 0),
        playersWithEvaluations: Object.keys(evaluationsByName).length,
        playerNames: Object.keys(evaluationsByName)
      }
    };
    
    console.log(`✅ Status processado: ${response.statistics.evaluatedPlayers}/${response.statistics.humanPlayers} jogadores com avaliações`);
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Erro ao processar status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Atualiza nomes dos jogadores já avaliados pelo usuário
 */
async function updateEvaluatedPlayerNames(authorId) {
  try {
    console.log('🔄 Atualizando nomes dos jogadores avaliados...');
    
    // Buscar Steam IDs únicos das avaliações do usuário
    const steamIdsQuery = `
      SELECT DISTINCT evaluated_steam_id 
      FROM evaluations 
      WHERE author_id = $1 AND evaluated_steam_id IS NOT NULL
    `;
    
    const { rows } = await db.query(steamIdsQuery, [authorId]);
    const steamIds = rows.map(r => r.evaluated_steam_id);
    
    if (steamIds.length === 0) {
      console.log('📭 Nenhum Steam ID para atualizar');
      return { updated: 0 };
    }
    
    console.log(`🔍 Atualizando nomes para ${steamIds.length} Steam IDs...`);
    
    // Atualizar nomes via Steam API
    const updateResult = await steamService.updatePlayerNamesFromSteam(steamIds);
    
    console.log(`✅ ${updateResult.updated} nomes atualizados`);
    return updateResult;
    
  } catch (error) {
    console.error('❌ Erro ao atualizar nomes:', error);
    return { updated: 0, error: error.message };
  }
}

/**
 * Busca avaliações por nomes de jogadores
 */
async function getEvaluationsByPlayerNames(authorId, playerNames) {
  try {
    if (playerNames.length === 0) return {};
    
    console.log(`🔍 Buscando avaliações para nomes: ${playerNames.join(', ')}`);
    
    // Query que busca avaliações comparando com last_known_name
    const query = `
      SELECT 
        e.id,
        e.rating,
        e.notes,
        e.tags,
        e.role,
        e.hero_id,
        e.match_id,
        e.created_at,
        p.last_known_name,
        p.steam_id as evaluated_steam_id
      FROM evaluations e
      JOIN players p ON e.player_id = p.id
      WHERE e.author_id = $1 
        AND p.last_known_name = ANY($2::text[])
      ORDER BY p.last_known_name, e.created_at DESC
    `;
    
    const { rows } = await db.query(query, [authorId, playerNames]);
    
    // Agrupar por nome do jogador
    const groupedEvaluations = {};
    
    rows.forEach(evaluation => {
      const playerName = evaluation.last_known_name;
      
      if (!groupedEvaluations[playerName]) {
        groupedEvaluations[playerName] = [];
      }
      
      groupedEvaluations[playerName].push({
        id: evaluation.id,
        rating: parseFloat(evaluation.rating),
        notes: evaluation.notes,
        tags: evaluation.tags || [],
        role: evaluation.role,
        hero_id: evaluation.hero_id,
        match_id: evaluation.match_id,
        created_at: evaluation.created_at,
        steam_id: evaluation.evaluated_steam_id
      });
    });
    
    console.log(`✅ Encontradas avaliações para ${Object.keys(groupedEvaluations).length} jogadores`);
    
    return groupedEvaluations;
    
  } catch (error) {
    console.error('❌ Erro ao buscar avaliações por nome:', error);
    return {};
  }
}

/**
 * Enriquece dados dos players com avaliações encontradas
 */
function enrichPlayersWithEvaluations(players, evaluationsByName) {
  return players.map(player => {
    const evaluations = evaluationsByName[player.name] || [];
    
    // Calcular estatísticas das avaliações
    const stats = evaluations.length > 0 ? {
      totalEvaluations: evaluations.length,
      averageRating: evaluations.reduce((sum, e) => sum + e.rating, 0) / evaluations.length,
      lastEvaluated: evaluations[0]?.created_at, // Mais recente primeiro
      allTags: [...new Set(evaluations.flatMap(e => e.tags))],
      mostCommonRole: getMostCommonRole(evaluations)
    } : null;
    
    return {
      ...player,
      hasEvaluations: evaluations.length > 0,
      evaluations: evaluations,
      stats: stats
    };
  });
}

/**
 * Encontra a role mais comum nas avaliações
 */
function getMostCommonRole(evaluations) {
  const roles = evaluations
    .map(e => e.role)
    .filter(role => role && role.trim().length > 0);
  
  if (roles.length === 0) return null;
  
  const roleCount = {};
  roles.forEach(role => {
    roleCount[role] = (roleCount[role] || 0) + 1;
  });
  
  return Object.entries(roleCount)
    .sort(([,a], [,b]) => b - a)[0][0];
}

module.exports = {
  parseStatus: exports.parseStatus
};
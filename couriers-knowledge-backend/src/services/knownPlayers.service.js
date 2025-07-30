// backend/src/services/knownPlayers.service.js

const db = require('../config/database');
const axios = require('axios');

class KnownPlayersService {
  
  constructor() {
    this.steamApiKey = process.env.STEAM_API_KEY; // Configurar no .env
  }

  /**
   * Buscar todos os players conhecidos de uma região
   */
  async getKnownPlayersByRegion(region = 'europe') {
    try {
      const query = `
        SELECT 
          kp.*,
          lc.rank as current_rank,
          lc.name as current_steam_name,
          lc.updated_at as last_seen
        FROM known_players kp
        LEFT JOIN leaderboard_cache lc ON kp.steam_id = lc.steam_id AND lc.region = kp.region
        WHERE kp.region = $1
        ORDER BY 
          CASE kp.confidence_level 
            WHEN 'confirmed' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'observation' THEN 4
            ELSE 5
          END,
          COALESCE(lc.rank, kp.last_known_rank, 9999)
      `;
      
      const result = await db.query(query, [region]);
      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar players conhecidos:', error);
      throw error;
    }
  }

  /**
   * Adicionar novo player conhecido
   */
  async addKnownPlayer(playerData) {
    const { steamUrl, competitiveName, region = 'europe', notes = '' } = playerData;
    
    try {
      // Converter Steam URL para SteamID64
      const steamId = await this.resolveSteamId(steamUrl);
      
      if (!steamId) {
        throw new Error('Não foi possível resolver o SteamID a partir da URL fornecida');
      }

      // Buscar informações do perfil Steam
      const steamProfile = await this.getSteamProfile(steamId);
      
      // Calcular setor de volatilidade se tiver rank atual
      let volatilitySector = null;
      let lastKnownRank = null;
      
      const currentRank = await this.getCurrentRankFromLeaderboard(steamId, region);
      if (currentRank) {
        lastKnownRank = currentRank;
        volatilitySector = this.calculateVolatilitySector(currentRank);
      }

      const query = `
        INSERT INTO known_players (
          steam_id, competitive_name, steam_name, region, 
          confidence_level, last_known_rank, volatility_sector, 
          status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const values = [
        steamId,
        competitiveName,
        steamProfile?.personaname || null,
        region,
        'confirmed', // Novo player adicionado manualmente = confirmado
        lastKnownRank,
        volatilitySector,
        'active',
        notes
      ];
      
      const result = await db.query(query, values);
      
      // Log da adição
      await this.logChange({
        region,
        steamId,
        playerName: competitiveName,
        changeType: 'new_known_player',
        newValue: competitiveName,
        changeDetails: { 
          addedBy: 'admin',
          steamProfile: steamProfile?.personaname,
          currentRank: lastKnownRank
        }
      });
      
      console.log(`✅ Player conhecido adicionado: ${competitiveName} (${steamId})`);
      return result.rows[0];
      
    } catch (error) {
      console.error('Erro ao adicionar player conhecido:', error);
      throw error;
    }
  }

  /**
   * Atualizar player conhecido
   */
  async updateKnownPlayer(playerId, updates) {
    try {
      const allowedFields = [
        'competitive_name', 'steam_name', 'confidence_level', 
        'status', 'notes', 'last_known_rank', 'volatility_sector'
      ];
      
      const setFields = [];
      const values = [];
      let valueIndex = 1;

      for (const [field, value] of Object.entries(updates)) {
        if (allowedFields.includes(field)) {
          setFields.push(`${field} = $${valueIndex}`);
          values.push(value);
          valueIndex++;
        }
      }

      if (setFields.length === 0) {
        throw new Error('Nenhum campo válido para atualização');
      }

      const query = `
        UPDATE known_players 
        SET ${setFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${valueIndex}
        RETURNING *
      `;
      
      values.push(playerId);
      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Player não encontrado');
      }

      // Log da atualização
      await this.logChange({
        region: result.rows[0].region,
        steamId: result.rows[0].steam_id,
        playerName: result.rows[0].competitive_name,
        changeType: 'player_updated',
        changeDetails: { 
          updatedFields: Object.keys(updates),
          updatedBy: 'admin'
        }
      });
      
      return result.rows[0];
      
    } catch (error) {
      console.error('Erro ao atualizar player conhecido:', error);
      throw error;
    }
  }

  /**
   * Remover player conhecido
   */
  async removeKnownPlayer(playerId) {
    try {
      const query = 'DELETE FROM known_players WHERE id = $1 RETURNING *';
      const result = await db.query(query, [playerId]);
      
      if (result.rows.length === 0) {
        throw new Error('Player não encontrado');
      }

      // Log da remoção
      await this.logChange({
        region: result.rows[0].region,
        steamId: result.rows[0].steam_id,
        playerName: result.rows[0].competitive_name,
        changeType: 'player_removed',
        changeDetails: { 
          removedBy: 'admin',
          reason: 'manual_removal'
        }
      });
      
      return result.rows[0];
      
    } catch (error) {
      console.error('Erro ao remover player conhecido:', error);
      throw error;
    }
  }

  /**
   * Resolver SteamID a partir de URL ou ID
   */
  async resolveSteamId(steamInput) {
    try {
      // Já é um SteamID64
      if (/^7656119\d{10}$/.test(steamInput)) {
        return steamInput;
      }

      // URL do perfil com SteamID64
      const profileMatch = steamInput.match(/steamcommunity\.com\/profiles\/(\d+)/);
      if (profileMatch) {
        return profileMatch[1];
      }

      // Custom URL - precisa usar Steam API
      const customMatch = steamInput.match(/steamcommunity\.com\/id\/([^\/]+)/);
      if (customMatch && this.steamApiKey) {
        const customId = customMatch[1];
        return await this.resolveVanityUrl(customId);
      }

      throw new Error('Formato de Steam URL/ID não reconhecido');
      
    } catch (error) {
      console.error('Erro ao resolver SteamID:', error);
      throw error;
    }
  }

  /**
   * Resolver Vanity URL usando Steam API
   */
  async resolveVanityUrl(vanityUrl) {
    if (!this.steamApiKey) {
      throw new Error('Steam API Key não configurada');
    }

    try {
      const response = await axios.get('http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/', {
        params: {
          key: this.steamApiKey,
          vanityurl: vanityUrl
        }
      });

      const data = response.data.response;
      if (data.success === 1) {
        return data.steamid;
      } else {
        throw new Error('Vanity URL não encontrada no Steam');
      }
      
    } catch (error) {
      console.error('Erro na Steam API:', error);
      throw new Error('Erro ao resolver Vanity URL do Steam');
    }
  }

  /**
   * Buscar perfil do Steam
   */
  async getSteamProfile(steamId) {
    if (!this.steamApiKey) {
      console.warn('Steam API Key não configurada, pulando busca do perfil');
      return null;
    }

    try {
      const response = await axios.get('http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/', {
        params: {
          key: this.steamApiKey,
          steamids: steamId
        }
      });

      const players = response.data.response.players;
      return players.length > 0 ? players[0] : null;
      
    } catch (error) {
      console.error('Erro ao buscar perfil Steam:', error);
      return null;
    }
  }

  /**
   * Buscar rank atual do player no leaderboard
   */
  async getCurrentRankFromLeaderboard(steamId, region) {
    try {
      const query = `
        SELECT rank 
        FROM leaderboard_cache 
        WHERE steam_id = $1 AND region = $2
        ORDER BY updated_at DESC 
        LIMIT 1
      `;
      
      const result = await db.query(query, [steamId, region]);
      return result.rows.length > 0 ? result.rows[0].rank : null;
      
    } catch (error) {
      console.error('Erro ao buscar rank atual:', error);
      return null;
    }
  }

  /**
   * Calcular setor de volatilidade baseado no rank
   */
  calculateVolatilitySector(rank) {
    if (rank <= 100) return 100;
    if (rank <= 500) return 200;
    if (rank <= 1000) return 300;
    if (rank <= 2000) return 400;
    if (rank <= 3000) return 500;
    return 600; // Área de adaptação
  }

  /**
   * Buscar players com leaderboard enriquecido
   */
  async getEnrichedLeaderboard(region = 'europe', limit = 4000) {
    try {
      const query = `
        SELECT 
          lc.rank,
          lc.name as steam_name,
          lc.team_tag,
          lc.country,
          lc.steam_id,
          lc.previous_rank,
          lc.rank_change,
          lc.updated_at,
          kp.id as known_player_id,
          kp.competitive_name,
          kp.confidence_level,
          kp.status as player_status,
          kp.notes,
          CASE 
            WHEN kp.steam_id IS NOT NULL THEN kp.confidence_level
            ELSE 'unknown'
          END as confidence_level_final,
          CASE
            WHEN lc.previous_rank IS NOT NULL AND ABS(lc.previous_rank - lc.rank) > $2
            THEN true
            ELSE false
          END as volatility_exceeded
        FROM leaderboard_cache lc
        LEFT JOIN known_players kp ON lc.steam_id = kp.steam_id AND lc.region = kp.region
        WHERE lc.region = $1
        ORDER BY lc.rank ASC
        LIMIT $3
      `;
      
      // Calcular volatilidade média para a consulta (aproximação)
      const avgVolatility = 300;
      const result = await db.query(query, [region, avgVolatility, limit]);
      
      return result.rows.map(row => ({
        rank: row.rank,
        steamName: row.steam_name,
        teamTag: row.team_tag,
        country: row.country,
        steamId: row.steam_id,
        previousRank: row.previous_rank,
        rankChange: row.rank_change,
        lastUpdate: row.updated_at,
        knownPlayer: row.known_player_id ? {
          id: row.known_player_id,
          competitiveName: row.competitive_name,
          confidenceLevel: row.confidence_level,
          status: row.player_status,
          notes: row.notes
        } : null,
        confidenceLevel: row.confidence_level_final,
        volatilityExceeded: row.volatility_exceeded
      }));
      
    } catch (error) {
      console.error('Erro ao buscar leaderboard enriquecido:', error);
      throw error;
    }
  }

  /**
   * Detectar anomalias e players suspeitos
   */
  async detectAnomalies(region = 'europe') {
    try {
      // Buscar players com volatilidade excedida
      const volatilityQuery = `
        SELECT 
          lc.steam_id,
          lc.name,
          lc.rank,
          lc.previous_rank,
          (lc.previous_rank - lc.rank) as rank_change,
          calculate_volatility_sector(lc.rank) as expected_volatility,
          ABS(lc.previous_rank - lc.rank) - calculate_volatility_sector(lc.rank) as exceeded_by,
          kp.competitive_name,
          kp.confidence_level
        FROM leaderboard_cache lc
        LEFT JOIN known_players kp ON lc.steam_id = kp.steam_id AND lc.region = kp.region
        WHERE lc.region = $1 
          AND lc.previous_rank IS NOT NULL
          AND ABS(lc.previous_rank - lc.rank) > calculate_volatility_sector(lc.rank)
        ORDER BY exceeded_by DESC
      `;

      // Buscar players desconhecidos no top 3000
      const unknownQuery = `
        SELECT 
          lc.steam_id,
          lc.name,
          lc.rank,
          lc.team_tag
        FROM leaderboard_cache lc
        LEFT JOIN known_players kp ON lc.steam_id = kp.steam_id AND lc.region = kp.region
        WHERE lc.region = $1 
          AND lc.rank <= 3000
          AND kp.steam_id IS NULL
        ORDER BY lc.rank ASC
      `;

      // Buscar mudanças recentes de nome
      const nameChangesQuery = `
        SELECT DISTINCT
          lc.steam_id,
          lc.name as current_name,
          kp.competitive_name,
          kp.steam_name as known_steam_name,
          lc.rank,
          kp.confidence_level
        FROM leaderboard_cache lc
        INNER JOIN known_players kp ON lc.steam_id = kp.steam_id AND lc.region = kp.region
        WHERE lc.region = $1
          AND lc.name != COALESCE(kp.steam_name, '')
          AND kp.steam_name IS NOT NULL
        ORDER BY lc.rank ASC
      `;

      const [volatilityResult, unknownResult, nameChangesResult] = await Promise.all([
        db.query(volatilityQuery, [region]),
        db.query(unknownQuery, [region]),
        db.query(nameChangesQuery, [region])
      ]);

      return {
        volatilityAnomalies: volatilityResult.rows,
        unknownPlayers: unknownResult.rows,
        nameChanges: nameChangesResult.rows,
        summary: {
          totalAnomalies: volatilityResult.rows.length + unknownResult.rows.length + nameChangesResult.rows.length,
          volatilityIssues: volatilityResult.rows.length,
          unknownInTop3000: unknownResult.rows.length,
          nameChangeAlerts: nameChangesResult.rows.length
        }
      };
      
    } catch (error) {
      console.error('Erro ao detectar anomalias:', error);
      throw error;
    }
  }

  /**
   * Marcar players suspeitos como "em observação"
   */
  async markPlayersForObservation(steamIds, reason = 'automated_detection') {
    try {
      const query = `
        UPDATE known_players 
        SET confidence_level = 'observation', 
            notes = COALESCE(notes || ' | ', '') || $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE steam_id = ANY($1)
        RETURNING steam_id, competitive_name
      `;
      
      const result = await db.query(query, [steamIds, `Marked for observation: ${reason}`]);
      
      // Log das mudanças
      for (const player of result.rows) {
        await this.logChange({
          steamId: player.steam_id,
          playerName: player.competitive_name,
          changeType: 'confidence_downgrade',
          oldValue: 'confirmed/high',
          newValue: 'observation',
          changeDetails: { reason, automated: true }
        });
      }
      
      return result.rows;
      
    } catch (error) {
      console.error('Erro ao marcar players para observação:', error);
      throw error;
    }
  }

  /**
   * Atualizar automaticamente dados dos players conhecidos
   */
  async syncKnownPlayersWithLeaderboard(region = 'europe') {
    try {
      console.log(`🔄 Sincronizando players conhecidos da região ${region}...`);
      
      const query = `
        UPDATE known_players kp
        SET 
          last_known_rank = lc.rank,
          volatility_sector = calculate_volatility_sector(lc.rank),
          steam_name = lc.name,
          status = 'active',
          updated_at = CURRENT_TIMESTAMP
        FROM leaderboard_cache lc
        WHERE kp.steam_id = lc.steam_id 
          AND kp.region = lc.region 
          AND kp.region = $1
        RETURNING kp.steam_id, kp.competitive_name, lc.rank
      `;
      
      const result = await db.query(query, [region]);
      
      // Marcar players ausentes como missing
      const missingQuery = `
        UPDATE known_players 
        SET status = 'missing', updated_at = CURRENT_TIMESTAMP
        WHERE region = $1 
          AND status = 'active'
          AND steam_id NOT IN (
            SELECT steam_id FROM leaderboard_cache WHERE region = $1 AND steam_id IS NOT NULL
          )
        RETURNING steam_id, competitive_name
      `;
      
      const missingResult = await db.query(missingQuery, [region]);
      
      console.log(`✅ Sincronização concluída: ${result.rows.length} players atualizados, ${missingResult.rows.length} marcados como ausentes`);
      
      return {
        updated: result.rows,
        missing: missingResult.rows
      };
      
    } catch (error) {
      console.error('Erro na sincronização:', error);
      throw error;
    }
  }

  /**
   * Buscar estatísticas dos players conhecidos
   */
  async getPlayerStats(region = 'europe') {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_known_players,
          COUNT(CASE WHEN confidence_level = 'confirmed' THEN 1 END) as confirmed,
          COUNT(CASE WHEN confidence_level = 'high' THEN 1 END) as high_confidence,
          COUNT(CASE WHEN confidence_level = 'medium' THEN 1 END) as medium_confidence,
          COUNT(CASE WHEN confidence_level = 'observation' THEN 1 END) as in_observation,
          COUNT(CASE WHEN confidence_level = 'unknown' THEN 1 END) as unknown,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_players,
          COUNT(CASE WHEN status = 'missing' THEN 1 END) as missing_players,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_players,
          ROUND(
            COUNT(CASE WHEN confidence_level IN ('confirmed', 'high') THEN 1 END) * 100.0 / 
            NULLIF(COUNT(*), 0), 2
          ) as confidence_percentage
        FROM known_players 
        WHERE region = $1
      `;
      
      const result = await db.query(query, [region]);
      return result.rows[0];
      
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  /**
   * Buscar mudanças recentes
   */
  async getRecentChanges(region = 'europe', limit = 50) {
    try {
      const query = `
        SELECT 
          steam_id,
          player_name,
          change_type,
          old_value,
          new_value,
          rank_position,
          previous_rank,
          volatility_exceeded,
          change_details,
          detected_at
        FROM leaderboard_changes
        WHERE region = $1
        ORDER BY detected_at DESC
        LIMIT $2
      `;
      
      const result = await db.query(query, [region, limit]);
      return result.rows;
      
    } catch (error) {
      console.error('Erro ao buscar mudanças recentes:', error);
      throw error;
    }
  }

  /**
   * Log de mudanças
   */
  async logChange(changeData) {
    try {
      const {
        region = 'europe',
        steamId,
        playerName,
        changeType,
        oldValue = null,
        newValue = null,
        rankPosition = null,
        previousRank = null,
        volatilityExceeded = false,
        changeDetails = {}
      } = changeData;

      const query = `
        INSERT INTO leaderboard_changes (
          region, steam_id, player_name, change_type, old_value, new_value,
          rank_position, previous_rank, volatility_exceeded, change_details
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `;
      
      const values = [
        region, steamId, playerName, changeType, oldValue, newValue,
        rankPosition, previousRank, volatilityExceeded, JSON.stringify(changeDetails)
      ];
      
      await db.query(query, values);
      
    } catch (error) {
      console.error('Erro ao registrar mudança:', error);
      // Não falhar por causa de log
    }
  }

  /**
   * Buscar players por similaridade de nome
   */
  async findSimilarPlayers(searchName, region = 'europe') {
    try {
      const query = `
        SELECT 
          steam_id,
          competitive_name,
          steam_name,
          confidence_level,
          GREATEST(
            similarity(competitive_name, $1),
            similarity(COALESCE(steam_name, ''), $1)
          ) as similarity_score
        FROM known_players
        WHERE region = $2
          AND (
            similarity(competitive_name, $1) > 0.3
            OR similarity(COALESCE(steam_name, ''), $1) > 0.3
          )
        ORDER BY similarity_score DESC
        LIMIT 10
      `;
      
      const result = await db.query(query, [searchName, region]);
      return result.rows;
      
    } catch (error) {
      console.error('Erro ao buscar players similares:', error);
      return [];
    }
  }
}

module.exports = new KnownPlayersService();
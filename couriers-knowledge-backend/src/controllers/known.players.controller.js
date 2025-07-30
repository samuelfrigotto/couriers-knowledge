// backend/src/controllers/knownPlayers.controller.js

const knownPlayersService = require('../services/knownPlayers.service');

class KnownPlayersController {

  async getKnownPlayersByRegion(req, res) {
    try {
      const { region } = req.params;
      
      if (!['europe', 'americas', 'se_asia', 'china'].includes(region)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Região inválida' 
        });
      }

      const players = await knownPlayersService.getKnownPlayersByRegion(region);
      
      res.json({
        success: true,
        region,
        players,
        total: players.length
      });
      
    } catch (error) {
      console.error('Erro ao buscar players conhecidos:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async getEnrichedLeaderboard(req, res) {
    try {
      const { region } = req.params;
      const { limit = 4000 } = req.query;
      
      if (!['europe', 'americas', 'se_asia', 'china'].includes(region)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Região inválida' 
        });
      }

      const leaderboard = await knownPlayersService.getEnrichedLeaderboard(region, parseInt(limit));
      
      res.json({
        success: true,
        region,
        leaderboard,
        total: leaderboard.length,
        lastUpdate: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Erro ao buscar leaderboard enriquecido:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async addKnownPlayer(req, res) {
    try {
      const { steamUrl, competitiveName, region = 'europe', notes } = req.body;
      
      if (!steamUrl || !competitiveName) {
        return res.status(400).json({
          success: false,
          error: 'steamUrl e competitiveName são obrigatórios'
        });
      }

      if (!['europe', 'americas', 'se_asia', 'china'].includes(region)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Região inválida' 
        });
      }

      const newPlayer = await knownPlayersService.addKnownPlayer({
        steamUrl,
        competitiveName,
        region,
        notes
      });
      
      res.status(201).json({
        success: true,
        message: 'Player adicionado com sucesso',
        player: newPlayer
      });
      
    } catch (error) {
      console.error('Erro ao adicionar player:', error);
      
      if (error.message.includes('SteamID')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      
      if (error.code === '23505') { // Constraint violation - duplicate steam_id
        return res.status(409).json({
          success: false,
          error: 'Player já existe no sistema'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async updateKnownPlayer(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Validar campos permitidos
      const allowedFields = [
        'competitive_name', 'steam_name', 'confidence_level', 
        'status', 'notes', 'last_known_rank', 'volatility_sector'
      ];
      
      const invalidFields = Object.keys(updates).filter(field => !allowedFields.includes(field));
      if (invalidFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Campos inválidos: ${invalidFields.join(', ')}`
        });
      }

      // Validar valores dos enums
      if (updates.confidence_level && !['confirmed', 'high', 'medium', 'observation', 'unknown'].includes(updates.confidence_level)) {
        return res.status(400).json({
          success: false,
          error: 'confidence_level inválido'
        });
      }

      if (updates.status && !['active', 'missing', 'inactive'].includes(updates.status)) {
        return res.status(400).json({
          success: false,
          error: 'status inválido'
        });
      }

      const updatedPlayer = await knownPlayersService.updateKnownPlayer(parseInt(id), updates);
      
      res.json({
        success: true,
        message: 'Player atualizado com sucesso',
        player: updatedPlayer
      });
      
    } catch (error) {
      console.error('Erro ao atualizar player:', error);
      
      if (error.message === 'Player não encontrado') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async removeKnownPlayer(req, res) {
    try {
      const { id } = req.params;
      
      const removedPlayer = await knownPlayersService.removeKnownPlayer(parseInt(id));
      
      res.json({
        success: true,
        message: 'Player removido com sucesso',
        player: removedPlayer
      });
      
    } catch (error) {
      console.error('Erro ao remover player:', error);
      
      if (error.message === 'Player não encontrado') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async detectAnomalies(req, res) {
    try {
      const { region } = req.params;
      
      if (!['europe', 'americas', 'se_asia', 'china'].includes(region)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Região inválida' 
        });
      }

      const anomalies = await knownPlayersService.detectAnomalies(region);
      
      res.json({
        success: true,
        region,
        anomalies,
        detectedAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Erro ao detectar anomalias:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async markPlayersForObservation(req, res) {
    try {
      const { steamIds, reason = 'manual_review' } = req.body;
      
      if (!Array.isArray(steamIds) || steamIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'steamIds deve ser um array não vazio'
        });
      }

      const markedPlayers = await knownPlayersService.markPlayersForObservation(steamIds, reason);
      
      res.json({
        success: true,
        message: `${markedPlayers.length} players marcados para observação`,
        players: markedPlayers
      });
      
    } catch (error) {
      console.error('Erro ao marcar players para observação:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async syncWithLeaderboard(req, res) {
    try {
      const { region } = req.params;
      
      if (!['europe', 'americas', 'se_asia', 'china'].includes(region)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Região inválida' 
        });
      }

      const syncResult = await knownPlayersService.syncKnownPlayersWithLeaderboard(region);
      
      res.json({
        success: true,
        message: 'Sincronização concluída',
        region,
        result: syncResult,
        syncedAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Erro na sincronização:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async getPlayerStats(req, res) {
    try {
      const { region } = req.params;
      
      if (!['europe', 'americas', 'se_asia', 'china'].includes(region)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Região inválida' 
        });
      }

      const stats = await knownPlayersService.getPlayerStats(region);
      
      res.json({
        success: true,
        region,
        stats,
        generatedAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async getRecentChanges(req, res) {
    try {
      const { region } = req.params;
      const { limit = 50 } = req.query;
      
      if (!['europe', 'americas', 'se_asia', 'china'].includes(region)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Região inválida' 
        });
      }

      const changes = await knownPlayersService.getRecentChanges(region, parseInt(limit));
      
      res.json({
        success: true,
        region,
        changes,
        total: changes.length
      });
      
    } catch (error) {
      console.error('Erro ao buscar mudanças recentes:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async resolveSteamId(req, res) {
    try {
      const { steamUrl } = req.body;
      
      if (!steamUrl) {
        return res.status(400).json({
          success: false,
          error: 'steamUrl é obrigatório'
        });
      }

      const steamId = await knownPlayersService.resolveSteamId(steamUrl);
      const steamProfile = await knownPlayersService.getSteamProfile(steamId);
      
      res.json({
        success: true,
        steamId,
        profile: steamProfile,
        originalUrl: steamUrl
      });
      
    } catch (error) {
      console.error('Erro ao resolver SteamID:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Erro ao resolver SteamID'
      });
    }
  }

  async findSimilarPlayers(req, res) {
    try {
      const { region, name } = req.params;
      
      if (!['europe', 'americas', 'se_asia', 'china'].includes(region)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Região inválida' 
        });
      }

      if (!name || name.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Nome deve ter pelo menos 2 caracteres'
        });
      }

      const similarPlayers = await knownPlayersService.findSimilarPlayers(decodeURIComponent(name), region);
      
      res.json({
        success: true,
        query: name,
        region,
        results: similarPlayers,
        total: similarPlayers.length
      });
      
    } catch (error) {
      console.error('Erro ao buscar players similares:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = new KnownPlayersController();
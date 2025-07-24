// backend/src/services/immortal.service.js - Web Scraping Service

const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../config/database');

class ImmortalService {
  
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 horas
    this.isUpdating = new Set(); // Prevenir atualizações simultâneas
  }

  /**
   * Busca dados do leaderboard oficial via web scraping
   */
  async getLeaderboardData(region = 'americas') {
    try {
      // Verificar cache primeiro
      const cached = this.getCachedData(region);
      if (cached) {
        console.log(`📋 Retornando leaderboard ${region} do cache`);
        return cached;
      }

      // Verificar se já está atualizando para evitar requests duplicados
      if (this.isUpdating.has(region)) {
        console.log(`🔄 Leaderboard ${region} já está sendo atualizado, aguardando...`);
        await this.waitForUpdate(region);
        return this.getCachedData(region) || this.getEmptyResponse(region);
      }

      this.isUpdating.add(region);
      console.log(`🕷️ Iniciando web scraping do leaderboard ${region}...`);

      const players = await this.scrapeLeaderboard(region);
      
      const response = {
        success: true,
        region: region,
        players: players,
        lastUpdated: new Date().toISOString(),
        totalPlayers: players.length
      };

      // Salvar no cache
      this.setCachedData(region, response);
      
      // Salvar no banco de dados para persistência
      await this.saveLeaderboardToDatabase(region, players);

      console.log(`✅ Leaderboard ${region} atualizado: ${players.length} players`);
      
      this.isUpdating.delete(region);
      return response;

    } catch (error) {
      console.error(`❌ Erro ao buscar leaderboard ${region}:`, error.message);
      this.isUpdating.delete(region);
      
      // Tentar retornar dados do banco como fallback
      const fallbackData = await this.getLeaderboardFromDatabase(region);
      if (fallbackData) {
        console.log(`📋 Retornando dados do banco como fallback para ${region}`);
        return fallbackData;
      }

      return this.getEmptyResponse(region);
    }
  }

  /**
   * Faz o scraping do site oficial do Dota 2
   */
  async scrapeLeaderboard(region) {
    const url = `https://www.dota2.com/leaderboards#${region}`;
    
    try {
      console.log(`🌐 Fazendo request para: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 30000 // 30 segundos
      });

      console.log(`📥 Response recebido, status: ${response.status}`);

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const $ = cheerio.load(response.data);
      const players = [];

      // Tentar diferentes seletores pois o site pode mudar
      const possibleSelectors = [
        '.leaderboard_row',
        '[class*="leaderboard"]',
        '.player-row',
        '[class*="player"]'
      ];

      let playersFound = false;

      for (const selector of possibleSelectors) {
        const rows = $(selector);
        
        if (rows.length > 0) {
          console.log(`🎯 Encontrado ${rows.length} elementos com seletor: ${selector}`);
          
          rows.each((index, element) => {
            try {
              const player = this.parsePlayerRow($, element, index + 1);
              if (player && player.name) {
                players.push(player);
              }
            } catch (parseError) {
              console.warn(`⚠️ Erro ao processar player ${index + 1}:`, parseError.message);
            }
          });

          if (players.length > 0) {
            playersFound = true;
            break;
          }
        }
      }

      if (!playersFound) {
        console.log('🔍 Tentando métodos alternativos de parsing...');
        
        // Método alternativo: buscar por padrões de texto
        const alternativePlayers = this.parseAlternativeMethod($);
        players.push(...alternativePlayers);
      }

      // Validar e limpar dados
      const validPlayers = players
        .filter(p => p && p.name && p.name.trim().length > 0)
        .slice(0, 1000) // Limitar a 1000 players
        .map((p, index) => ({
          rank: p.rank || (index + 1),
          name: p.name.trim(),
          teamTag: p.teamTag || null,
          country: p.country || null,
          steamId: p.steamId || null
        }));

      console.log(`✅ ${validPlayers.length} players válidos extraídos para ${region}`);
      
      // Log dos primeiros 5 para debug
      console.log('📋 Primeiros players:', validPlayers.slice(0, 5));

      return validPlayers;

    } catch (error) {
      console.error(`❌ Erro no scraping de ${region}:`, error.message);
      throw error;
    }
  }

  /**
   * Processa uma linha de jogador
   */
  parsePlayerRow($, element, defaultRank) {
    const $el = $(element);
    
    // Diferentes formas de extrair o nome
    let name = null;
    const nameSelectors = [
      '.name',
      '.player-name',
      '.player_name',
      '[class*="name"]',
      'td:nth-child(2)', // Segunda coluna geralmente é o nome
      'td:nth-child(3)'  // Terceira coluna às vezes é o nome
    ];

    for (const selector of nameSelectors) {
      const nameEl = $el.find(selector).first();
      if (nameEl.length > 0) {
        name = nameEl.text().trim();
        if (name && name.length > 0) break;
      }
    }

    // Se não encontrou nome, pegar todo o texto e tentar extrair
    if (!name) {
      const fullText = $el.text().trim();
      const textParts = fullText.split(/\s+/).filter(part => part.length > 2);
      name = textParts.find(part => isNaN(parseInt(part))) || null;
    }

    if (!name) return null;

    // Tentar extrair rank
    let rank = defaultRank;
    const rankSelectors = ['.rank', '.position', '[class*="rank"]', 'td:first-child'];
    
    for (const selector of rankSelectors) {
      const rankEl = $el.find(selector).first();
      if (rankEl.length > 0) {
        const rankText = rankEl.text().trim();
        const rankNum = parseInt(rankText.replace(/[^0-9]/g, ''));
        if (!isNaN(rankNum) && rankNum > 0) {
          rank = rankNum;
          break;
        }
      }
    }

    // Tentar extrair team tag (texto entre colchetes)
    let teamTag = null;
    const teamMatch = name.match(/\[([^\]]+)\]/);
    if (teamMatch) {
      teamTag = teamMatch[1];
      name = name.replace(/\[([^\]]+)\]/, '').trim();
    }

    return {
      rank: rank,
      name: name,
      teamTag: teamTag,
      country: null, // TODO: implementar extração de país
      steamId: null  // TODO: implementar se disponível
    };
  }

  /**
   * Método alternativo de parsing quando seletores padrão falham
   */
  parseAlternativeMethod($) {
    const players = [];
    
    try {
      // Buscar por padrões de texto que parecem nomes de players
      const bodyText = $('body').text();
      const lines = bodyText.split('\n');
      
      let currentRank = 1;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Pular linhas muito curtas ou que são claramente não-players
        if (trimmedLine.length < 3 || 
            /^(rank|position|name|team|country)$/i.test(trimmedLine) ||
            /^\d+$/.test(trimmedLine)) {
          continue;
        }

        // Verificar se parece com um nome de player
        if (this.looksLikePlayerName(trimmedLine)) {
          let name = trimmedLine;
          let teamTag = null;

          // Extrair team tag se presente
          const teamMatch = name.match(/\[([^\]]+)\]/);
          if (teamMatch) {
            teamTag = teamMatch[1];
            name = name.replace(/\[([^\]]+)\]/, '').trim();
          }

          players.push({
            rank: currentRank++,
            name: name,
            teamTag: teamTag,
            country: null,
            steamId: null
          });

          // Limitar para evitar muitos resultados falsos
          if (players.length >= 100) break;
        }
      }

      console.log(`🔄 Método alternativo encontrou ${players.length} possíveis players`);
      return players;

    } catch (error) {
      console.warn('⚠️ Erro no método alternativo:', error.message);
      return [];
    }
  }

  /**
   * Verifica se uma string parece ser um nome de player
   */
  looksLikePlayerName(text) {
    if (!text || text.length < 2 || text.length > 50) return false;
    
    // Não deve ser apenas números
    if (/^\d+$/.test(text)) return false;
    
    // Não deve conter apenas caracteres especiais
    if (!/[a-zA-Z0-9]/.test(text)) return false;
    
    // Não deve ser uma palavra comum de interface
    const commonWords = [
      'leaderboard', 'rank', 'position', 'name', 'team', 'country',
      'loading', 'error', 'refresh', 'update', 'back', 'next',
      'americas', 'europe', 'china', 'asia'
    ];
    
    if (commonWords.includes(text.toLowerCase())) return false;
    
    return true;
  }

  // ===== MÉTODOS DE CACHE =====

  getCachedData(region) {
    const cached = this.cache.get(region);
    if (!cached) return null;

    const now = Date.now();
    const cacheTime = new Date(cached.lastUpdated).getTime();
    
    if (now - cacheTime > this.cacheExpiry) {
      this.cache.delete(region);
      return null;
    }

    return cached;
  }

  setCachedData(region, data) {
    this.cache.set(region, data);
  }

  async waitForUpdate(region) {
    let attempts = 0;
    const maxAttempts = 30; // 30 segundos
    
    while (this.isUpdating.has(region) && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
  }

  // ===== MÉTODOS DE BANCO DE DADOS =====

  async saveLeaderboardToDatabase(region, players) {
    try {
      // Primeiro, deletar dados antigos da região
      await db.query('DELETE FROM leaderboard_cache WHERE region = $1', [region]);

      // Inserir novos dados
      for (const player of players) {
        await db.query(`
          INSERT INTO leaderboard_cache (region, rank, name, team_tag, country, steam_id, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        `, [region, player.rank, player.name, player.teamTag, player.country, player.steamId]);
      }

      console.log(`💾 ${players.length} players salvos no banco para ${region}`);

    } catch (error) {
      console.warn(`⚠️ Erro ao salvar no banco para ${region}:`, error.message);
    }
  }

  async getLeaderboardFromDatabase(region) {
    try {
      const result = await db.query(`
        SELECT rank, name, team_tag, country, steam_id, updated_at
        FROM leaderboard_cache 
        WHERE region = $1 
        ORDER BY rank ASC
      `, [region]);

      if (result.rows.length === 0) return null;

      const players = result.rows.map(row => ({
        rank: row.rank,
        name: row.name,
        teamTag: row.team_tag,
        country: row.country,
        steamId: row.steam_id
      }));

      return {
        success: true,
        region: region,
        players: players,
        lastUpdated: result.rows[0].updated_at,
        totalPlayers: players.length,
        source: 'database'
      };

    } catch (error) {
      console.warn(`⚠️ Erro ao buscar no banco para ${region}:`, error.message);
      return null;
    }
  }

  // ===== MÉTODOS UTILITÁRIOS =====

  getEmptyResponse(region) {
    return {
      success: false,
      region: region,
      players: [],
      lastUpdated: new Date().toISOString(),
      totalPlayers: 0,
      error: 'No data available'
    };
  }

  /**
   * Força atualização de uma região específica
   */
  async forceUpdate(region) {
    this.cache.delete(region);
    this.isUpdating.delete(region);
    return await this.getLeaderboardData(region);
  }

  /**
   * Limpa todo o cache
   */
  clearCache() {
    this.cache.clear();
    this.isUpdating.clear();
    console.log('🗑️ Cache do leaderboard limpo');
  }

  /**
   * Busca player por nome em uma região específica
   */
  async findPlayerInRegion(playerName, region) {
    const leaderboard = await this.getLeaderboardData(region);
    
    if (!leaderboard.success) return null;

    // Busca exata primeiro
    let player = leaderboard.players.find(p => 
      p.name.toLowerCase() === playerName.toLowerCase()
    );

    if (player) {
      return { ...player, region, matchType: 'exact' };
    }

    // Busca aproximada
    const cleanName = playerName.replace(/[^\w]/g, '').toLowerCase();
    player = leaderboard.players.find(p => 
      p.name.replace(/[^\w]/g, '').toLowerCase() === cleanName
    );

    if (player) {
      return { ...player, region, matchType: 'approximate' };
    }

    return null;
  }
}

module.exports = new ImmortalService();
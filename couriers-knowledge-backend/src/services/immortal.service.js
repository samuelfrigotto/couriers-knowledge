// backend/src/services/immortal.service.js - VERSÃO PUPPETEER

const puppeteer = require('puppeteer');
const db = require('../config/database');

class ImmortalService {
  
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 horas
    this.isUpdating = new Set();
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

      // Verificar se já está atualizando
      if (this.isUpdating.has(region)) {
        console.log(`🔄 Leaderboard ${region} já está sendo atualizado, aguardando...`);
        await this.waitForUpdate(region);
        return this.getCachedData(region) || this.getEmptyResponse(region);
      }

      this.isUpdating.add(region);
      console.log(`🕷️ Iniciando scraping do leaderboard ${region}...`);

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
      
      // Salvar no banco
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
   * Scraping com Puppeteer - BASEADO NO SEU CÓDIGO
   */
  async scrapeLeaderboard(region) {
    const url = `https://www.dota2.com/leaderboards/#${region}`;
    let browser = null;

    try {
      console.log(`🌐 Fazendo scraping para: ${url}`);
      
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Esperar os elementos aparecerem
      await page.waitForSelector('#leaderboard_body .player_name', { timeout: 15000 });

      // Extrair dados completos (rank + nome + outros dados)
      const players = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('#leaderboard_body tr'));
        
        return rows.map((row, index) => {
          const cells = row.querySelectorAll('td');
          if (cells.length < 2) return null;

          // Rank (primeira célula)
          const rankText = cells[0]?.textContent?.trim() || '';
          const rank = parseInt(rankText.replace(/[^0-9]/g, '')) || (index + 1);

          // Nome (segunda célula, dentro do span.player_name)
          const nameSpan = cells[1]?.querySelector('.player_name');
          const name = nameSpan?.textContent?.trim() || '';
          
          if (!name) return null;

          // Team tag (se existir)
          const teamElement = row.querySelector('[class*="team"], [class*="tag"]');
          const teamTag = teamElement?.textContent?.trim() || null;

          // País (da imagem da bandeira)
          const flagImg = row.querySelector('img[src*="flag"], img[class*="flag"]');
          let country = null;
          if (flagImg) {
            const flagSrc = flagImg.src || '';
            // Extrair código do país da URL da bandeira
            const countryMatch = flagSrc.match(/flags\/([a-z]{2})\./i);
            country = countryMatch ? countryMatch[1].toUpperCase() : null;
          }

          return {
            rank: rank,
            name: name,
            teamTag: teamTag,
            country: country,
            steamId: null
          };
        }).filter(player => player !== null);
      });

      await browser.close();
      browser = null;

      console.log(`✅ Scraping concluído: ${players.length} players extraídos`);
      
      if (players.length > 0) {
        console.log('📋 Primeiros 5 players:', players.slice(0, 5));
      }

      return players;

    } catch (error) {
      if (browser) {
        await browser.close();
      }
      console.error(`❌ Erro no scraping de ${region}:`, error.message);
      throw error;
    }
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
    const maxAttempts = 30;
    
    while (this.isUpdating.has(region) && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
  }

  // ===== MÉTODOS DE BANCO DE DADOS =====

  async saveLeaderboardToDatabase(region, players) {
    try {
      await db.query('DELETE FROM leaderboard_cache WHERE region = $1', [region]);

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
   * Força atualização de uma região
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
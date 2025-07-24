// backend/src/schedulers/leaderboard.scheduler.js

const cron = require('node-cron');
const ImmortalService = require('../services/immortal.service');

class LeaderboardScheduler {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.stats = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      lastSuccess: null,
      lastError: null
    };
  }

  /**
   * Inicia o agendamento para rodar a cada hora no minuto 18
   * Cron: '18 * * * *' = minuto 18 de cada hora
   */
  start() {
    console.log('🕐 Iniciando scheduler do leaderboard...');
    console.log('⏰ Programado para rodar a cada hora no minuto 18 (09:18, 10:18, etc.)');

    // Agendar para minuto 18 de cada hora
    cron.schedule('18 * * * *', async () => {
      await this.runScheduledUpdate();
    }, {
      scheduled: true,
      timezone: "America/Sao_Paulo"
    });

    // Opcional: rodar imediatamente ao iniciar (apenas para teste)
    if (process.env.NODE_ENV !== 'production') {
      console.log('🧪 Modo desenvolvimento: executando scraping inicial...');
      setTimeout(() => {
        this.runScheduledUpdate();
      }, 5000);
    }
  }

  /**
   * Executa atualização de todas as regiões
   */
  async runScheduledUpdate() {
    if (this.isRunning) {
      console.log('⚠️ Scraping já está rodando, pulando execução...');
      return;
    }

    this.isRunning = true;
    this.lastRun = new Date();
    this.stats.totalRuns++;

    const startTime = Date.now();
    console.log(`\n🚀 ========== SCRAPING AGENDADO INICIADO ==========`);
    console.log(`📅 Data/Hora: ${this.lastRun.toLocaleString('pt-BR')}`);

    const regions = ['americas', 'europe', 'se_asia', 'china'];
    const results = {};

    try {
      // Executar scraping para todas as regiões em paralelo
      const promises = regions.map(async (region) => {
        try {
          console.log(`🌍 Iniciando scraping para região: ${region}`);
          const result = await ImmortalService.forceUpdate(region);
          
          results[region] = {
            success: true,
            playersCount: result.totalPlayers,
            lastUpdated: result.lastUpdated
          };
          
          console.log(`✅ ${region}: ${result.totalPlayers} players atualizados`);
          return result;
          
        } catch (error) {
          console.error(`❌ Erro em ${region}:`, error.message);
          results[region] = {
            success: false,
            error: error.message
          };
          throw error;
        }
      });

      await Promise.allSettled(promises);

      // Verificar resultados
      const successCount = Object.values(results).filter(r => r.success).length;
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

      if (successCount === regions.length) {
        this.stats.successfulRuns++;
        this.stats.lastSuccess = new Date();
        console.log(`\n🎉 ========== SCRAPING CONCLUÍDO COM SUCESSO ==========`);
        console.log(`✅ ${successCount}/${regions.length} regiões atualizadas`);
        console.log(`⏱️ Tempo total: ${totalTime}s`);
        
        // Executar linkagem de Steam IDs após scraping bem-sucedido
        await this.linkSteamIds();
        
      } else {
        this.stats.failedRuns++;
        this.stats.lastError = new Date();
        console.log(`\n⚠️ ========== SCRAPING PARCIALMENTE FALHOU ==========`);
        console.log(`⚠️ ${successCount}/${regions.length} regiões atualizadas`);
        console.log(`⏱️ Tempo total: ${totalTime}s`);
      }

    } catch (error) {
      this.stats.failedRuns++;
      this.stats.lastError = new Date();
      console.error(`\n❌ ========== ERRO NO SCRAPING ==========`);
      console.error(`❌ Erro geral:`, error.message);
    } finally {
      this.isRunning = false;
      console.log(`📊 Stats: ${this.stats.successfulRuns} sucessos, ${this.stats.failedRuns} falhas\n`);
    }
  }

  /**
   * Tenta linkar Steam IDs dos jogadores conhecidos
   */
  async linkSteamIds() {
    try {
      console.log('\n🔗 Iniciando linkagem de Steam IDs...');
      const db = require('../config/database');
      
      // Buscar usuários 8.5k+ conhecidos
      const knownUsersQuery = `
        SELECT u.steam_id, u.steam_username, p.last_known_name
        FROM users u
        LEFT JOIN players p ON u.steam_id = p.steam_id
        WHERE u.mmr >= 8500 OR u.is_immortal = true
      `;
      
      const { rows: knownUsers } = await db.query(knownUsersQuery);
      
      if (knownUsers.length === 0) {
        console.log('📋 Nenhum usuário 8.5k+ encontrado para linkagem');
        return;
      }

      console.log(`👥 Tentando linkar ${knownUsers.length} usuários conhecidos...`);
      
      let linkedCount = 0;
      
      for (const user of knownUsers) {
        const names = [user.steam_username, user.last_known_name].filter(Boolean);
        
        for (const name of names) {
          // Atualizar leaderboard com steam_id onde o nome bate
          const updateQuery = `
            UPDATE leaderboard_cache 
            SET steam_id = $1 
            WHERE steam_id IS NULL 
            AND (LOWER(name) = LOWER($2) OR LOWER(name) SIMILAR TO LOWER($3))
          `;
          
          const { rowCount } = await db.query(updateQuery, [
            user.steam_id.toString(),
            name,
            `%${name.replace(/[^a-zA-Z0-9]/g, '')}%`
          ]);
          
          if (rowCount > 0) {
            linkedCount += rowCount;
            console.log(`🔗 Linkado "${name}" -> Steam ID ${user.steam_id} (${rowCount} registros)`);
          }
        }
      }
      
      console.log(`✅ Linkagem concluída: ${linkedCount} registros atualizados\n`);
      
    } catch (error) {
      console.error('❌ Erro na linkagem de Steam IDs:', error.message);
    }
  }

  /**
   * Retorna estatísticas do scheduler
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      nextRun: this.getNextRunTime()
    };
  }

  /**
   * Calcula próxima execução
   */
  getNextRunTime() {
    const now = new Date();
    const next = new Date(now);
    
    // Se já passou dos 18 minutos desta hora, próxima hora
    if (now.getMinutes() >= 18) {
      next.setHours(now.getHours() + 1);
    }
    
    next.setMinutes(18);
    next.setSeconds(0);
    next.setMilliseconds(0);
    
    return next;
  }

  /**
   * Execução manual (para testes)
   */
  async runManual() {
    console.log('🔧 Execução manual do scraping iniciada...');
    await this.runScheduledUpdate();
  }
}

module.exports = new LeaderboardScheduler();
// src/jobs/resetApiLimits.js - VERSÃO FINAL SEM NOVA COLUNA
const cron = require('node-cron');
const db = require('../config/database');

class ApiLimitsResetJob {
  constructor() {
    this.isRunning = false;
  }

  async resetApiLimits() {
    if (this.isRunning) {
      console.log('⚠️ Reset já está executando, pulando...');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();
    
    try {
      console.log('🔄 [CRON] Iniciando reset diário dos contadores de API...');
      console.log(`📅 Horário: ${startTime.toLocaleString('pt-BR')}`);

      // ✅ CORRIGIDO: Reseta TODOS os usuários (sem WHERE)
      const resetQuery = `
        UPDATE users 
        SET 
          api_calls_today = 0
        RETURNING id, steam_username, api_calls_today;
      `;

      const result = await db.query(resetQuery);
      
      const endTime = new Date();
      const duration = endTime - startTime;

      console.log(`✅ [CRON] Reset concluído com sucesso!`);
      console.log(`📊 Usuários resetados: ${result.rowCount}`);
      console.log(`⏱️ Duração: ${duration}ms`);
      
      if (result.rowCount > 0) {
        console.log(`👥 Primeiros 5 usuários resetados:`);
        result.rows.slice(0, 5).forEach(user => {
          console.log(`   - ${user.steam_username} (ID: ${user.id}) - api_calls_today: ${user.api_calls_today}`);
        });
        
        if (result.rowCount > 5) {
          console.log(`   ... e mais ${result.rowCount - 5} usuários`);
        }
      }

      await this.logStatistics();

    } catch (error) {
      console.error('❌ [CRON] Erro ao resetar contadores de API:', error);
      console.error('📋 Stack trace:', error.stack);
    } finally {
      this.isRunning = false;
    }
  }

  async logStatistics() {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN account_status = 'Premium' THEN 1 END) as premium_users,
          COUNT(CASE WHEN account_status = 'Free' THEN 1 END) as free_users,
          COUNT(CASE WHEN api_calls_today > 0 THEN 1 END) as users_with_calls_today,
          COUNT(CASE WHEN DATE(last_api_call_date) = CURRENT_DATE THEN 1 END) as users_used_today
        FROM users;
      `;

      const { rows } = await db.query(statsQuery);
      const stats = rows[0];

      console.log(`📈 [STATS] Estatísticas do sistema:`);
      console.log(`   👥 Total de usuários: ${stats.total_users}`);
      console.log(`   💎 Usuários Premium: ${stats.premium_users}`);
      console.log(`   🆓 Usuários Free: ${stats.free_users}`);
      console.log(`   📞 Usuários com chamadas hoje: ${stats.users_with_calls_today}`);
      console.log(`   📅 Usuários que usaram hoje: ${stats.users_used_today}`);

    } catch (error) {
      console.error('❌ [CRON] Erro ao buscar estatísticas:', error);
    }
  }

  start() {
    console.log('🚀 [CRON] Iniciando agendador de reset de API...');
    
    const cronExpression = '0 0 * * *';
    
    cron.schedule(cronExpression, () => {
      console.log('⏰ [CRON] Executando reset diário automático...');
      this.resetApiLimits();
    }, {
      scheduled: true,
      timezone: "America/Sao_Paulo"
    });

    console.log('✅ [CRON] Job agendado para executar diariamente à meia-noite (GMT-3)');
    console.log('📋 [CRON] Expressão cron:', cronExpression);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔄 [CRON] Executando reset inicial (desenvolvimento)...');
      setTimeout(() => {
        this.resetApiLimits();
      }, 3000);
    }

    console.log(`🕐 [CRON] Próximo reset será à meia-noite (horário de Brasília)`);
    console.log(`🌎 [CRON] Timezone configurada: America/Sao_Paulo`);
  }

  stop() {
    console.log('🛑 [CRON] Parando agendador de reset de API...');
    cron.destroy();
  }

  async testReset() {
    console.log('🧪 [TEST] Executando reset manual para teste...');
    await this.resetApiLimits();
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      nextExecution: '00:00 (próximo dia)',
      timezone: 'America/Sao_Paulo'
    };
  }
}

const apiLimitsResetJob = new ApiLimitsResetJob();
module.exports = apiLimitsResetJob;

if (require.main === module) {
  console.log('🧪 Executando reset manual...');
  apiLimitsResetJob.testReset().then(() => {
    console.log('✅ Teste concluído!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  });
}
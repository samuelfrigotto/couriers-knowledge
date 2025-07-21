// couriers-knowledge-backend/src/jobs/resetApiLimits.js
// Job para resetar os contadores de API diariamente

const cron = require('node-cron');
const db = require('../config/database');

class ApiLimitsResetJob {
  constructor() {
    this.isRunning = false;
  }

  // Função principal que executa o reset
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

      // Query para resetar contadores de usuários que não fizeram chamadas hoje
      const resetQuery = `
        UPDATE users 
        SET 
          api_calls_today = 0,
          last_api_call_date = CURRENT_DATE
        WHERE 
          last_api_call_date < CURRENT_DATE 
          OR last_api_call_date IS NULL
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
          console.log(`   - ${user.steam_username} (ID: ${user.id})`);
        });
        
        if (result.rowCount > 5) {
          console.log(`   ... e mais ${result.rowCount - 5} usuários`);
        }
      }

      // Estatísticas adicionais
      await this.logStatistics();

    } catch (error) {
      console.error('❌ [CRON] Erro ao resetar contadores de API:', error);
      console.error('📋 Stack trace:', error.stack);
    } finally {
      this.isRunning = false;
    }
  }

  // Função para logar estatísticas do sistema
  async logStatistics() {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN account_status = 'Premium' THEN 1 END) as premium_users,
          COUNT(CASE WHEN account_status = 'Free' THEN 1 END) as free_users,
          COUNT(CASE WHEN api_calls_today > 0 THEN 1 END) as users_with_calls_today
        FROM users;
      `;

      const { rows } = await db.query(statsQuery);
      const stats = rows[0];

      console.log(`📈 [STATS] Estatísticas do sistema:`);
      console.log(`   👥 Total de usuários: ${stats.total_users}`);
      console.log(`   💎 Usuários Premium: ${stats.premium_users}`);
      console.log(`   🆓 Usuários Free: ${stats.free_users}`);
      console.log(`   📞 Usuários com chamadas hoje: ${stats.users_with_calls_today}`);

    } catch (error) {
      console.error('❌ [CRON] Erro ao buscar estatísticas:', error);
    }
  }

  // Função para testar o reset manualmente
  async testReset() {
    console.log('🧪 [TEST] Executando reset manual para teste...');
    await this.resetApiLimits();
  }

  // Inicia o cron job
  start() {
    console.log('🚀 [CRON] Iniciando agendador de reset de API...');
    
    // Executa todo dia à meia-noite (00:00)
    // Formato: segundo minuto hora dia mês dia-da-semana
    const cronExpression = '0 0 * * *';
    
    cron.schedule(cronExpression, () => {
      this.resetApiLimits();
    }, {
      scheduled: true,
      timezone: "America/Sao_Paulo" // Fuso horário brasileiro
    });

    console.log('✅ [CRON] Job agendado para executar diariamente à meia-noite (GMT-3)');
    console.log('📋 [CRON] Expressão cron:', cronExpression);
    
    // Executa um reset inicial na inicialização (opcional)
    console.log('🔄 [CRON] Executando reset inicial...');
    setTimeout(() => {
      this.resetApiLimits();
    }, 2000); // Aguarda 2 segundos para o servidor estar totalmente inicializado
  }

  // Para o cron job (para testes ou shutdown)
  stop() {
    console.log('🛑 [CRON] Parando agendador de reset de API...');
    cron.destroy();
  }

  // Função para verificar status do job
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextExecution: '00:00 (próximo dia)',
      timezone: 'America/Sao_Paulo'
    };
  }
}

// Criar instância do job
const apiLimitsResetJob = new ApiLimitsResetJob();

// Exportar para uso no servidor
module.exports = apiLimitsResetJob;

// Se executado diretamente (para testes)
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
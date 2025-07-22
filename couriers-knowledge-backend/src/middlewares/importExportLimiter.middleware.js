// CRIE/SUBSTITUA o arquivo: couriers-knowledge-backend/src/middlewares/importExportLimiter.middleware.js

const db = require('../config/database');

// Limites configuráveis
const LIMITS = {
  FREE: {
    DAILY: 3,     // 1 por dia
    MONTHLY: 30   // 10 por mês
  },
  PREMIUM: {
    DAILY: null,  // Sem limite diário
    MONTHLY: 300  // 100 por mês
  }
};

const exportLimiter = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Buscar status atualizado do usuário diretamente do banco
    const userQuery = `SELECT account_status, premium_expires_at FROM users WHERE id = $1`;
    const userResult = await db.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    
    const user = userResult.rows[0];
    const userStatus = user.account_status || 'Free';
    
    // Verificar se Premium ainda está válido
    const isPremiumValid = userStatus === 'Premium' && 
      (!user.premium_expires_at || new Date(user.premium_expires_at) > new Date());
    
    const effectiveStatus = isPremiumValid ? 'Premium' : 'Free';
    
    console.log('=== EXPORT LIMITER DEBUG ===');
    console.log('User ID:', userId);
    console.log('Account Status DB:', userStatus);
    console.log('Premium Expires:', user.premium_expires_at);
    console.log('Is Premium Valid:', isPremiumValid);
    console.log('Effective Status:', effectiveStatus);
    
    // Verificar limites
    const canExport = await checkLimits(userId, effectiveStatus, 'export');
    
    if (!canExport.allowed) {
      return res.status(429).json({
        message: canExport.message,
        limits: canExport.limits,
        current: canExport.current,
        userStatus: effectiveStatus
      });
    }
    
    // Adicionar status ao req para uso no controller
    req.user.effective_status = effectiveStatus;
    
    next();
  } catch (error) {
    console.error('Erro no exportLimiter:', error);
    // Em caso de erro, permite a operação para não bloquear o usuário
    next();
  }
};

/**
 * Middleware para verificar limites de importação
 */
const importLimiter = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Buscar status atualizado do usuário diretamente do banco
    const userQuery = `SELECT account_status, premium_expires_at FROM users WHERE id = $1`;
    const userResult = await db.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    
    const user = userResult.rows[0];
    const userStatus = user.account_status || 'Free';
    
    // Verificar se Premium ainda está válido
    const isPremiumValid = userStatus === 'Premium' && 
      (!user.premium_expires_at || new Date(user.premium_expires_at) > new Date());
    
    const effectiveStatus = isPremiumValid ? 'Premium' : 'Free';
    
    console.log('=== IMPORT LIMITER DEBUG ===');
    console.log('User ID:', userId);
    console.log('Account Status DB:', userStatus);
    console.log('Premium Expires:', user.premium_expires_at);
    console.log('Is Premium Valid:', isPremiumValid);
    console.log('Effective Status:', effectiveStatus);
    
    // Verificar limites
    const canImport = await checkLimits(userId, effectiveStatus, 'import');
    
    if (!canImport.allowed) {
      return res.status(429).json({
        message: canImport.message,
        limits: canImport.limits,
        current: canImport.current,
        userStatus: effectiveStatus
      });
    }
    
    // Adicionar status ao req para uso no controller
    req.user.effective_status = effectiveStatus;
    
    next();
  } catch (error) {
    console.error('Erro no importLimiter:', error);
    // Em caso de erro, permite a operação para não bloquear o usuário
    next();
  }
};

/**
 * Função para verificar limites de uso
 */
async function checkLimits(userId, userStatus, operation) {
  const isPremium = userStatus === 'Premium';
  const limits = isPremium ? LIMITS.PREMIUM : LIMITS.FREE;
  
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  
  // Buscar uso atual
  const usageQuery = `
    SELECT 
      COUNT(*) FILTER (WHERE DATE(created_at) = $1) as daily_count,
      COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) as monthly_count
    FROM import_export_logs 
    WHERE user_id = $2 AND operation_type = $3
  `;
  
  const usageResult = await db.query(usageQuery, [today, userId, operation]);
  const usage = usageResult.rows[0];
  
  const dailyCount = parseInt(usage.daily_count) || 0;
  const monthlyCount = parseInt(usage.monthly_count) || 0;
  
  // Verificar limite diário (apenas para usuários Free)
  if (!isPremium && limits.DAILY && dailyCount >= limits.DAILY) {
    return {
      allowed: false,
      message: `Limite diário de ${limits.DAILY} ${operation}(ões) atingido. Upgrade para Premium para mais operações!`,
      limits: {
        daily: limits.DAILY,
        monthly: limits.MONTHLY
      },
      current: {
        daily: dailyCount,
        monthly: monthlyCount
      }
    };
  }
  
  // Verificar limite mensal
  if (limits.MONTHLY && monthlyCount >= limits.MONTHLY) {
    const limitType = isPremium ? 'Premium' : 'gratuito';
    return {
      allowed: false,
      message: `Limite mensal do plano ${limitType} (${limits.MONTHLY} ${operation}(ões)) atingido.`,
      limits: {
        daily: limits.DAILY,
        monthly: limits.MONTHLY
      },
      current: {
        daily: dailyCount,
        monthly: monthlyCount
      }
    };
  }
  
  return {
    allowed: true,
    limits: {
      daily: limits.DAILY,
      monthly: limits.MONTHLY
    },
    current: {
      daily: dailyCount,
      monthly: monthlyCount
    }
  };
}

/**
 * Função para registrar uma operação de import/export
 */
async function logOperation(userId, operationType, details = {}) {
  try {
    const insertQuery = `
      INSERT INTO import_export_logs (user_id, operation_type, details, created_at)
      VALUES ($1, $2, $3, NOW())
    `;
    
    await db.query(insertQuery, [
      userId,
      operationType,
      JSON.stringify(details)
    ]);
  } catch (error) {
    console.error('Erro ao registrar operação:', error);
    // Não falha a operação principal se o log falhar
  }
}

/**
 * Função para obter estatísticas de uso do usuário
 */
async function getUserUsageStats(userId) {
  try {
    const statsQuery = `
      SELECT 
        operation_type,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as daily_count,
        COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) as monthly_count,
        COUNT(*) as total_count
      FROM import_export_logs 
      WHERE user_id = $1
      GROUP BY operation_type
    `;
    
    const result = await db.query(statsQuery, [userId]);
    
    const stats = {
      export: { daily: 0, monthly: 0, total: 0 },
      import: { daily: 0, monthly: 0, total: 0 }
    };
    
    result.rows.forEach(row => {
      stats[row.operation_type] = {
        daily: parseInt(row.daily_count) || 0,
        monthly: parseInt(row.monthly_count) || 0,
        total: parseInt(row.total_count) || 0
      };
    });
    
    return stats;
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return {
      export: { daily: 0, monthly: 0, total: 0 },
      import: { daily: 0, monthly: 0, total: 0 }
    };
  }
}

module.exports = {
  exportLimiter,
  importLimiter,
  logOperation,
  getUserUsageStats,
  LIMITS
};
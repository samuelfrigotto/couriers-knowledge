// couriers-knowledge-backend/src/middlewares/rateLimiter.middleware.js
const db = require("../config/database");

async function rateLimiter(req, res, next) {
  const userId = req.user.id; // Obtido do middleware de autenticação
  // ✅ ADMIN BYPASS - SE USER ID = 1, PULAR RATE LIMITING
  if (userId === 1 || userId === '1') {
    console.log('🛡️ [RATE LIMITER] Admin detectado - pulando rate limit');
    req.user.api_calls_today = 0;
    req.user.api_limit = 999999;
    req.user.account_status = 'Admin';
    return next();
  }

  try {
    // ✅ BUSCAR TAMBÉM O account_status do usuário
    const { rows } = await db.query(
      "SELECT created_at, api_calls_today, last_api_call_date, account_status FROM users WHERE id = $1",
      [userId]
    );
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const today = new Date().toISOString().slice(0, 10); // Formato YYYY-MM-DD
    const userCreationDate = new Date(user.created_at);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // --- Lógica de Reset Diário ---
    // Se a última chamada foi antes de hoje, reseta o contador.
    if (
      user.last_api_call_date &&
      user.last_api_call_date.toISOString().slice(0, 10) < today
    ) {
      user.api_calls_today = 0;
    }

    // ✅ LÓGICA: Define o Limite baseado no status da conta (apenas para não-admins)
    const accountStatus = user.account_status || 'Free';
    const isNewUser = userCreationDate > threeDaysAgo;
    
    let limit;
    
    if (accountStatus === 'Premium') {
      // ✅ USUÁRIOS PREMIUM: 120 chamadas por dia (30 usos × 4 chamadas)
      limit = 120;
      console.log('💎 [RATE LIMITER] Usuário Premium - 120 chamadas/dia');
    } else if (isNewUser) {
      // Usuários gratuitos novos (primeiros 3 dias): 12 chamadas (3 usos × 4)
      limit = 12;
      console.log('🆕 [RATE LIMITER] Usuário novo - 12 chamadas/dia');
    } else {
      // Usuários gratuitos normais: 20 chamadas (5 usos × 4)
      limit = 20;
      console.log('🆓 [RATE LIMITER] Usuário free - 20 chamadas/dia');
    }

    // --- Verifica o Limite ---
    if (user.api_calls_today >= limit) {
      console.log(`🚫 [RATE LIMITER] Limite atingido - User ${userId}: ${user.api_calls_today}/${limit} chamadas`);
      return res.status(429).json({
        error: "Daily API call limit reached. Please try again tomorrow.",
        details: {
          currentCalls: user.api_calls_today,
          limit: limit,
          accountStatus: accountStatus,
          isNewUser: isNewUser,
          upgradeMessage: accountStatus === 'Free' ? 
            "Upgrade para Premium e tenha 30 usos por dia!" : null
        }
      });
    }

    // Se passar, anexa o contador atual ao request para uso posterior
    req.user.api_calls_today = user.api_calls_today;
    req.user.api_limit = limit;
    req.user.account_status = accountStatus;
    
    console.log(`✅ [RATE LIMITER] Chamada autorizada - User ${userId}: ${user.api_calls_today}/${limit} chamadas`);
    next();
  } catch (error) {
    console.error("Rate limiter error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = rateLimiter;
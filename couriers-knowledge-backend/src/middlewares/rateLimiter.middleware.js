// /src/middlewares/rateLimiter.middleware.js

const db = require("../config/database");

async function rateLimiter(req, res, next) {
  const userId = req.user.id; // Obtido do middleware de autenticação

  try {
    const { rows } = await db.query(
      "SELECT created_at, api_calls_today, last_api_call_date FROM users WHERE id = $1",
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

    // --- Define o Limite do Usuário ---
    const isNewUser = userCreationDate > threeDaysAgo;
    const limit = isNewUser ? 12 : 20;

    // --- Verifica o Limite ---
    if (user.api_calls_today >= limit) {
      return res
        .status(429)
        .json({
          error: "Daily API call limit reached. Please try again tomorrow.",
        });
    }

    // Se passar, anexa o contador atual ao request para uso posterior
    req.user.api_calls_today = user.api_calls_today;
    next();
  } catch (error) {
    console.error("Rate limiter error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = rateLimiter;

const rateLimiter = require('express-rate-limit');
const slowDown = require('express-slow-down');

// Rate limiter para exportações (máximo 10 por hora por usuário)
const exportLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // máximo 10 exportações por hora
  message: {
    error: 'Muitas tentativas de exportação. Tente novamente em 1 hora.'
  },
  keyGenerator: (req) => req.user?.id || req.ip,
  skip: (req) => req.user?.account_status === 'Premium' // Sem limite para Premium
});

// Rate limiter para importações (máximo 5 por hora por usuário)
const importLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // máximo 5 importações por hora
  message: {
    error: 'Muitas tentativas de importação. Tente novamente em 1 hora.'
  },
  keyGenerator: (req) => req.user?.id || req.ip,
  skip: (req) => req.user?.account_status === 'Premium'
});

// Slow down para importações grandes
const importSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutos
  delayAfter: 2, // depois de 2 requests
  delayMs: 500, // delay de 500ms
  maxDelayMs: 5000, // máximo 5s de delay
  keyGenerator: (req) => req.user?.id || req.ip,
  skip: (req) => req.user?.account_status === 'Premium'
});

module.exports = {
  exportLimiter,
  importLimiter,
  importSlowDown
};
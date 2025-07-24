const jwt = require('jsonwebtoken');
const db = require('../config/database');

/**
 * Middleware para verificar se usuário é admin (ID = 1)
 */
const requireAdmin = async (req, res, next) => {
  try {
    // Primeiro verificar se está autenticado
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuário no banco
    const { rows } = await db.query(
      'SELECT id, steam_id, steam_username FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    const user = rows[0];

    // Verificar se é admin (ID = 1)
    if (user.id !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas administradores podem acessar esta funcionalidade.',
        requiredRole: 'admin',
        userRole: 'user'
      });
    }

    // Adicionar usuário ao request
    req.user = user;
    req.user.is_admin = true;
    
    console.log(`🛡️ Admin acesso autorizado: ${user.steam_username} (ID: ${user.id})`);
    next();

  } catch (error) {
    console.error('Erro na verificação admin:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = { requireAdmin };

// couriers-knowledge-backend/src/services/premium.service.js

const db = require('../config/database');

class PremiumService {
  
  // Ativar Premium do usuário
  async activatePremium(userId, subscriptionData) {
    try {
      const { 
        stripe_customer_id, 
        stripe_subscription_id, 
        expires_at, 
        subscription_status = 'active' 
      } = subscriptionData;

      const query = `
        UPDATE users 
        SET 
          account_status = 'Premium',
          premium_expires_at = $1,
          stripe_customer_id = $2,
          stripe_subscription_id = $3,
          subscription_status = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *;
      `;

      const result = await db.query(query, [
        expires_at,
        stripe_customer_id,
        stripe_subscription_id,
        subscription_status,
        userId
      ]);

      if (result.rows.length === 0) {
        throw new Error(`Usuário com ID ${userId} não encontrado`);
      }

      console.log(`✅ Premium ativado para usuário ${userId} até ${expires_at}`);
      return result.rows[0];

    } catch (error) {
      console.error('❌ Erro ao ativar premium:', error);
      throw error;
    }
  }

  // Desativar Premium do usuário
  async deactivatePremium(userId, reason = 'subscription_cancelled') {
    try {
      const query = `
        UPDATE users 
        SET 
          account_status = 'Free',
          subscription_status = 'cancelled',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *;
      `;

      const result = await db.query(query, [userId]);

      if (result.rows.length === 0) {
        throw new Error(`Usuário com ID ${userId} não encontrado`);
      }

      console.log(`❌ Premium desativado para usuário ${userId}. Motivo: ${reason}`);
      return result.rows[0];

    } catch (error) {
      console.error('❌ Erro ao desativar premium:', error);
      throw error;
    }
  }

  // Buscar usuário por Customer ID do Stripe
  async getUserByStripeCustomerId(stripeCustomerId) {
    try {
      const query = 'SELECT * FROM users WHERE stripe_customer_id = $1';
      const result = await db.query(query, [stripeCustomerId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Erro ao buscar usuário por customer ID:', error);
      throw error;
    }
  }

  // Buscar usuário por email
  async getUserByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await db.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Erro ao buscar usuário por email:', error);
      throw error;
    }
  }

  // Calcular data de expiração baseada no período da assinatura
  calculateExpirationDate(intervalUnit, intervalCount = 1) {
    const now = new Date();
    
    switch (intervalUnit) {
      case 'month':
        return new Date(now.setMonth(now.getMonth() + intervalCount));
      case 'year':
        return new Date(now.setFullYear(now.getFullYear() + intervalCount));
      default:
        // Default: 1 mês
        return new Date(now.setMonth(now.getMonth() + 1));
    }
  }

  // Verificar se usuário ainda é Premium (baseado na data)
  async checkPremiumStatus(userId) {
    try {
      const query = `
        SELECT 
          account_status,
          premium_expires_at,
          subscription_status
        FROM users 
        WHERE id = $1
      `;
      
      const result = await db.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return { isPremium: false, reason: 'user_not_found' };
      }

      const user = result.rows[0];
      const now = new Date();
      
      // Se não tem data de expiração, não é Premium
      if (!user.premium_expires_at) {
        return { isPremium: false, reason: 'no_expiration_date' };
      }

      // Se a data de expiração já passou
      if (new Date(user.premium_expires_at) < now) {
        // Atualizar status para Free automaticamente
        await this.deactivatePremium(userId, 'expired');
        return { isPremium: false, reason: 'expired' };
      }

      // Se status da assinatura não está ativo
      if (user.subscription_status !== 'active') {
        return { isPremium: false, reason: 'subscription_inactive' };
      }

      return { 
        isPremium: true, 
        expiresAt: user.premium_expires_at,
        status: user.subscription_status
      };

    } catch (error) {
      console.error('❌ Erro ao verificar status premium:', error);
      throw error;
    }
  }
}

module.exports = new PremiumService();
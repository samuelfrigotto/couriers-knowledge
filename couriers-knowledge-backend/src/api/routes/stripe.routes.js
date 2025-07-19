// couriers-knowledge-backend/src/api/routes/stripe.routes.js

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const authMiddleware = require('../../middlewares/auth.middleware');
const premiumService = require('../../services/premium.service');
const db = require('../../config/database'); // ← ADICIONAR ESTA LINHA

// 1. Endpoint para buscar planos disponíveis (público)
router.get('/plans', async (req, res) => {
  try {
    const plans = [
      {
        id: 'monthly',
        name: 'Premium Mensal',
        price_id: process.env.STRIPE_PRICE_MONTHLY,
        amount: 2490, // em centavos
        display_amount: 'R$ 24,90',
        currency: 'brl',
        interval: 'month',
        description: 'Cobrado mensalmente'
      },
      {
        id: 'semiannual',
        name: 'Premium Semestral',
        price_id: process.env.STRIPE_PRICE_SEMIANNUAL,
        amount: 11940, // em centavos (total 6 meses)
        display_amount: 'R$ 119,40',
        monthly_equivalent: 'R$ 19,90/mês',
        currency: 'brl',
        interval: 'every 6 months',
        description: 'Cobrado a cada 6 meses (R$ 19,90/mês)',
        popular: true
      },
      {
        id: 'annual',
        name: 'Premium Anual',
        price_id: process.env.STRIPE_PRICE_ANNUAL,
        amount: 17880, // em centavos (total 12 meses)
        display_amount: 'R$ 178,80',
        monthly_equivalent: 'R$ 14,90/mês',
        currency: 'brl',
        interval: 'yearly',
        description: 'Cobrado anualmente (R$ 14,90/mês)'
      }
    ];
    
    res.json({ success: true, plans });
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar planos' });
  }
});

// 2. Endpoint para criar uma sessão de checkout
router.post('/create-checkout-session', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { priceId } = req.body;
    
    // Validar se o priceId é um dos nossos planos
    const validPrices = [
      process.env.STRIPE_PRICE_MONTHLY,
      process.env.STRIPE_PRICE_SEMIANNUAL,
      process.env.STRIPE_PRICE_ANNUAL
    ];
    
    if (!validPrices.includes(priceId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Price ID inválido' 
      });
    }

    // Buscar ou criar customer
    let customer;
    try {
      // Primeiro, tenta buscar customer existente pelo email
      const existingCustomers = await stripe.customers.list({
        email: req.user.email,
        limit: 1
      });
      
      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
        console.log('Customer existente encontrado:', customer.id);
      } else {
        // Criar novo customer
        customer = await stripe.customers.create({
          email: req.user.email,
          name: req.user.steamUsername || 'Usuário Premium',
          metadata: {
            user_id: req.user.id.toString(),
            steam_id: req.user.steamId || '',
            created_at: new Date().toISOString()
          }
        });
        console.log('Novo customer criado:', customer.id);
      }
    } catch (error) {
      console.error('Erro ao gerenciar customer:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao processar dados do cliente' 
      });
    }

    // Verificar se já tem assinatura ativa
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1
    });

    if (existingSubscriptions.data.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Usuário já possui uma assinatura ativa'
      });
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card', 'boleto'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/app/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/app/get-premium?canceled=true`,
      metadata: {
        user_id: req.user.id.toString(),
        price_id: priceId,
        user_email: req.user.email
      },
      subscription_data: {
        metadata: {
          user_id: req.user.id.toString(),
          user_email: req.user.email
        }
      }
    });

    console.log('Checkout session criada:', session.id, 'para usuário:', req.user.id);

    res.json({ 
      success: true,
      checkout_url: session.url,
      session_id: session.id 
    });

  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 3. Endpoint para verificar status de uma sessão
router.get('/session/:sessionId', authMiddleware.verifyToken, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    
    res.json({
      success: true,
      status: session.payment_status,
      customer_email: session.customer_details?.email,
      amount_total: session.amount_total,
      subscription_id: session.subscription
    });
  } catch (error) {
    console.error('Erro ao buscar sessão:', error);
    res.status(404).json({ 
      success: false, 
      error: 'Sessão não encontrada' 
    });
  }
});

// 4. Endpoint para buscar status da assinatura do usuário
router.get('/subscription-status', authMiddleware.verifyToken, async (req, res) => {
  try {
    // Buscar customer pelo email
    const customers = await stripe.customers.list({
      email: req.user.email,
      limit: 1
    });

    if (customers.data.length === 0) {
      return res.json({
        success: true,
        has_subscription: false,
        status: 'no_customer'
      });
    }

    // Buscar assinaturas ativas
    const subscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      return res.json({
        success: true,
        has_subscription: false,
        status: 'no_active_subscription'
      });
    }

    const subscription = subscriptions.data[0];
    res.json({
      success: true,
      has_subscription: true,
      status: subscription.status,
      subscription_id: subscription.id,
      current_period_end: subscription.current_period_end,
      price_id: subscription.items.data[0].price.id
    });

  } catch (error) {
    console.error('Erro ao verificar assinatura:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao verificar status da assinatura' 
    });
  }
});


// Webhook FINAL - Versão limpa e completa
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('✅ Webhook verificado:', event.type);
  } catch (err) {
    console.error('❌ Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('🎉 Checkout completado:', session.id);
        
        const userId = session.metadata?.user_id;
        if (!userId) {
          console.error('❌ User ID não encontrado no metadata');
          break;
        }

        // Buscar dados da subscription para pegar a data de expiração
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          
          // Converter timestamp do Stripe para Date
          const expirationDate = new Date(subscription.current_period_end * 1000);
          
          console.log(`👤 Ativando Premium para usuário ${userId} até ${expirationDate}`);

          const updateQuery = `
            UPDATE users 
            SET 
              account_status = 'Premium',
              premium_expires_at = $1,
              stripe_customer_id = $2,
              stripe_subscription_id = $3,
              subscription_status = 'active',
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING *;
          `;

          const result = await db.query(updateQuery, [
            expirationDate,
            session.customer,
            session.subscription,
            userId
          ]);

          if (result.rows.length > 0) {
            console.log('✅ Premium ativado com sucesso!');
            console.log(`📅 Expira em: ${expirationDate}`);
          } else {
            console.error(`❌ Usuário ${userId} não encontrado`);
          }
        }
        break;
        
      case 'customer.subscription.updated':
        const updatedSub = event.data.object;
        console.log('🔄 Assinatura atualizada:', updatedSub.id);
        
        // Atualizar status e data de expiração
        const newExpirationDate = new Date(updatedSub.current_period_end * 1000);
        
        const updateSubQuery = `
          UPDATE users 
          SET 
            subscription_status = $1,
            premium_expires_at = $2,
            updated_at = CURRENT_TIMESTAMP
          WHERE stripe_subscription_id = $3
          RETURNING *;
        `;

        const updateResult = await db.query(updateSubQuery, [
          updatedSub.status,
          newExpirationDate,
          updatedSub.id
        ]);

        if (updateResult.rows.length > 0) {
          console.log(`✅ Assinatura atualizada: ${updatedSub.status}`);
          console.log(`📅 Nova data de expiração: ${newExpirationDate}`);
        }
        break;
        
      case 'customer.subscription.deleted':
        const deletedSub = event.data.object;
        console.log('❌ Assinatura cancelada:', deletedSub.id);
        
        const cancelQuery = `
          UPDATE users 
          SET 
            account_status = 'Free',
            subscription_status = 'cancelled',
            updated_at = CURRENT_TIMESTAMP
          WHERE stripe_subscription_id = $1
          RETURNING *;
        `;

        const cancelResult = await db.query(cancelQuery, [deletedSub.id]);
        
        if (cancelResult.rows.length > 0) {
          console.log('✅ Premium cancelado, usuário voltou para Free');
        }
        break;
        
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        console.log('💳 Pagamento falhou:', failedInvoice.id);
        
        // Marcar como past_due mas não cancelar imediatamente
        const failQuery = `
          UPDATE users 
          SET 
            subscription_status = 'past_due',
            updated_at = CURRENT_TIMESTAMP
          WHERE stripe_customer_id = $1
          RETURNING *;
        `;

        await db.query(failQuery, [failedInvoice.customer]);
        console.log('⚠️ Usuário marcado como past_due');
        break;
        
      default:
        console.log(`📋 Evento não processado: ${event.type}`);
    }
    
    res.json({ received: true, event_type: event.type });
    
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});


module.exports = router;
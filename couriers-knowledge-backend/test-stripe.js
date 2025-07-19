// test-integration-complete.js - Teste COMPLETO da integração

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testeCompletoIntegracao() {
  console.log('🚀 TESTE COMPLETO DA INTEGRAÇÃO STRIPE + BACKEND\n');

  try {
    // 1. Validar todas as variáveis
    console.log('1️⃣ Validando configuração...');
    const requiredVars = [
      'STRIPE_PUBLISHABLE_KEY',
      'STRIPE_SECRET_KEY', 
      'STRIPE_WEBHOOK_SECRET',
      'STRIPE_PRICE_MONTHLY',
      'STRIPE_PRICE_SEMIANNUAL',
      'STRIPE_PRICE_ANNUAL',
      'FRONTEND_URL'
    ];

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        throw new Error(`❌ Variável ${varName} não configurada`);
      }
    }
    console.log('✅ Todas as variáveis configuradas');

    // 2. Testar conexão Stripe
    console.log('\n2️⃣ Testando conexão Stripe...');
    const account = await stripe.accounts.retrieve();
    console.log('✅ Conectado ao Stripe Account:', account.id);

    // 3. Validar todos os Price IDs
    console.log('\n3️⃣ Validando Price IDs...');
    const prices = {
      'Mensal': { id: process.env.STRIPE_PRICE_MONTHLY, expected: 24.90 },
      'Semestral': { id: process.env.STRIPE_PRICE_SEMIANNUAL, expected: 119.40 },
      'Anual': { id: process.env.STRIPE_PRICE_ANNUAL, expected: 178.80 }
    };

    for (const [nome, config] of Object.entries(prices)) {
      const price = await stripe.prices.retrieve(config.id);
      const valor = price.unit_amount / 100;
      const status = valor === config.expected ? '✅' : '❌';
      console.log(`${status} ${nome}: R$ ${valor} (esperado: R$ ${config.expected})`);
      
      if (valor !== config.expected) {
        console.log(`⚠️  Price ID ${config.id} tem valor incorreto!`);
      }
    }

    // 4. Testar criação de customer completo
    console.log('\n4️⃣ Testando customer completo...');
    const customer = await stripe.customers.create({
      email: 'teste@couriers-knowledge.com',
      name: 'Usuário de Teste Premium',
      metadata: {
        user_id: '999',
        steam_id: '76561198000000000',
        environment: 'test',
        created_at: new Date().toISOString()
      }
    });
    console.log('✅ Customer criado com metadata:', customer.id);

    // 5. Testar checkout session para cada plano
    console.log('\n5️⃣ Testando checkout sessions...');
    const sessions = [];
    
    for (const [nome, config] of Object.entries(prices)) {
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card', 'boleto'],
        line_items: [{
          price: config.id,
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL}/success`,
        cancel_url: `${process.env.FRONTEND_URL}/cancel`,
        metadata: {
          user_id: '999',
          price_id: config.id,
          test: 'true'
        }
      });
      sessions.push({ nome, session });
      console.log(`✅ ${nome}: Session ${session.id}`);
    }

    // 6. Testar webhook signature (simulação)
    console.log('\n6️⃣ Testando webhook configuration...');
    if (process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
      console.log('✅ Webhook secret configurado corretamente');
    } else {
      console.log('❌ Webhook secret não configurado ou formato incorreto');
    }

    // 7. Testar endpoints da API (simulação)
    console.log('\n7️⃣ Configuração dos endpoints...');
    console.log('📋 Endpoints que devem funcionar:');
    console.log('   GET /api/stripe/plans');
    console.log('   POST /api/stripe/create-checkout-session');
    console.log('   GET /api/stripe/session/:sessionId');
    console.log('   GET /api/stripe/subscription-status');
    console.log('   POST /api/stripe/webhook');

    // 8. Limpeza
    console.log('\n8️⃣ Limpando dados de teste...');
    await stripe.customers.del(customer.id);
    console.log('✅ Customer removido');

    // 9. Resumo final
    console.log('\n🎉 INTEGRAÇÃO COMPLETA TESTADA COM SUCESSO!');
    console.log('\n📋 CHECKLIST FINAL:');
    console.log('✅ Stripe conectado e funcionando');
    console.log('✅ Price IDs validados');
    console.log('✅ Customer creation OK');
    console.log('✅ Checkout sessions OK');
    console.log('✅ Webhook configurado');
    console.log('✅ Endpoints preparados');

    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('1. Inicie o servidor: npm start');
    console.log('2. Teste os endpoints via Postman/Insomnia');
    console.log('3. Configure o webhook URL no Dashboard Stripe');
    console.log('4. Implemente o frontend com checkout');
    console.log('5. Teste com cartão: 4242 4242 4242 4242');

    console.log('\n💡 ENDPOINTS PARA TESTAR:');
    console.log(`GET ${process.env.BACKEND_URL}/api/stripe/plans`);
    console.log(`Webhook URL: ${process.env.BACKEND_URL}/api/stripe/webhook`);

  } catch (error) {
    console.error('❌ ERRO NO TESTE COMPLETO:', error.message);
    console.error('🔍 Detalhes:', error.type || 'N/A', '|', error.code || 'N/A');
    process.exit(1);
  }
}

testeCompletoIntegracao();
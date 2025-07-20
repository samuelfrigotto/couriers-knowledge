require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function debugWebhookConfiguration() {
  console.log('🔍 DIAGNÓSTICO DO WEBHOOK\n');

  try {
    // 1. Verificar configuração do ambiente
    console.log('1️⃣ Verificando configuração...');
    console.log(`✅ STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? 'Configurado' : '❌ FALTANDO'}`);
    console.log(`✅ STRIPE_WEBHOOK_SECRET: ${process.env.STRIPE_WEBHOOK_SECRET ? 'Configurado' : '❌ FALTANDO'}`);
    console.log(`✅ BACKEND_URL: ${process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:3001'}`);

    // 2. Listar webhooks configurados no Stripe
    console.log('\n2️⃣ Webhooks configurados no Stripe:');
    const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });
    
    if (webhooks.data.length === 0) {
      console.log('❌ NENHUM WEBHOOK CONFIGURADO!');
      console.log('📋 Você precisa configurar um webhook no Dashboard do Stripe');
      console.log(`📍 URL do webhook: ${process.env.BACKEND_URL || 'http://localhost:3001'}/api/stripe/webhook`);
    } else {
      webhooks.data.forEach((webhook, index) => {
        console.log(`\n📍 Webhook ${index + 1}:`);
        console.log(`   URL: ${webhook.url}`);
        console.log(`   Status: ${webhook.status}`);
        console.log(`   Eventos: ${webhook.enabled_events.join(', ')}`);
      });
    }

    // 3. Verificar customer e subscription do usuário
    console.log('\n3️⃣ Verificando customer do usuário...');
    
    // Buscar por customers com metadata que contenha user_id = 1
    const customers = await stripe.customers.list({
      limit: 100
    });
    
    const userCustomers = customers.data.filter(customer => 
      customer.metadata && customer.metadata.user_id === '1'
    );
    
    if (userCustomers.length === 0) {
      console.log('❌ Nenhum customer encontrado para user_id = 1');
    } else {
      for (const customer of userCustomers) {
        console.log(`\n👤 Customer encontrado: ${customer.id}`);
        console.log(`   Email: ${customer.email || 'N/A'}`);
        console.log(`   Metadata: ${JSON.stringify(customer.metadata)}`);
        
        // Verificar assinaturas deste customer
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          limit: 10
        });
        
        console.log(`\n📋 Assinaturas (${subscriptions.data.length}):`);
        subscriptions.data.forEach((sub, idx) => {
          console.log(`   ${idx + 1}. ${sub.id} - Status: ${sub.status}`);
          console.log(`      Criada: ${new Date(sub.created * 1000).toLocaleString()}`);
          if (sub.current_period_end) {
            console.log(`      Expira: ${new Date(sub.current_period_end * 1000).toLocaleString()}`);
          }
        });
      }
    }

    // 4. Verificar eventos recentes do webhook
    console.log('\n4️⃣ Eventos recentes do Stripe:');
    const events = await stripe.events.list({
      limit: 10,
      types: [
        'checkout.session.completed',
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted'
      ]
    });

    if (events.data.length === 0) {
      console.log('ℹ️ Nenhum evento relacionado a assinaturas encontrado');
    } else {
      events.data.forEach((event, idx) => {
        console.log(`\n📅 Evento ${idx + 1}: ${event.type}`);
        console.log(`   ID: ${event.id}`);
        console.log(`   Criado: ${new Date(event.created * 1000).toLocaleString()}`);
        
        if (event.data.object.metadata) {
          console.log(`   Metadata: ${JSON.stringify(event.data.object.metadata)}`);
        }
      });
    }

    // 5. Gerar recomendações
    console.log('\n🎯 RECOMENDAÇÕES:');
    
    if (webhooks.data.length === 0) {
      console.log('1. Configure um webhook no Dashboard do Stripe');
      console.log('2. Use a URL: https://SEU_DOMINIO/api/stripe/webhook');
      console.log('3. Eventos necessários:');
      console.log('   - checkout.session.completed');
      console.log('   - customer.subscription.updated');
      console.log('   - customer.subscription.deleted');
      console.log('   - invoice.payment_failed');
    }
    
    if (userCustomers.length === 0) {
      console.log('4. Limpe o usuário no banco e teste uma nova assinatura');
    }
    
    console.log('5. Teste uma nova assinatura após configurar tudo');
    console.log('6. Monitore os logs do servidor durante o teste');

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error.message);
  }
}

debugWebhookConfiguration();
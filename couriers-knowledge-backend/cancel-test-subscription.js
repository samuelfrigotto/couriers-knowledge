// cancel-test-subscription.js
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function cancelarAssinaturasTeste() {
  console.log('🔍 Buscando assinaturas ativas...');

  try {
    // Buscar customer pelo email do usuário ID 1
    const customers = await stripe.customers.list({
      email: 'teste@gmail.com', // ← COLOQUE SEU EMAIL AQUI
      limit: 10
    });

    if (customers.data.length === 0) {
      console.log('❌ Nenhum customer encontrado');
      return;
    }

    for (const customer of customers.data) {
      console.log(`👤 Customer encontrado: ${customer.id} (${customer.email})`);
      
      // Buscar assinaturas ativas deste customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 10
      });

      console.log(`📋 Assinaturas ativas: ${subscriptions.data.length}`);

      for (const subscription of subscriptions.data) {
        console.log(`\n🔄 Cancelando assinatura: ${subscription.id}`);
        console.log(`💰 Valor: ${subscription.items.data[0].price.unit_amount / 100}`);
        console.log(`📅 Criada em: ${new Date(subscription.created * 1000)}`);

        // Cancelar assinatura imediatamente
        const canceledSubscription = await stripe.subscriptions.cancel(subscription.id);
        
        console.log(`✅ Assinatura cancelada: ${canceledSubscription.status}`);
      }
    }

    console.log('\n🎉 Processo concluído! Agora você pode criar novas assinaturas.');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

// Também buscar por todas as assinaturas ativas (caso não encontre pelo email)
async function listarTodasAssinaturasAtivas() {
  console.log('\n🔍 Listando TODAS as assinaturas ativas...');
  
  try {
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 10
    });

    console.log(`📊 Total de assinaturas ativas: ${subscriptions.data.length}`);

    for (const subscription of subscriptions.data) {
      const customer = await stripe.customers.retrieve(subscription.customer);
      console.log(`\n📋 ID: ${subscription.id}`);
      console.log(`👤 Customer: ${customer.email || 'Sem email'} (${customer.id})`);
      console.log(`💰 Valor: ${subscription.items.data[0].price.unit_amount / 100}`);
      console.log(`📅 Status: ${subscription.status}`);
    }

  } catch (error) {
    console.error('❌ Erro ao listar:', error.message);
  }
}

async function executar() {
  await listarTodasAssinaturasAtivas();
  
  // Descomente a linha abaixo após verificar quais assinaturas existem
  await cancelarAssinaturasTeste();
}

executar();
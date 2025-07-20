// premium-test-manager.js - Gerenciador completo de Premium para testes

require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { Pool } = require("pg");

// Configuração do banco
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

class PremiumTestManager {
  constructor() {
    this.userId = 1; // ID do usuário para teste
    this.userEmail = "teste@gmail.com"; // Email do usuário
  }

  async showMenu() {
    console.log("\n🎮 GERENCIADOR DE PREMIUM PARA TESTES");
    console.log("=====================================");
    console.log("1. 📊 Ver status atual");
    console.log("2. ✅ Ativar Premium (simular)");
    console.log("3. ❌ Desativar Premium");
    console.log("4. 🗑️  Limpar todos os dados Premium");
    console.log("5. 📋 Listar assinaturas no Stripe");
    console.log("6. 🔄 Cancelar assinaturas no Stripe");
    console.log("7. 🧪 Simular webhook de ativação");
    console.log("0. 🚪 Sair");
    console.log("=====================================");
  }

  async getCurrentStatus() {
    try {
      const query = `
        SELECT 
          id, steam_username, account_status, premium_expires_at,
          stripe_customer_id, stripe_subscription_id, subscription_status
        FROM users WHERE id = $1
      `;
      const result = await pool.query(query, [this.userId]);

      if (result.rows.length === 0) {
        console.log("❌ Usuário não encontrado!");
        return null;
      }

      const user = result.rows[0];
      console.log("\n📊 STATUS ATUAL:");
      console.log("================");
      console.log(`👤 Usuário: ${user.steam_username} (ID: ${user.id})`);
      console.log(`🎯 Status: ${user.account_status || "Free"}`);
      console.log(
        `📅 Premium expira: ${
          user.premium_expires_at
            ? new Date(user.premium_expires_at).toLocaleString("pt-BR")
            : "N/A"
        }`
      );
      console.log(`🏪 Customer ID: ${user.stripe_customer_id || "N/A"}`);
      console.log(
        `📋 Subscription ID: ${user.stripe_subscription_id || "N/A"}`
      );
      console.log(
        `🔄 Status Subscription: ${user.subscription_status || "N/A"}`
      );

      return user;
    } catch (error) {
      console.error("❌ Erro ao buscar status:", error.message);
      return null;
    }
  }

  async activatePremium(durationMonths = 1) {
    try {
      console.log(`\n✅ Ativando Premium por ${durationMonths} mês(es)...`);

      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + durationMonths);

      const query = `
        UPDATE users 
        SET 
          account_status = 'Premium',
          premium_expires_at = $1,
          stripe_customer_id = 'test_customer_' || id,
          stripe_subscription_id = 'test_sub_' || id || '_' || extract(epoch from now()),
          subscription_status = 'active',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *;
      `;

      const result = await pool.query(query, [expirationDate, this.userId]);

      if (result.rows.length > 0) {
        console.log("✅ Premium ativado com sucesso!");
        console.log(`📅 Expira em: ${expirationDate.toLocaleString("pt-BR")}`);
        console.log(`🏪 Customer ID: ${result.rows[0].stripe_customer_id}`);
        console.log(
          `📋 Subscription ID: ${result.rows[0].stripe_subscription_id}`
        );
      } else {
        console.log("❌ Falha ao ativar Premium");
      }
    } catch (error) {
      console.error("❌ Erro ao ativar Premium:", error.message);
    }
  }

  async deactivatePremium() {
    try {
      console.log("\n❌ Desativando Premium...");

      const query = `
        UPDATE users 
        SET 
          account_status = 'Free',
          subscription_status = 'cancelled',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *;
      `;

      const result = await pool.query(query, [this.userId]);

      if (result.rows.length > 0) {
        console.log("✅ Premium desativado! Status = Free");
      } else {
        console.log("❌ Falha ao desativar Premium");
      }
    } catch (error) {
      console.error("❌ Erro ao desativar Premium:", error.message);
    }
  }

  async clearAllPremiumData() {
    try {
      console.log("\n🗑️ Limpando TODOS os dados Premium...");

      const query = `
        UPDATE users 
        SET 
          account_status = 'Free',
          premium_expires_at = NULL,
          stripe_customer_id = NULL,
          stripe_subscription_id = NULL,
          subscription_status = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *;
      `;

      const result = await pool.query(query, [this.userId]);

      if (result.rows.length > 0) {
        console.log("✅ Todos os dados Premium limpos!");
        console.log("🆕 Usuário voltou ao estado inicial (Free)");
      } else {
        console.log("❌ Falha ao limpar dados");
      }
    } catch (error) {
      console.error("❌ Erro ao limpar dados:", error.message);
    }
  }

  async listStripeSubscriptions() {
    try {
      console.log("\n📋 Buscando assinaturas no Stripe...");

      // Buscar customer pelo email
      const customers = await stripe.customers.list({
        email: this.userEmail,
        limit: 10,
      });

      if (customers.data.length === 0) {
        console.log("❌ Nenhum customer encontrado no Stripe");
        return;
      }

      for (const customer of customers.data) {
        console.log(`\n👤 Customer: ${customer.id} (${customer.email})`);

        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          limit: 10,
        });

        if (subscriptions.data.length === 0) {
          console.log("   📭 Nenhuma assinatura encontrada");
          continue;
        }

        subscriptions.data.forEach((sub, index) => {
          const status = sub.status;
          const emoji =
            status === "active" ? "✅" : status === "cancelled" ? "❌" : "⚠️";

          console.log(`   ${emoji} ${index + 1}. ${sub.id}`);
          console.log(`      Status: ${status}`);
          console.log(
            `      Valor: R$ ${
              sub.items.data[0]?.price?.unit_amount / 100 || "N/A"
            }`
          );
          console.log(
            `      Criada: ${new Date(sub.created * 1000).toLocaleString(
              "pt-BR"
            )}`
          );

          if (sub.items.data[0]?.current_period_end) {
            console.log(
              `      Expira: ${new Date(
                sub.items.data[0].current_period_end * 1000
              ).toLocaleString("pt-BR")}`
            );
          }
        });
      }
    } catch (error) {
      console.error("❌ Erro ao listar assinaturas:", error.message);
    }
  }

  async cancelStripeSubscriptions() {
    try {
      console.log("\n🔄 Cancelando assinaturas no Stripe...");

      const customers = await stripe.customers.list({
        email: this.userEmail,
        limit: 10,
      });

      if (customers.data.length === 0) {
        console.log("❌ Nenhum customer encontrado");
        return;
      }

      let canceledCount = 0;

      for (const customer of customers.data) {
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: "active",
          limit: 10,
        });

        for (const subscription of subscriptions.data) {
          console.log(`🔄 Cancelando: ${subscription.id}`);

          try {
            await stripe.subscriptions.cancel(subscription.id);
            console.log(`   ✅ Cancelada com sucesso`);
            canceledCount++;
          } catch (cancelError) {
            console.log(`   ❌ Erro ao cancelar: ${cancelError.message}`);
          }
        }
      }

      console.log(`\n🎉 ${canceledCount} assinatura(s) cancelada(s) no Stripe`);

      if (canceledCount > 0) {
        console.log("⏳ Aguardando 2 segundos para o webhook processar...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error("❌ Erro ao cancelar assinaturas:", error.message);
    }
  }

  async simulateWebhook() {
    try {
      console.log("\n🧪 Simulando webhook de ativação...");

      const axios = require("axios");
      const webhookUrl = "http://localhost:3001/api/stripe/webhook";

      // Payload simulado de customer.subscription.created
      const payload = {
        id: "evt_test_webhook",
        object: "event",
        type: "customer.subscription.created",
        data: {
          object: {
            id: `test_sub_${Date.now()}`,
            object: "subscription",
            status: "active",
            customer: "test_customer",
            items: {
              data: [
                {
                  current_period_end:
                    Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // +30 dias
                  current_period_start: Math.floor(Date.now() / 1000),
                },
              ],
            },
            metadata: {
              user_id: this.userId.toString(),
            },
          },
        },
      };

      const response = await axios.post(webhookUrl, payload, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("✅ Webhook simulado com sucesso!");
      console.log(
        `📊 Response: ${response.status} - ${response.data?.event_type || "OK"}`
      );
    } catch (error) {
      if (error.response?.status === 400) {
        console.log(
          "⚠️ Webhook rejeitado (signature), mas isso é normal em simulação"
        );
      } else {
        console.error("❌ Erro ao simular webhook:", error.message);
      }
    }
  }

  async run() {
    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const askQuestion = (question) => {
      return new Promise((resolve) => {
        rl.question(question, resolve);
      });
    };

    while (true) {
      await this.showMenu();
      const choice = await askQuestion("\n🔢 Escolha uma opção: ");

      switch (choice.trim()) {
        case "1":
          await this.getCurrentStatus();
          break;

        case "2":
          const months = await askQuestion(
            "📅 Quantos meses de Premium? (padrão: 1): "
          );
          await this.activatePremium(parseInt(months) || 1);
          break;

        case "3":
          await this.deactivatePremium();
          break;

        case "4":
          await this.clearAllPremiumData();
          break;

        case "5":
          await this.listStripeSubscriptions();
          break;

        case "6":
          await this.cancelStripeSubscriptions();
          break;

        case "7":
          await this.simulateWebhook();
          break;

        case "0":
          console.log("👋 Saindo...");
          rl.close();
          process.exit(0);
          break;

        default:
          console.log("❌ Opção inválida!");
      }

      await askQuestion("\n⏸️  Pressione ENTER para continuar...");
    }
  }
}

// Executar
const manager = new PremiumTestManager();
manager.run().catch(console.error);

// get-premium.component.ts - VERSÃO CORRIGIDA
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GetPremiumService, Plan } from '../../../core/get-premium.service';

@Component({
  selector: 'app-get-premium',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './get-premium.component.html',
  styleUrls: ['./get-premium.component.css']
})
export class GetPremiumComponent implements OnInit {
  private premiumService = inject(GetPremiumService);

  plans: Plan[] = [];
  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.premiumService.getPlans().subscribe({
      next: (response) => {
        if (response.success) {
          // Transformar dados da API para o formato esperado pelo template
          this.plans = response.plans.map(plan => this.transformPlanData(plan));
        } else {
          this.error = 'Erro ao carregar planos';
          // Fallback para planos estáticos se a API falhar
          this.plans = this.getStaticPlans();
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar planos:', err);
        this.error = 'Erro ao carregar planos. Usando dados estáticos.';
        // Fallback para planos estáticos
        this.plans = this.getStaticPlans();
        this.isLoading = false;
      }
    });
  }

  private transformPlanData(apiPlan: any): Plan {
    // Transformar dados da API para o formato esperado pelo template
    let price = apiPlan.amount ? apiPlan.amount / 100 : null;
    let period = 'por mês';
    let total = apiPlan.display_amount;
    let monthlyEquivalent = '';

    // Ajustar dados específicos por tipo de plano
    if (apiPlan.id === 'semiannual') {
      price = 19.90; // Preço mensal equivalente
      period = 'por mês (6 meses)';
      total = apiPlan.display_amount + ' (6 meses)';
      monthlyEquivalent = 'R$ 19,90/mês';
    } else if (apiPlan.id === 'annual') {
      price = 14.90; // Preço mensal equivalente
      period = 'por mês (12 meses)';
      total = apiPlan.display_amount + ' (12 meses)';
      monthlyEquivalent = 'R$ 14,90/mês';
    }

    return {
      ...apiPlan,
      price: price,
      period: period,
      total: total,
      comingSoon: false,
      popular: apiPlan.popular || false,
      features: this.getPlanFeatures(apiPlan.id),
      buttonText: this.getButtonText(apiPlan.id),
      buttonClass: this.getButtonClass(apiPlan.id)
    };
  }

  private getPlanFeatures(planId: string): Array<{ text: string; included: boolean }> {
    const baseFeatures = [
      { text: 'Avaliações ilimitadas', included: true },
      { text: 'Suporte prioritário', included: true },
      { text: 'Sem anúncios', included: true },
      { text: 'Relatórios avançados', included: true },
      { text: 'Exportação de dados', included: true }
    ];

    switch (planId) {
      case 'monthly':
        return [
          ...baseFeatures,
          { text: 'Cancelamento a qualquer momento', included: true }
        ];
      case 'semiannual':
        return [
          ...baseFeatures,
          { text: '20% de desconto', included: true },
          { text: 'Recursos beta exclusivos', included: true }
        ];
      case 'annual':
        return [
          ...baseFeatures,
          { text: '40% de desconto', included: true },
          { text: 'Recursos beta exclusivos', included: true },
          { text: 'Consultoria mensal gratuita', included: true }
        ];
      default:
        return baseFeatures;
    }
  }

  private getButtonText(planId: string): string {
    switch (planId) {
      case 'monthly':
        return 'Começar Agora';
      case 'semiannual':
        return 'Escolher Plano';
      case 'annual':
        return 'Melhor Valor';
      default:
        return 'Selecionar';
    }
  }

  private getButtonClass(planId: string): string {
    switch (planId) {
      case 'semiannual':
        return 'primary';
      default:
        return 'secondary';
    }
  }

  onPlanSelect(plan: Plan): void {
    if (this.isLoading || plan.comingSoon) return;

    this.isLoading = true;

    this.premiumService.createCheckoutSession(plan.price_id).subscribe({
      next: (response) => {
        if (response.success && response.checkout_url) {
          // Redirecionar para o checkout da Stripe
          window.location.href = response.checkout_url;
        } else {
          this.error = 'Erro ao criar sessão de pagamento';
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Erro ao criar checkout:', err);
        this.error = 'Erro ao processar pagamento. Tente novamente.';
        this.isLoading = false;
      }
    });
  }

  // Dados estáticos como fallback
  private getStaticPlans(): Plan[] {
    return [
      {
        id: 'monthly',
        name: 'Premium Mensal',
        price_id: 'price_monthly_fallback',
        amount: 2490,
        display_amount: 'R$ 24,90',
        currency: 'brl',
        interval: 'month',
        description: 'Cobrado mensalmente',
        price: 24.90,
        period: 'por mês',
        total: 'R$ 24,90/mês',
        popular: false,
        comingSoon: false,
        features: [
          { text: 'Avaliações ilimitadas', included: true },
          { text: 'Suporte prioritário', included: true },
          { text: 'Sem anúncios', included: true },
          { text: 'Relatórios avançados', included: true },
          { text: 'Exportação de dados', included: true },
          { text: 'Cancelamento a qualquer momento', included: true }
        ],
        buttonText: 'Começar Agora',
        buttonClass: 'secondary'
      },
      {
        id: 'semiannual',
        name: 'Premium Semestral',
        price_id: 'price_semiannual_fallback',
        amount: 11940,
        display_amount: 'R$ 119,40',
        monthly_equivalent: 'R$ 19,90/mês',
        currency: 'brl',
        interval: 'every 6 months',
        description: 'Cobrado a cada 6 meses',
        price: 19.90,
        period: 'por mês (6 meses)',
        total: 'R$ 119,40 (6 meses)',
        popular: true,
        comingSoon: false,
        features: [
          { text: 'Avaliações ilimitadas', included: true },
          { text: 'Suporte prioritário VIP', included: true },
          { text: 'Sem anúncios', included: true },
          { text: 'Relatórios avançados', included: true },
          { text: 'Exportação de dados', included: true },
          { text: '20% de desconto', included: true },
          { text: 'Recursos beta exclusivos', included: true }
        ],
        buttonText: 'Escolher Plano',
        buttonClass: 'primary'
      },
      {
        id: 'annual',
        name: 'Premium Anual',
        price_id: 'price_annual_fallback',
        amount: 17880,
        display_amount: 'R$ 178,80',
        monthly_equivalent: 'R$ 14,90/mês',
        currency: 'brl',
        interval: 'yearly',
        description: 'Cobrado anualmente',
        price: 14.90,
        period: 'por mês (12 meses)',
        total: 'R$ 178,80 (12 meses)',
        popular: false,
        comingSoon: false,
        features: [
          { text: 'Avaliações ilimitadas', included: true },
          { text: 'Suporte prioritário VIP', included: true },
          { text: 'Sem anúncios', included: true },
          { text: 'Relatórios avançados', included: true },
          { text: 'Exportação de dados', included: true },
          { text: '40% de desconto', included: true },
          { text: 'Recursos beta exclusivos', included: true },
          { text: 'Consultoria mensal gratuita', included: true }
        ],
        buttonText: 'Melhor Valor',
        buttonClass: 'secondary'
      },
      {
        id: 'tryhard',
        name: 'Tryhard Pro',
        price_id: 'price_tryhard_fallback',
        amount: 0,
        display_amount: 'Em desenvolvimento',
        currency: 'brl',
        interval: 'custom',
        description: 'Plano personalizado',
        price: 100.00,
        period: 'sem limitações',
        total: 'Em desenvolvimento',
        popular: false,
        comingSoon: true,
        features: [
          { text: 'Todos os recursos premium', included: true },
          { text: 'Suporte 24/7 dedicado', included: true },
          { text: 'API de acesso completa', included: true },
          { text: 'Sem qualquer limitação', included: true },
          { text: 'Recursos experimentais', included: true },
          { text: 'Customizações avançadas', included: true },
          { text: 'Integração empresarial', included: true }
        ],
        buttonText: 'Notify Me',
        buttonClass: 'secondary'
      }
    ];
  }

  // Propriedades para comparação (mantidas para compatibilidade)
  get freePlanLimitations(): string[] {
    return [
      'Máximo 200 avaliações',
      'Suporte apenas por email',
      'Funcionalidades básicas apenas',
      'Sem acesso a recursos beta',
      'Limite de exportações'
    ];
  }

  get premiumBenefits(): string[] {
    return [
      'Avaliações ilimitadas',
      'Suporte prioritário',
      'Todos os recursos disponíveis',
      'Acesso antecipado a recursos',
      'Exportações ilimitadas',
      'Relatórios avançados',
      'Análises detalhadas'
    ];
  }
}

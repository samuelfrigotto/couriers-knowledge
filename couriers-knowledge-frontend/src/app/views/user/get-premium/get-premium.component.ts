// get-premium.component.ts
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
          this.plans = response.plans;
        } else {
          this.error = 'Erro ao carregar planos';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar planos:', err);
        this.error = 'Erro ao carregar planos. Tente novamente.';
        this.isLoading = false;
      }
    });
  }

  onPlanSelect(plan: Plan): void {
    if (this.isLoading) return;

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

  // Dados estáticos para comparação (mantidos como fallback)
  staticPlans = [
    {
      name: 'Mensal',
      price: 19.90,
      period: 'por mês',
      total: 'R$ 19,90/mês',
      popular: false,
      comingSoon: false,
      features: [
        { text: 'Acesso completo aos recursos premium', included: true },
        { text: 'Suporte prioritário', included: true },
        { text: 'Sem anúncios', included: true },
        { text: 'Exportação ilimitada', included: true },
        { text: 'Cancelamento a qualquer momento', included: false }
      ],
      buttonText: 'Começar Agora',
      buttonClass: 'secondary'
    },
    {
      name: 'Semestral',
      price: 17.90,
      period: 'por mês',
      total: 'R$ 107,40 (6 meses)',
      popular: true,
      comingSoon: false,
      features: [
        { text: 'Acesso completo aos recursos premium', included: true },
        { text: 'Suporte prioritário VIP', included: true },
        { text: 'Sem anúncios', included: true },
        { text: 'Exportação ilimitada', included: true },
        { text: '10% de desconto', included: true },
        { text: 'Recursos beta exclusivos', included: true }
      ],
      buttonText: 'Escolher Plano',
      buttonClass: 'primary'
    },
    {
      name: 'Anual',
      price: 14.90,
      period: 'por mês',
      total: 'R$ 178,80 (12 meses)',
      popular: false,
      comingSoon: false,
      features: [
        { text: 'Acesso completo aos recursos premium', included: true },
        { text: 'Suporte prioritário VIP', included: true },
        { text: 'Sem anúncios', included: true },
        { text: 'Exportação ilimitada', included: true },
        { text: '25% de desconto', included: true },
        { text: 'Recursos beta exclusivos', included: true },
        { text: 'Consultoria mensal gratuita', included: true }
      ],
      buttonText: 'Melhor Valor',
      buttonClass: 'secondary'
    },
    {
      name: 'Tryhard',
      price: null,
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

  freePlanLimitations = [
    'Máximo 5 projetos simultâneos',
    '3 exportações por mês',
    'Suporte apenas por email',
    'Anúncios exibidos',
    'Armazenamento limitado (1GB)',
    'Sem acesso aos recursos beta',
    'Marca d\'água nas exportações'
  ];

  premiumBenefits = [
    'Projetos ilimitados',
    'Exportações ilimitadas',
    'Suporte prioritário',
    'Experiência sem anúncios',
    'Armazenamento ilimitado',
    'Acesso antecipado a recursos',
    'Exportações sem marca d\'água'
  ];

}

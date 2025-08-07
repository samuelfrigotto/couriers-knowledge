// src/app/views/user/get-premium/get-premium.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GetPremiumService, Plan } from '../../../core/get-premium.service';
import { I18nService } from '../../../core/i18n.service';
import { CurrencyService } from '../../../core/currency.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-get-premium',
  standalone: true,
  imports: [CommonModule, TranslatePipe, RouterLink],
  templateUrl: './get-premium.component.html',
  styleUrls: ['./get-premium.component.css']
})
export class GetPremiumComponent implements OnInit {
  private premiumService = inject(GetPremiumService);
  private i18nService = inject(I18nService);
  private currencyService = inject(CurrencyService);

  plans: Plan[] = [];
  isLoading = true;
  error: string | null = null;
  currentLanguage = 'en';
  currentCurrency = 'BRL';

  // Estado de processamento
  processingPlanId: string | null = null;

  // Controle do modal Pro
  showProModal = false;

  ngOnInit(): void {
    // Subscribe to language changes
    this.i18nService.currentLanguage$.subscribe(lang => {
      this.currentLanguage = lang;
      if (this.plans.length > 0) {
        this.plans = this.getStaticPlans();
      }
    });

    // Subscribe to currency changes
    this.currencyService.currentCurrency$.subscribe(currency => {
      this.currentCurrency = currency;
      if (this.plans.length > 0) {
        this.plans = this.getStaticPlans();
      }
    });

    this.loadPlans();
  }

  loadPlans(): void {
    this.premiumService.getPlans().subscribe({
      next: (response) => {
        if (response.success && response.plans?.length > 0) {
          this.plans = response.plans.map(plan => this.transformPlanData(plan));
        } else {
          this.plans = this.getStaticPlans();
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar planos:', err);
        this.error = this.i18nService.translate('premium.error') + '. Usando dados estáticos.';
        this.plans = this.getStaticPlans();
        this.isLoading = false;
      }
    });
  }

  onSelectPlan(plan: Plan): void {
    if (plan.comingSoon || this.isProcessing(plan.id)) {
      return;
    }

    this.processingPlanId = plan.id;

    this.premiumService.createCheckoutSession(plan.price_id).subscribe({
      next: (response) => {
        if (response.success && response.checkout_url) {
          window.location.href = response.checkout_url;
        } else {
          console.error('Erro na criação da sessão:', response);
          alert('Erro ao processar pagamento. Tente novamente.');
        }
        this.processingPlanId = null;
      },
      error: (err) => {
        console.error('Erro ao criar checkout:', err);
        alert('Erro ao processar pagamento. Tente novamente.');
        this.processingPlanId = null;
      }
    });
  }

  isProcessing(planId: string): boolean {
    return this.processingPlanId === planId;
  }

  // Controles do modal Pro
  openProModal(): void {
    this.showProModal = true;
  }

  closeProModal(): void {
    this.showProModal = false;
  }

  // Função para navegação personalizada
  handleProContact(): void {
    // Implementar redirecionamento para suporte
    console.log('Redirecionando para suporte especializado...');
    // Aqui você pode implementar a navegação para suporte ou email
  }

  private transformPlanData(apiPlan: any): Plan {
    const pricing = this.currencyService.getPricing();
    let price = null;
    let period = '';
    let total = '';
    let monthlyEquivalent = '';

    const currentLang = this.currentLanguage;
    const planName = this.i18nService.translate(`premium.${apiPlan.id}`);

    if (apiPlan.id === 'monthly') {
      price = pricing.monthly;
      period = this.i18nService.translate('premium.perMonth');
      total = this.currencyService.formatPrice(pricing.monthly);
    } else if (apiPlan.id === 'semiannual') {
      price = pricing.semiannual * 6;
      period = this.i18nService.translate('premium.perMonthSix');
      total = this.currencyService.formatPrice(pricing.semiannual * 6) + ' (' + (currentLang === 'en' ? '6 months' : '6 meses') + ')';
      monthlyEquivalent = this.currencyService.formatPrice(pricing.semiannual) + (currentLang === 'en' ? '/month' : '/mês');
    } else if (apiPlan.id === 'annual') {
      price = pricing.annual * 12;
      period = this.i18nService.translate('premium.perMonthTwelve');
      total = this.currencyService.formatPrice(pricing.annual * 12) + ' (' + (currentLang === 'en' ? '12 months' : '12 meses') + ')';
      monthlyEquivalent = this.currencyService.formatPrice(pricing.annual) + (currentLang === 'en' ? '/month' : '/mês');
    } else if (apiPlan.id === 'tryhard') {
      period = this.i18nService.translate('premium.noLimitations');
      total = this.i18nService.translate('premium.inDevelopment');
    }

    return {
      ...apiPlan,
      name: planName,
      period: period,
      total: total,
      price: price,
      monthly_equivalent: monthlyEquivalent,
      display_amount: price ? this.currencyService.formatPrice(price) : '',
      comingSoon: apiPlan.id === 'tryhard',
      popular: apiPlan.id === 'semiannual',
      features: this.getPlanFeatures(apiPlan.id),
      buttonText: this.getButtonText(apiPlan.id),
      buttonClass: this.getButtonClass(apiPlan.id)
    };
  }

  private getPlanFeatures(planId: string): Array<{ text: string; included: boolean }> {
    const baseFeatures = [
      { key: 'premium.features.unlimitedEvaluations', included: true },
      { key: 'premium.features.prioritySupport', included: true },
      { key: 'premium.features.noAds', included: true },
      { key: 'premium.features.advancedReports', included: true },
      { key: 'premium.features.dataExport', included: true },
      { key: 'premium.features.betaFeatures', included: true }
    ];

    switch (planId) {
      case 'monthly':
        return baseFeatures.map(f => ({
          text: this.i18nService.translate(f.key),
          included: f.included
        }));

      case 'semiannual':
        return [
          ...baseFeatures,
          { key: 'premium.discount.20', included: true }
        ].map(f => ({
          text: this.i18nService.translate(f.key),
          included: f.included
        }));

      case 'annual':
        return [
          ...baseFeatures,
          { key: 'premium.discount.40', included: true },
          { key: 'premium.features.monthlyConsulting', included: true }
        ].map(f => ({
          text: this.i18nService.translate(f.key),
          included: f.included
        }));

      case 'tryhard':
        return [
          { key: 'premium.features.allPremiumFeatures', included: true },
          { key: 'premium.features.support247', included: true },
          { key: 'premium.features.fullApiAccess', included: true },
          { key: 'premium.features.noLimitations', included: true },
          { key: 'premium.features.experimentalFeatures', included: true },
          { key: 'premium.features.advancedCustomizations', included: true },
          { key: 'premium.features.enterpriseIntegration', included: true }
        ].map(f => ({
          text: this.i18nService.translate(f.key),
          included: f.included
        }));

      default:
        return baseFeatures.map(f => ({
          text: this.i18nService.translate(f.key),
          included: f.included
        }));
    }
  }

  private getButtonText(planId: string): string {
    switch (planId) {
      case 'tryhard':
        return this.i18nService.translate('premium.notifyMe');
      case 'semiannual':
        return this.i18nService.translate('premium.choosePlan');
      default:
        return this.i18nService.translate('premium.choosePlan');
    }
  }

  private getButtonClass(planId: string): string {
    switch (planId) {
      case 'monthly':
        return 'primary';
      case 'tryhard':
        return 'secondary';
      default:
        return 'primary';
    }
  }

  private getStaticPlans(): Plan[] {
    const pricing = this.currencyService.getPricing();

    return [
      {
        id: 'monthly',
        name: this.i18nService.translate('premium.monthly'),
        price_id: 'price_1Rmf6sQOyUltBOQEO37eF8hb',
        amount: Math.round(pricing.monthly * 100),
        display_amount: this.currencyService.formatPrice(pricing.monthly),
        currency: this.currentCurrency.toLowerCase(),
        interval: 'monthly',
        description: 'Cobrado mensalmente',
        price: pricing.monthly,
        period: this.i18nService.translate('premium.perMonth'),
        total: this.currencyService.formatPrice(pricing.monthly),
        popular: false,
        comingSoon: false,
        features: this.getPlanFeatures('monthly'),
        buttonText: this.getButtonText('monthly'),
        buttonClass: this.getButtonClass('monthly')
      },
      {
        id: 'semiannual',
        name: this.i18nService.translate('premium.semiannual'),
        price_id: 'price_1Rmf8VQOyUltBOQEYvAqrkpX',
        amount: Math.round(pricing.semiannual * 6 * 100),
        display_amount: this.currencyService.formatPrice(pricing.semiannual * 6),
        monthly_equivalent: this.currentLanguage === 'en' ?
          this.currencyService.formatPrice(pricing.semiannual) + '/month' :
          this.currencyService.formatPrice(pricing.semiannual) + '/mês',
        currency: this.currentCurrency.toLowerCase(),
        interval: 'semiannual',
        description: 'Cobrado semestralmente',
        price: pricing.semiannual * 6,
        period: this.i18nService.translate('premium.perMonthSix'),
        total: this.currencyService.formatPrice(pricing.semiannual * 6) + ' (' + (this.currentLanguage === 'en' ? '6 months' : '6 meses') + ')',
        popular: true,
        comingSoon: false,
        features: this.getPlanFeatures('semiannual'),
        buttonText: this.getButtonText('semiannual'),
        buttonClass: this.getButtonClass('semiannual')
      },
      {
        id: 'annual',
        name: this.i18nService.translate('premium.annual'),
        price_id: 'price_1Rmf9LQOyUltBOQECmXKJZBc',
        amount: Math.round(pricing.annual * 12 * 100),
        display_amount: this.currencyService.formatPrice(pricing.annual * 12),
        monthly_equivalent: this.currentLanguage === 'en' ?
          this.currencyService.formatPrice(pricing.annual) + '/month' :
          this.currencyService.formatPrice(pricing.annual) + '/mês',
        currency: this.currentCurrency.toLowerCase(),
        interval: 'annual',
        description: 'Cobrado anualmente',
        price: pricing.annual * 12,
        period: this.i18nService.translate('premium.perMonthTwelve'),
        total: this.currencyService.formatPrice(pricing.annual * 12) + ' (' + (this.currentLanguage === 'en' ? '12 months' : '12 meses') + ')',
        popular: false,
        comingSoon: false,
        features: this.getPlanFeatures('annual'),
        buttonText: this.getButtonText('annual'),
        buttonClass: this.getButtonClass('annual')
      },
      {
        id: 'tryhard',
        name: this.i18nService.translate('premium.tryhard'),
        price_id: '',
        amount: 0,
        display_amount: '',
        currency: this.currentCurrency.toLowerCase(),
        interval: 'lifetime',
        description: 'Para jogadores elite',
        price: null,
        period: this.i18nService.translate('premium.noLimitations'),
        total: this.i18nService.translate('premium.inDevelopment'),
        popular: false,
        comingSoon: true,
        features: this.getPlanFeatures('tryhard'),
        buttonText: this.getButtonText('tryhard'),
        buttonClass: this.getButtonClass('tryhard')
      }
    ];
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GetPremiumService, Plan } from '../../../core/get-premium.service';
import { I18nService } from '../../../core/i18n.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-get-premium',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './get-premium.component.html',
  styleUrls: ['./get-premium.component.css']
})
export class GetPremiumComponent implements OnInit {
  private premiumService = inject(GetPremiumService);
  private i18nService = inject(I18nService);

  plans: Plan[] = [];
  isLoading = true;
  error: string | null = null;
  currentLanguage = 'en';

  ngOnInit(): void {
    this.i18nService.currentLanguage$.subscribe(lang => {
      this.currentLanguage = lang;
      if (this.plans.length > 0) {
        this.plans = this.plans.map(plan => this.transformPlanData(plan));
      }
    });

    this.loadPlans();
  }

  loadPlans(): void {
    this.premiumService.getPlans().subscribe({
      next: (response) => {
        if (response.success) {
          this.plans = response.plans.map(plan => this.transformPlanData(plan));
        } else {
          this.error = this.i18nService.translate('premium.error');
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

  private transformPlanData(apiPlan: any): Plan {
    const currentLang = this.i18nService.getCurrentLanguage();

    let planName = '';
    switch (apiPlan.id) {
      case 'monthly':
        planName = this.i18nService.translate('premium.monthly');
        break;
      case 'semiannual':
        planName = this.i18nService.translate('premium.semiannual');
        break;
      case 'annual':
        planName = this.i18nService.translate('premium.annual');
        break;
      case 'tryhard':
        planName = this.i18nService.translate('premium.tryhard');
        break;
      default:
        planName = apiPlan.name;
    }

    let period = '';
    let total = '';
    let monthlyEquivalent = '';

    if (apiPlan.id === 'monthly') {
      period = this.i18nService.translate('premium.perMonth');
      total = apiPlan.display_amount;
    } else if (apiPlan.id === 'semiannual') {
      period = this.i18nService.translate('premium.perMonthSix');
      total = apiPlan.display_amount + ' (6 ' + (currentLang === 'en' ? 'months' : 'meses') + ')';
      monthlyEquivalent = currentLang === 'en' ? 'R$ 19.90/month' : 'R$ 19,90/mês';
    } else if (apiPlan.id === 'annual') {
      period = this.i18nService.translate('premium.perMonthTwelve');
      total = apiPlan.display_amount + ' (12 ' + (currentLang === 'en' ? 'months' : 'meses') + ')';
      monthlyEquivalent = currentLang === 'en' ? 'R$ 14.90/month' : 'R$ 14,90/mês';
    } else if (apiPlan.id === 'tryhard') {
      period = this.i18nService.translate('premium.noLimitations');
      total = this.i18nService.translate('premium.inDevelopment');
    }

    return {
      ...apiPlan,
      name: planName,
      period: period,
      total: total,
      monthly_equivalent: monthlyEquivalent,
      comingSoon: apiPlan.id === 'tryhard',
      popular: apiPlan.popular || false,
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
      case 'annual':
        return this.i18nService.translate('premium.bestValue');
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
    return [
      {
        id: 'monthly',
        name: this.i18nService.translate('premium.monthly'),
        price_id: 'price_monthly_fallback',
        amount: 2490,
        display_amount: 'R$ 24,90',
        currency: 'brl',
        interval: 'monthly',
        description: 'Cobrado mensalmente',
        price: 24.90,
        period: this.i18nService.translate('premium.perMonth'),
        total: 'R$ 24,90',
        popular: true,
        comingSoon: false,
        features: this.getPlanFeatures('monthly'),
        buttonText: this.getButtonText('monthly'),
        buttonClass: this.getButtonClass('monthly')
      },
      {
        id: 'semiannual',
        name: this.i18nService.translate('premium.semiannual'),
        price_id: 'price_semiannual_fallback',
        amount: 11940,
        display_amount: 'R$ 119,40',
        monthly_equivalent: this.currentLanguage === 'en' ? 'R$ 19.90/month' : 'R$ 19,90/mês',
        currency: 'brl',
        interval: 'semiannual',
        description: 'Cobrado semestralmente',
        price: 19.90,
        period: this.i18nService.translate('premium.perMonthSix'),
        total: 'R$ 119,40 (6 ' + (this.currentLanguage === 'en' ? 'months' : 'meses') + ')',
        popular: false,
        comingSoon: false,
        features: this.getPlanFeatures('semiannual'),
        buttonText: this.getButtonText('semiannual'),
        buttonClass: this.getButtonClass('semiannual')
      },
      {
        id: 'annual',
        name: this.i18nService.translate('premium.annual'),
        price_id: 'price_annual_fallback',
        amount: 17880,
        display_amount: 'R$ 178,80',
        monthly_equivalent: this.currentLanguage === 'en' ? 'R$ 14.90/month' : 'R$ 14,90/mês',
        currency: 'brl',
        interval: 'yearly',
        description: 'Cobrado anualmente',
        price: 14.90,
        period: this.i18nService.translate('premium.perMonthTwelve'),
        total: 'R$ 178,80 (12 ' + (this.currentLanguage === 'en' ? 'months' : 'meses') + ')',
        popular: false,
        comingSoon: false,
        features: this.getPlanFeatures('annual'),
        buttonText: this.getButtonText('annual'),
        buttonClass: this.getButtonClass('annual')
      },
      {
        id: 'tryhard',
        name: this.i18nService.translate('premium.tryhard'),
        price_id: 'price_tryhard_fallback',
        amount: 0,
        display_amount: this.i18nService.translate('premium.inDevelopment'),
        currency: 'brl',
        interval: 'custom',
        description: 'Plano personalizado',
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

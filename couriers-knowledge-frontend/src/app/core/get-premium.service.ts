// get-premium.service.ts - VERSÃO CORRIGIDA
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/environment';

export interface Plan {
  // Propriedades da API
  id: string;
  name: string;
  price_id: string;
  amount: number;
  display_amount: string;
  monthly_equivalent?: string;
  currency: string;
  interval: string;
  description: string;
  popular?: boolean;

  // Propriedades para compatibilidade com o template
  price?: number | null;
  period?: string;
  total?: string;
  comingSoon?: boolean;
  features?: Array<{ text: string; included: boolean }>;
  buttonText?: string;
  buttonClass?: string;
}

export interface PlansResponse {
  success: boolean;
  plans: Plan[];
}

export interface CheckoutResponse {
  success: boolean;
  checkout_url: string;
  session_id: string;
}

export interface SessionStatusResponse {
  success: boolean;
  status: string;
  customer_email?: string;
  amount_total?: number;
  subscription_id?: string;
}

export interface SubscriptionStatusResponse {
  success: boolean;
  has_subscription: boolean;
  status: string;
  subscription_id?: string;
  current_period_end?: number;
  price_id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GetPremiumService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/stripe`;

  // Buscar planos disponíveis
  getPlans(): Observable<PlansResponse> {
    return this.http.get<PlansResponse>(`${this.baseUrl}/plans`);
  }

  // Criar sessão de checkout
  createCheckoutSession(priceId: string): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.baseUrl}/create-checkout-session`, {
      priceId
    });
  }

  // Verificar status da assinatura do usuário atual
  getSubscriptionStatus(): Observable<SubscriptionStatusResponse> {
    return this.http.get<SubscriptionStatusResponse>(`${this.baseUrl}/subscription-status`);
  }

  // Verificar status de uma sessão específica de checkout
  getSessionStatus(sessionId: string): Observable<SessionStatusResponse> {
    return this.http.get<SessionStatusResponse>(`${this.baseUrl}/session/${sessionId}`);
  }

  // Cancelar assinatura (implementação futura)
  cancelSubscription(subscriptionId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/cancel-subscription`, {
      subscription_id: subscriptionId
    });
  }

  // Atualizar método de pagamento (implementação futura)
  updatePaymentMethod(subscriptionId: string, paymentMethodId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/update-payment-method`, {
      subscription_id: subscriptionId,
      payment_method_id: paymentMethodId
    });
  }

  // Obter histórico de pagamentos (implementação futura)
  getPaymentHistory(): Observable<any> {
    return this.http.get(`${this.baseUrl}/payment-history`);
  }

  // Verificar se usuário tem acesso premium
  checkPremiumAccess(): Observable<{ isPremium: boolean; expiresAt?: string }> {
    return this.http.get<{ isPremium: boolean; expiresAt?: string }>(`${this.baseUrl}/premium-access`);
  }
}

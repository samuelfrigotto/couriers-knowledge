// get-premium.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/environment';

export interface Plan {
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
  price?: number;
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

  // Verificar status da assinatura
  getSubscriptionStatus(): Observable<any> {
    return this.http.get(`${this.baseUrl}/subscription-status`);
  }

  // Verificar status de uma sessão específica
  getSessionStatus(sessionId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/session/${sessionId}`);
  }
}

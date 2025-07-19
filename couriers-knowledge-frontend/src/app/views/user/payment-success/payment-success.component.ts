// src/app/views/user/payment-success/payment-success.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GetPremiumService } from '../../../core/get-premium.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="success-container">
      <div class="success-card" *ngIf="!isLoading">
        <div class="success-icon">🎉</div>
        <h1>Pagamento Realizado com Sucesso!</h1>
        <p class="success-message">
          Seu plano Premium foi ativado com sucesso!
        </p>

        <div class="session-details" *ngIf="sessionDetails">
          <h3>Detalhes da Compra:</h3>
          <p><strong>Status:</strong> {{ sessionDetails.status }}</p>
          <p><strong>Email:</strong> {{ sessionDetails.customer_email }}</p>
          <p><strong>Valor:</strong> R$ {{ formatAmount(sessionDetails.amount_total) }}</p>
        </div>

        <div class="action-buttons">
          <button class="btn-primary" (click)="goToDashboard()">
            Ir para Dashboard
          </button>
          <button class="btn-secondary" (click)="goToProfile()">
            Ver Perfil Premium
          </button>
        </div>
      </div>

      <div class="loading" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>Verificando seu pagamento...</p>
      </div>

      <div class="error-card" *ngIf="error">
        <div class="error-icon">❌</div>
        <h2>Erro ao Verificar Pagamento</h2>
        <p>{{ error }}</p>
        <button class="btn-secondary" (click)="retry()">Tentar Novamente</button>
      </div>
    </div>
  `,
  styles: [`
    .success-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      padding: 20px;
      background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
    }

    .success-card, .error-card {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      padding: 60px 40px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
      max-width: 500px;
      width: 100%;
      color: white;
    }

    .success-icon, .error-icon {
      font-size: 4rem;
      margin-bottom: 20px;
    }

    h1, h2 {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 20px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .success-message {
      font-size: 1.2rem;
      margin-bottom: 30px;
      color: #a8a8b3;
    }

    .session-details {
      background: rgba(102, 126, 234, 0.1);
      border-radius: 12px;
      padding: 20px;
      margin: 30px 0;
      border: 1px solid rgba(102, 126, 234, 0.2);
    }

    .session-details h3 {
      color: #667eea;
      margin-bottom: 15px;
    }

    .session-details p {
      margin: 8px 0;
      color: #e0e0e0;
    }

    .action-buttons {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-top: 30px;
    }

    .btn-primary, .btn-secondary {
      padding: 12px 24px;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .loading {
      text-align: center;
      color: white;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 3px solid rgba(102, 126, 234, 0.3);
      border-top: 3px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .action-buttons {
        flex-direction: column;
      }

      .success-card, .error-card {
        padding: 40px 20px;
      }
    }
  `]
})
export class PaymentSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private premiumService = inject(GetPremiumService);

  isLoading = true;
  error: string | null = null;
  sessionDetails: any = null;
  sessionId: string | null = null;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.sessionId = params['session_id'];
      if (this.sessionId) {
        this.verifyPayment();
      } else {
        this.error = 'Session ID não encontrado';
        this.isLoading = false;
      }
    });
  }

  verifyPayment(): void {
    if (!this.sessionId) return;

    this.premiumService.getSessionStatus(this.sessionId).subscribe({
      next: (response) => {
        if (response.success) {
          this.sessionDetails = response;
        } else {
          this.error = 'Erro ao verificar pagamento';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao verificar sessão:', err);
        this.error = 'Erro ao verificar pagamento. Tente novamente.';
        this.isLoading = false;
      }
    });
  }

  formatAmount(amount: number): string {
    return (amount / 100).toFixed(2);
  }

  goToDashboard(): void {
    this.router.navigate(['/app/dashboard']);
  }

  goToProfile(): void {
    this.router.navigate(['/app/profile']);
  }

  retry(): void {
    this.error = null;
    this.isLoading = true;
    this.verifyPayment();
  }
}

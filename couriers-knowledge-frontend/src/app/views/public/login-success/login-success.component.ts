// src/app/views/public/login-success/login-success.component.ts - DEBUG DETALHADO

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-login-success',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-success-container">
      <div class="spinner"></div>
      <h2>Autenticando...</h2>
      <div class="debug-info">
        <p><strong>Debug Info:</strong></p>
        <p>URL atual: {{ currentUrl }}</p>
        <p>Token encontrado: {{ tokenFound ? 'SIM' : 'NÃO' }}</p>
        <p>Query params: {{ queryParamsText }}</p>
        <p *ngIf="errorMessage" class="error">{{ errorMessage }}</p>
      </div>
    </div>
  `,
  styles: [`
    .login-success-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: linear-gradient(135deg, #121212 0%, #1a1a2e 100%);
      color: white;
      font-family: Arial, sans-serif;
      padding: 20px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid #fff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .debug-info {
      background: rgba(0, 0, 0, 0.3);
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
      max-width: 600px;
      text-align: left;
    }

    .debug-info p {
      margin: 5px 0;
      font-size: 14px;
    }

    .error {
      color: #ff6b6b;
      font-weight: bold;
    }

    h2 {
      margin: 10px 0;
    }
  `]
})
export class LoginSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  errorMessage: string = '';
  currentUrl: string = '';
  tokenFound: boolean = false;
  queryParamsText: string = '';

  ngOnInit(): void {
    this.currentUrl = window.location.href;

    this.handleAuthentication();
  }

  private handleAuthentication(): void {

    this.route.queryParams.subscribe({
      next: (params) => {

        this.queryParamsText = JSON.stringify(params, null, 2);

        const token = params['token'];

        if (token && token.trim() !== '') {
          this.tokenFound = true;

          this.authService.saveToken(token);

          setTimeout(() => {
            const savedToken = this.authService.getToken();
            const isAuth = this.authService.isAuthenticated();


            if (savedToken && isAuth) {
              this.router.navigate(['/app/dashboard']);
            } else {
              this.errorMessage = `Falha na autenticação. Token salvo: ${!!savedToken}, Auth: ${isAuth}`;
            }
          }, 100);

        } else {
          this.tokenFound = false;
          this.errorMessage = 'Token não encontrado na URL. Verifique se o login foi feito corretamente.';

          // ✅ TENTAR BUSCAR EM OUTROS LUGARES
          const urlSearchParams = new URLSearchParams(window.location.search);
          const urlToken = urlSearchParams.get('token');

          if (urlToken) {
            this.authService.saveToken(urlToken);
            this.router.navigate(['/app/dashboard']);
            return;
          }

          // ✅ REDIRECIONAR APÓS 3 SEGUNDOS
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        }
      },
      error: (error) => {
        this.errorMessage = `Erro: ${error.message}`;

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      }
    });
  }
}

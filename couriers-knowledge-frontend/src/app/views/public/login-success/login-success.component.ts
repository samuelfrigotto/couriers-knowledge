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
    console.log('🔍 [LOGIN SUCCESS] ===== INÍCIO DO DEBUG =====');
    this.currentUrl = window.location.href;
    console.log('🔍 [LOGIN SUCCESS] URL completa:', this.currentUrl);

    this.handleAuthentication();
  }

  private handleAuthentication(): void {
    console.log('🔍 [LOGIN SUCCESS] Processando autenticação...');

    // ✅ PRIMEIRA VERIFICAÇÃO: URL atual
    console.log('🔍 [LOGIN SUCCESS] window.location.search:', window.location.search);
    console.log('🔍 [LOGIN SUCCESS] window.location.hash:', window.location.hash);

    this.route.queryParams.subscribe({
      next: (params) => {
        console.log('🔍 [LOGIN SUCCESS] ===== QUERY PARAMS RECEBIDOS =====');
        console.log('🔍 [LOGIN SUCCESS] Params completos:', params);
        console.log('🔍 [LOGIN SUCCESS] Params keys:', Object.keys(params));
        console.log('🔍 [LOGIN SUCCESS] Params values:', Object.values(params));

        this.queryParamsText = JSON.stringify(params, null, 2);

        const token = params['token'];

        console.log('🔍 [LOGIN SUCCESS] Token extraído:', token);
        console.log('🔍 [LOGIN SUCCESS] Token type:', typeof token);
        console.log('🔍 [LOGIN SUCCESS] Token length:', token ? token.length : 0);

        if (token && token.trim() !== '') {
          this.tokenFound = true;
          console.log('✅ [LOGIN SUCCESS] Token válido encontrado!');

          // ✅ SALVAR TOKEN COM VERIFICAÇÃO
          console.log('🔍 [LOGIN SUCCESS] Salvando token...');
          this.authService.saveToken(token);

          // ✅ VERIFICAÇÃO IMEDIATA
          setTimeout(() => {
            const savedToken = this.authService.getToken();
            const isAuth = this.authService.isAuthenticated();

            console.log('🔍 [LOGIN SUCCESS] ===== VERIFICAÇÃO PÓS-SAVE =====');
            console.log('🔍 [LOGIN SUCCESS] Token foi salvo?', !!savedToken);
            console.log('🔍 [LOGIN SUCCESS] Tokens iguais?', token === savedToken);
            console.log('🔍 [LOGIN SUCCESS] isAuthenticated()?', isAuth);

            if (savedToken && isAuth) {
              console.log('✅ [LOGIN SUCCESS] Tudo OK! Redirecionando...');
              this.router.navigate(['/app/dashboard']);
            } else {
              console.error('❌ [LOGIN SUCCESS] Falha na autenticação após save');
              this.errorMessage = `Falha na autenticação. Token salvo: ${!!savedToken}, Auth: ${isAuth}`;
            }
          }, 100);

        } else {
          this.tokenFound = false;
          console.warn('⚠️ [LOGIN SUCCESS] Token não encontrado ou vazio');
          this.errorMessage = 'Token não encontrado na URL. Verifique se o login foi feito corretamente.';

          // ✅ TENTAR BUSCAR EM OUTROS LUGARES
          const urlSearchParams = new URLSearchParams(window.location.search);
          const urlToken = urlSearchParams.get('token');
          console.log('🔍 [LOGIN SUCCESS] Token via URLSearchParams:', urlToken);

          if (urlToken) {
            console.log('✅ [LOGIN SUCCESS] Token encontrado via URLSearchParams!');
            this.authService.saveToken(urlToken);
            this.router.navigate(['/app/dashboard']);
            return;
          }

          // ✅ REDIRECIONAR APÓS 3 SEGUNDOS
          setTimeout(() => {
            console.log('🔄 [LOGIN SUCCESS] Redirecionando para login...');
            this.router.navigate(['/login']);
          }, 3000);
        }
      },
      error: (error) => {
        console.error('❌ [LOGIN SUCCESS] Erro ao processar params:', error);
        this.errorMessage = `Erro: ${error.message}`;

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      }
    });
  }
}

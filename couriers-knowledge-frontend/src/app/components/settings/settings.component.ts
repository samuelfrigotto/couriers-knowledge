// src/app/components/settings/settings.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService, Language } from '../../core/i18n.service';
import { CurrencyService, Currency } from '../../core/currency.service';
import { AuthService } from '../../core/auth.service';
import { UserService } from '../../core/user.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { MmrVerificationComponent } from '../mmr-verification/mmr-verification.component';

interface UserProfile {
  id: number;
  steamUsername: string;
  avatarUrl?: string;
  accountStatus: 'Free' | 'Premium';
  isAdmin?: boolean;
  isImmortal?: boolean;
  mmr?: number;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, TranslatePipe, MmrVerificationComponent],
  template: `
    <div class="settings-container">
      <div class="settings-header">
        <h2>{{ 'settings.title' | translate }}</h2>
      </div>

      <div class="settings-content">
        <!-- Configurações de Idioma -->
        <div class="setting-section">
          <div class="setting-label">
            <h3>{{ 'settings.language' | translate }}</h3>
            <p class="setting-description">{{ 'settings.language.description' | translate }}</p>
            <div class="current-language-display">
              <span class="current-label">{{ 'language.current' | translate }}:</span>
              <span class="current-value">{{ currentLanguageInfo.flag }} {{ currentLanguageInfo.name }}</span>
            </div>
          </div>
          <div class="setting-control">
            <select
              class="language-select"
              [value]="currentLanguage"
              (change)="onLanguageChange($event)"
            >
              <option value="" disabled>{{ 'language.select' | translate }}</option>
              <option
                *ngFor="let lang of availableLanguages"
                [value]="lang.code"
                [selected]="lang.code === currentLanguage"
              >
                {{ lang.flag }} {{ lang.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Configurações de Moeda -->
        <div class="setting-section">
          <div class="setting-label">
            <h3>{{ 'settings.currency' | translate }}</h3>
            <p class="setting-description">{{ 'settings.currency.description' | translate }}</p>
            <div class="current-language-display">
              <span class="current-label">{{ 'currency.current' | translate }}:</span>
              <span class="current-value">{{ currentCurrencyInfo.symbol }} {{ currentCurrencyInfo.name }}</span>
            </div>
          </div>
          <div class="setting-control">
            <select
              class="language-select"
              [value]="currentCurrency"
              (change)="onCurrencyChange($event)"
            >
              <option value="" disabled>{{ 'currency.select' | translate }}</option>
              <option
                *ngFor="let currency of availableCurrencies"
                [value]="currency.code"
                [selected]="currency.code === currentCurrency"
              >
                {{ currency.symbol }} {{ currency.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Seção de Verificação MMR (apenas para usuários não-admin e não-immortal) -->
        <div class="setting-section mmr-section" *ngIf="shouldShowMmrVerification">
          <div class="setting-label">
            <h3>Verificação de MMR</h3>
            <p class="setting-description">
              Comprove seu MMR para desbloquear recursos Premium automaticamente
            </p>
          </div>
          <div class="setting-control full-width">
            <app-mmr-verification></app-mmr-verification>
          </div>
        </div>

        <!-- Informações da Conta -->
        <div class="setting-section" *ngIf="userProfile">
          <div class="setting-label">
            <h3>Informações da Conta</h3>
            <p class="setting-description">Detalhes do seu perfil</p>
          </div>
          <div class="setting-control">
            <div class="account-info">
              <div class="info-row">
                <span class="info-label">Usuário:</span>
                <span class="info-value">{{ userProfile.steamUsername }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="info-value" [ngClass]="'status-' + userProfile.accountStatus.toLowerCase()">
                  {{ userProfile.accountStatus }}
                </span>
              </div>
              <div class="info-row" *ngIf="userProfile.isAdmin">
                <span class="info-label">Privilégio:</span>
                <span class="info-value admin">▲ Administrador</span>
              </div>
              <div class="info-row" *ngIf="userProfile.isImmortal">
                <span class="info-label">Rank:</span>
                <span class="info-value immortal">★ Immortal Player</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Informações do Sistema -->
        <div class="setting-section">
          <div class="setting-label">
            <h3>Informações do Sistema</h3>
            <p class="setting-description">Detalhes técnicos e suporte</p>
          </div>
          <div class="setting-control">
            <div class="system-info">
              <div class="info-row">
                <span class="info-label">Versão:</span>
                <span class="info-value">v1.0.0 Beta</span>
              </div>
              <div class="info-row">
                <span class="info-label">Servidor:</span>
                <span class="info-value">Online</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ✅ BOTÃO LOGOUT ESTILIZADO -->
        <div class="setting-section logout-section">
          <div class="setting-label">
            <h3>{{ 'settings.account.title' | translate }}</h3>
            <p class="setting-description">{{ 'settings.account.description' | translate }}</p>
          </div>
          <div class="setting-control">
            <button class="logout-button" (click)="logout()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
              {{ 'settings.logout.button' | translate }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: white;
    }

    .settings-header {
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .settings-header h2 {
      margin: 0;
      color: white;
      font-size: 28px;
      font-weight: 600;
    }

    .setting-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 24px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .setting-section.mmr-section {
      flex-direction: column;
      align-items: stretch;
    }

    .setting-section.mmr-section .setting-control {
      margin-top: 20px;
    }

    .setting-section.logout-section {
      border-bottom: none;
      padding-bottom: 0;
    }

    .setting-label {
      flex: 1;
      margin-right: 20px;
    }

    .setting-label h3 {
      margin: 0 0 8px 0;
      color: white;
      font-size: 18px;
      font-weight: 500;
    }

    .setting-description {
      margin: 0 0 12px 0;
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      line-height: 1.4;
    }

    .current-language-display {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: rgba(102, 126, 234, 0.1);
      border-radius: 6px;
      border: 1px solid rgba(102, 126, 234, 0.2);
      margin-top: 8px;
      max-width: fit-content;
    }

    .current-label {
      color: rgba(255, 255, 255, 0.8);
      font-size: 12px;
      font-weight: 500;
    }

    .current-value {
      color: #667eea;
      font-weight: 600;
      font-size: 14px;
    }

    .setting-control {
      flex-shrink: 0;
    }

    .setting-control.full-width {
      flex: 1;
      margin-right: 0;
    }

    .language-select {
      padding: 10px 14px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      color: white;
      font-size: 14px;
      min-width: 200px;
      transition: all 0.3s ease;
    }

    .language-select:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .language-select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
    }

    .language-select option {
      background: #1a1a1a;
      color: white;
      padding: 8px;
    }

    .language-select option:disabled {
      color: rgba(255, 255, 255, 0.5);
    }

    .account-info,
    .system-info {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      padding: 16px;
      min-width: 200px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .info-row:last-child {
      margin-bottom: 0;
    }

    .info-label {
      font-weight: 500;
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
    }

    .info-value {
      color: white;
      font-weight: 500;
      font-size: 14px;
    }

    .info-value.status-free {
      color: #94a3b8;
    }

    .info-value.status-premium {
      color: #f59e0b;
    }

    .info-value.admin {
      color: #8b5cf6;
    }

    .info-value.immortal {
      color: #f59e0b;
    }

    /* ✅ ESTILO DO BOTÃO LOGOUT */
    .logout-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 14px 24px;
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1));
      border: 2px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 15px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      min-width: 160px;
      position: relative;
      overflow: hidden;
    }

    .logout-button::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.1), transparent);
      transition: left 0.5s ease;
    }

    .logout-button:hover::before {
      left: 100%;
    }

    .logout-button:hover {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2));
      border-color: rgba(239, 68, 68, 0.5);
      color: #fca5a5;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
    }

    .logout-button:active {
      transform: translateY(0);
      box-shadow: 0 4px 15px rgba(239, 68, 68, 0.2);
    }

    .logout-button svg {
      transition: transform 0.3s ease;
    }

    .logout-button:hover svg {
      transform: translateX(3px);
    }

    @media (max-width: 768px) {
      .settings-container {
        padding: 15px;
      }

      .setting-section {
        flex-direction: column;
        align-items: stretch;
      }

      .setting-label {
        margin-right: 0;
        margin-bottom: 15px;
      }

      .language-select {
        width: 100%;
      }

      .account-info,
      .system-info {
        min-width: auto;
      }

      .logout-button {
        width: 100%;
        min-width: auto;
      }
    }
  `]
})
export class SettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);

  // Language properties
  currentLanguage: string;
  currentLanguageInfo: Language;
  availableLanguages: Language[];

  // Currency properties
  currentCurrency: string;
  currentCurrencyInfo: Currency;
  availableCurrencies: Currency[];

  userProfile: UserProfile | null = null;

  constructor(
    private i18nService: I18nService,
    private currencyService: CurrencyService
  ) {
    // Initialize language
    this.availableLanguages = this.i18nService.availableLanguages;
    this.currentLanguage = this.i18nService.getCurrentLanguage();
    this.currentLanguageInfo = this.i18nService.getCurrentLanguageInfo();

    // Initialize currency
    this.availableCurrencies = this.currencyService.availableCurrencies;
    this.currentCurrency = this.currencyService.getCurrentCurrency();
    this.currentCurrencyInfo = this.currencyService.getCurrentCurrencyInfo();

    // Subscribe to language changes
    this.i18nService.currentLanguage$.subscribe(lang => {
      this.currentLanguage = lang;
      this.currentLanguageInfo = this.i18nService.getCurrentLanguageInfo();
    });

    // Subscribe to currency changes
    this.currencyService.currentCurrency$.subscribe(currency => {
      this.currentCurrency = currency;
      this.currentCurrencyInfo = this.currencyService.getCurrentCurrencyInfo();
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  /**
   * Carrega o perfil do usuário
   */
  private loadUserProfile(): void {
    this.userService.getUserStats().subscribe({
      next: (profile) => {
        this.userProfile = {
          ...profile,
          isAdmin: this.checkAdminStatus(profile),
          isImmortal: this.checkImmortalStatus(profile)
        };
      },
      error: (error) => {
        console.error('Erro ao carregar perfil do usuário:', error);
      }
    });
  }

  /**
   * Verifica se o usuário é admin
   */
  private checkAdminStatus(userData: any): boolean {
    if (!userData) return false;

    // Verificar pelo token
    const decodedToken = this.authService.getDecodedToken();
    if (decodedToken) {
      const isAdminByToken = decodedToken.id === 1 || decodedToken.id === '1';
      if (isAdminByToken) {
        return true;
      }
    }

    // Fallback: verificar pelos dados do usuário
    return userData.id === 1 || userData.id === '1';
  }

  /**
   * Verifica se o usuário é Immortal
   */
  private checkImmortalStatus(userData: any): boolean {
    if (!userData?.mmr) return false;

    // Considerar Immortal se MMR >= 8500
    const immortalThreshold = 8500;
    return userData.mmr >= immortalThreshold;
  }

  /**
   * Verifica se deve mostrar verificação MMR (usuários não-admin e não-immortal)
   */
  get shouldShowMmrVerification(): boolean {
    return this.userProfile?.isAdmin !== true && this.userProfile?.isImmortal !== true;
  }

  /**
   * Método para mudança de idioma
   */
  onLanguageChange(event: any): void {
    const selectedLanguage = event.target.value;
    if (selectedLanguage && selectedLanguage !== this.currentLanguage) {
      this.i18nService.setCurrentLanguage(selectedLanguage);
    }
  }

  /**
   * Método para mudança de moeda
   */
  onCurrencyChange(event: any): void {
    const selectedCurrency = event.target.value;
    if (selectedCurrency && selectedCurrency !== this.currentCurrency) {
      this.currencyService.setCurrentCurrency(selectedCurrency);
    }
  }

  /**
   * ✅ MÉTODO LOGOUT
   */
  logout(): void {
    this.authService.logout();
  }
}

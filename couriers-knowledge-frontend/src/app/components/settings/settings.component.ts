import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { I18nService, Language } from '../../core/i18n.service';
import { CurrencyService, Currency } from '../../core/currency.service';
import { AuthService } from '../../core/auth.service';
import { UserService } from '../../core/user.service';
import { VersionService } from '../../core/version.service';
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
  imports: [CommonModule, FormsModule, TranslatePipe, MmrVerificationComponent],
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

        <!-- Informações da Conta -->
        <div class="setting-section">
          <div class="setting-label">
            <h3>{{ 'settings.account.info.title' | translate }}</h3>
            <p class="setting-description">{{ 'settings.account.info.description' | translate }}</p>
          </div>
          <div class="setting-control">
            <div class="account-info" *ngIf="userProfile">
              <div class="info-row">
                <span class="info-label">{{ 'account.info.steamUsername' | translate }}:</span>
                <span class="info-value">{{ userProfile.steamUsername }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">{{ 'account.info.accountStatus' | translate }}:</span>
                <span class="info-value" [class.premium]="userProfile.accountStatus === 'Premium'">
                  {{ userProfile.accountStatus === 'Premium' ? ('account.status.premium' | translate) : ('account.status.free' | translate) }}
                </span>
              </div>
              <div class="info-row" *ngIf="userProfile.mmr">
                <span class="info-label">{{ 'account.info.mmr' | translate }}:</span>
                <span class="info-value">{{ userProfile.mmr }}</span>
              </div>
              <div class="info-row" *ngIf="userProfile.isAdmin">
                <span class="info-label">{{ 'account.info.rank' | translate }}:</span>
                <span class="info-value admin">{{ 'account.rank.admin' | translate }}</span>
              </div>
              <div class="info-row" *ngIf="userProfile.isImmortal">
                <span class="info-label">{{ 'account.info.rank' | translate }}:</span>
                <span class="info-value immortal">{{ 'account.rank.immortal' | translate }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Informações do Sistema -->
        <div class="setting-section">
          <div class="setting-label">
            <h3>{{ 'settings.system.info.title' | translate }}</h3>
            <p class="setting-description">{{ 'settings.system.info.description' | translate }}</p>
          </div>
          <div class="setting-control">
            <div class="system-info">
              <div class="info-row">
                <span class="info-label">{{ 'system.info.version' | translate }}:</span>
                <span class="info-value">{{ currentVersion }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">{{ 'system.info.server' | translate }}:</span>
                <span class="info-value">{{ 'system.status.online' | translate }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ✅ SEÇÃO ADMIN - APENAS PARA ADMINISTRADORES -->
        <div class="setting-section admin-section" *ngIf="userProfile?.isAdmin">
          <div class="setting-label">
            <h3>{{ 'settings.admin.title' | translate }}</h3>
            <p class="setting-description">{{ 'settings.admin.description' | translate }}</p>
          </div>
          <div class="setting-control">
            <div class="admin-controls">
              <div class="version-update">
                <label>{{ 'admin.version.update' | translate }}</label>
                <div class="version-input-group">
                  <input
                    type="text"
                    [(ngModel)]="newVersionInput"
                    placeholder="v0.0.31"
                    class="version-input"
                    [disabled]="isUpdatingVersion"
                  >
                  <button
                    class="update-version-btn"
                    (click)="updateSystemVersion()"
                    [disabled]="isUpdatingVersion || !newVersionInput"
                  >
                    <span *ngIf="!isUpdatingVersion">{{ 'admin.version.update.button' | translate }}</span>
                    <span *ngIf="isUpdatingVersion">{{ 'admin.version.updating' | translate }}...</span>
                  </button>
                </div>
                <small class="version-help">{{ 'admin.version.help' | translate }}</small>
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

        <!-- MMR Verification Component (se necessário) -->
        <div *ngIf="shouldShowMmrVerification" class="setting-section mmr-section">
          <div class="setting-control full-width">
            <app-mmr-verification></app-mmr-verification>
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

    /* ===== ACCOUNT & SYSTEM INFO STYLES ===== */
    .account-info,
    .system-info {
      background: rgba(255, 255, 255, 0.05);
      padding: 16px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      min-width: 200px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      color: rgba(255, 255, 255, 0.7);
      font-size: 13px;
      font-weight: 400;
    }

    .info-value {
      color: white;
      font-size: 13px;
      font-weight: 500;
      text-align: right;
    }

    .info-value.premium {
      color: #10b981;
      font-weight: 600;
    }

    .info-value.admin {
      color: #f59e0b;
      font-weight: 600;
    }

    .info-value.immortal {
      color: #ef4444;
      font-weight: 600;
    }

    /* ===== ADMIN SECTION STYLES ===== */
    .admin-section {
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 8px;
    }

    .admin-controls {
      background: rgba(255, 255, 255, 0.05);
      padding: 16px;
      border-radius: 8px;
      min-width: 300px;
    }

    .version-update label {
      display: block;
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .version-input-group {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
    }

    .version-input {
      flex: 1;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: white;
      font-size: 14px;
    }

    .version-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .update-version-btn {
      padding: 8px 16px;
      background: #3b82f6;
      border: none;
      border-radius: 6px;
      color: white;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .update-version-btn:hover:not(:disabled) {
      background: #2563eb;
    }

    .update-version-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .version-help {
      color: rgba(255, 255, 255, 0.6);
      font-size: 12px;
    }
    .logout-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 6px;
      color: #ef4444;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      min-width: 200px;
      justify-content: center;
    }

    .logout-button:hover {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.5);
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

  // Version properties
  currentVersion: string = 'v0.0.30';
  newVersionInput: string = '';
  isUpdatingVersion: boolean = false;

  userProfile: UserProfile | null = null;

  constructor(
    private i18nService: I18nService,
    private currencyService: CurrencyService,
    private versionService: VersionService
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

    // Subscribe to version changes
    this.versionService.currentVersion$.subscribe(version => {
      this.currentVersion = version;
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

  /**
   * ✅ MÉTODO PARA ATUALIZAR VERSÃO (APENAS ADMIN)
   */
  updateSystemVersion(): void {
    if (!this.newVersionInput || !this.userProfile?.isAdmin) {
      return;
    }

    // Validar formato da versão
    const versionPattern = /^v\d+\.\d+\.\d+$/;
    if (!versionPattern.test(this.newVersionInput)) {
      alert('Formato inválido! Use o formato: v0.0.30');
      return;
    }

    this.isUpdatingVersion = true;

    this.versionService.updateVersion(this.newVersionInput).subscribe({
      next: (response) => {
        if (response.success) {
          alert(`Versão atualizada para ${response.version}!`);
          this.currentVersion = response.version;
          this.newVersionInput = '';

          // Recarregar versão para todos
          this.versionService.loadCurrentVersion();
        } else {
          alert('Erro ao atualizar versão: ' + response.message);
        }
      },
      error: (error) => {
        console.error('Erro ao atualizar versão:', error);
        alert('Erro ao atualizar versão. Verifique o console.');
      },
      complete: () => {
        this.isUpdatingVersion = false;
      }
    });
  }
}

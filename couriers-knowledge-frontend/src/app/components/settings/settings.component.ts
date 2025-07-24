// src/app/components/settings/settings.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService, Language } from '../../core/i18n.service';
import { AuthService } from '../../core/auth.service';
import { UserService } from '../../core/user.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { MmrVerificationComponent } from '../mmr-verification/mmr-verification.component';
import { Observable } from 'rxjs';

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
          </div>
          <div class="setting-control">
            <select
              class="language-select"
              [value]="currentLanguage"
              (change)="onLanguageChange($event)"
            >
              <option
                *ngFor="let lang of availableLanguages"
                [value]="lang.code"
              >
                {{ lang.flag }} {{ lang.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Seção de Verificação MMR (apenas para usuários não-admin e não-immortal) -->
        <div class="setting-section mmr-section" *ngIf="shouldShowMmrVerification">
          <div class="setting-label">
            <h3>🎯 Verificação de MMR</h3>
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
                <span class="info-label">Status:</span>
                <span class="info-value" [ngClass]="'status-' + userProfile.accountStatus.toLowerCase()">
                  {{ userProfile.accountStatus }}
                </span>
              </div>
              <div class="info-row" *ngIf="userProfile.isAdmin">
                <span class="info-label">Privilégio:</span>
                <span class="info-value admin">👑 Administrador</span>
              </div>
              <div class="info-row" *ngIf="userProfile.isImmortal">
                <span class="info-label">Rank:</span>
                <span class="info-value immortal">⭐ Immortal Player</span>
              </div>
              <div class="info-row" *ngIf="userProfile.mmr">
                <span class="info-label">MMR:</span>
                <span class="info-value">{{ userProfile.mmr }}</span>
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
                <span class="info-value">v0.0.27 Beta</span>
              </div>
              <div class="info-row">
                <span class="info-label">Servidor:</span>
                <span class="info-value">Online</span>
              </div>
            </div>
          </div>
        </div>

        <div class="setting-info">
          <div class="info-item">
            <span class="info-label">{{ 'language.current' | translate }}:</span>
            <span class="info-value">
              {{ currentLanguageInfo.flag }} {{ currentLanguageInfo.name }}
            </span>
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
      margin: 0;
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      line-height: 1.4;
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
      min-width: 160px;
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

    .setting-info {
      margin-top: 30px;
      padding: 15px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .info-item .info-label {
      font-weight: 500;
      color: rgba(255, 255, 255, 0.8);
    }

    .info-item .info-value {
      color: #667eea;
      font-weight: 500;
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
    }
  `]
})
export class SettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);

  currentLanguage: string;
  currentLanguageInfo: Language;
  availableLanguages: Language[];
  userProfile: UserProfile | null = null;

  constructor(private i18nService: I18nService) {
    this.availableLanguages = this.i18nService.availableLanguages;
    this.currentLanguage = this.i18nService.getCurrentLanguage();
    this.currentLanguageInfo = this.i18nService.getCurrentLanguageInfo();

    this.i18nService.currentLanguage$.subscribe(lang => {
      this.currentLanguage = lang;
      this.currentLanguageInfo = this.i18nService.getCurrentLanguageInfo();
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

  onLanguageChange(event: any): void {
    const selectedLanguage = event.target.value;
    this.i18nService.setCurrentLanguage(selectedLanguage);
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService, Language } from '../../core/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="settings-container">
      <div class="settings-header">
        <h2>{{ 'settings.title' | translate }}</h2>
      </div>

      <div class="settings-content">
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
      max-width: 600px;
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
      font-size: 24px;
      font-weight: 600;
    }

    .setting-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 20px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .setting-label {
      flex: 1;
      margin-right: 20px;
    }

    .setting-label h3 {
      margin: 0 0 5px 0;
      color: white;
      font-size: 16px;
      font-weight: 500;
    }

    .setting-description {
      margin: 0;
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
    }

    .setting-control {
      flex-shrink: 0;
    }

    .language-select {
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: white;
      font-size: 14px;
      min-width: 140px;
    }

    .language-select option {
      background: #1a1a1a;
      color: white;
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

    .info-label {
      font-weight: 500;
      color: rgba(255, 255, 255, 0.8);
    }

    .info-value {
      color: #667eea;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .setting-section {
        flex-direction: column;
        align-items: stretch;
      }

      .setting-label {
        margin-right: 0;
        margin-bottom: 15px;
      }
    }
  `]
})
export class SettingsComponent {
  currentLanguage: string;
  currentLanguageInfo: Language;
  availableLanguages: Language[];

  constructor(private i18nService: I18nService) {
    this.availableLanguages = this.i18nService.availableLanguages;
    this.currentLanguage = this.i18nService.getCurrentLanguage();
    this.currentLanguageInfo = this.i18nService.getCurrentLanguageInfo();

    this.i18nService.currentLanguage$.subscribe(lang => {
      this.currentLanguage = lang;
      this.currentLanguageInfo = this.i18nService.getCurrentLanguageInfo();
    });
  }

  onLanguageChange(event: any): void {
    const selectedLanguage = event.target.value;
    this.i18nService.setCurrentLanguage(selectedLanguage);
  }
}

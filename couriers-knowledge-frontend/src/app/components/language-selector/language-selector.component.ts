import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService, Language } from '../../core/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="language-selector">
      <button
        class="language-toggle"
        (click)="toggleDropdown()"
        [attr.aria-label]="'language.select' | translate"
      >
        <span class="flag">{{ currentLanguage.flag }}</span>
        <span class="language-name">{{ currentLanguage.name }}</span>
        <span class="arrow" [class.open]="isDropdownOpen">▼</span>
      </button>

      <div class="language-dropdown" [class.open]="isDropdownOpen">
        <button
          *ngFor="let language of availableLanguages"
          class="language-option"
          [class.active]="language.code === currentLanguage.code"
          (click)="selectLanguage(language.code)"
        >
          <span class="flag">{{ language.flag }}</span>
          <span class="name">{{ language.name }}</span>
          <span class="check" *ngIf="language.code === currentLanguage.code">✓</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .language-selector {
      position: relative;
      display: inline-block;
    }

    .language-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
      color: white;
    }

    .language-toggle:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .flag {
      font-size: 16px;
    }

    .arrow {
      transition: transform 0.2s ease;
      color: rgba(255, 255, 255, 0.7);
      font-size: 12px;
    }

    .arrow.open {
      transform: rotate(180deg);
    }

    .language-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: rgba(20, 20, 30, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition: all 0.2s ease;
      backdrop-filter: blur(10px);
    }

    .language-dropdown.open {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .language-option {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 10px 12px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s ease;
      color: white;
    }

    .language-option:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .language-option.active {
      background: rgba(102, 126, 234, 0.3);
      color: #667eea;
    }

    .check {
      margin-left: auto;
      color: #28a745;
      font-weight: bold;
    }
  `]
})
export class LanguageSelectorComponent {
  isDropdownOpen = false;
  currentLanguage: Language;
  availableLanguages: Language[];

  constructor(private i18nService: I18nService) {
    this.availableLanguages = this.i18nService.availableLanguages;
    this.currentLanguage = this.i18nService.getCurrentLanguageInfo();

    this.i18nService.currentLanguage$.subscribe(languageCode => {
      this.currentLanguage = this.i18nService.getCurrentLanguageInfo();
    });
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectLanguage(languageCode: string): void {
    this.i18nService.setCurrentLanguage(languageCode);
    this.isDropdownOpen = false;
  }
}

// src/app/components/steam-integration-banner/steam-integration-banner.component.ts

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-steam-integration-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="steam-integration-banner" [class.compact]="compact">
      <div class="banner-icon">💬</div>
      <div class="banner-content">
        <h4>{{ title }}</h4>
        <p>{{ description }}</p>
      </div>
    </div>
  `,
  styles: [`
    .steam-integration-banner {
      display: flex;
      align-items: center;
      gap: 20px;
      background: linear-gradient(135deg, #1b2838 0%, #2c3e50 100%);
      border: 2px solid #66c0f4;
      border-radius: 12px;
      padding: 20px;
      animation: steamGlow 3s ease-in-out infinite alternate;
    }

    .steam-integration-banner.compact {
      padding: 16px;
      gap: 16px;
    }

    @keyframes steamGlow {
      0% { box-shadow: 0 0 5px rgba(102, 192, 244, 0.3); }
      100% { box-shadow: 0 0 20px rgba(102, 192, 244, 0.6); }
    }

    .banner-icon {
      font-size: 3rem;
      animation: bounce 2s ease-in-out infinite;
    }

    .steam-integration-banner.compact .banner-icon {
      font-size: 2.5rem;
    }

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-10px); }
      60% { transform: translateY(-5px); }
    }

    .banner-content h4 {
      color: #66c0f4;
      margin: 0 0 8px 0;
      font-size: 1.3rem;
      font-weight: 600;
    }

    .steam-integration-banner.compact .banner-content h4 {
      font-size: 1.1rem;
    }

    .banner-content p {
      margin: 0;
      color: #a0aec0;
      line-height: 1.4;
    }

    .steam-integration-banner.compact .banner-content p {
      font-size: 0.9rem;
    }

    @media (max-width: 768px) {
      .steam-integration-banner {
        flex-direction: column;
        text-align: center;
        gap: 12px;
      }

      .banner-icon {
        font-size: 2.5rem;
      }

      .steam-integration-banner.compact .banner-icon {
        font-size: 2rem;
      }
    }
  `]
})
export class SteamIntegrationBannerComponent {
  @Input() title: string = 'Integração com Chat Steam';
  @Input() description: string = 'Agora você pode abrir o chat da Steam automaticamente com a mensagem de convite já pronta! Só apertar Enter.';
  @Input() compact: boolean = false;
}

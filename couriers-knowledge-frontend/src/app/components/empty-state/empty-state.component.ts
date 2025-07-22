// empty-state.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface EmptyStateConfig {
  type: 'evaluations' | 'friends' | 'matches' | 'live' | 'general';
  title?: string;
  subtitle?: string;
  actionText?: string;
  actionRoute?: string;
  showAction?: boolean;
}

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state-container">
      <!-- Logo com animação -->
      <div class="logo-container">
        <img src="../../../assets/images/logo-sem-fundo.png"
             alt="Courier's Knowledge"
             class="empty-logo">
        <div class="logo-glow"></div>
      </div>

      <!-- Ícone específico do tipo -->
      <div class="type-icon">
        <svg [innerHTML]="getTypeIcon()" class="icon"></svg>
      </div>

      <!-- Conteúdo textual -->
      <div class="content">
        <h3 class="title">{{ getTitle() }}</h3>
        <p class="subtitle">{{ getSubtitle() }}</p>

        <!-- Dica motivacional -->
        <div class="tip">
          <span class="tip-icon">💡</span>
          <span class="tip-text">{{ getTip() }}</span>
        </div>
      </div>

      <!-- Botão de ação (opcional) -->
      <button
        *ngIf="config.showAction !== false"
        class="action-button"
        (click)="onActionClick()">
        {{ getActionText() }}
      </button>

      <!-- Rodapé com marca -->
      <div class="brand-footer">
        <small>{{ getBrandMessage() }}</small>
      </div>
    </div>
  `,
  styleUrls: ['./empty-state.component.css']
})
export class EmptyStateComponent {
  @Input() config: EmptyStateConfig = { type: 'general' };

  getTitle(): string {
    if (this.config.title) return this.config.title;

    const titles = {
      evaluations: 'Nenhuma avaliação ainda',
      friends: 'Sua lista de amigos está vazia',
      matches: 'Nenhuma partida encontrada',
      live: 'Nenhuma partida ao vivo',
      general: 'Nada para mostrar aqui'
    };

    return titles[this.config.type];
  }

  getSubtitle(): string {
    if (this.config.subtitle) return this.config.subtitle;

    const subtitles = {
      evaluations: 'Comece avaliando jogadores nas suas partidas para construir sua base de conhecimento.',
      friends: 'Adicione amigos para compartilhar avaliações e descobrir novos insights sobre jogadores.',
      matches: 'Suas partidas aparecerão aqui quando você começar a jogar ou avaliar outros jogadores.',
      live: 'Quando você estiver em uma partida ao vivo, ela aparecerá aqui com informações em tempo real.',
      general: 'Este espaço será preenchido conforme você usar o Courier\'s Knowledge.'
    };

    return subtitles[this.config.type];
  }

  getTip(): string {
    const tips = {
      evaluations: 'Dica: Avalie sempre após cada partida para não esquecer detalhes importantes!',
      friends: 'Dica: Amigos ajudam a descobrir jogadores problemáticos ou excelentes em comum.',
      matches: 'Dica: Use o Game State Integration para capturar partidas automaticamente.',
      live: 'Dica: Ative o GSI para ver dados em tempo real enquanto joga.',
      general: 'Dica: Explore todas as funcionalidades para maximizar sua experiência.'
    };

    return tips[this.config.type];
  }

  getActionText(): string {
    if (this.config.actionText) return this.config.actionText;

    const actions = {
      evaluations: 'Ver Partidas Recentes',
      friends: 'Buscar Amigos',
      matches: 'Configurar GSI',
      live: 'Ativar GSI',
      general: 'Começar'
    };

    return actions[this.config.type];
  }

  getBrandMessage(): string {
    const messages = [
      'Os segredos dos jogadores, repassados de entregador para entregador.',
      'Courier\'s Knowledge - Sua base de dados pessoal do Dota 2.',
      'Transformando experiências em conhecimento estratégico.',
      'Onde cada avaliação conta para melhorar seu jogo.'
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  getTypeIcon(): string {
    const icons = {
      evaluations: `
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      `,
      friends: `
        <path d="M16 7c0 2.21-1.79 4-4 4s-4-1.79-4-4 1.79-4 4-4 4 1.79 4 4zm-4 5c2.67 0 8 1.34 8 4v3H4v-3c0-2.66 5.33-4 8-4z"/>
        <circle cx="18" cy="8" r="2"/>
        <path d="M22 16v2h-4v-2c0-1.33-2.67-2-4-2v-1c2.67 0 8 1.34 8 3z"/>
      `,
      matches: `
        <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2.5-9H19V1h-2v1H7V1H5v1H3.5C2.67 2 2 2.67 2 3.5v16C2 20.33 2.67 21 3.5 21h17c.83 0 1.5-.67 1.5-1.5v-16C22 2.67 21.33 2 20.5 2z"/>
      `,
      live: `
        <circle cx="12" cy="12" r="8"/>
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
      `,
      general: `
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <path d="M12 17h.01"/>
      `
    };

    return icons[this.config.type];
  }

  onActionClick(): void {
    if (this.config.actionRoute) {
      // Aqui você pode implementar navegação ou emitir evento
      console.log(`Navegando para: ${this.config.actionRoute}`);
      // Exemplo: this.router.navigate([this.config.actionRoute]);
    }

    // Emite evento personalizado para o componente pai
    const event = new CustomEvent('emptyStateAction', {
      detail: { type: this.config.type, action: this.getActionText() }
    });
    window.dispatchEvent(event);
  }
}

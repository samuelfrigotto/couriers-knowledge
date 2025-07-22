// empty-state.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export interface EmptyStateConfig {
  type: 'evaluations' | 'friends' | 'matches' | 'live' | 'general';
  title?: string;
  subtitle?: string;
  actionText?: string;
  actionRoute?: string;
  showAction?: boolean;
  customMessage?: string;
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
  @Output() actionClick = new EventEmitter<any>();

  constructor(private router: Router) {}

  getTitle(): string {
    if (this.config.title) return this.config.title;

    const titles = {
      evaluations: 'Nenhuma avaliação ainda',
      friends: 'Sua lista de amigos está vazia',
      matches: 'Nenhuma partida encontrada',
      live: 'Aguardando dados de partida',
      general: 'Nada para mostrar aqui'
    };

    return titles[this.config.type];
  }

  getSubtitle(): string {
    if (this.config.subtitle) return this.config.subtitle;

    const subtitles = {
      evaluations: 'Comece avaliando jogadores nas suas partidas para construir sua base de conhecimento.',
      friends: 'Adicione amigos para compartilhar avaliações e descobrir novos insights sobre jogadores.',
      matches: 'Suas partidas aparecerão aqui quando você começar a jogar e avaliar outros jogadores.',
      live: 'Suas partidas em tempo real aparecerão aqui quando disponíveis através do Dota 2.',
      general: 'Este espaço será preenchido conforme você usar o Courier\'s Knowledge.'
    };

    return subtitles[this.config.type];
  }

  getTip(): string {
    const tips = {
      evaluations: 'Dica: Avalie sempre após cada partida para não esquecer detalhes importantes!',
      friends: 'Dica: Conecte-se com outros jogadores para expandir sua rede de conhecimento.',
      matches: 'Dica: O histórico de partidas ajuda a identificar padrões e melhorar sua gameplay.',
      live: 'Dica: Dados de partidas em tempo real proporcionam insights valiosos durante o jogo.',
      general: 'Dica: Explore todas as funcionalidades para maximizar sua experiência no Dota 2.'
    };

    return tips[this.config.type];
  }

  getActionText(): string {
    if (this.config.actionText) return this.config.actionText;

    const actions = {
      evaluations: 'Fazer primeira avaliação',
      friends: 'Buscar amigos',
      matches: 'Ver tutoriais',
      live: 'Configurar Dota 2',
      general: 'Começar agora'
    };

    return actions[this.config.type];
  }

  getBrandMessage(): string {
    const messages = [
      'Courier\'s Knowledge - Elevando seu nível no Dota 2.',
      'Transformando experiências em conhecimento estratégico.',
      'Onde cada avaliação conta para melhorar seu jogo.',
      'Sua jornada rumo ao próximo nível começa aqui.'
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
        <path d="M8.5 14.5L12 11l3.5 3.5"/>
        <path d="M12 6v6"/>
        <path d="M16 10l-4 4-4-4"/>
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
    // Emite evento para o componente pai
    this.actionClick.emit({
      type: this.config.type,
      action: this.getActionText(),
      route: this.config.actionRoute
    });

    // Navegação automática se rota foi especificada
    if (this.config.actionRoute) {
      this.router.navigate([this.config.actionRoute]);
    }
  }
}

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { MatchDataService } from '../../../core/match-data.service';
import { UserService } from '../../../core/user.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';

interface UserProfile {
  id: number;
  steamUsername: string;
  avatarUrl?: string;
  accountStatus: 'Free' | 'Premium';
  created_at: string;

  // Immortal-specific fields
  isImmortal?: boolean;
  immortalRank?: number;
  immortalRegion?: 'americas' | 'europe' | 'se_asia' | 'china';
  mmr?: number;

  // Existing fields
  apiCallsToday?: number;
  apiLimit?: number;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private matchDataService = inject(MatchDataService);
  private userService = inject(UserService);

  public userProfile: UserProfile | null = null;

  readonly updateLimitTooltip = 'Cada atualização consulta dados de fontes externas para buscar seu histórico mais recente. Para garantir a estabilidade do serviço para todos, o plano gratuito possui um limite diário. Assinantes Premium apoiam o projeto e desfrutam de um limite muito maior!';

  ngOnInit(): void {
    this.loadUserProfile();
    this.refreshMatchData();
  }

  /**
   * Carrega perfil do usuário e verifica status Immortal
   */
  private loadUserProfile(): void {
    this.userService.getUserStats().subscribe({
      next: (statsData) => {
        this.userProfile = {
          ...statsData,
          isImmortal: this.checkImmortalStatus(statsData),
          immortalRank: this.extractImmortalRank(statsData),
          immortalRegion: this.detectUserRegion(statsData)
        };

        console.log('User Profile loaded:', this.userProfile);
      },
      error: (error) => {
        console.error('Erro ao carregar perfil do usuário:', error);
      }
    });
  }

  /**
   * Verifica se o usuário é Immortal (8.5k+ MMR)
   * Esta lógica pode ser expandida para verificar contra leaderboards oficiais
   */
  private checkImmortalStatus(userData: any): boolean {
    // Método 1: Verificar MMR diretamente (se disponível)
    if (userData.mmr && userData.mmr >= 8500) {
      return true;
    }

    // Método 2: Verificar se está no leaderboard (implementação futura)
    if (userData.leaderboardRank && userData.leaderboardRank <= 1000) {
      return true;
    }

    // Método 3: Flag manual no banco de dados
    if (userData.isImmortalPlayer === true) {
      return true;
    }

    // Por enquanto, retornar false para todos
    // TODO: Implementar verificação real contra leaderboard
    return false;
  }

  /**
   * Extrai rank Immortal se disponível
   */
  private extractImmortalRank(userData: any): number | undefined {
    if (userData.leaderboardRank) {
      return userData.leaderboardRank;
    }

    if (userData.immortalRank) {
      return userData.immortalRank;
    }

    return undefined;
  }

  /**
   * Detecta região do usuário (implementação básica)
   */
  private detectUserRegion(userData: any): 'americas' | 'europe' | 'se_asia' | 'china' {
    // Implementar lógica de detecção de região
    // Por enquanto, default para Americas
    return userData.region || 'americas';
  }

  /**
   * Atualiza dados de partidas (apenas para usuários não-Immortal)
   */
  private refreshMatchData(): void {
    // Só buscar dados via API se não for Immortal
    if (!this.userProfile?.isImmortal) {
      this.matchDataService.refreshMatchData();
    }
  }

  /**
   * Retorna texto traduzido do status da conta
   */
  getAccountStatusTranslated(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Free': 'layout.user.status.free',
      'Premium': 'layout.user.status.premium'
    };

    // Temporário: retornar chave para tradução
    return statusMap[status] || status;
  }

  /**
   * Retorna texto do contador de atualizações
   */
  getUpdatesCounterText(): string {
    if (!this.userProfile) return '';

    const remaining = (this.userProfile.apiLimit || 0) - (this.userProfile.apiCallsToday || 0);
    return `${remaining}/${this.userProfile.apiLimit || 0} restantes`;
  }

  /**
   * Retorna tooltip das limitações de update
   */
  getUpdateLimitTooltip(): string {
    if (this.userProfile?.isImmortal) {
      return 'Como jogador Immortal (8.5k+ MMR), o histórico automático não está disponível devido às restrições da Valve. Use as funcionalidades de importação manual.';
    }

    return this.updateLimitTooltip;
  }

  /**
   * Logout do usuário
   */
  logout(): void {
    this.authService.logout();
  }

  /**
   * Verifica se deve mostrar menu Immortal
   */
  get shouldShowImmortalMenu(): boolean {
    return this.userProfile?.isImmortal === true;
  }

  /**
   * Verifica se deve mostrar aviso sobre limitações
   */
  get shouldShowImmortalNotice(): boolean {
    return this.userProfile?.isImmortal === true;
  }

  /**
   * Retorna classe CSS baseada no status do usuário
   */
  getUserStatusClass(): string {
    if (!this.userProfile) return '';

    const classes = [];

    if (this.userProfile.accountStatus === 'Premium') {
      classes.push('premium-user');
    }

    if (this.userProfile.isImmortal) {
      classes.push('immortal-user');
    }

    return classes.join(' ');
  }

  /**
   * Formata rank Immortal para exibição
   */
  getFormattedImmortalRank(): string {
    if (!this.userProfile?.immortalRank) return '';

    if (this.userProfile.immortalRank <= 10) {
      return `TOP ${this.userProfile.immortalRank}`;
    }

    return `#${this.userProfile.immortalRank}`;
  }

  /**
   * Retorna cor baseada no rank Immortal
   */
  getImmortalRankColor(): string {
    const rank = this.userProfile?.immortalRank;
    if (!rank) return '#8b5cf6';

    if (rank <= 10) return '#f59e0b'; // Dourado para top 10
    if (rank <= 100) return '#8b5cf6'; // Roxo para top 100
    return '#3b82f6'; // Azul para outros
  }
}

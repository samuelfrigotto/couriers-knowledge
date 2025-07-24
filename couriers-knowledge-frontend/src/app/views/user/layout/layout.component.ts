// src/app/views/user/layout/layout.component.ts
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

  // Admin fields
  isAdmin?: boolean;

  // ✅ CAMPOS DE API LIMITS (mantidos para compatibilidade)
  apiCallsToday?: number;
  apiLimit?: number;

  // ✅ NOVOS CAMPOS DE USOS
  usesConsumed?: number;
  usesAllowed?: number;
  usesRemaining?: number;
  callsPerUse?: number;

  // ✅ CAMPOS ADICIONAIS QUE PODEM VIR DO BACKEND
  totalEvaluations?: number;
  averageRating?: number;
  mostUsedTags?: string[];
  receivedEvaluationsCount?: number;
  averageReceivedRating?: number;
  selfAverageRating?: number;
  totalMatches?: number;
  winsLast20?: number;
  averageMatchTime?: number;
  averageKda?: {
    kills: string;
    deaths: string;
    assists: string;
  };
  mostUsedHeroId?: string;
  mostFacedHeroId?: string;
  evaluationPercentage?: number;
  tiltAnalysis?: {
    matchesWithLowRatedTeammates: number;
    winsWithLowRatedTeammates: number;
    tiltWinRate: number | null;
  };
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
    this.debugAuth();
    this.loadUserProfile();
    this.refreshMatchData();
  }

  /**
   * Carrega perfil do usuário e verifica status Immortal e Admin
   */
 private loadUserProfile(): void {

  this.userService.getUserStats().subscribe({
    next: (statsData) => {

      this.userProfile = {
        ...statsData,
        isImmortal: this.checkImmortalStatus(statsData),
        immortalRank: this.extractImmortalRank(statsData),
        immortalRegion: this.detectUserRegion(statsData),
        isAdmin: this.checkAdminStatus(statsData)
      };

    },
    error: (error) => {
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
  console.log('🔍 [LAYOUT] getUpdatesCounterText chamado');
  console.log('🔍 [LAYOUT] userProfile:', this.userProfile);

  if (!this.userProfile) {
    console.log('❌ [LAYOUT] userProfile é null/undefined');
    return '';
  }

  // ✅ ADMIN NÃO MOSTRA CONTADOR (TEM USOS ILIMITADOS)
  if (this.userProfile.isAdmin) {
    console.log('🛡️ [LAYOUT] Usuário é admin - sem contador');
    return '∞ Ilimitado';
  }

  // ✅ IMMORTAL TAMBÉM NÃO MOSTRA CONTADOR (NÃO USA API)
  if (this.userProfile.isImmortal) {
    console.log('⭐ [LAYOUT] Usuário é immortal - sem contador');
    return 'N/A Immortal';
  }

  // ✅ PRIORIZAR OS NOVOS CAMPOS DE USOS
  if (this.userProfile.usesRemaining !== undefined && this.userProfile.usesAllowed !== undefined) {
    console.log('🔍 [LAYOUT] Usando campos de usos:');
    console.log('🔍 [LAYOUT] usesRemaining:', this.userProfile.usesRemaining);
    console.log('🔍 [LAYOUT] usesAllowed:', this.userProfile.usesAllowed);

    const remaining = this.userProfile.usesRemaining;
    const total = this.userProfile.usesAllowed;

    const result = `${remaining}/${total}`;
    console.log('✅ [LAYOUT] Resultado (usos):', result);
    return result;
  }

  // ✅ FALLBACK PARA OS CAMPOS ANTIGOS (caso não venham os novos)
  console.log('🔍 [LAYOUT] Usando campos antigos (API calls):');
  console.log('🔍 [LAYOUT] apiCallsToday:', this.userProfile.apiCallsToday);
  console.log('🔍 [LAYOUT] apiLimit:', this.userProfile.apiLimit);

  const used = this.userProfile.apiCallsToday || 0;
  const limit = this.userProfile.apiLimit || 0;
  const remaining = Math.max(0, Math.floor((limit - used) / 4)); // Dividir por 4 para obter usos
  const totalUses = Math.floor(limit / 4);

  console.log('🔍 [LAYOUT] Cálculo (fallback):', { used, limit, remaining, totalUses });

  const result = `${remaining}/${totalUses}`;
  console.log('✅ [LAYOUT] Resultado final (fallback):', result);

  return result;
}
  /**
   * Retorna tooltip das limitações de update
   */
  getUpdateLimitTooltip(): string {
  if (this.userProfile?.isImmortal) {
    return 'Como jogador Immortal (8.5k+ MMR), o histórico automático não está disponível devido às restrições da Valve. Use as funcionalidades de importação manual.';
  }

  if (this.userProfile?.isAdmin) {
    return 'Como administrador, você tem usos ilimitados para manter e gerenciar o sistema.';
  }

  return 'Cada atualização consulta dados de fontes externas para buscar seu histórico mais recente. Para garantir a estabilidade do serviço para todos, o plano gratuito possui um limite diário de usos. Assinantes Premium apoiam o projeto e desfrutam de muito mais usos por dia!';
}

  /**
   * Logout do usuário
   */
  logout(): void {
    this.authService.logout();
  }

  // ===== PROPRIEDADES PARA IMMORTAL =====

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

    if (this.userProfile.isAdmin) {
      classes.push('admin-user');
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

  // ===== PROPRIEDADES PARA ADMIN =====

  /**
   * Verifica se o usuário é admin (ID 1)
   */
  private checkAdminStatus(userData: any): boolean {
  console.log('🔍 [LAYOUT] Verificando admin status...');
  console.log('🔍 [LAYOUT] userData.id:', userData.id, 'Tipo:', typeof userData.id);

  // Verificar pelo token JWT primeiro (mais confiável)
  const token = this.authService.getDecodedToken();
  if (token) {
    console.log('🔍 [LAYOUT] Token ID:', token.id, 'Tipo:', typeof token.id);
    const isAdminByToken = token.id === 1 || token.id === '1';
    console.log('🔍 [LAYOUT] É admin pelo token?', isAdminByToken);

    if (isAdminByToken) {
      return true;
    }
  }

  // Fallback: verificar pelos dados do usuário
  const isAdminByData = userData.id === 1 || userData.id === '1';
  console.log('🔍 [LAYOUT] É admin pelos dados?', isAdminByData);

  return isAdminByData;
}

// ✅ ADICIONAR MÉTODO DE DEBUG TEMPORÁRIO
private debugAuth(): void {
  console.log('🔍 [DEBUG] Verificando autenticação...');

  const token = this.authService.getToken();
  console.log('🔍 [DEBUG] Token presente:', !!token);

  if (token) {
    const decodedToken = this.authService.getDecodedToken();
    console.log('🔍 [DEBUG] Token decodificado:', decodedToken);
    console.log('🔍 [DEBUG] User ID no token:', decodedToken?.id, 'Tipo:', typeof decodedToken?.id);
    console.log('🔍 [DEBUG] É admin?', decodedToken?.id === 1 || decodedToken?.id === '1');

    const isAuth = this.authService.isAuthenticated();
    console.log('🔍 [DEBUG] Está autenticado:', isAuth);
  }
}

  /**
   * Verifica se deve mostrar menu admin
   */
  get shouldShowAdminMenu(): boolean {
    return this.userProfile?.isAdmin === true;
  }

  /**
   * Verifica se deve mostrar verificação MMR (usuários não-admin)
   */
  get shouldShowMmrVerification(): boolean {
    return this.userProfile?.isAdmin !== true;
  }
}

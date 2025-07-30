// immortal-live-match.component.ts

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatusService, StatusParseResponse, StatusPlayer } from '../../../core/status.service';
import { GameDataService } from '../../../core/game-data.service';
import { UserService } from '../../../core/user.service';
import { ImmortalService } from '../../../core/immortal.service';
import { RatingDisplayComponent } from '../../../components/rating-display/rating-display.component';
import { ToastrService } from 'ngx-toastr';
import { TranslatePipe } from '../../../pipes/translate.pipe';

interface EnhancedStatusPlayer extends StatusPlayer {
  leaderboardData?: {
    officialName: string;
    rank: number;
    region: string;
    isVerified: boolean;
  };
  nameMatch?: {
    confidence: number;
    suggestions: string[];
  };
  assignedTeam?: 'radiant' | 'dire' | null; // Nova propriedade para team assignment
  evaluationData?: any; // Dados de avaliação do jogador
}

@Component({
  selector: 'app-immortal-live-match',
  standalone: true,
  imports: [CommonModule, FormsModule, RatingDisplayComponent, TranslatePipe],
  templateUrl: './immortal-live-match.component.html',
  styleUrls: ['./immortal-live-match.component.css']
})
export class ImmortalLiveMatchComponent implements OnInit, OnDestroy {

  // ===== DEPENDENCY INJECTION =====
  private statusService = inject(StatusService);
  private userService = inject(UserService);
  protected immortalService = inject(ImmortalService);
  public gameDataService = inject(GameDataService);
  private toastr = inject(ToastrService);

  // ===== COMPONENT STATE =====
  statusInput = '';
  isProcessing = false;
  showInstructions = true;
  matchData: StatusParseResponse | null = null;
  error: string | null = null;

  // ===== IMMORTAL SPECIFIC STATE =====
  enhancedPlayers: EnhancedStatusPlayer[] = [];
  leaderboardData: any = null;
  isEnhancing = false;

  // ===== TEAM ASSIGNMENT STATE =====
  showTeamSelection = false;
  unassignedPlayers: EnhancedStatusPlayer[] = [];

  // ===== MODAL STATE =====
  isDetailModalVisible = false;
  selectedPlayerForDetails: EnhancedStatusPlayer | null = null;

  // ===== USER DATA =====
  userInfo: any = null;

  // ===== TIMER =====
  private reminderTimer: number | null = null;
  private hasPlayedReminder = false;

  // ===== INSTRUCTIONS =====
  instructions: string[] = [
    'Entre em uma partida no Dota 2',
    'Abra o console (F9 ou habilitado nas configurações)',
    'Digite o comando: status',
    'Copie o resultado completo',
    'Cole no campo abaixo e analise'
  ];

  systemTips: string[] = [
    'Como jogador Immortal, esta é a única forma de obter dados de partida',
    'O sistema fará cross-reference automático com leaderboard oficial',
    'Após análise, você poderá assinalar manualmente os times',
    'Jogadores com avaliações aparecem primeiro para facilitar escolha'
  ];

  // ===== LIFECYCLE HOOKS =====
  ngOnInit(): void {
    this.loadUserInfo();
    this.preloadLeaderboard();
    this.startReminderTimer();
  }

  ngOnDestroy(): void {
    if (this.reminderTimer) {
      clearTimeout(this.reminderTimer);
    }
  }

  // ===== INITIALIZATION METHODS =====
  private loadUserInfo(): void {
    this.userService.getUserStats().subscribe({
      next: (user) => {
        this.userInfo = user;
      },
      error: (error) => {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    });
  }

  private preloadLeaderboard(): void {
    const region = this.userInfo?.immortalRegion || 'americas';

    this.immortalService.getLeaderboardData(region).subscribe({
      next: (response) => {
        if (response.success) {
          this.leaderboardData = response;
          console.log(`✅ Leaderboard ${region} pré-carregado:`, response.totalPlayers, 'players');
        } else {
          console.warn(`⚠️ Falha ao pré-carregar leaderboard ${region}`);
        }
      },
      error: (error) => {
        console.error(`❌ Erro ao pré-carregar leaderboard:`, error);
      }
    });
  }

  private startReminderTimer(): void {
    this.reminderTimer = window.setTimeout(() => {
      if (!this.hasPlayedReminder && !this.matchData) {
        this.playReminderNotification();
        this.hasPlayedReminder = true;
      }
    }, 25000);
  }

  private playReminderNotification(): void {
    this.toastr.info(
      'Lembre-se de usar o comando status se estiver em uma partida!',
      'Lembrete Immortal',
      { timeOut: 5000 }
    );
  }

  // ===== MAIN FUNCTIONALITY =====
  analyzeStatus(): void {
    if (!this.statusInput.trim()) {
      this.toastr.warning('Por favor, cole o resultado do comando status');
      return;
    }

    this.isProcessing = true;
    this.error = null;
    this.showInstructions = false;

    this.statusService.parseStatus(this.statusInput).subscribe({
      next: (response: StatusParseResponse) => {
        if (response.success) {
          this.matchData = response;
          this.toastr.success('Status analisado com sucesso!');

          // Enhanced processing for Immortals
          this.enhanceWithLeaderboardData();
        } else {
          this.error = response.error || 'Erro ao processar status';
          this.toastr.error(this.error, 'Erro no Parse');
        }
        this.isProcessing = false;
      },
      error: (error: any) => {
        this.error = 'Erro de conexão com o servidor';
        this.toastr.error(this.error, 'Erro de Rede');
        this.isProcessing = false;
        console.error('Erro ao analisar status:', error);
      }
    });
  }

  // ===== IMMORTAL ENHANCEMENT =====
  private enhanceWithLeaderboardData(): void {
    if (!this.matchData) {
      console.log('⚠️ Dados insuficientes para enhancement');
      return;
    }

    this.isEnhancing = true;
    console.log('🔍 Fazendo cross-reference com leaderboard REAL...');

    // Extrair nomes de todos os players humanos
    const allPlayers = [
      ...this.matchData.teams.radiant,
      ...this.matchData.teams.dire
    ];

    const humanPlayers = allPlayers.filter(p => !p.isBot);

    // Inicializar players enhanceados sem team assignment
    this.enhancedPlayers = humanPlayers.map(player => ({
      ...player,
      assignedTeam: null
    }));

    const playerNames = humanPlayers.map(p => p.name);
    console.log(`📋 Players para verificar no leaderboard:`, playerNames);

    // Buscar na região configurada do usuário
    const region = this.userInfo?.immortalRegion || 'americas';

    this.immortalService.findPlayersInLeaderboard(playerNames, region).subscribe({
      next: (crossReferenceResults) => {
        console.log(`🎯 Cross-reference concluído:`, crossReferenceResults);

        // Enriquecer dados dos players com informações do leaderboard
        this.enhancedPlayers = this.enhancedPlayers.map(player => {
          const enhanced: EnhancedStatusPlayer = { ...player };

          // Buscar resultado do cross-reference
          const leaderboardMatch = crossReferenceResults.find(
            result => result.inputName.toLowerCase() === player.name.toLowerCase()
          );

          if (leaderboardMatch && leaderboardMatch.found && leaderboardMatch.leaderboardData) {
            enhanced.leaderboardData = {
              officialName: leaderboardMatch.leaderboardData.name,
              rank: leaderboardMatch.leaderboardData.rank,
              region: region,
              isVerified: true
            };

            enhanced.nameMatch = {
              confidence: leaderboardMatch.confidence,
              suggestions: []
            };

            console.log(`✅ MATCH ENCONTRADO: ${player.name} -> #${leaderboardMatch.leaderboardData.rank} ${leaderboardMatch.leaderboardData.name}`);
          } else {
            const suggestions = this.findSimilarNames(player.name);
            enhanced.nameMatch = {
              confidence: 0,
              suggestions: suggestions
            };
          }

          return enhanced;
        });

        // Carregar avaliações dos jogadores
        this.loadPlayerEvaluations();

        // Preparar para seleção de times
        this.prepareTeamSelection();

        this.isEnhancing = false;
      },
      error: (error) => {
        console.error('❌ Erro no cross-reference:', error);
        this.isEnhancing = false;
        this.prepareTeamSelection(); // Continuar mesmo sem leaderboard
      }
    });
  }

  private findSimilarNames(playerName: string): string[] {
    if (!this.leaderboardData?.players) return [];

    const cleanName = playerName.toLowerCase().trim();
    return this.leaderboardData.players
      .filter((p: any) => p.name.toLowerCase().includes(cleanName) || cleanName.includes(p.name.toLowerCase()))
      .slice(0, 3)
      .map((p: any) => p.name);
  }

  private loadPlayerEvaluations(): void {
    // TODO: Implementar carregamento de avaliações
    // Por agora, simular alguns dados
    this.enhancedPlayers.forEach(player => {
      // Simular que alguns players têm avaliações
      if (Math.random() > 0.6) {
        player.evaluationData = {
          hasEvaluation: true,
          averageRating: Math.floor(Math.random() * 5) + 1,
          totalEvaluations: Math.floor(Math.random() * 10) + 1
        };
      }
    });
  }

  private prepareTeamSelection(): void {
    // Ordenar jogadores: primeiro os com avaliações, depois por rank immortal, depois por nome
    this.unassignedPlayers = [...this.enhancedPlayers].sort((a, b) => {
      // Prioridade 1: Jogadores com avaliações
      if (a.evaluationData?.hasEvaluation && !b.evaluationData?.hasEvaluation) return -1;
      if (!a.evaluationData?.hasEvaluation && b.evaluationData?.hasEvaluation) return 1;

      // Prioridade 2: Jogadores Immortal (rank menor = melhor)
      if (a.leaderboardData?.rank && !b.leaderboardData?.rank) return -1;
      if (!a.leaderboardData?.rank && b.leaderboardData?.rank) return 1;
      if (a.leaderboardData?.rank && b.leaderboardData?.rank) {
        return a.leaderboardData.rank - b.leaderboardData.rank;
      }

      // Prioridade 3: Ordem alfabética
      return a.name.localeCompare(b.name);
    });

    this.showTeamSelection = true;
    this.toastr.info('Agora assine cada jogador ao time correto usando as setas', 'Seleção de Times', { timeOut: 6000 });
  }

  // ===== TEAM ASSIGNMENT METHODS =====
  assignPlayerToTeam(player: EnhancedStatusPlayer, team: 'radiant' | 'dire'): void {
    const playerIndex = this.enhancedPlayers.findIndex(p => p.name === player.name);
    if (playerIndex !== -1) {
      this.enhancedPlayers[playerIndex].assignedTeam = team;
      this.updateUnassignedPlayers();
    }
  }

  unassignPlayer(player: EnhancedStatusPlayer): void {
    const playerIndex = this.enhancedPlayers.findIndex(p => p.name === player.name);
    if (playerIndex !== -1) {
      this.enhancedPlayers[playerIndex].assignedTeam = null;
      this.updateUnassignedPlayers();
    }
  }

  private updateUnassignedPlayers(): void {
    this.unassignedPlayers = this.enhancedPlayers.filter(p => !p.assignedTeam);
  }

  // ===== HELPER METHODS FOR TEMPLATE =====
  getLeaderboardStatus(): string {
    if (!this.leaderboardData) return 'Não carregado';

    const lastUpdate = new Date(this.leaderboardData.lastUpdate);
    const hoursAgo = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60));

    return `${this.leaderboardData.totalPlayers} players (${hoursAgo}h atrás)`;
  }

  getImmortalPlayersCount(): number {
    return this.enhancedPlayers.filter(p => p.leaderboardData?.isVerified).length;
  }

  getTeamPlayers(team: 'radiant' | 'dire'): EnhancedStatusPlayer[] {
    return this.enhancedPlayers.filter(p => p.assignedTeam === team);
  }

  isImmortalPlayer(player: EnhancedStatusPlayer): boolean {
    return !!player.leaderboardData?.isVerified;
  }

  getImmortalData(player: EnhancedStatusPlayer) {
    return player.leaderboardData;
  }

  hasNameMatch(player: EnhancedStatusPlayer): boolean {
    return !!player.nameMatch && player.nameMatch.confidence > 0;
  }

  getNameMatch(player: EnhancedStatusPlayer) {
    return player.nameMatch;
  }

  hasSuggestions(player: EnhancedStatusPlayer): boolean {
    return !!player.nameMatch?.suggestions && player.nameMatch.suggestions.length > 0;
  }

  getConfidenceClass(confidence: number): string {
    if (confidence >= 80) return 'high-confidence';
    if (confidence >= 50) return 'medium-confidence';
    return 'low-confidence';
  }

  hasPlayerEvaluation(player: EnhancedStatusPlayer): boolean {
    return !!player.evaluationData?.hasEvaluation;
  }

  getPlayerEvaluationInfo(player: EnhancedStatusPlayer): string {
    if (!player.evaluationData) return '';
    return `⭐ ${player.evaluationData.averageRating}/5 (${player.evaluationData.totalEvaluations} avaliações)`;
  }

  // ===== LEADERBOARD ACTIONS =====
  refreshLeaderboard(): void {
    const region = this.userInfo?.immortalRegion || 'americas';

    this.toastr.info(`Atualizando leaderboard ${region}...`, 'Atualizando', { timeOut: 3000 });

    this.immortalService.refreshLeaderboard(region).subscribe({
      next: (response) => {
        if (response.success) {
          this.leaderboardData = response;
          this.toastr.success(`Leaderboard ${region} atualizado!`, 'Atualizado');

          // Re-fazer cross-reference se há uma partida analisada
          if (this.matchData) {
            this.enhanceWithLeaderboardData();
          }
        } else {
          this.toastr.error('Falha ao atualizar leaderboard', 'Erro');
        }
      },
      error: (error) => {
        console.error('❌ Erro ao atualizar leaderboard:', error);
        this.toastr.error('Erro ao atualizar leaderboard', 'Erro');
      }
    });
  }

  // ===== RESET FUNCTIONALITY =====
  resetForm(): void {
    this.statusInput = '';
    this.matchData = null;
    this.enhancedPlayers = [];
    this.unassignedPlayers = [];
    this.showInstructions = true;
    this.showTeamSelection = false;
    this.error = null;
    this.hasPlayedReminder = false;

    this.startReminderTimer();
  }

  // ===== TEAM ASSIGNMENT COMPLETION =====
  isTeamSelectionComplete(): boolean {
    return this.unassignedPlayers.length === 0 && this.enhancedPlayers.length > 0;
  }

  finalizeTeamSelection(): void {
    if (this.isTeamSelectionComplete()) {
      this.showTeamSelection = false;
      this.toastr.success('Times configurados com sucesso!', 'Configuração Completa');
    }
  }
}

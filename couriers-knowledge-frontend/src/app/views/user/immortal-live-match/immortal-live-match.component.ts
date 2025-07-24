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
  private immortalService = inject(ImmortalService);
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

  // ===== MODAL STATE =====
  isDetailModalVisible = false;
  selectedPlayerForDetails: EnhancedStatusPlayer | null = null;

  // ===== USER DATA =====
  userInfo: any = null;

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
    'O sistema fará cross-reference automático com o leaderboard oficial',
    'Nomes oficiais serão comparados com nomes Steam automaticamente'
  ];

  // ===== REMINDER SYSTEM =====
  private reminderTimer: number | null = null;
  private hasPlayedReminder = false;

  // ===== LIFECYCLE HOOKS =====
  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.cleanupComponent();
  }

  // ===== INITIALIZATION =====
  private initializeComponent(): void {
    this.loadUserInfo();
    this.startReminderTimer();
    this.preloadLeaderboardData();
  }

  private cleanupComponent(): void {
    if (this.reminderTimer) {
      clearTimeout(this.reminderTimer);
    }
  }

  private loadUserInfo(): void {
    this.userService.getUserStats().subscribe({
      next: (user: any) => {
        this.userInfo = user;
        console.log('Immortal user loaded:', user);
      },
      error: (error: any) => {
        console.error('Erro ao carregar informações do usuário:', error);
      }
    });
  }

  // ===== LEADERBOARD INTEGRATION =====
  private preloadLeaderboardData(): void {
    if (this.userInfo?.immortalRegion) {
      this.immortalService.getLeaderboardData(this.userInfo.immortalRegion).subscribe({
        next: (data) => {
          this.leaderboardData = data;
          console.log(`Leaderboard ${this.userInfo.immortalRegion} carregado:`, data.players?.length, 'players');
        },
        error: (error) => {
          console.warn('Erro ao carregar leaderboard:', error);
        }
      });
    }
  }

  // ===== REMINDER SYSTEM =====
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
    if (!this.matchData || !this.leaderboardData) {
      console.log('Dados insuficientes para enhancement');
      return;
    }

    this.isEnhancing = true;
    console.log('🔍 Fazendo cross-reference com leaderboard...');

    const allPlayers = [
      ...this.matchData.teams.radiant,
      ...this.matchData.teams.dire
    ];

    this.enhancedPlayers = allPlayers.map(player => {
      const enhanced: EnhancedStatusPlayer = { ...player };

      // Buscar no leaderboard
      const leaderboardMatch = this.findPlayerInLeaderboard(player.name);

      if (leaderboardMatch) {
        enhanced.leaderboardData = {
          officialName: leaderboardMatch.name,
          rank: leaderboardMatch.rank,
          region: this.userInfo.immortalRegion,
          isVerified: true
        };

        // Calcular confiança do match
        enhanced.nameMatch = {
          confidence: this.calculateNameMatchConfidence(player.name, leaderboardMatch.name),
          suggestions: []
        };

        console.log(`✅ Match encontrado: ${player.name} -> ${leaderboardMatch.name} (#${leaderboardMatch.rank})`);
      } else {
        // Buscar sugestões similares
        const suggestions = this.findSimilarNames(player.name);
        enhanced.nameMatch = {
          confidence: 0,
          suggestions: suggestions
        };

        console.log(`❓ Player não encontrado no leaderboard: ${player.name}`);
      }

      return enhanced;
    });

    this.isEnhancing = false;

    // Mostrar resultado do enhancement
    const foundCount = this.enhancedPlayers.filter(p => p.leaderboardData?.isVerified).length;
    this.toastr.info(
      `${foundCount}/10 jogadores encontrados no leaderboard oficial`,
      'Cross-Reference Completo',
      { timeOut: 4000 }
    );
  }

  private findPlayerInLeaderboard(playerName: string): any {
    if (!this.leaderboardData?.players) return null;

    // Busca exata primeiro
    let match = this.leaderboardData.players.find((p: any) =>
      p.name.toLowerCase() === playerName.toLowerCase()
    );

    if (match) return match;

    // Busca sem caracteres especiais
    const cleanPlayerName = playerName.replace(/[^\w\s]/g, '').toLowerCase();
    match = this.leaderboardData.players.find((p: any) =>
      p.name.replace(/[^\w\s]/g, '').toLowerCase() === cleanPlayerName
    );

    return match || null;
  }

  private calculateNameMatchConfidence(playerName: string, officialName: string): number {
    if (playerName.toLowerCase() === officialName.toLowerCase()) return 100;

    // Algoritmo simples de similaridade
    const clean1 = playerName.replace(/[^\w]/g, '').toLowerCase();
    const clean2 = officialName.replace(/[^\w]/g, '').toLowerCase();

    if (clean1 === clean2) return 95;
    if (clean1.includes(clean2) || clean2.includes(clean1)) return 85;

    return 70; // Match parcial
  }

  private findSimilarNames(playerName: string): string[] {
    if (!this.leaderboardData?.players) return [];

    const cleanName = playerName.replace(/[^\w]/g, '').toLowerCase();

    return this.leaderboardData.players
      .filter((p: any) => {
        const cleanLeaderboard = p.name.replace(/[^\w]/g, '').toLowerCase();
        return cleanLeaderboard.includes(cleanName) || cleanName.includes(cleanLeaderboard);
      })
      .slice(0, 3)
      .map((p: any) => p.name);
  }

  // ===== FORM CONTROLS =====
  resetForm(): void {
    this.statusInput = '';
    this.matchData = null;
    this.enhancedPlayers = [];
    this.error = null;
    this.showInstructions = true;
    this.closeAllModals();

    // Reiniciar timer de lembrete
    this.hasPlayedReminder = false;
    if (this.reminderTimer) {
      clearTimeout(this.reminderTimer);
    }
    this.startReminderTimer();
  }

  // ===== MODAL MANAGEMENT =====
  showPlayerDetails(player: EnhancedStatusPlayer): void {
    this.selectedPlayerForDetails = player;
    this.isDetailModalVisible = true;
  }

  closeDetailModal(): void {
    this.isDetailModalVisible = false;
    this.selectedPlayerForDetails = null;
  }

  closeAllModals(): void {
    this.closeDetailModal();
  }

  // ===== UTILITY METHODS =====
  formatRating(rating: number): string {
    return this.statusService.formatRating(rating);
  }

  getRatingColor(rating: number): string {
    return this.statusService.getRatingColor(rating);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // ===== STATE GETTERS =====
  hasEvaluations(): boolean {
    return (this.matchData?.evaluationsSummary?.totalFound ?? 0) > 0;
  }

  getMatchStatistics() {
    return this.matchData?.statistics || {
      totalPlayers: 0,
      humanPlayers: 0,
      botPlayers: 0,
      evaluatedPlayers: 0
    };
  }

  isLoading(): boolean {
    return this.isProcessing || this.isEnhancing;
  }

  hasError(): boolean {
    return !!this.error;
  }

  // ===== ENHANCED GETTERS FOR TEMPLATE =====
  getImmortalPlayersCount(): number {
    return this.enhancedPlayers.filter(p => p.leaderboardData?.isVerified).length;
  }

  getEnhancedPlayersByTeam(team: 'radiant' | 'dire'): EnhancedStatusPlayer[] {
    return this.enhancedPlayers.filter(p => p.team === team);
  }
}

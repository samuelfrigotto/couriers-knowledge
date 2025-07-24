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
    this.loadUserInfo();
    this.startReminderTimer();
    this.preloadLeaderboardData();
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
    const region = this.userInfo?.immortalRegion || 'americas';
    
    console.log(`📋 Pré-carregando leaderboard ${region}...`);
    
    this.immortalService.getLeaderboardData(region).subscribe({
      next: (response) => {
        if (response.success) {
          console.log(`✅ Leaderboard ${region} pré-carregado: ${response.totalPlayers} players`);
          this.leaderboardData = response;
        } else {
          console.warn(`⚠️ Falha ao pré-carregar leaderboard ${region}`);
        }
      },
      error: (error) => {
        console.error(`❌ Erro ao pré-carregar leaderboard:`, error);
      }
    });
  }

  refreshLeaderboard(): void {
    const region = this.userInfo?.immortalRegion || 'americas';
    
    this.toastr.info(`Atualizando leaderboard ${region}... Isso pode demorar alguns segundos.`, 'Atualizando', { timeOut: 3000 });
    
    this.immortalService.refreshLeaderboard(region).subscribe({
      next: (response) => {
        if (response.success) {
          this.leaderboardData = response;
          this.toastr.success(`Leaderboard ${region} atualizado com ${response.totalPlayers} players!`, 'Atualizado');
          
          // Se há uma partida analisada, refazer o cross-reference
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
    const playerNames = humanPlayers.map(p => p.name);

    console.log(`📋 Players para verificar no leaderboard:`, playerNames);

    // Buscar na região configurada do usuário (ou americas como padrão)
    const region = this.userInfo?.immortalRegion || 'americas';

    this.immortalService.findPlayersInLeaderboard(playerNames, region).subscribe({
      next: (crossReferenceResults) => {
        console.log(`🎯 Cross-reference concluído:`, crossReferenceResults);

        // Enriquecer dados dos players com informações do leaderboard
        this.enhancedPlayers = humanPlayers.map(player => {
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

            console.log(`✅ MATCH ENCONTRADO: ${player.name} -> #${leaderboardMatch.leaderboardData.rank} ${leaderboardMatch.leaderboardData.name} (${leaderboardMatch.confidence}% confiança)`);
          } else {
            // Tentar buscar sugestões similares
            const suggestions = this.findSimilarNames(player.name);
            
            enhanced.nameMatch = {
              confidence: 0,
              suggestions: suggestions
            };

            console.log(`❌ Player não encontrado no leaderboard: ${player.name}`);
            if (suggestions.length > 0) {
              console.log(`💡 Sugestões similares:`, suggestions);
            }
          }

          return enhanced;
        });

        // Estatísticas finais
        const immortalsFound = this.enhancedPlayers.filter(p => p.leaderboardData?.isVerified).length;
        const totalPlayers = this.enhancedPlayers.length;

        console.log(`🏆 RESULTADO FINAL: ${immortalsFound}/${totalPlayers} players encontrados no leaderboard Immortal ${region.toUpperCase()}`);

        if (immortalsFound > 0) {
          console.log('🎮 Players Immortal na partida:');
          this.enhancedPlayers
            .filter(p => p.leaderboardData?.isVerified)
            .forEach(p => {
              console.log(`   #${p.leaderboardData!.rank}: ${p.leaderboardData!.officialName} (time: ${p.team})`);
            });

          this.toastr.success(
            `${immortalsFound} player(s) Immortal encontrado(s) no leaderboard!`,
            '🏆 Players Immortal Detectados',
            { timeOut: 8000 }
          );
        } else {
          this.toastr.info(
            'Nenhum player desta partida está no top 1000 Immortal da região.',
            '📊 Análise Concluída',
            { timeOut: 5000 }
          );
        }

        this.isEnhancing = false;
      },
      error: (error) => {
        console.error('❌ Erro no cross-reference:', error);
        this.toastr.error('Erro ao verificar players no leaderboard', 'Erro');
        this.isEnhancing = false;
      }
    });
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

   getLeaderboardStatus(): string {
    if (!this.leaderboardData) return 'Não carregado';
    if (this.immortalService.isLoading) return 'Carregando...';
    
    const source = this.leaderboardData.source === 'database' ? 'Cache' : 'Tempo Real';
    const updatedAt = new Date(this.leaderboardData.lastUpdated).toLocaleTimeString('pt-BR');
    
    return `${source} - ${this.leaderboardData.totalPlayers} players (${updatedAt})`;
  }

}

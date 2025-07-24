// couriers-knowledge-frontend/src/app/views/user/live-match/live-match.component.ts

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatusService, StatusParseResponse, StatusPlayer } from '../../../core/status.service';
import { GameDataService } from '../../../core/game-data.service';
import { UserService } from '../../../core/user.service';
import { RatingDisplayComponent } from '../../../components/rating-display/rating-display.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-live-match',
  standalone: true,
  imports: [CommonModule, FormsModule, RatingDisplayComponent],
  templateUrl: './live-match.component.html',
  styleUrls: ['./live-match.component.css']
})
export class LiveMatchComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID); // ← ADICIONAR
  // ===== VIEW REFERENCES =====
  @ViewChild('notificationSound') notificationSound!: ElementRef<HTMLAudioElement>;

  // ===== DEPENDENCY INJECTION =====
  private statusService = inject(StatusService);
  private userService = inject(UserService);
  public gameDataService = inject(GameDataService);
  private toastr = inject(ToastrService);

  // ===== COMPONENT STATE =====
  statusInput = '';
  isProcessing = false;
  showInstructions = true;
  matchData: StatusParseResponse | null = null;
  error: string | null = null;

  // ===== MODAL STATE =====
  isDetailModalVisible = false;
  selectedPlayerForDetails: StatusPlayer | null = null;

  // ===== USER DATA =====
  userInfo: any = null;

  // ===== INSTRUCTIONS & TIPS =====
  instructions: string[] = [];
  systemTips: string[] = [];

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

  // ===== INITIALIZATION METHODS =====

  private initializeComponent(): void {
    this.loadInstructions();
    this.loadUserInfo();
    if (isPlatformBrowser(this.platformId)) {
      this.startReminderTimer();
    }
  }

  private cleanupComponent(): void {
    if (this.reminderTimer) {
      clearTimeout(this.reminderTimer);
    }
  }

  private loadInstructions(): void {
    this.instructions = [
      'Abra o Dota 2 e entre em uma partida',
      'Abra o console (precisa estar habilitado nas configurações)',
      'Digite o comando: status',
      'Copie o texto a partir da linha "status Server: Running"',
      'Até a linha "[Client] #end"',
      'Cole no campo ao lado',
      'Clique em Analisar Status'
    ];

    this.systemTips = [
      'O sistema compara nomes exatos dos jogadores',
      'Nomes são atualizados automaticamente da Steam',
      'Página para Immortal Draft está em desenvolvimento'
    ];
  }

  private loadUserInfo(): void {
    this.userService.getUserStats().subscribe({
      next: (userStats: any) => {
        this.userInfo = userStats;

        // Fallbacks para campos obrigatórios
        if (!this.userInfo.account_status) {
          this.userInfo.account_status = 'Free';
        }

        if (!this.userInfo.created_at) {
          this.userInfo.created_at = new Date().toISOString();
        }
      },
      error: (error: any) => {
        console.error('Erro ao carregar informações do usuário:', error);
        // Fallback em caso de erro - usuário Free novo
        this.userInfo = {
          account_status: 'Free',
          created_at: new Date().toISOString()
        };
      }
    });
  }

  // ===== REMINDER SYSTEM METHODS =====

  private startReminderTimer(): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.log('🔍 [LIVE MATCH] SSR detectado, não iniciando timer');
      return;
    }

    if (typeof window === 'undefined') {
      console.log('🔍 [LIVE MATCH] Window não disponível, não iniciando timer');
      return;
    }

    this.reminderTimer = window.setTimeout(() => {
      if (!this.hasPlayedReminder && !this.matchData) {
        this.playReminderNotification();
        this.hasPlayedReminder = true;
      }
    }, 25000); // 25 segundos
  }

  private playReminderNotification(): void {
    try {
      // Tentar reproduzir som
      if (this.notificationSound?.nativeElement) {
        this.notificationSound.nativeElement.play().catch((error: any) => {
          console.log('Não foi possível tocar o som de lembrete:', error);
        });
      }

      // Mostrar notificação visual
      this.toastr.info(
        'Não se esqueça de colar o comando status se estiver em uma partida!',
        'Lembrete',
        { timeOut: 5000 }
      );
    } catch (error) {
      console.log('Erro ao reproduzir lembrete:', error);
    }
  }

  // ===== ACCESS CONTROL METHODS =====

  canViewDetails(): boolean {
    if (!this.userInfo) return false;

    // Premium users can always see details
    if (this.userInfo.account_status === 'Premium') {
      return true;
    }

    // New users (< 7 days) can see details
    const accountCreationDate = new Date(this.userInfo.created_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return accountCreationDate > sevenDaysAgo;
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

  resetForm(): void {
    this.statusInput = '';
    this.matchData = null;
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

  showPlayerDetails(player: StatusPlayer): void {
    if (!this.canViewDetails()) {
      this.toastr.info(
        'Upgrade para Premium ou use nos primeiros 7 dias para ver detalhes das avaliações',
        'Acesso Restrito'
      );
      return;
    }

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

  isBot(player: StatusPlayer): boolean {
    return player.isBot;
  }

  getTeamClass(player: StatusPlayer): string {
    return player.team === 'radiant' ? 'radiant' : 'dire';
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
    return this.isProcessing;
  }

  hasError(): boolean {
    return !!this.error;
  }

  clearError(): void {
    this.error = null;
  }

  getStatusMessage(): string {
    if (this.isProcessing) {
      return 'Processando status do Dota 2...';
    }

    if (this.error) {
      return this.error;
    }

    if (this.matchData) {
      const stats = this.matchData.statistics;
      return `Análise completa: ${stats.evaluatedPlayers}/${stats.humanPlayers} jogadores com avaliações`;
    }

    return 'Cole o comando status do Dota 2 para começar';
  }

  // ===== VALIDATION METHODS =====

  canAnalyze(): boolean {
    return !!this.statusInput && !this.isProcessing;
  }

  canClear(): boolean {
    return !!this.statusInput && !this.isProcessing;
  }

  canReset(): boolean {
    return !!this.matchData;
  }
}

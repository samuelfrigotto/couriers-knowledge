// couriers-knowledge-frontend/src/app/views/user/live-match/live-match.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatusService, StatusParseResponse, StatusPlayer } from '../../../core/status.service';
import { GameDataService } from '../../../core/game-data.service';
import { EvaluationService } from '../../../core/evaluation.service';
import { RatingDisplayComponent } from '../../../components/rating-display/rating-display.component';
import { EvaluationFormComponent } from '../../../components/evaluation-form/evaluation-form.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-live-match',
  standalone: true,
  imports: [CommonModule, FormsModule, RatingDisplayComponent, EvaluationFormComponent],
  templateUrl: './live-match.component.html',
  styleUrls: ['./live-match.component.css']
})
export class LiveMatchComponent implements OnInit {
  private statusService = inject(StatusService);
  public gameDataService = inject(GameDataService);
  private evaluationService = inject(EvaluationService);
  private toastr = inject(ToastrService);

  // Estado do formulário
  statusInput = '';
  isProcessing = false;
  showInstructions = true;

  // Dados da partida
  matchData: StatusParseResponse | null = null;
  error: string | null = null;

  // Modal de avaliação
  isEvaluationModalVisible = false;
  selectedPlayerForEvaluation: any = null;

  // Modal de detalhes
  isDetailModalVisible = false;
  selectedPlayerForDetails: StatusPlayer | null = null;

  // Estado dos limites
  evaluationStatus: any = null;
  isLimitReached = false;

  // Instruções e dicas
  instructions: string[] = [];
  systemTips: string[] = [];

  ngOnInit(): void {
    this.loadInstructions();
    this.checkEvaluationLimit();
  }

  /**
   * Carrega as instruções e dicas do sistema
   */
  private loadInstructions(): void {
    this.instructions = this.statusService.getStatusInstructions();
    this.systemTips = this.statusService.getSystemTips();
  }

  /**
   * Verifica o limite de avaliações do usuário
   */
  private checkEvaluationLimit(): void {
    this.evaluationService.getEvaluationStatus().subscribe({
      next: (status) => {
        this.evaluationStatus = status;
        this.isLimitReached = status.isLimitReached || false;
      },
      error: (error) => {
        console.error('Erro ao verificar limite de avaliações:', error);
        this.isLimitReached = false;
      }
    });
  }

  /**
   * Processa o comando status colado pelo usuário
   */
  analyzeStatus(): void {
    // Validação inicial
    const validation = this.statusService.validateStatusInput(this.statusInput);
    if (!validation.valid) {
      this.error = validation.error || 'Input inválido';
      this.toastr.error(this.error, 'Erro de Validação');
      return;
    }

    this.isProcessing = true;
    this.error = null;

    this.statusService.parseStatus(this.statusInput).subscribe({
      next: (response) => {
        if (response.success) {
          this.matchData = response;
          this.showInstructions = false;
          this.toastr.success(
            `${response.statistics.evaluatedPlayers}/${response.statistics.humanPlayers} jogadores com avaliações`,
            'Status Analisado!'
          );
        } else {
          this.error = response.error || 'Erro ao processar status';
          this.toastr.error(this.error, 'Erro no Parse');
        }
        this.isProcessing = false;
      },
      error: (error) => {
        this.error = 'Erro de conexão com o servidor';
        this.toastr.error(this.error, 'Erro de Rede');
        this.isProcessing = false;
        console.error('Erro ao analisar status:', error);
      }
    });
  }

  /**
   * Reseta o formulário para uma nova análise
   */
  resetForm(): void {
    this.statusInput = '';
    this.matchData = null;
    this.error = null;
    this.showInstructions = true;
    this.closeAllModals();
  }

  /**
   * Mostra detalhes de um jogador
   */
  showPlayerDetails(player: StatusPlayer): void {
    this.selectedPlayerForDetails = player;
    this.isDetailModalVisible = true;
  }

  /**
   * Fecha o modal de detalhes
   */
  closeDetailModal(): void {
    this.isDetailModalVisible = false;
    this.selectedPlayerForDetails = null;
  }

  /**
   * Abre modal para avaliar um jogador
   */
  evaluatePlayer(player: StatusPlayer): void {
    if (this.isLimitReached) {
      this.toastr.warning('Limite de avaliações atingido', 'Limite Atingido');
      return;
    }

    // Preparar dados para o formulário de avaliação
    // Como o componente de avaliação espera 'evaluationData', criamos um objeto compatível
    this.selectedPlayerForEvaluation = {
      targetPlayerName: player.name,
      // Outros campos podem ser adicionados conforme necessário
    };

    this.isEvaluationModalVisible = true;
  }

  /**
   * Fecha o modal de avaliação
   */
  closeEvaluationModal(): void {
    this.isEvaluationModalVisible = false;
    this.selectedPlayerForEvaluation = null;
  }

  /**
   * Fecha todos os modais
   */
  closeAllModals(): void {
    this.closeDetailModal();
    this.closeEvaluationModal();
  }

  /**
   * Callback quando uma avaliação é salva
   */
  onEvaluationSaved(): void {
    this.closeEvaluationModal();
    this.toastr.success('Avaliação salva com sucesso!', 'Sucesso');

    // Recarregar os dados para mostrar a nova avaliação
    if (this.statusInput && this.matchData) {
      this.analyzeStatus();
    }

    // Verificar novamente o limite
    this.checkEvaluationLimit();
  }

  /**
   * Formata rating para exibição
   */
  formatRating(rating: number): string {
    return this.statusService.formatRating(rating);
  }

  /**
   * Retorna cor baseada na rating
   */
  getRatingColor(rating: number): string {
    return this.statusService.getRatingColor(rating);
  }

  /**
   * Formata data para exibição
   */
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

  /**
   * Verifica se um jogador é bot
   */
  isBot(player: StatusPlayer): boolean {
    return player.isBot;
  }

  /**
   * Retorna classe CSS baseada no time
   */
  getTeamClass(player: StatusPlayer): string {
    return player.team === 'radiant' ? 'radiant' : 'dire';
  }

  /**
   * Verifica se há avaliações para mostrar
   */
  hasEvaluations(): boolean {
    return (this.matchData?.evaluationsSummary?.totalFound ?? 0) > 0;
  }

  /**
   * Retorna estatísticas da partida
   */
  getMatchStatistics() {
    return this.matchData?.statistics || {
      totalPlayers: 0,
      humanPlayers: 0,
      botPlayers: 0,
      evaluatedPlayers: 0
    };
  }

  /**
   * Verifica se está processando
   */
  isLoading(): boolean {
    return this.isProcessing;
  }

  /**
   * Verifica se há erro
   */
  hasError(): boolean {
    return !!this.error;
  }

  /**
   * Limpa erro
   */
  clearError(): void {
    this.error = null;
  }

  /**
   * Retorna mensagem de status para o usuário
   */
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

  /**
   * Verifica se pode analisar o status
   */
  canAnalyze(): boolean {
    return !!this.statusInput && !this.isProcessing;
  }

  /**
   * Verifica se pode limpar o campo
   */
  canClear(): boolean {
    return !!this.statusInput && !this.isProcessing;
  }

  /**
   * Verifica se pode fazer nova análise
   */
  canReset(): boolean {
    return !!this.matchData;
  }
}

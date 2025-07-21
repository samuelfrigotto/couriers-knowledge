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

  ngOnInit(): void {
    this.checkEvaluationLimit();
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
          console.log('✅ Status processado:', response);
        } else {
          this.error = response.error || 'Erro ao processar status';
          this.toastr.error(this.error, 'Erro');
        }
        this.isProcessing = false;
      },
      error: (err) => {
        console.error('❌ Erro ao analisar status:', err);
        this.error = err.error?.error || 'Erro ao comunicar com o servidor';
        this.toastr.error(this.error!, 'Erro');
        this.isProcessing = false;
      }
    });
  }

  /**
   * Limpa os dados e volta para o formulário
   */
  resetForm(): void {
    this.statusInput = '';
    this.matchData = null;
    this.error = null;
    this.showInstructions = true;
  }

  /**
   * Abre modal com detalhes das avaliações de um jogador
   */
  showPlayerDetails(player: StatusPlayer): void {
    if (!player.hasEvaluations) return;

    this.selectedPlayerForDetails = player;
    this.isDetailModalVisible = true;
  }

  /**
   * Fecha modal de detalhes
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
      this.toastr.error(
        'Limite de avaliações atingido! Considere fazer upgrade para Premium.',
        'Limite Atingido',
        { timeOut: 8000 }
      );
      return;
    }

    // Preparar dados iniciais para o formulário
    // Como não temos Steam ID, só passamos o nome
    this.selectedPlayerForEvaluation = {
      targetPlayerName: player.name,
      // Outros campos ficarão em branco para o usuário preencher
    };

    this.isEvaluationModalVisible = true;
  }

  /**
   * Fecha modal de avaliação
   */
  closeEvaluationModal(): void {
    this.isEvaluationModalVisible = false;
    this.selectedPlayerForEvaluation = null;
  }

  /**
   * Callback quando avaliação é salva
   */
  onEvaluationSaved(): void {
    this.closeEvaluationModal();
    this.checkEvaluationLimit();

    // Reprocessar status para atualizar avaliações
    if (this.statusInput) {
      this.analyzeStatus();
    }
  }

  /**
   * Callback para erros no formulário de avaliação
   */
  onEvaluationError(error: any): void {
    if (error.status === 403) {
      this.checkEvaluationLimit();
    }
  }

  /**
   * Verifica limite de avaliações
   */
  private checkEvaluationLimit(): void {
    this.evaluationService.getEvaluationStatus().subscribe({
      next: (status) => {
        this.evaluationStatus = status;
        this.isLimitReached = status.limitReached;
      },
      error: (err) => {
        console.error('Erro ao verificar limite de avaliações:', err);
      }
    });
  }

  /**
   * Retorna instruções de uso
   */
  get instructions(): string[] {
    return this.statusService.getStatusInstructions();
  }

  /**
   * Retorna dicas do sistema
   */
  get systemTips(): string[] {
    return this.statusService.getSystemTips();
  }

  /**
   * Formata rating para exibição
   */
  formatRating(rating: number): string {
    return this.statusService.formatRating(rating);
  }

  /**
   * Retorna cor da rating
   */
  getRatingColor(rating: number): string {
    return this.statusService.getRatingColor(rating);
  }

  /**
   * Retorna classe CSS da rating
   */
  getRatingClass(rating: number): string {
    return this.statusService.getRatingClass(rating);
  }

  /**
   * Formata data para exibição
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Hoje';
    } else if (diffDays === 2) {
      return 'Ontem';
    } else if (diffDays <= 7) {
      return `${diffDays} dias atrás`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  }
}

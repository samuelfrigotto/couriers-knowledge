// Arquivo: recent-matches.component.ts - VERSÃO 100% TRADUZIDA

import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ImageFallbackDirective } from '../../../core/directives/image-fallback.directive';
// Serviços
import { SteamService } from '../../../core/steam.service';
import { GameDataService } from '../../../core/game-data.service';
import { MatchDataService } from '../../../core/match-data.service';
import { EvaluationService } from '../../../core/evaluation.service';
import { I18nService } from '../../../core/i18n.service'; // ← ADICIONAR

// Componentes e Pipes
import { EvaluationFormComponent } from '../../../components/evaluation-form/evaluation-form.component';
import { FilterByPropertyPipe } from '../../../pipes/filter-by-property.pipe';
import { EmptyStateComponent } from '../../../components/empty-state/empty-state.component';
import { TranslatePipe } from '../../../pipes/translate.pipe'; // ← ADICIONAR

@Component({
  selector: 'app-recent-matches',
  standalone: true,
  imports: [
    CommonModule,
    EvaluationFormComponent,
    DecimalPipe,
    DatePipe,
    FilterByPropertyPipe,
    EmptyStateComponent,
    TranslatePipe,
    ImageFallbackDirective  
  ],
  templateUrl: './recent-matches.component.html',
  styleUrls: ['./recent-matches.component.css']
})
export class RecentMatchesComponent {
  // --- INJEÇÃO DE DEPENDÊNCIAS ---
  public gameDataService = inject(GameDataService);
  private toastr = inject(ToastrService);
  private steamService = inject(SteamService);
  private matchDataService = inject(MatchDataService);
  private evaluationService = inject(EvaluationService);
  private i18nService = inject(I18nService); // ← ADICIONAR

  // --- ESTADO REATIVO PARA A LISTA ---
  matches$: Observable<any[]>;
  isLoading$: Observable<boolean>;

  // --- ESTADO LOCAL PARA A VISÃO DE DETALHES ---
  selectedMatch: any = null;
  isDetailsLoading = false;

  // --- ESTADO LOCAL PARA O FORMULÁRIO ---
  isFormVisible = false;
  evaluationInitialData: any = null;

  // --- CONTROLE DE LIMITE DE AVALIAÇÕES ---
  public evaluationStatus: any = null;
  public isLimitReached = false;

  constructor() {
    this.matches$ = this.matchDataService.matches$;
    this.isLoading$ = this.matchDataService.isLoading$;

    // Verificar limite ao inicializar
    this.checkEvaluationLimit();
  }

  /**
   * Verifica o limite de avaliações do usuário
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
   * Visualiza os detalhes de uma partida específica
   */
  viewMatchDetails(matchId: string): void {
    this.isDetailsLoading = true;
    this.selectedMatch = { match_id: matchId };
    this.steamService.getMatchDetails(matchId).subscribe({
      next: (details) => {
        this.selectedMatch = details;
        this.isDetailsLoading = false;
      },
      error: (err) => {
        this.isDetailsLoading = false;
        this.selectedMatch = null;
        // ✅ TRADUZIDO
        this.toastr.error(this.i18nService.translate('matches.errors.loadDetails'));
        console.error('Erro ao carregar detalhes:', err);
      }
    });
  }

  /**
   * Volta para a lista de partidas
   */
  backToMatches(): void {
    this.selectedMatch = null;
  }

  /**
   * Abre o formulário de avaliação para um jogador específico
   */
  evaluatePlayer(player: any): void {
    if (this.isLimitReached) {
      // ✅ TRADUZIDO
      this.toastr.warning(this.i18nService.translate('matches.errors.limitReached'));
      return;
    }

    if (!player.steam_id_64) {
      // ✅ TRADUZIDO
      this.toastr.error(this.i18nService.translate('matches.errors.anonymousPlayer'));
      return;
    }

    if (player.is_already_evaluated) {
      // ✅ TRADUZIDO
      this.toastr.info(this.i18nService.translate('matches.errors.alreadyEvaluated'));
      return;
    }

    // Configurar dados iniciais para o formulário
    this.evaluationInitialData = {
      targetPlayerName: player.personaname || 'Jogador Anônimo',
      targetSteamId: player.steam_id_64,
      target_player_steam_id: player.steam_id_64,
      matchId: this.selectedMatch.match_id,
      match_id: this.selectedMatch.match_id,
      hero_id: player.hero_id,
      rating: null,
      notes: null,
      tags: [],
      role: null
    };

    console.log('📋 Dados preparados:', this.evaluationInitialData);
    this.isFormVisible = true;
  }

  /**
   * Fecha o formulário de avaliação
   */
  closeForm(): void {
    this.isFormVisible = false;
    this.evaluationInitialData = null;
  }

  /**
   * Callback executado quando uma avaliação é salva com sucesso
   */
  onEvaluationSaved(): void {

  // ✅ TOAST TRADUZIDO (único toast)
  this.toastr.success(this.i18nService.translate('matches.success.evaluationSaved'));
  this.closeForm();

      setTimeout(() => {
      window.location.reload();
    }, 1500); // Aguarda 1.5s para o usuário ver o toast de sucesso

  // ✅ ATUALIZAR O STATUS DO JOGADOR COMO AVALIADO
  if (this.selectedMatch && this.evaluationInitialData) {
    console.log('🔍 Procurando jogador para atualizar...');

    // Pegar o Steam ID correto
    const targetSteamId = this.evaluationInitialData.targetSteamId ||
                         this.evaluationInitialData.target_player_steam_id;

    console.log('🆔 Steam ID procurado:', targetSteamId);

    const player = this.selectedMatch.players.find((p: any) => {
      console.log(`👤 Comparando: ${p.steam_id_64} === ${targetSteamId}`);
      return p.steam_id_64 === targetSteamId;
    });

    if (player) {
      console.log('✅ Jogador encontrado, marcando como avaliado:', player.personaname);
      player.is_already_evaluated = true;
    } else {
      console.warn('❌ Jogador não encontrado para marcar como avaliado');
      console.log('📋 Jogadores disponíveis:', this.selectedMatch.players.map((p: any) => ({
        name: p.personaname,
        steam_id: p.steam_id_64
      })));
    }

  }

  // Recarregar status de limite
  this.checkEvaluationLimit();
}

  /**
   * Callback executado quando ocorre erro ao salvar avaliação
   */
  onEvaluationError(error: any): void {
    // ✅ TRADUZIDO
    const errorMessage = error.message || this.i18nService.translate('matches.errors.saveEvaluation');
    this.toastr.error(errorMessage);
    console.error('Erro na avaliação:', error);
  }

  /**
   * Retorna o tooltip apropriado para o botão de avaliação
   */
  getEvaluationTooltip(player: any): string {
    if (player.is_already_evaluated) {
      return this.i18nService.translate('matches.errors.alreadyEvaluated');
    }
    if (!player.steam_id_64) {
      return this.i18nService.translate('matches.errors.anonymousPlayer');
    }
    if (this.isLimitReached) {
      return this.i18nService.translate('matches.errors.limitReached');
    }
    return this.i18nService.translate('matches.evaluation.evaluate');
  }

  /**
   * Abre a análise da partida no Stratz
   * @param matchId ID da partida
   */
  openStratzAnalysis(matchId: string): void {
    // URL do Stratz para análise detalhada da partida
    const stratzUrl = `https://stratz.com/matches/${matchId}`;

    // Abre em nova aba
    window.open(stratzUrl, '_blank', 'noopener,noreferrer');
  }

  /**
   * Callback para ações do empty state
   */
  onEmptyStateAction(event: any): void {
    if (event.detail.type === 'matches') {
      // Redirecionar para configuração do GSI ou tutorial
      console.log('Ação do empty state:', event.detail);
      // this.router.navigate(['/gsi-setup']);
    }
  }
}

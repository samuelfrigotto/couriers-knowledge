// Arquivo: couriers-knowledge-frontend/src/app/views/user/recent-matches/recent-matches.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

// Serviços
import { SteamService } from '../../../core/steam.service';
import { GameDataService } from '../../../core/game-data.service';
import { MatchDataService } from '../../../core/match-data.service';
import { EvaluationService } from '../../../core/evaluation.service';

// Componentes e Pipes
import { EvaluationFormComponent } from '../../../components/evaluation-form/evaluation-form.component';
import { FilterByPropertyPipe } from '../../../pipes/filter-by-property.pipe';
import { EmptyStateComponent } from '../../../components/empty-state/empty-state.component';


@Component({
  selector: 'app-recent-matches',
  standalone: true,
  imports: [CommonModule, EvaluationFormComponent, DecimalPipe, DatePipe, FilterByPropertyPipe, EmptyStateComponent],
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
        this.toastr.error('Não foi possível carregar os detalhes desta partida.');
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
      this.toastr.warning('Você atingiu o limite de avaliações. Considere assinar o Premium para avaliar mais jogadores.');
      return;
    }

    if (!player.steam_id_64) {
      this.toastr.error('Não é possível avaliar jogadores anônimos.');
      return;
    }

    if (player.is_already_evaluated) {
      this.toastr.info('Você já avaliou este jogador nesta partida.');
      return;
    }

    // Configurar dados iniciais para o formulário
    this.evaluationInitialData = {
      playerName: player.personaname || 'Jogador Anônimo',
      steamId: player.steam_id_64,
      matchId: this.selectedMatch.match_id,
      heroId: player.hero_id
    };

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
    this.toastr.success('Avaliação salva com sucesso!');
    this.closeForm();

    // Atualizar o status do jogador como avaliado
    if (this.selectedMatch && this.evaluationInitialData) {
      const player = this.selectedMatch.players.find((p: any) =>
        p.steam_id_64 === this.evaluationInitialData.steamId
      );
      if (player) {
        player.is_already_evaluated = true;
      }
    }

    // Recarregar status de limite
    this.checkEvaluationLimit();
  }

  /**
   * Callback executado quando ocorre erro ao salvar avaliação
   */
  onEvaluationError(error: any): void {
    this.toastr.error(error.message || 'Erro ao salvar avaliação.');
    console.error('Erro na avaliação:', error);
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


  onEmptyStateAction(event: any): void {
    if (event.detail.type === 'matches') {
      // Redirecionar para configuração do GSI ou tutorial
      console.log('Ação do empty state:', event.detail);
      // this.router.navigate(['/gsi-setup']);
    }
  }
}

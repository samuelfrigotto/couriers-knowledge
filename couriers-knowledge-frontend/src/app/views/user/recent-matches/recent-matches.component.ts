// Arquivo: couriers-knowledge-frontend/src/app/views/user/recent-matches/recent-matches.component.ts
// SUBSTITUIR o arquivo completo por esta versão

import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

// Serviços
import { SteamService } from '../../../core/steam.service';
import { GameDataService } from '../../../core/game-data.service';
import { MatchDataService } from '../../../core/match-data.service';
import { EvaluationService } from '../../../core/evaluation.service'; // ✅ ADICIONAR

// Componentes e Pipes
import { EvaluationFormComponent } from '../../../components/evaluation-form/evaluation-form.component';
import { FilterByPropertyPipe } from '../../../pipes/filter-by-property.pipe';

@Component({
  selector: 'app-recent-matches',
  standalone: true,
  imports: [CommonModule, EvaluationFormComponent, DecimalPipe, DatePipe, FilterByPropertyPipe],
  templateUrl: './recent-matches.component.html',
  styleUrls: ['./recent-matches.component.css']
})
export class RecentMatchesComponent {
  // --- INJEÇÃO DE DEPENDÊNCIAS ---
  public gameDataService = inject(GameDataService);
  private toastr = inject(ToastrService);
  private steamService = inject(SteamService);
  private matchDataService = inject(MatchDataService);
  private evaluationService = inject(EvaluationService); // ✅ ADICIONAR

  // --- ESTADO REATIVO PARA A LISTA ---
  matches$: Observable<any[]>;
  isLoading$: Observable<boolean>;

  // --- ESTADO LOCAL PARA A VISÃO DE DETALHES ---
  selectedMatch: any = null;
  isDetailsLoading = false;

  // --- ESTADO LOCAL PARA O FORMULÁRIO ---
  isFormVisible = false;
  evaluationInitialData: any = null;

  // ✅ ADICIONAR: Controle de limite de avaliações
  public evaluationStatus: any = null;
  public isLimitReached = false;

  constructor() {
    this.matches$ = this.matchDataService.matches$;
    this.isLoading$ = this.matchDataService.isLoading$;

    // ✅ ADICIONAR: Verificar limite ao inicializar
    this.checkEvaluationLimit();
  }

  // ✅ NOVO MÉTODO: Verificar limite de avaliações
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
        this.toastr.error('Não foi possível carregar os detalhes desta partida.', 'Erro de API');
      }
    });
  }

  backToMatches(): void {
    this.selectedMatch = null;
  }

  // ✅ MODIFICAR: Adicionar verificação de limite
  evaluatePlayer(player: any): void {
    if (player.is_already_evaluated) {
      this.toastr.info('Você já avaliou este jogador nesta partida.');
      return;
    }
    if (!player.steam_id_64) {
      this.toastr.warning('Não é possível avaliar um jogador anônimo.');
      return;
    }

    // ✅ NOVO: Verificar limite antes de abrir formulário
    if (this.isLimitReached) {
      this.toastr.error(
        'Você atingiu o limite de avaliações do plano gratuito. Faça upgrade para Premium para avaliações ilimitadas!',
        'Limite Atingido',
        {
          timeOut: 10000,
          closeButton: true
        }
      );
      return;
    }

    this.evaluationInitialData = {
      targetSteamId: player.steam_id_64,
      matchId: this.selectedMatch.match_id,
      hero_id: player.hero_id
    };
    this.isFormVisible = true;
  }

  closeForm(): void {
    this.isFormVisible = false;
    this.evaluationInitialData = null;
  }

  // ✅ MODIFICAR: Atualizar limite após salvar
  onEvaluationSaved(): void {
    this.closeForm();
    if (this.selectedMatch) {
      this.viewMatchDetails(this.selectedMatch.match_id);
    }
    // ✅ ADICIONAR: Atualizar status do limite
    this.checkEvaluationLimit();
  }

  // ✅ NOVO MÉTODO: Tratar erros do formulário
  onEvaluationError(error: any): void {
    // Este método será chamado se o formulário emitir erro
    if (error.status === 403) {
      this.checkEvaluationLimit(); // Atualizar status
    }
  }
}

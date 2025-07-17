import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

// Serviços
import { SteamService } from '../../../core/steam.service';
import { GameDataService } from '../../../core/game-data.service';
import { MatchDataService } from '../../../core/match-data.service';

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
  private steamService = inject(SteamService); // Mantido para getMatchDetails
  private matchDataService = inject(MatchDataService);

  // --- ESTADO REATIVO PARA A LISTA ---
  matches$: Observable<any[]>;
  isLoading$: Observable<boolean>;

  // --- ESTADO LOCAL PARA A VISÃO DE DETALHES ---
  selectedMatch: any = null;
  isDetailsLoading = false;

  // --- ESTADO LOCAL PARA O FORMULÁRIO ---
  isFormVisible = false;
  evaluationInitialData: any = null;

  constructor() {
    // Apontamos para os Observables do serviço central
    this.matches$ = this.matchDataService.matches$;
    this.isLoading$ = this.matchDataService.isLoading$;
  }

  // Lógica para carregar detalhes de uma partida específica
  viewMatchDetails(matchId: string): void {
    this.isDetailsLoading = true;
    this.selectedMatch = { match_id: matchId }; // Placeholder para a UI
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

  // Funções de controle da UI (sem alterações)
  backToMatches(): void {
    this.selectedMatch = null;
  }

  evaluatePlayer(player: any): void {
    if (player.is_already_evaluated) {
      this.toastr.info('Você já avaliou este jogador nesta partida.');
      return;
    }
    if (!player.steam_id_64) {
      this.toastr.warning('Não é possível avaliar um jogador anônimo.');
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

  onEvaluationSaved(): void {
    this.closeForm();
    if (this.selectedMatch) {
      this.viewMatchDetails(this.selectedMatch.match_id);
    }
  }
}

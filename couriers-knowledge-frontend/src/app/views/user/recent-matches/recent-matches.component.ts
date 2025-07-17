import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { SteamService } from '../../../core/steam.service';
import { EvaluationFormComponent } from '../../../components/evaluation-form/evaluation-form.component';
import { GameDataService } from '../../../core/game-data.service';
import { ToastrService } from 'ngx-toastr';
import { FilterByPropertyPipe } from '../../../pipes/filter-by-property.pipe';

@Component({
  selector: 'app-recent-matches',
  standalone: true,
  imports: [CommonModule, EvaluationFormComponent, DecimalPipe, DatePipe, FilterByPropertyPipe],
  templateUrl: './recent-matches.component.html',
  styleUrl: './recent-matches.component.css'
})
export class RecentMatchesComponent implements OnInit {
  private steamService = inject(SteamService);
  public gameDataService = inject(GameDataService);
  private toastr = inject(ToastrService);

  matches: any[] = [];
  selectedMatch: any = null;
  isLoading = true;
  isFormVisible = false;
  evaluationInitialData: any = null;

  ngOnInit(): void {
    this.isLoading = true;
    this.steamService.getMatchHistory().subscribe({
      next: (data) => {
        this.matches = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.toastr.error('Não foi possível carregar seu histórico de partidas.', 'Erro de API');
      }
    });
  }

  viewMatchDetails(matchId: string): void {
    this.isLoading = true;
    this.selectedMatch = { match_id: matchId }; // Preenche temporariamente para a UI mudar
    this.steamService.getMatchDetails(matchId).subscribe({
      next: (details) => {
        this.selectedMatch = details;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.selectedMatch = null;
        this.toastr.error('Não foi possível carregar os detalhes desta partida.', 'Erro de API');
      }
    });
  }

  backToMatches(): void {
    this.selectedMatch = null;
  }

  evaluatePlayer(player: any): void {
    if (player.is_already_evaluated) {
      alert('Você já avaliou este jogador nesta partida.');
      return;
    }
    if (!player.steam_id_64) {
      alert('Não é possível avaliar um jogador anônimo.');
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
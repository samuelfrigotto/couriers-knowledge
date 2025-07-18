import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import { GsiService } from '../../../core/gsi.service';
import { GameDataService } from '../../../core/game-data.service';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../../../core/auth.service';
import { EvaluationService } from '../../../core/evaluation.service';
import { RatingDisplayComponent } from '../../../components/rating-display/rating-display.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-live-match',
  standalone: true,
  imports: [CommonModule, JsonPipe, RatingDisplayComponent],
  templateUrl: './live-match.component.html',
  styleUrl: './live-match.component.css'
})
export class LiveMatchComponent implements OnInit, OnDestroy {
  private gsiService = inject(GsiService);
  private authService = inject(AuthService);
  public gameDataService = inject(GameDataService);
  private evaluationService = inject(EvaluationService);
  private toastr = inject(ToastrService);

  public gsiDataSubscription!: Subscription;
  public gsiData: any = null;
  public playerStats: { [key: string]: any } = {};

  public currentUserSteamId: string | null;

  public isDetailModalVisible = false;
  public selectedPlayerForDetails: any = null;
  public selectedPlayerEvaluations: any[] = [];

  constructor() {
    this.currentUserSteamId = this.authService.getDecodedToken()?.steam_id || null;
  }

  ngOnInit() {
    this.gsiDataSubscription = this.gsiService.gsiData$.subscribe(newData => {
      if (newData) {
        const combinedData = { ...this.gsiData, ...newData };

        if (combinedData.player && combinedData.hero) {
          const userSlotKey = `player${combinedData.player.player_slot}`;

          if (!combinedData[userSlotKey]) {
            combinedData[userSlotKey] = {};
          }

          combinedData[userSlotKey] = {
            ...combinedData[userSlotKey],
            ...combinedData.player,
            hero: combinedData.hero
          };

          // ================================================================= //
          // AQUI ESTÁ A CORREÇÃO: Adicione esta linha!                        //
          // Ela remove o objeto "player" duplicado após a fusão dos dados.   //
          delete combinedData.player;                                          //
          // ================================================================= //
        }

        this.gsiData = combinedData;

        // O restante da função continua igual...
        const playerKeys = Object.keys(this.gsiData).filter(key => key.startsWith('player'));
        if (playerKeys.length > 0) {
          const steamIds = playerKeys
            .map(key => this.gsiData[key].steamid)
            .filter(id => id && id !== '0');

          if (steamIds.length > 0) {
            this.gsiService.getPlayerStats(steamIds).subscribe(stats => {
              this.playerStats = { ...this.playerStats, ...stats };
            });
          }
        }
      }
    });
  }
  ngOnDestroy() {
    if (this.gsiDataSubscription) {
      this.gsiDataSubscription.unsubscribe();
    }
  }

  showPlayerEvaluationDetails(player: any, event: MouseEvent) {
    event.stopPropagation();
    if (!player || !player.steamid) return;

    this.selectedPlayerForDetails = player;
    this.evaluationService.getEvaluationsForPlayer(player.steamid).subscribe(evaluations => {
      this.selectedPlayerEvaluations = evaluations;
      this.isDetailModalVisible = true;
    });
  }

  closeDetailModal() {
    this.isDetailModalVisible = false;
    this.selectedPlayerForDetails = null;
    this.selectedPlayerEvaluations = [];
  }

  getGameStateText(state: string): string {
    if (!state) return 'Desconectado';
    const states: { [key: string]: string } = {
      'DOTA_GAMERULES_STATE_INIT': 'Inicializando',
      'DOTA_GAMERULES_STATE_WAIT_FOR_PLAYERS_TO_LOAD': 'Aguardando Jogadores',
      'DOTA_GAMERULES_STATE_HERO_SELECTION': 'Seleção de Heróis',
      'DOTA_GAMERULES_STATE_STRATEGY_TIME': 'Tempo de Estratégia',
      'DOTA_GAMERULES_STATE_PRE_GAME': 'Pré-Jogo',
      'DOTA_GAMERULES_STATE_GAME_IN_PROGRESS': 'Partida em Andamento',
      'DOTA_GAMERULES_STATE_POST_GAME': 'Pós-Jogo',
      'DOTA_GAMERULES_STATE_DISCONNECT': 'Desconectado'
    };
    return states[state] || 'Estado Desconhecido';
  }

  getGameStateClass(state: string): string {
    if (state === 'DOTA_GAMERULES_STATE_GAME_IN_PROGRESS') return 'in-progress';
    if (state === 'DOTA_GAMERULES_STATE_POST_GAME') return 'post-game';
    return 'pre-game';
  }

  getPlayersByTeam(data: any, teamName: 'radiant' | 'dire'): any[] {
    if (!data) return [];

    return Object.keys(data)
      .filter(key => key.startsWith('player'))
      .map(key => data[key])
      .filter(player => player && player.team_name === teamName);
  }

  isUser(player: any): boolean {
    return player.steamid === this.currentUserSteamId;
  }

  // FUNÇÃO RESTAURADA
  formatAverageRating(rating: string): string {
    const num = parseFloat(rating);
    if (num % 1 === 0) {
      return num.toFixed(0);
    }
    return num.toFixed(1);
  }
}

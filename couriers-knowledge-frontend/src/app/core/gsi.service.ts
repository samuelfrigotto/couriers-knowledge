// src/app/core/gsi.service.ts - VERSÃO MINIMAL ANTI-CRASH
import { Injectable, NgZone, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../enviroments/environment';

declare global {
  interface Window {
    electronAPI: {
      onGsiData: (callback: (data: any) => void) => void;
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class GsiService {
  private gsiDataSource = new BehaviorSubject<any>(null);
  public gsiData$ = this.gsiDataSource.asObservable();

  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Estados mínimos
  private lastMatchId: string | null = null;
  private currentPlayers: any = {};

  // Anti-crash: processamento ultra limitado
  private lastUpdate = 0;
  private readonly UPDATE_INTERVAL = 2000; // Apenas a cada 2 segundos!

  constructor(private ngZone: NgZone) {
    if (window.electronAPI) {
      window.electronAPI.onGsiData((data) => {
        this.ngZone.run(() => {
          const now = Date.now();

          // ANTI-CRASH: Processar apenas a cada 2 segundos
          if (now - this.lastUpdate < this.UPDATE_INTERVAL) {
            return;
          }

          this.lastUpdate = now;
          this.processMinimalData(data);
        });
      });
    }
  }

  private processMinimalData(data: any): void {
    if (!data) return;

    console.log('[GSI] Dados recebidos:', Object.keys(data)); // Log básico para debug

    // Apenas match ID e estado básico
    const matchId = data.map?.matchid;
    const gameState = data.map?.game_state;

    // Reset se mudou partida
    if (matchId && this.lastMatchId && matchId !== this.lastMatchId) {
      this.currentPlayers = {};
      console.log('[GSI] Nova partida detectada:', matchId);
    }
    this.lastMatchId = matchId;

    // Processar dados do jogador principal
    const simplePlayers: any = {};

    if (data.player && data.hero) {
      const slot = data.player.player_slot;
      const playerKey = `player${slot}`;

      simplePlayers[playerKey] = {
        steamid: data.player.steamid || '0',
        name: data.player.name || 'Você',
        team_name: slot < 5 ? 'radiant' : 'dire',
        player_slot: slot,
        hero: data.hero || { id: 0 }
      };

      console.log('[GSI] Jogador principal:', simplePlayers[playerKey]);
    }

    // Processar allplayers se disponível
    if (data.allplayers) {
      console.log('[GSI] AllPlayers encontrado:', Object.keys(data.allplayers));

      Object.entries(data.allplayers).forEach(([key, player]: [string, any]) => {
        if (player && typeof player === 'object') {
          const slot = player.player_slot !== undefined ?
            player.player_slot :
            parseInt(key.replace('player', ''));

          const playerKey = `player${slot}`;

          simplePlayers[playerKey] = {
            steamid: player.steamid || '0',
            name: player.name || `Player ${slot}`,
            team_name: slot < 5 ? 'radiant' : 'dire',
            player_slot: slot,
            hero: player.hero || { id: 0 }
          };
        }
      });
    }

    // Processar players individuais (player0, player1, etc.)
    Object.keys(data).forEach(key => {
      if (key.match(/^player\d+$/)) {
        const player = data[key];
        if (player && typeof player === 'object') {
          const slot = parseInt(key.replace('player', ''));

          simplePlayers[key] = {
            steamid: player.steamid || '0',
            name: player.name || `Player ${slot}`,
            team_name: slot < 5 ? 'radiant' : 'dire',
            player_slot: slot,
            hero: player.hero || { id: 0 }
          };

          console.log(`[GSI] ${key} processado:`, simplePlayers[key]);
        }
      }
    });

    const playerCount = Object.keys(simplePlayers).length;
    console.log(`[GSI] Total de jogadores processados: ${playerCount}`);

    // Output
    const output = {
      map: {
        matchid: matchId,
        game_state: gameState
      },
      ...simplePlayers
    };

    this.currentPlayers = simplePlayers;
    this.gsiDataSource.next(output);
  }

  // Método para buscar estatísticas (simplificado)
  getPlayerStats(steamIds: string[]): Observable<any> {
    // Limite máximo de IDs para evitar sobrecarga
    const limitedIds = steamIds.slice(0, 5);
    return this.http.post<any>(`${this.apiUrl}/gsi/player-stats`, { steamIds: limitedIds });
  }

  // Estado simplificado
  getCurrentState(): any {
    return {
      lastMatchId: this.lastMatchId,
      playerCount: Object.keys(this.currentPlayers).length
    };
  }

  // Reset simples
  forceReset(): void {
    this.currentPlayers = {};
    this.lastMatchId = null;
    this.gsiDataSource.next(null);
  }
}

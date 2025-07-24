// immortal.service.ts - Frontend Service

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../enviroments/environment';

interface LeaderboardPlayer {
  rank: number;
  name: string;
  steamId?: string;
  teamTag?: string;
  country?: string;
}

interface LeaderboardResponse {
  success: boolean;
  region: string;
  players: LeaderboardPlayer[];
  lastUpdated: string;
  totalPlayers: number;
}

@Injectable({
  providedIn: 'root'
})
export class ImmortalService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Cache para leaderboards
  private leaderboardCache = new Map<string, LeaderboardResponse>();
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 horas

  // BehaviorSubjects para estado reativo
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  /**
   * Busca dados do leaderboard oficial
   */
  getLeaderboardData(region: 'americas' | 'europe' | 'se_asia' | 'china'): Observable<LeaderboardResponse> {
    // Verificar cache primeiro
    const cached = this.getCachedLeaderboard(region);
    if (cached) {
      console.log(`📋 Leaderboard ${region} carregado do cache`);
      return of(cached);
    }

    console.log(`🔍 Buscando leaderboard ${region} do servidor...`);
    this.isLoadingSubject.next(true);

    return this.http.get<LeaderboardResponse>(`${this.apiUrl}/immortal/leaderboard/${region}`).pipe(
      tap(response => {
        this.cacheLeaderboard(region, response);
        this.isLoadingSubject.next(false);
        console.log(`✅ Leaderboard ${region} carregado:`, response.players?.length, 'players');
      }),
      catchError(error => {
        console.error(`❌ Erro ao carregar leaderboard ${region}:`, error);
        this.isLoadingSubject.next(false);

        // Retornar estrutura vazia em caso de erro
        return of({
          success: false,
          region: region,
          players: [],
          lastUpdated: new Date().toISOString(),
          totalPlayers: 0
        });
      })
    );
  }

  /**
   * Força atualização do leaderboard
   */
  refreshLeaderboard(region: 'americas' | 'europe' | 'se_asia' | 'china'): Observable<LeaderboardResponse> {
    // Limpar cache e buscar novamente
    this.clearCacheForRegion(region);
    return this.getLeaderboardData(region);
  }

  /**
   * Busca múltiplas regiões simultaneamente
   */
  getAllLeaderboards(): Observable<LeaderboardResponse[]> {
    const regions: Array<'americas' | 'europe' | 'se_asia' | 'china'> =
      ['americas', 'europe', 'se_asia', 'china'];

    const requests = regions.map(region =>
      this.getLeaderboardData(region).pipe(
        catchError(error => {
          console.warn(`Erro ao carregar ${region}:`, error);
          return of({
            success: false,
            region: region,
            players: [],
            lastUpdated: new Date().toISOString(),
            totalPlayers: 0
          });
        })
      )
    );

    return new Observable(observer => {
      Promise.all(requests.map(req => req.toPromise()))
        .then(results => {
          observer.next(results.filter(r => r !== undefined) as LeaderboardResponse[]);
          observer.complete();
        })
        .catch(error => {
          console.error('Erro ao carregar múltiplos leaderboards:', error);
          observer.error(error);
        });
    });
  }

  /**
   * Encontra jogador por nome em todas as regiões
   */
  findPlayerGlobally(playerName: string): Observable<{
    found: boolean;
    player?: LeaderboardPlayer;
    region?: string;
    suggestions: Array<{player: LeaderboardPlayer, region: string}>;
  }> {
    return new Observable(observer => {
      this.getAllLeaderboards().subscribe({
        next: (leaderboards) => {
          let exactMatch: {player: LeaderboardPlayer, region: string} | null = null;
          const suggestions: Array<{player: LeaderboardPlayer, region: string}> = [];

          // Buscar em todas as regiões
          leaderboards.forEach(leaderboard => {
            if (!leaderboard.success) return;

            leaderboard.players.forEach(player => {
              // Match exato
              if (player.name.toLowerCase() === playerName.toLowerCase()) {
                exactMatch = { player, region: leaderboard.region };
                return;
              }

              // Matches similares
              if (this.isNameSimilar(playerName, player.name)) {
                suggestions.push({ player, region: leaderboard.region });
              }
            });
          });

          observer.next({
            found: !!exactMatch,
            player: exactMatch?.player,
            region: exactMatch?.region,
            suggestions: suggestions.slice(0, 5) // Limitar a 5 sugestões
          });
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Verifica status Immortal do usuário atual
   */
  checkUserImmortalStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/immortal/status`);
  }

  /**
   * Atualiza MMR do usuário (para desenvolvimento)
   */
  updateUserMMR(mmr: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/immortal/update-mmr`, { mmr });
  }

  // ===== MÉTODOS PRIVADOS DE CACHE =====

  private getCachedLeaderboard(region: string): LeaderboardResponse | null {
    const cached = this.leaderboardCache.get(region);
    if (!cached) return null;

    // Verificar se cache expirou
    const cacheTime = new Date(cached.lastUpdated).getTime();
    const now = Date.now();

    if (now - cacheTime > this.cacheExpiry) {
      this.leaderboardCache.delete(region);
      return null;
    }

    return cached;
  }

  private cacheLeaderboard(region: string, data: LeaderboardResponse): void {
    this.leaderboardCache.set(region, {
      ...data,
      lastUpdated: new Date().toISOString()
    });
  }

  private clearCacheForRegion(region: string): void {
    this.leaderboardCache.delete(region);
  }

  public clearAllCache(): void {
    this.leaderboardCache.clear();
  }

  // ===== UTILIDADES =====

  private isNameSimilar(name1: string, name2: string): boolean {
    const clean1 = name1.replace(/[^\w]/g, '').toLowerCase();
    const clean2 = name2.replace(/[^\w]/g, '').toLowerCase();

    // Verificar se um contém o outro
    if (clean1.includes(clean2) || clean2.includes(clean1)) {
      return true;
    }

    // Verificar similaridade por distância Levenshtein simples
    const distance = this.levenshteinDistance(clean1, clean2);
    const maxLength = Math.max(clean1.length, clean2.length);
    const similarity = 1 - (distance / maxLength);

    return similarity > 0.6; // 60% de similaridade
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[len2][len1];
  }

  // ===== MÉTODOS PARA TEMPLATE =====

  getRegionDisplayName(region: string): string {
    const regionNames: { [key: string]: string } = {
      'americas': 'Americas',
      'europe': 'Europe',
      'se_asia': 'Southeast Asia',
      'china': 'China'
    };
    return regionNames[region] || region;
  }

  getRegionFlag(region: string): string {
    const flags: { [key: string]: string } = {
      'americas': '🌎',
      'europe': '🇪🇺',
      'se_asia': '🌏',
      'china': '🇨🇳'
    };
    return flags[region] || '🌍';
  }

  formatRank(rank: number): string {
    if (rank <= 10) return `TOP ${rank}`;
    return `#${rank}`;
  }

  getRankColor(rank: number): string {
    if (rank <= 10) return '#f59e0b'; // Dourado
    if (rank <= 100) return '#8b5cf6'; // Roxo
    if (rank <= 500) return '#3b82f6'; // Azul
    return '#6b7280'; // Cinza
  }
}

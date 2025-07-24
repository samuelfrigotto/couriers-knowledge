// frontend/src/app/core/immortal.service.ts - ATUALIZADO PARA DADOS REAIS

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
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
  source?: string; // 'puppeteer' | 'database'
}

interface PlayerSearchResult {
  success: boolean;
  query: string;
  results: Array<{
    rank: number;
    name: string;
    region: string;
    matchType: 'exact' | 'approximate';
    teamTag?: string;
    country?: string;
  }>;
  totalFound: number;
}

@Injectable({
  providedIn: 'root'
})
export class ImmortalService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Cache para leaderboards
  private leaderboardCache = new Map<string, LeaderboardResponse>();
  private cacheExpiry = 60 * 60 * 1000; // 1 hora (backend tem cache de 24h)

  // BehaviorSubjects para estado reativo
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  private lastUpdateSubject = new BehaviorSubject<Date | null>(null);
  public lastUpdate$ = this.lastUpdateSubject.asObservable();

  /**
   * Busca dados do leaderboard oficial
   */
  getLeaderboardData(region: 'americas' | 'europe' | 'se_asia' | 'china'): Observable<LeaderboardResponse> {
    // Verificar cache frontend primeiro
    const cached = this.getCachedLeaderboard(region);
    if (cached) {
      console.log(`📋 Leaderboard ${region} carregado do cache frontend`);
      return of(cached);
    }

    console.log(`🔍 Buscando leaderboard ${region} do backend (com Puppeteer)...`);
    this.isLoadingSubject.next(true);

    return this.http.get<LeaderboardResponse>(`${this.apiUrl}/immortal/leaderboard/${region}`).pipe(
      tap(response => {
        this.cacheLeaderboard(region, response);
        this.isLoadingSubject.next(false);
        this.lastUpdateSubject.next(new Date());
        
        const source = response.source === 'database' ? 'cache do banco' : 'scraping em tempo real';
        console.log(`✅ Leaderboard ${region} carregado via ${source}:`, response.totalPlayers, 'players');
        
        if (response.players.length > 0) {
          console.log('🏆 Top 5 players:', response.players.slice(0, 5));
        }
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
   * Força atualização do leaderboard (novo scraping)
   */
  refreshLeaderboard(region: 'americas' | 'europe' | 'se_asia' | 'china'): Observable<LeaderboardResponse> {
    console.log(`🔄 Forçando atualização do leaderboard ${region}...`);
    
    // Limpar cache frontend
    this.clearCacheForRegion(region);
    this.isLoadingSubject.next(true);

    return this.http.post<LeaderboardResponse>(`${this.apiUrl}/immortal/refresh/${region}`, {}).pipe(
      tap(response => {
        this.cacheLeaderboard(region, response);
        this.isLoadingSubject.next(false);
        this.lastUpdateSubject.next(new Date());
        console.log(`✅ Leaderboard ${region} atualizado via novo scraping:`, response.totalPlayers, 'players');
      }),
      catchError(error => {
        console.error(`❌ Erro ao atualizar leaderboard ${region}:`, error);
        this.isLoadingSubject.next(false);
        
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
   * Busca player específico em todas as regiões
   */
  searchPlayer(playerName: string): Observable<PlayerSearchResult> {
    if (!playerName || playerName.trim().length < 2) {
      return of({
        success: false,
        query: playerName,
        results: [],
        totalFound: 0
      });
    }

    console.log(`🔍 Buscando player "${playerName}" em todas as regiões...`);

    return this.http.get<PlayerSearchResult>(`${this.apiUrl}/immortal/search/${encodeURIComponent(playerName)}`).pipe(
      tap(response => {
        console.log(`🎯 Busca por "${playerName}": ${response.totalFound} resultados encontrados`);
        if (response.results.length > 0) {
          console.log('📋 Resultados:', response.results);
        }
      }),
      catchError(error => {
        console.error(`❌ Erro ao buscar player ${playerName}:`, error);
        return of({
          success: false,
          query: playerName,
          results: [],
          totalFound: 0
        });
      })
    );
  }

  /**
   * Busca múltiplas regiões simultaneamente
   */
  getAllLeaderboards(): Observable<{ [region: string]: LeaderboardResponse }> {
    const regions: Array<'americas' | 'europe' | 'se_asia' | 'china'> = ['americas', 'europe', 'se_asia', 'china'];
    
    console.log('🌍 Carregando leaderboards de todas as regiões...');

    const requests = regions.map(region => 
      this.getLeaderboardData(region).pipe(
        catchError(error => {
          console.warn(`⚠️ Erro ao carregar ${region}:`, error);
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
      Promise.all(requests.map(req => req.toPromise())).then(responses => {
        const result: { [region: string]: LeaderboardResponse } = {};
        responses.forEach((response, index) => {
          if (response) {
            result[regions[index]] = response;
          }
        });
        
        console.log('🌍 Todas as regiões carregadas:', Object.keys(result));
        observer.next(result);
        observer.complete();
      }).catch(error => {
        console.error('❌ Erro ao carregar múltiplas regiões:', error);
        observer.error(error);
      });
    });
  }

  /**
   * Faz cross-reference de uma lista de nomes com o leaderboard
   */
  findPlayersInLeaderboard(playerNames: string[], region: 'americas' | 'europe' | 'se_asia' | 'china' = 'americas'): Observable<Array<{
    inputName: string;
    found: boolean;
    leaderboardData?: LeaderboardPlayer;
    confidence: number;
  }>> {
    return this.getLeaderboardData(region).pipe(
      tap(leaderboard => {
        if (!leaderboard.success) {
          console.warn(`⚠️ Leaderboard ${region} não disponível para cross-reference`);
        }
      }),
      catchError(error => {
        console.error(`❌ Erro no cross-reference:`, error);
        return of({ success: false, region, players: [], lastUpdated: '', totalPlayers: 0 });
      }),
      map(leaderboard => {
        const results = playerNames.map(name => {
          if (!leaderboard.success || leaderboard.players.length === 0) {
            return { inputName: name, found: false, confidence: 0 };
          }

          // Busca exata primeiro
          let exactMatch = leaderboard.players.find(p => 
            p.name.toLowerCase() === name.toLowerCase()
          );

          if (exactMatch) {
            return {
              inputName: name,
              found: true,
              leaderboardData: exactMatch,
              confidence: 100
            };
          }

          // Busca aproximada
          const cleanInputName = name.replace(/[^\w]/g, '').toLowerCase();
          let approximateMatch = leaderboard.players.find(p => {
            const cleanLeaderboardName = p.name.replace(/[^\w]/g, '').toLowerCase();
            return cleanLeaderboardName === cleanInputName ||
                   cleanLeaderboardName.includes(cleanInputName) ||
                   cleanInputName.includes(cleanLeaderboardName);
          });

          if (approximateMatch) {
            const confidence = this.calculateNameSimilarity(name, approximateMatch.name);
            return {
              inputName: name,
              found: true,
              leaderboardData: approximateMatch,
              confidence: confidence
            };
          }

          return { inputName: name, found: false, confidence: 0 };
        });

        const foundCount = results.filter(r => r.found).length;
        console.log(`🎯 Cross-reference: ${foundCount}/${playerNames.length} players encontrados no leaderboard ${region}`);
        
        return results;
      })
    );
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
    console.log('🗑️ Cache do frontend limpo');
  }

  // ===== UTILIDADES =====

  private calculateNameSimilarity(name1: string, name2: string): number {
    const clean1 = name1.replace(/[^\w]/g, '').toLowerCase();
    const clean2 = name2.replace(/[^\w]/g, '').toLowerCase();

    if (clean1 === clean2) return 100;
    if (clean1.includes(clean2) || clean2.includes(clean1)) return 85;

    // Cálculo de similaridade básico
    const distance = this.levenshteinDistance(clean1, clean2);
    const maxLength = Math.max(clean1.length, clean2.length);
    const similarity = 1 - (distance / maxLength);

    return Math.round(similarity * 100);
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

  // ===== GETTERS PARA TEMPLATES =====

  get isLoading(): boolean {
    return this.isLoadingSubject.value;
  }

  get cacheStatus(): { [region: string]: { cached: boolean; lastUpdated: string | null } } {
    const regions = ['americas', 'europe', 'se_asia', 'china'];
    const status: any = {};

    regions.forEach(region => {
      const cached = this.leaderboardCache.get(region);
      status[region] = {
        cached: !!cached,
        lastUpdated: cached?.lastUpdated || null
      };
    });

    return status;
  }
}
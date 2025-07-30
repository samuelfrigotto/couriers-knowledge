// frontend/src/app/core/known-players.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of, map } from 'rxjs';
import { environment } from '../../enviroments/environment';

// ===== INTERFACES =====
export interface KnownPlayer {
  id: number;
  steam_id: string;
  competitive_name: string;
  steam_name?: string;
  region: string;
  confidence_level: 'confirmed' | 'high' | 'medium' | 'observation' | 'unknown';
  last_known_rank?: number;
  volatility_sector?: number;
  status: 'active' | 'missing' | 'inactive';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EnrichedLeaderboardPlayer {
  rank: number;
  competitiveName: string; // NOME QUE VEM DO LEADERBOARD (scraping)
  steamName?: string; // Nome real do Steam (quando admin fizer o link)
  teamTag?: string;
  country?: string;
  steamId: string;
  previousRank?: number;
  rankChange?: number;
  lastUpdate: string;
  knownPlayer?: KnownPlayer;
  confidenceLevel: string;
  volatilityExceeded: boolean;
}

export interface LeaderboardAnomalies {
  volatilityAnomalies: Array<{
    steam_id: string;
    name: string;
    rank: number;
    previous_rank: number;
    rank_change: number;
    expected_volatility: number;
    exceeded_by: number;
    competitive_name?: string;
    confidence_level?: string;
  }>;
  unknownPlayers: Array<{
    steam_id: string;
    name: string;
    rank: number;
    team_tag?: string;
  }>;
  nameChanges: Array<{
    steam_id: string;
    current_name: string;
    competitive_name: string;
    known_steam_name: string;
    rank: number;
    confidence_level: string;
  }>;
  summary: {
    totalAnomalies: number;
    volatilityIssues: number;
    unknownInTop3000: number;
    nameChangeAlerts: number;
  };
}

export interface PlayerStats {
  total_known_players: number;
  confirmed: number;
  high_confidence: number;
  medium_confidence: number;
  in_observation: number;
  unknown: number;
  active_players: number;
  missing_players: number;
  inactive_players: number;
  confidence_percentage: number;
}

export interface RecentChange {
  steam_id: string;
  player_name: string;
  change_type: string;
  old_value?: string;
  new_value?: string;
  rank_position?: number;
  previous_rank?: number;
  volatility_exceeded: boolean;
  change_details: any;
  detected_at: string;
}

export interface SteamProfile {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
}

@Injectable({
  providedIn: 'root'
})
export class KnownPlayersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}`;

  // Estados observáveis
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private knownPlayersSubject = new BehaviorSubject<KnownPlayer[]>([]);
  public knownPlayers$ = this.knownPlayersSubject.asObservable();

  private statsSubject = new BehaviorSubject<PlayerStats | null>(null);
  public stats$ = this.statsSubject.asObservable();

  private anomaliesSubject = new BehaviorSubject<LeaderboardAnomalies | null>(null);
  public anomalies$ = this.anomaliesSubject.asObservable();

  // Cache para evitar requests desnecessários
  private cache = new Map<string, any>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutos

  // ===== LEADERBOARD ENRIQUECIDO =====
  /**
   * Buscar leaderboard enriquecido - USANDO A ROTA EXISTENTE /api/immortal/leaderboard/:region
   */
  getEnrichedLeaderboard(region: string = 'europe', limit: number = 4000): Observable<EnrichedLeaderboardPlayer[]> {
    const cacheKey = `enriched-leaderboard-${region}-${limit}`;
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return of(cached);
    }

    this.loadingSubject.next(true);

    // USAR A ROTA EXISTENTE DO IMMORTAL
    return this.http.get<any>(`${this.apiUrl}/immortal/leaderboard/${region}`).pipe(
      map(response => {
        console.log('🔍 Resposta bruta do backend:', response);

        if (response.success && response.players && Array.isArray(response.players)) {
          // Converter para o formato esperado - CORRIGIDO
          const enrichedPlayers: EnrichedLeaderboardPlayer[] = response.players.map((player: any, index: number) => {
            // O nome que vem do scraping é o NOME COMPETITIVO
            const competitiveName = player.name || `Player ${index + 1}`;

            // Gerar steamId mock se não tiver
            const steamId = player.steamId || `mock_steam_${player.rank || (index + 1)}`;

            console.log(`🔍 Mapeando player ${index + 1}:`, {
              original: player,
              rank: player.rank || (index + 1),
              competitiveName,
              steamId: steamId.substring(0, 12) + '...'
            });

            return {
              rank: player.rank || (index + 1),
              competitiveName: competitiveName, // NOME DO SCRAPING
              steamName: undefined, // Será preenchido quando admin fizer o link
              teamTag: player.teamTag || undefined,
              country: player.country || undefined,
              steamId: steamId,
              previousRank: undefined, // Não temos histórico ainda
              rankChange: undefined,
              lastUpdate: response.lastUpdated || new Date().toISOString(),
              knownPlayer: undefined, // Por enquanto nenhum player é conhecido
              confidenceLevel: 'unknown', // Todos começam como desconhecidos
              volatilityExceeded: false
            };
          });

          // Limitar se necessário
          const limitedPlayers = limit > 0 ? enrichedPlayers.slice(0, limit) : enrichedPlayers;

          this.setCache(cacheKey, limitedPlayers);
          console.log(`✅ Leaderboard ${region} processado: ${limitedPlayers.length} players`);

          if (limitedPlayers.length > 0) {
            console.log('🏆 Top 5 players processados:', limitedPlayers.slice(0, 5).map(p => ({
              rank: p.rank,
              competitiveName: p.competitiveName,
              steamId: p.steamId.substring(0, 8) + '...'
            })));
          }

          this.loadingSubject.next(false);
          return limitedPlayers;
        }

        console.warn('⚠️ Resposta do backend não contém players válidos:', response);
        this.loadingSubject.next(false);
        return [];
      }),
      catchError(error => {
        console.error(`❌ Erro ao carregar leaderboard ${region}:`, error);
        this.loadingSubject.next(false);
        return of([]);
      })
    );
  }

  // ===== KNOWN PLAYERS - MOCK POR ENQUANTO =====
  /**
   * Buscar todos os players conhecidos de uma região - MOCK POR ENQUANTO
   */
  getKnownPlayers(region: string = 'europe'): Observable<KnownPlayer[]> {
    console.log(`📋 Known players para ${region}: 0 (não implementado ainda)`);
    this.knownPlayersSubject.next([]);
    return of([]);
  }

  /**
   * Adicionar novo player conhecido - MOCK POR ENQUANTO
   */
  addKnownPlayer(playerData: {
    steamUrl: string;
    competitiveName: string;
    region?: string;
    notes?: string;
    rank?: number;
  }): Observable<KnownPlayer> {
    console.log('📝 Simulando adição de player conhecido:', playerData);

    // Extrair/gerar SteamID
    let steamId = playerData.steamUrl;
    if (playerData.steamUrl.includes('steamcommunity.com/profiles/')) {
      steamId = playerData.steamUrl.split('/profiles/')[1].replace('/', '');
    } else if (playerData.steamUrl.includes('steamcommunity.com/id/')) {
      // Para custom URLs, gerar um mock ID
      steamId = `76561198${Math.floor(Math.random() * 1000000000)}`;
    }

    // Simular player adicionado
    const newPlayer: KnownPlayer = {
      id: Date.now(),
      steam_id: steamId,
      competitive_name: playerData.competitiveName,
      steam_name: undefined, // Não temos o steam name ainda
      region: playerData.region || 'europe',
      confidence_level: 'confirmed',
      last_known_rank: playerData.rank,
      status: 'active',
      notes: playerData.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Atualizar lista local
    const currentPlayers = this.knownPlayersSubject.value;
    this.knownPlayersSubject.next([...currentPlayers, newPlayer]);

    console.log('✅ Player conhecido simulado adicionado:', newPlayer);
    return of(newPlayer);
  }

  /**
   * Atualizar player conhecido - MOCK POR ENQUANTO
   */
  updateKnownPlayer(playerId: number, updates: Partial<KnownPlayer>): Observable<KnownPlayer> {
    console.log('💾 Simulando atualização de player:', playerId, updates);

    // Simular player atualizado
    const mockPlayer: KnownPlayer = {
      id: playerId,
      steam_id: 'mock_steam_id',
      competitive_name: updates.competitive_name || 'Updated Player',
      steam_name: updates.steam_name,
      region: 'europe',
      confidence_level: updates.confidence_level || 'confirmed',
      status: updates.status || 'active',
      notes: updates.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return of(mockPlayer);
  }

  /**
   * Remover player conhecido - MOCK POR ENQUANTO
   */
  removeKnownPlayer(playerId: number): Observable<boolean> {
    console.log('🗑️ Simulando remoção de player:', playerId);

    // Remover da lista local
    const currentPlayers = this.knownPlayersSubject.value;
    const filteredPlayers = currentPlayers.filter(p => p.id !== playerId);
    this.knownPlayersSubject.next(filteredPlayers);

    return of(true);
  }

  // ===== LINK STEAM PROFILE - NOVA FUNCIONALIDADE =====
  /**
   * Linkar perfil Steam com nome competitivo
   */
  linkSteamProfile(competitiveName: string, steamUrl: string, region: string = 'europe'): Observable<KnownPlayer> {
    console.log('🔗 Simulando link de perfil Steam:', {
      competitiveName,
      steamUrl,
      region
    });

    // Extrair SteamID
    let steamId = steamUrl;
    if (steamUrl.includes('steamcommunity.com/profiles/')) {
      steamId = steamUrl.split('/profiles/')[1].replace('/', '');
    } else if (steamUrl.includes('steamcommunity.com/id/')) {
      steamId = `76561198${Math.floor(Math.random() * 1000000000)}`;
    }

    // Simular busca do perfil Steam para obter o nome real
    const mockSteamName = `Steam_${competitiveName}`;

    const linkedPlayer: KnownPlayer = {
      id: Date.now(),
      steam_id: steamId,
      competitive_name: competitiveName,
      steam_name: mockSteamName, // Nome real do Steam
      region: region,
      confidence_level: 'confirmed',
      status: 'active',
      notes: `Linkado automaticamente em ${new Date().toLocaleDateString()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return of(linkedPlayer);
  }

  // ===== ESTATÍSTICAS E ANOMALIAS - MOCK =====
  /**
   * Buscar estatísticas - DADOS MOCK
   */
  getPlayerStats(region: string = 'europe'): Observable<PlayerStats> {
    // Calcular stats baseado nos players conhecidos atuais
    const knownPlayers = this.knownPlayersSubject.value;
    const totalPlayers = knownPlayers.length;

    const mockStats: PlayerStats = {
      total_known_players: totalPlayers,
      confirmed: knownPlayers.filter(p => p.confidence_level === 'confirmed').length,
      high_confidence: knownPlayers.filter(p => p.confidence_level === 'high').length,
      medium_confidence: knownPlayers.filter(p => p.confidence_level === 'medium').length,
      in_observation: knownPlayers.filter(p => p.confidence_level === 'observation').length,
      unknown: Math.max(0, 4000 - totalPlayers), // Assumir 4000 total
      active_players: knownPlayers.filter(p => p.status === 'active').length,
      missing_players: knownPlayers.filter(p => p.status === 'missing').length,
      inactive_players: knownPlayers.filter(p => p.status === 'inactive').length,
      confidence_percentage: totalPlayers > 0 ? Math.round((knownPlayers.filter(p => p.confidence_level === 'confirmed').length / totalPlayers) * 100) : 0
    };

    this.statsSubject.next(mockStats);
    return of(mockStats);
  }

  /**
   * Buscar mudanças recentes - DADOS MOCK
   */
  getRecentChanges(region: string = 'europe', limit: number = 50): Observable<RecentChange[]> {
    console.log(`📋 Mudanças recentes: 0 (mock)`);
    return of([]);
  }

  /**
   * Detectar anomalias - MOCK
   */
  detectAnomalies(region: string = 'europe'): Observable<LeaderboardAnomalies> {
    const mockAnomalies: LeaderboardAnomalies = {
      volatilityAnomalies: [],
      unknownPlayers: [],
      nameChanges: [],
      summary: {
        totalAnomalies: 0,
        volatilityIssues: 0,
        unknownInTop3000: 0,
        nameChangeAlerts: 0
      }
    };

    this.anomaliesSubject.next(mockAnomalies);
    return of(mockAnomalies);
  }

  /**
   * Marcar players para observação - MOCK
   */
  markPlayersForObservation(steamIds: string[], reason: string = 'manual_review'): Observable<boolean> {
    console.log(`⚠️ Simulando marcação de ${steamIds.length} players para observação`);
    return of(true);
  }

  /**
   * Sincronizar com leaderboard - MOCK
   */
  syncWithLeaderboard(region: string = 'europe'): Observable<any> {
    console.log(`🔄 Simulando sincronização para ${region}`);
    return of({ success: true, message: 'Sincronização simulada' });
  }

  // ===== STEAM UTILITIES - MOCK =====
  /**
   * Resolver SteamID a partir de URL - MOCK SIMPLES
   */
  resolveSteamId(steamUrl: string): Observable<{steamId: string, profile?: SteamProfile}> {
    console.log('🔍 Simulando resolução de SteamID:', steamUrl);

    let steamId = steamUrl;

    // Extrair SteamID de URLs
    if (steamUrl.includes('steamcommunity.com/profiles/')) {
      steamId = steamUrl.split('/profiles/')[1].replace('/', '');
    } else if (steamUrl.includes('steamcommunity.com/id/')) {
      const customId = steamUrl.split('/id/')[1].replace('/', '');
      steamId = `76561198${Math.floor(Math.random() * 1000000000)}`; // Mock SteamID64
    }

    const mockProfile: SteamProfile = {
      steamid: steamId,
      personaname: 'Mock Player',
      profileurl: steamUrl,
      avatar: '',
      avatarmedium: '',
      avatarfull: ''
    };

    return of({ steamId, profile: mockProfile });
  }

  /**
   * Buscar players similares por nome - MOCK
   */
  findSimilarPlayers(name: string, region: string = 'europe'): Observable<KnownPlayer[]> {
    console.log(`🔍 Simulando busca de players similares para "${name}"`);
    return of([]);
  }

  // ===== CACHE UTILITIES =====
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private clearCacheForRegion(region: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(region));
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Limpar todo o cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Cache do KnownPlayersService limpo');
  }

  // ===== UI UTILITIES =====
  getConfidenceLevelDisplay(level: string): string {
    const levels = {
      'confirmed': 'Confirmado (100%)',
      'high': 'Alta confiança (95%)',
      'medium': 'Média confiança (80%)',
      'observation': 'Em observação (60%)',
      'unknown': 'Desconhecido (0%)'
    };
    return levels[level as keyof typeof levels] || level;
  }

  getConfidenceLevelColor(level: string): string {
    const colors = {
      'confirmed': 'text-green-600',
      'high': 'text-blue-600',
      'medium': 'text-yellow-600',
      'observation': 'text-orange-600',
      'unknown': 'text-gray-400'
    };
    return colors[level as keyof typeof colors] || 'text-gray-400';
  }

  getStatusDisplay(status: string): string {
    const statuses = {
      'active': 'Ativo',
      'missing': 'Ausente',
      'inactive': 'Inativo'
    };
    return statuses[status as keyof typeof statuses] || status;
  }

  getVolatilityRange(rank: number): string {
    if (rank <= 100) return '±100';
    if (rank <= 500) return '±200';
    if (rank <= 1000) return '±300';
    if (rank <= 2000) return '±400';
    if (rank <= 3000) return '±500';
    return 'Zona de adaptação';
  }

  formatSteamProfileUrl(steamId: string): string {
    return `https://steamcommunity.com/profiles/${steamId}`;
  }

  formatChangeType(changeType: string): string {
    const types = {
      'rank_change': 'Mudança de rank',
      'name_change': 'Mudança de nome',
      'new_player': 'Novo player',
      'missing_player': 'Player ausente',
      'volatility_alert': 'Alerta de volatilidade',
      'new_known_player': 'Player conhecido adicionado',
      'player_updated': 'Player atualizado',
      'player_removed': 'Player removido',
      'confidence_downgrade': 'Confiança reduzida'
    };
    return types[changeType as keyof typeof types] || changeType;
  }
}

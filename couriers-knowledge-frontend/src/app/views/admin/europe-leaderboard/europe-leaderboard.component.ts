import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  KnownPlayersService,
  KnownPlayer,
  EnrichedLeaderboardPlayer,
  LeaderboardAnomalies,
  PlayerStats,
  RecentChange
} from '../../../core/known-players.service';



@Component({
  selector: 'app-europe-leaderboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './europe-leaderboard.component.html',
  styleUrls: ['./europe-leaderboard.component.scss']
})
export class EuropeLeaderboardComponent implements OnInit {
  private knownPlayersService = inject(KnownPlayersService);

  // ===== SIGNALS PARA ESTADOS REATIVOS =====
  players = signal<EnrichedLeaderboardPlayer[]>([]);
  stats = signal<PlayerStats | null>(null);
  recentChanges = signal<RecentChange[]>([]);
  loading = signal(false);
  lastUpdate = signal<Date | null>(null);

  // ===== FORM SIGNALS =====
  showAddModal = signal(false);
  editingPlayer = signal<KnownPlayer | null>(null);
  steamProfileUrl = signal('');
  competitiveName = signal('');
  playerRank = signal<number | null>(null);
  selectedRegion = signal('europe');
  notes = signal('');
  editConfidenceLevel = signal<string>('confirmed');
  editStatus = signal<string>('active');

  // ===== FILTER SIGNALS =====
  searchTerm = signal('');
  filterConfidence = signal('all');

  //===
  Math = Math;
  console = console;


  // ===== COMPUTED FILTERED PLAYERS =====
  filteredPlayers = computed(() => {
    const search = this.searchTerm().toLowerCase();
    const confidence = this.filterConfidence();

    return this.players().filter(player => {
      const matchesSearch = !search ||
        player.competitiveName.toLowerCase().includes(search) || // CORRIGIDO: usar competitiveName
        player.steamId.includes(search) ||
        (player.steamName || '').toLowerCase().includes(search) ||
        (player.knownPlayer?.competitive_name || '').toLowerCase().includes(search);

      const matchesFilter = confidence === 'all' || player.confidenceLevel === confidence;

      return matchesSearch && matchesFilter;
    });
  });

  // ===== LIFECYCLE =====
  ngOnInit() {
    this.loadData();
  }

  // ===== DATA LOADING =====
  async loadData() {
    this.loading.set(true);

    try {
      console.log('🔄 Carregando dados do leaderboard Europa...');

      // Carregar dados em paralelo
      const [leaderboard, stats, changes] = await Promise.all([
        this.knownPlayersService.getEnrichedLeaderboard('europe', 4000).toPromise(),
        this.knownPlayersService.getPlayerStats('europe').toPromise(),
        this.knownPlayersService.getRecentChanges('europe', 20).toPromise()
      ]);

      this.players.set(leaderboard || []);
      this.stats.set(stats || null);
      this.recentChanges.set(changes || []);
      this.lastUpdate.set(new Date());

      console.log('✅ Dados carregados com sucesso:', {
        players: leaderboard?.length || 0,
        hasStats: !!stats,
        changes: changes?.length || 0
      });

      // Log dos primeiros players para debug
      if (leaderboard && leaderboard.length > 0) {
        console.log('🏆 Primeiros 3 players carregados:', leaderboard.slice(0, 3).map(p => ({
          rank: p.rank,
          competitiveName: p.competitiveName,
          steamName: p.steamName || 'Não definido',
          steamId: p.steamId.substring(0, 8) + '...'
        })));
      }

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      this.showErrorMessage('Erro ao carregar dados do leaderboard');
    } finally {
      this.loading.set(false);
    }
  }

  async refreshLeaderboard() {
    console.log('🔄 Atualizando leaderboard...');
    // Limpar cache primeiro
    this.knownPlayersService.clearCache();
    await this.loadData();
  }

  // ===== FILTER HANDLERS =====
  onSearchChange() {
    // Trigger reativo automático via signal
    console.log('🔍 Filtro de busca alterado:', this.searchTerm());
  }

  onFilterChange() {
    // Trigger reativo automático via signal
    console.log('🎯 Filtro de confiança alterado:', this.filterConfidence());
  }

  // ===== RANK UTILITIES =====
  getRankChange(player: EnrichedLeaderboardPlayer): string | null {
    if (!player.previousRank || player.previousRank === player.rank) return null;
    const change = player.previousRank - player.rank;
    const isPositive = change > 0;
    return `${isPositive ? '↑' : '↓'} ${Math.abs(change)}`;
  }

  getRankChangeClass(player: EnrichedLeaderboardPlayer): string {
    if (!player.previousRank || player.previousRank === player.rank) return '';
    const change = player.previousRank - player.rank;
    const isPositive = change > 0;
    return `text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`;
  }

  // ===== DISPLAY UTILITIES =====
  getSteamProfileUrl(steamId: string): string {
    return `https://steamcommunity.com/profiles/${steamId}`;
  }

  getConfidenceLevelDisplay(level: string): string {
    const levels = {
      'confirmed': 'Confirmado',
      'high': 'Alta',
      'medium': 'Média',
      'observation': 'Observação',
      'unknown': 'Desconhecido'
    };
    return levels[level as keyof typeof levels] || level;
  }

  // ===== MODAL HANDLERS - ADD PLAYER =====
  quickAddPlayer(player: EnrichedLeaderboardPlayer) {
    console.log('➕ Adição rápida de player:', {
      competitiveName: player.competitiveName,
      rank: player.rank,
      steamId: player.steamId.substring(0, 8) + '...'
    });

    // Preencher modal com dados do player
    this.steamProfileUrl.set(this.getSteamProfileUrl(player.steamId));
    this.competitiveName.set(player.competitiveName); // NOME COMPETITIVO do scraping
    this.playerRank.set(player.rank);
    this.showAddModal.set(true);
  }

  closeAddModal() {
    console.log('❌ Fechando modal de adição');
    this.showAddModal.set(false);
    this.resetAddForm();
  }

  private resetAddForm() {
    this.steamProfileUrl.set('');
    this.competitiveName.set('');
    this.playerRank.set(null);
    this.notes.set('');
  }

  async addPlayer() {
    if (!this.steamProfileUrl() || !this.competitiveName()) {
      this.showErrorMessage('Steam URL e Nome Competitivo são obrigatórios');
      return;
    }

    try {
      this.loading.set(true);
      console.log('📝 Adicionando player conhecido:', {
        steamUrl: this.steamProfileUrl(),
        competitiveName: this.competitiveName(),
        rank: this.playerRank(),
        notes: this.notes()
      });

      await this.knownPlayersService.addKnownPlayer({
        steamUrl: this.steamProfileUrl(),
        competitiveName: this.competitiveName(),
        region: 'europe',
        notes: this.notes(),
        rank: this.playerRank() || undefined
      }).toPromise();

      this.closeAddModal();
      await this.loadData(); // Recarregar dados
      this.showSuccessMessage('Player conhecido adicionado com sucesso!');

    } catch (error: any) {
      console.error('❌ Erro ao adicionar player:', error);
      this.showErrorMessage(error.error?.error || 'Erro ao adicionar player. Verifique os dados e tente novamente.');
    } finally {
      this.loading.set(false);
    }
  }

  // ===== MODAL HANDLERS - EDIT PLAYER =====
  editPlayer(player: KnownPlayer) {
    console.log('✏️ Editando player:', player.competitive_name);
    this.editingPlayer.set(player);
    this.competitiveName.set(player.competitive_name);
    this.editConfidenceLevel.set(player.confidence_level);
    this.editStatus.set(player.status);
    this.notes.set(player.notes || '');
  }

  closeEditModal() {
    console.log('❌ Fechando modal de edição');
    this.editingPlayer.set(null);
    this.resetEditForm();
  }

  private resetEditForm() {
    this.competitiveName.set('');
    this.notes.set('');
    this.editConfidenceLevel.set('confirmed');
    this.editStatus.set('active');
  }

  async updatePlayer() {
    const player = this.editingPlayer();
    if (!player) return;

    try {
      this.loading.set(true);
      console.log('💾 Atualizando player:', player.competitive_name);

      await this.knownPlayersService.updateKnownPlayer(player.id, {
        competitive_name: this.competitiveName(),
        confidence_level: this.editConfidenceLevel() as any,
        status: this.editStatus() as any,
        notes: this.notes()
      }).toPromise();

      this.closeEditModal();
      await this.loadData(); // Recarregar dados
      this.showSuccessMessage('Player atualizado com sucesso!');

    } catch (error: any) {
      console.error('❌ Erro ao atualizar player:', error);
      this.showErrorMessage(error.error?.error || 'Erro ao atualizar player. Tente novamente.');
    } finally {
      this.loading.set(false);
    }
  }

  // ===== DELETE PLAYER =====
  async deletePlayer(playerId: number) {
    if (!confirm('⚠️ Tem certeza que deseja remover este player do sistema?')) return;

    try {
      this.loading.set(true);
      console.log('🗑️ Removendo player:', playerId);

      await this.knownPlayersService.removeKnownPlayer(playerId).toPromise();
      await this.loadData(); // Recarregar dados
      this.showSuccessMessage('Player removido com sucesso!');

    } catch (error: any) {
      console.error('❌ Erro ao remover player:', error);
      this.showErrorMessage(error.error?.error || 'Erro ao remover player. Tente novamente.');
    } finally {
      this.loading.set(false);
    }
  }

  // ===== LINK STEAM PROFILE =====
  async linkSteamProfile(player: EnrichedLeaderboardPlayer) {
    const steamUrl = prompt(`🔗 Cole a URL do perfil Steam para "${player.competitiveName}":`);
    if (!steamUrl) return;

    try {
      this.loading.set(true);
      console.log('🔗 Linkando perfil Steam:', {
        competitiveName: player.competitiveName,
        steamUrl,
        rank: player.rank
      });

      await this.knownPlayersService.linkSteamProfile(
        player.competitiveName,
        steamUrl,
        'europe'
      ).toPromise();

      await this.loadData(); // Recarregar dados
      this.showSuccessMessage(`Perfil Steam linkado para ${player.competitiveName}!`);

    } catch (error: any) {
      console.error('❌ Erro ao linkar perfil Steam:', error);
      this.showErrorMessage('Erro ao linkar perfil Steam. Verifique a URL e tente novamente.');
    } finally {
      this.loading.set(false);
    }
  }

  // ===== CHANGE DESCRIPTION FORMATTER =====
  formatChangeDescription(change: RecentChange): string {
    switch (change.change_type) {
      case 'volatility_alert':
        return `${change.player_name} mudou do rank #${change.previous_rank} para #${change.rank_position} - Fora da volatilidade esperada`;

      case 'new_known_player':
        return `${change.player_name} adicionado como player conhecido`;

      case 'player_updated':
        return `${change.player_name} teve seus dados atualizados`;

      case 'rank_change':
        return `${change.player_name} mudou de rank: #${change.previous_rank} → #${change.rank_position}`;

      case 'name_change':
        return `Player mudou de nome: ${change.old_value} → ${change.new_value}`;

      case 'new_player':
        return `Novo player ${change.player_name} apareceu no rank #${change.rank_position}`;

      case 'missing_player':
        return `Player ${change.player_name} não apareceu na última atualização`;

      case 'confidence_downgrade':
        return `${change.player_name} teve confiança reduzida para observação`;

      default:
        return `${change.player_name}: ${change.change_type}`;
    }
  }

  // ===== UTILITY METHODS =====
  private showSuccessMessage(message: string) {
    // Implementar toast/notification service
    console.log('✅ Sucesso:', message);
    // Temporário - usar alert
    alert(`✅ ${message}`);
  }

  private showErrorMessage(message: string) {
    // Implementar toast/notification service
    console.error('❌ Erro:', message);
    // Temporário - usar alert
    alert(`❌ ${message}`);
  }

  // ===== DEBUGGING HELPERS =====
  getPlayerDebugInfo(player: EnrichedLeaderboardPlayer): string {
    return JSON.stringify({
      rank: player.rank,
      competitiveName: player.competitiveName,
      steamName: player.steamName || 'N/A',
      confidenceLevel: player.confidenceLevel,
      hasKnownPlayer: !!player.knownPlayer,
      steamId: player.steamId.substring(0, 8) + '...'
    }, null, 2);
  }

  getStatsDebugInfo(): string {
    const stats = this.stats();
    if (!stats) return 'Stats não carregadas';

    return JSON.stringify({
      total: stats.total_known_players,
      confirmed: stats.confirmed,
      observation: stats.in_observation,
      unknown: stats.unknown,
      confidence: stats.confidence_percentage
    }, null, 2);
  }

  // ===== PLAYER STATUS HELPERS =====
  isPlayerKnown(player: EnrichedLeaderboardPlayer): boolean {
    return !!player.knownPlayer;
  }

  getPlayerDisplayName(player: EnrichedLeaderboardPlayer): string {
    // Se o player é conhecido e tem steam_name, mostrar o nome Steam
    if (player.knownPlayer?.steam_name) {
      return player.knownPlayer.steam_name;
    }

    // Senão, mostrar o nome competitivo (que vem do scraping)
    return player.competitiveName;
  }

  getPlayerCompetitiveName(player: EnrichedLeaderboardPlayer): string {
    // Se é conhecido, mostrar o nome competitivo cadastrado
    if (player.knownPlayer?.competitive_name) {
      return player.knownPlayer.competitive_name;
    }

    // Senão, mostrar o nome que veio do scraping
    return player.competitiveName;
  }

  // ===== ADVANCED FEATURES (FUTURO) =====
  async detectAnomalies() {
    try {
      this.loading.set(true);
      console.log('🔍 Detectando anomalias...');

      const anomalies = await this.knownPlayersService.detectAnomalies('europe').toPromise();

      if (anomalies && anomalies.summary.totalAnomalies > 0) {
        console.log('⚠️ Anomalias detectadas:', anomalies.summary);
        this.showErrorMessage(`⚠️ ${anomalies.summary.totalAnomalies} anomalias detectadas! Verifique os logs.`);
      } else {
        this.showSuccessMessage('✅ Nenhuma anomalia detectada no momento');
      }

    } catch (error) {
      console.error('❌ Erro ao detectar anomalias:', error);
      this.showErrorMessage('Erro ao detectar anomalias');
    } finally {
      this.loading.set(false);
    }
  }

  async syncWithLeaderboard() {
    try {
      this.loading.set(true);
      console.log('🔄 Sincronizando com leaderboard...');

      await this.knownPlayersService.syncWithLeaderboard('europe').toPromise();
      await this.loadData();
      this.showSuccessMessage('✅ Sincronização concluída com sucesso!');

    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      this.showErrorMessage('Erro na sincronização com o leaderboard');
    } finally {
      this.loading.set(false);
    }
  }

  // ===== VOLATILITY HELPERS =====
  getVolatilityInfo(rank: number): string {
    if (rank <= 100) return 'Volatilidade: ±100 posições';
    if (rank <= 500) return 'Volatilidade: ±200 posições';
    if (rank <= 1000) return 'Volatilidade: ±300 posições';
    if (rank <= 2000) return 'Volatilidade: ±400 posições';
    if (rank <= 3000) return 'Volatilidade: ±500 posições';
    return 'Zona de adaptação - Observação especial';
  }

  // ===== EXPORT/IMPORT FUNCTIONS =====
  exportLeaderboardData() {
    const data = this.filteredPlayers().map(player => ({
      rank: player.rank,
      competitiveName: player.competitiveName,
      steamName: player.steamName || '',
      knownPlayer: player.knownPlayer ? 'Sim' : 'Não',
      confidenceLevel: this.getConfidenceLevelDisplay(player.confidenceLevel),
      steamId: player.steamId,
      teamTag: player.teamTag || '',
      country: player.country || ''
    }));

    const csv = this.convertToCSV(data);
    this.downloadCSV(csv, `europe-leaderboard-${new Date().toISOString().split('T')[0]}.csv`);
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  private downloadCSV(csv: string, filename: string) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}

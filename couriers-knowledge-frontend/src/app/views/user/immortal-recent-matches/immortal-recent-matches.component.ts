// immortal-recent-matches.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameDataService } from '../../../core/game-data.service';
import { UserService } from '../../../core/user.service';
import { ToastrService } from 'ngx-toastr';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { I18nService } from '../../../core/i18n.service';

interface ImportedMatch {
  id: number;
  match_id: string;
  user_hero_id: number;
  user_won: boolean;
  duration: number;
  created_at: string;
  radiant_score: number;
  dire_score: number;
  match_date: string;
  players: MatchPlayer[];
}

interface MatchPlayer {
  heroId: number | null;
  name: string;
  rank: string;
  kills: number;
  deaths: number;
  assists: number;
  networth: number;
  team: 'radiant' | 'dire';
}

interface NewMatchForm {
  userWon: boolean;
  duration: number;
  radiantScore: number;
  direScore: number;
  radiantPlayers: MatchPlayer[];
  direPlayers: MatchPlayer[];
}

@Component({
  selector: 'app-immortal-recent-matches',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './immortal-recent-matches.component.html',
  styleUrls: ['./immortal-recent-matches.component.css']
})
export class ImmortalRecentMatchesComponent implements OnInit {

  // ===== DEPENDENCY INJECTION =====
  public gameDataService = inject(GameDataService);
  private userService = inject(UserService);
  private toastr = inject(ToastrService);
  private i18nService = inject(I18nService);

  // ===== COMPONENT STATE =====
  importedMatches: ImportedMatch[] = [];
  isLoading = false;
  selectedMatch: ImportedMatch | null = null;

  // ===== MODAL STATE =====
  isHelpModalVisible = false;
  isAddMatchModalVisible = false;

  // ===== FORM STATE =====
  currentStep = 1; // 1: Match Info, 2: Radiant Team, 3: Dire Team
  newMatch: NewMatchForm = {
    userWon: true,
    duration: 45,
    radiantScore: 0,
    direScore: 0,
    radiantPlayers: [],
    direPlayers: []
  };

  // ===== USER DATA =====
  userInfo: any = null;

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadImportedMatches();
    this.initializeNewMatchForm();
  }

  // ===== INITIALIZATION =====

  private initializeNewMatchForm(): void {
    this.newMatch = {
      userWon: true,
      duration: 45,
      radiantScore: 0,
      direScore: 0,
      radiantPlayers: this.createEmptyPlayers('radiant'),
      direPlayers: this.createEmptyPlayers('dire')
    };
  }

  private createEmptyPlayers(team: 'radiant' | 'dire'): MatchPlayer[] {
    return Array.from({ length: 5 }, () => ({
      heroId: null, // Mudei para null para evitar problemas de string
      name: '',
      rank: '',
      kills: 0,
      deaths: 0,
      assists: 0,
      networth: 0,
      team
    }));
  }

  // ===== DATA LOADING =====

  private loadUserInfo(): void {
    this.userService.getUserStats().subscribe({
      next: (user) => {
        this.userInfo = user;
      },
      error: (error) => {
        console.error('Erro ao carregar informações do usuário:', error);
      }
    });
  }

  private loadImportedMatches(): void {
    this.isLoading = true;
    // TODO: Implementar carregamento das partidas importadas

    // Mock data temporário
    setTimeout(() => {
      this.importedMatches = [
        {
          id: 1,
          match_id: '7234567890',
          user_hero_id: 1,
          user_won: true,
          duration: 2847,
          created_at: '2025-01-20T15:30:00Z',
          radiant_score: 43,
          dire_score: 31,
          match_date: '2025-01-20',
          players: []
        },
        {
          id: 2,
          match_id: '7234567891',
          user_hero_id: 74,
          user_won: false,
          duration: 3124,
          created_at: '2025-01-19T20:15:00Z',
          radiant_score: 28,
          dire_score: 35,
          match_date: '2025-01-19',
          players: []
        }
      ];
      this.isLoading = false;
    }, 1000);
  }

  // ===== MODAL ACTIONS =====

  openHelpModal(): void {
    this.isHelpModalVisible = true;
  }

  closeHelpModal(): void {
    this.isHelpModalVisible = false;
  }

  openAddMatchModal(): void {
    this.initializeNewMatchForm();
    this.currentStep = 1;
    this.isAddMatchModalVisible = true;
  }

  closeAddMatchModal(): void {
    this.isAddMatchModalVisible = false;
    this.currentStep = 1;
  }

  // ===== WIZARD NAVIGATION =====

  nextStep(): void {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  canGoNext(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.newMatch.duration > 0 &&
               this.newMatch.radiantScore >= 0 &&
               this.newMatch.direScore >= 0;
      case 2:
        // Verifica se pelo menos um jogador do Radiant tem herói selecionado
        return this.newMatch.radiantPlayers.some(p => p.heroId && p.heroId > 0);
      case 3:
        // Verifica se pelo menos um jogador do Dire tem herói selecionado
        return this.newMatch.direPlayers.some(p => p.heroId && p.heroId > 0);
      default:
        return false;
    }
  }

  getStepTitle(): string {
    switch (this.currentStep) {
      case 1:
        return this.i18nService.translate('importMatches.steps.matchInfo');
      case 2:
        return this.i18nService.translate('importMatches.steps.radiantTeam');
      case 3:
        return this.i18nService.translate('importMatches.steps.direTeam');
      default:
        return '';
    }
  }

  // Debug method - pode remover depois
  debugStepValidation(): void {
    console.log('Current Step:', this.currentStep);
    console.log('Match Data:', this.newMatch);
    console.log('Can Go Next:', this.canGoNext());

    if (this.currentStep === 2) {
      console.log('Radiant Players Raw:', this.newMatch.radiantPlayers.map(p => ({
        heroId: p.heroId,
        heroIdType: typeof p.heroId,
        isValid: p.heroId && p.heroId > 0
      })));
      console.log('Radiant Players with Heroes:',
        this.newMatch.radiantPlayers.filter(p => p.heroId && p.heroId > 0));
    }
  }

  // ===== HERO CHANGE HANDLER =====
  onHeroChange(heroId: any, player: MatchPlayer): void {
    // Converte para number ou null
    const numericHeroId = heroId ? Number(heroId) : null;
    player.heroId = numericHeroId;

    console.log('Hero changed:', {
      heroId,
      numericHeroId,
      player,
      typeof: typeof heroId
    });
  }

  // ===== MATCH FORM ACTIONS =====

  canSaveMatch(): boolean {
    // Check if at least basic match info is filled
    const hasBasicInfo = this.newMatch.duration > 0 &&
                        this.newMatch.radiantScore >= 0 &&
                        this.newMatch.direScore >= 0;

    // Check if at least some players have heroes selected
    const radiantHeroes = this.newMatch.radiantPlayers.filter(p => p.heroId && p.heroId > 0).length;
    const direHeroes = this.newMatch.direPlayers.filter(p => p.heroId && p.heroId > 0).length;

    return hasBasicInfo && radiantHeroes > 0 && direHeroes > 0;
  }

  saveMatch(): void {
    if (!this.canSaveMatch()) {
      this.toastr.warning(this.i18nService.translate('importMatches.validation.incompleteData'));
      return;
    }

    // Create new match object
    const newMatch: ImportedMatch = {
      id: Date.now(), // Temporary ID
      match_id: `manual_${Date.now()}`,
      user_hero_id: this.getUserHeroId(),
      user_won: this.newMatch.userWon,
      duration: this.newMatch.duration * 60, // Convert to seconds
      created_at: new Date().toISOString(),
      radiant_score: this.newMatch.radiantScore,
      dire_score: this.newMatch.direScore,
      match_date: new Date().toISOString().split('T')[0],
      players: [...this.newMatch.radiantPlayers, ...this.newMatch.direPlayers]
    };

    // TODO: Send to backend
    // For now, just add to local array
    this.importedMatches.unshift(newMatch);

    this.toastr.success(this.i18nService.translate('importMatches.success.matchAdded'));
    this.closeAddMatchModal();
  }

  private getUserHeroId(): number {
    // Try to find user's hero from the filled players
    // This is a simplified approach - in real implementation,
    // you'd need to ask user which player they are
    const allPlayers = [...this.newMatch.radiantPlayers, ...this.newMatch.direPlayers];
    const userPlayer = allPlayers.find(p => p.heroId! > 0);
    return userPlayer?.heroId || 1;
  }

  // ===== MATCH ACTIONS =====

  viewMatchDetails(matchId: string): void {
    const match = this.importedMatches.find(m => m.match_id === matchId);
    if (match) {
      this.selectedMatch = match;
    }
  }

  backToMatches(): void {
    this.selectedMatch = null;
  }

  deleteMatch(matchId: string): void {
    if (confirm(this.i18nService.translate('importMatches.confirm.deleteMatch'))) {
      // TODO: Implementar exclusão
      this.importedMatches = this.importedMatches.filter(m => m.match_id !== matchId);
      this.toastr.success(this.i18nService.translate('importMatches.success.matchDeleted'));
    }
  }

  // ===== UTILITY METHODS =====

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getSourceIcon(source: string): string {
    // Remove this method as we're not using source anymore
    return '';
  }

  getSourceText(source: string): string {
    // Remove this method as we're not using source anymore
    return '';
  }
}

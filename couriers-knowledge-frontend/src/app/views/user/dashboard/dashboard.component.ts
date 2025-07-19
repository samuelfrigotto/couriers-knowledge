// frontend/src/app/views/user/dashboard/dashboard.component.ts
// ATUALIZAÇÃO: Adicionar filtro permanente de jogador - VERSÃO CORRIGIDA

import { Component, HostListener , OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms'; // ✅ CORREÇÃO 1: Adicionado FormControl ao import
import { EvaluationService } from '../../../core/evaluation.service';
import { EvaluationFormComponent } from '../../../components/evaluation-form/evaluation-form.component';
import { GameDataService, Hero } from '../../../core/game-data.service';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { RatingDisplayComponent } from '../../../components/rating-display/rating-display.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    EvaluationFormComponent,
    ReactiveFormsModule,
    DecimalPipe,
    DatePipe,
    RatingDisplayComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private evaluationService = inject(EvaluationService);
  public gameDataService = inject(GameDataService);
  private toastr = inject(ToastrService);
  private fb = inject(FormBuilder);

  private allEvaluations: any[] = [];
  public displayedEvaluations: any[] = [];

  // ✅ CORREÇÃO 2: Inicializar as propriedades do filtro permanente
  public filteredBySearch: any[] = [];
  public permanentSearchControl = new FormControl('');

  public isLoading = true;
  public isRefreshing = false;
  public isFormModalVisible = false;
  public selectedEvaluation: any = null;
  public isFilterVisible = false;
  public activeFilter: string | null = null;
  public filterForm: FormGroup;
  public heroes$!: Observable<Hero[]>;
  public roles = ['hc', 'mid', 'off', 'sup 4', 'sup 5', 'outro'];
  public activeActionMenu: number | null = null;

  public evaluationStatus: any = null;
  public isLimitReached = false;
  public showUpgradeMessage = false;

  constructor() {
    this.filterForm = this.fb.group({
      playerName: [''],
      heroId: [null],
      role: [null],
      minRating: [null],
      maxRating: [null],
      notes: [''],
      tags: ['']
    });
  }

  ngOnInit(): void {
    this.heroes$ = this.gameDataService.heroes$.pipe(
      map(heroesMap => Object.values(heroesMap).sort((a, b) => a.localized_name.localeCompare(b.localized_name)))
    );

    // ✅ CORREÇÃO 3: Inicializar filteredBySearch antes de configurar listeners
    this.filteredBySearch = [];
    this.setupPermanentSearchListener();
    this.loadAllEvaluations();
    this.checkEvaluationLimit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.activeActionMenu = null;
    const target = event.target as HTMLElement;
    if (!target.closest('.header-title')) {
      this.activeFilter = null;
    }
  }

  loadAllEvaluations(): void {
    this.isLoading = true;
    this.evaluationService.getMyEvaluations().pipe(
      map(evaluations => evaluations.sort(this.customSort))
    ).subscribe({
      next: (sortedData) => {
        this.allEvaluations = sortedData;
        // ✅ CORREÇÃO 4: Garantir que filteredBySearch seja inicializado
        this.filteredBySearch = [...this.allEvaluations];
        this.applyAllFilters();
        this.setupFilterListener();
        this.isLoading = false;
      },
      error: (err) => {
        this.toastr.error('Falha ao buscar avaliações.');
        this.isLoading = false;
      }
    });
  }

  // Configurar listener do filtro permanente
  setupPermanentSearchListener(): void {
    this.permanentSearchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.applyPermanentSearch(searchTerm || '');
      this.applyAllFilters();
    });
  }

  // Aplicar filtro de busca permanente
  applyPermanentSearch(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.filteredBySearch = [...this.allEvaluations];
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    this.filteredBySearch = this.allEvaluations.filter(evaluation => {
      const playerName = (evaluation.targetPlayerName || '').toLowerCase();
      const steamId = (evaluation.target_player_steam_id || '').toLowerCase();
      const matchId = (evaluation.match_id || '').toString().toLowerCase();

      return playerName.includes(term) ||
             steamId.includes(term) ||
             matchId.includes(term);
    });

    console.log(`🔍 Busca permanente: "${searchTerm}" - ${this.filteredBySearch.length} resultados`);
  }

  // Limpar busca permanente
  clearPermanentSearch(): void {
    this.permanentSearchControl.setValue('');
    this.toastr.info('Busca limpa!');
  }

  setupFilterListener(): void {
    this.filterForm.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    ).subscribe(() => {
      this.applyAllFilters();
    });
  }

  // ✅ CORREÇÃO 5: Melhorar a lógica de aplicação de filtros
  applyAllFilters(): void {
    const filters = this.filterForm.value;

    // Começar com dados filtrados pela busca permanente (com verificação de segurança)
    const searchTerm = this.permanentSearchControl.value || '';
    let filtered = searchTerm.trim() && this.filteredBySearch.length >= 0 ?
      [...this.filteredBySearch] :
      [...this.allEvaluations];

    // Aplicar filtros do formulário
    if (filters.playerName) {
      const term = filters.playerName.toLowerCase();
      filtered = filtered.filter(e => (e.targetPlayerName || '').toLowerCase().includes(term));
    }
    if (filters.heroId) {
      filtered = filtered.filter(e => e.hero_id === Number(filters.heroId));
    }
    if (filters.role) {
      filtered = filtered.filter(e => e.role === filters.role);
    }

    const { minRating, maxRating } = this.filterForm.value;
    if (minRating !== null || maxRating !== null) {
      const min = minRating === null ? 1 : Number(minRating);
      const max = maxRating === null ? 5 : Number(maxRating);
      filtered = filtered.filter(e => e.rating >= min && e.rating <= max);
    }

    if (filters.notes) {
      const term = filters.notes.toLowerCase();
      filtered = filtered.filter(e => (e.notes || '').toLowerCase().includes(term));
    }
    if (filters.tags) {
      const term = filters.tags.toLowerCase();
      filtered = filtered.filter(e => (e.tags || []).some((tag: string) => tag.toLowerCase().includes(term)));
    }

    this.displayedEvaluations = filtered;
  }

  private customSort(a: any, b: any): number {
    const nameA = (a.targetPlayerName || '').toLowerCase();
    const nameB = (b.targetPlayerName || '').toLowerCase();
    const isLetterA = /^[a-z]/.test(nameA);
    const isLetterB = /^[a-z]/.test(nameB);

    if (isLetterA && !isLetterB) return -1;
    if (!isLetterA && isLetterB) return 1;

    return nameA.localeCompare(nameB);
  }

  toggleFilter(filterName: string, event: MouseEvent): void {
    event.stopPropagation();
    this.activeFilter = this.activeFilter === filterName ? null : filterName;
  }

  // Resetar filtros incluindo busca permanente
  resetFilters(): void {
    // Limpar formulário de filtros
    this.filterForm.reset({
      playerName: '',
      heroId: null,
      role: null,
      minRating: null,
      maxRating: null,
      notes: '',
      tags: ''
    });

    // Limpar também a busca permanente
    this.permanentSearchControl.setValue('');

    this.activeFilter = null;
    this.toastr.info('Todos os filtros foram limpos!');
  }

  refreshNames(): void {
    this.isRefreshing = true;
    this.evaluationService.refreshPlayerNames().subscribe({
      next: (response) => {
        this.toastr.success(response.message || 'Nomes atualizados!');
        this.loadAllEvaluations();
        this.isRefreshing = false;
      },
      error: (err) => {
        this.toastr.error('Ocorreu um erro ao tentar atualizar os nomes.');
        this.isRefreshing = false;
      }
    });
  }

  openFormModal(): void {
    if (this.isLimitReached) {
      this.showUpgradeToast();
      return;
    }

    this.selectedEvaluation = null;
    this.isFormModalVisible = true;
  }

  editEvaluation(evaluation: any): void {
    this.selectedEvaluation = evaluation;
    this.isFormModalVisible = true;
    this.activeActionMenu = null;
  }

  deleteEvaluation(evaluationId: number): void {
    if (confirm('Tem certeza de que deseja excluir esta avaliação?')) {
      this.evaluationService.deleteEvaluation(evaluationId.toString()).subscribe({
        next: () => {
          this.toastr.success('Avaliação excluída com sucesso!');
          this.loadAllEvaluations();
          this.activeActionMenu = null;
        },
        error: (err) => {
          this.toastr.error('Falha ao excluir avaliação.');
        }
      });
    }
  }

  onFormSubmitted(): void {
    this.isFormModalVisible = false;
    this.loadAllEvaluations();
    this.checkEvaluationLimit();
  }

  onFormClosed(): void {
    this.isFormModalVisible = false;
    this.selectedEvaluation = null;
  }

  async shareEvaluation(evaluation: any): Promise<void> {
    try {
      this.activeActionMenu = null;
      const heroName = evaluation.hero_id ?
        this.gameDataService.getHeroById(evaluation.hero_id)?.localized_name || 'Herói não informado' :
        'Herói não informado';

      const rating = Number(evaluation.rating);
      const formattedRating = (rating % 1 === 0) ? rating.toFixed(0) : rating.toFixed(1);
      const ratingStars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));

      let shareText = `[Courier's Knowledge] Avaliação de jogador:\n`;
      shareText += `- Jogador: ${evaluation.targetPlayerName || 'Jogador Desconhecido'}`;
      if (evaluation.target_player_steam_id) {
        shareText += ` (ID: ${evaluation.target_player_steam_id})`;
      }
      shareText += `\n`;
      shareText += `- Herói: ${heroName}\n`;
      if (evaluation.match_id) {
        shareText += `- Partida: ${evaluation.match_id}\n`;
      }
      shareText += `- Nota: ${formattedRating}/5 (${ratingStars})\n`;
      shareText += `- Anotações: "${evaluation.notes || 'Nenhuma.'}"\n`;
      shareText += `- Tags: ${evaluation.tags && evaluation.tags.length > 0 ? '#' + evaluation.tags.join(' #') : 'Nenhuma.'}\n`;
      shareText += `\nAnote e avalie seus jogos com o Courier's Knowledge!`;

      await navigator.clipboard.writeText(shareText);
      this.toastr.success('Avaliação copiada para a área de transferência!');

    } catch (err) {
      console.error('Erro ao compartilhar avaliação:', err);
      this.toastr.error('Não foi possível copiar a avaliação.');
    }
  }

  toggleActionMenu(event: MouseEvent, evaluationId: number): void {
    event.stopPropagation();
    this.activeActionMenu = this.activeActionMenu === evaluationId ? null : evaluationId;
  }


  private checkEvaluationLimit(): void {
    this.evaluationService.getEvaluationStatus().subscribe({
      next: (status) => {
        this.evaluationStatus = status;
        this.isLimitReached = status.limitReached;

        if (this.isLimitReached) {
          this.toastr.warning(
            `Você atingiu o limite de ${status.limit} avaliações do plano gratuito. Considere fazer upgrade para Premium!`,
            'Limite Atingido',
            { timeOut: 8000 }
          );
        }
      },
      error: (err) => {
        console.error('Erro ao verificar limite de avaliações:', err);
      }
    });
  }

  private showUpgradeToast(): void {
    this.toastr.error(
      'Você atingiu o limite de avaliações do plano gratuito. Faça upgrade para Premium para avaliações ilimitadas!',
      'Limite Atingido',
      {
        timeOut: 10000,
        closeButton: true
      }
    );
  }

  onEvaluationError(error: any): void {
    // Reagir a erros do formulário se necessário
    if (error.status === 403) {
      this.checkEvaluationLimit(); // Atualizar status do limite
    }
  }

  // ✅ NOVO MÉTODO: Mostrar modal de upgrade
  showUpgradeModal(): void {
    this.showUpgradeMessage = true;
  }

  // ✅ NOVO MÉTODO: Fechar modal de upgrade
  closeUpgradeModal(): void {
    this.showUpgradeMessage = false;
  }

}

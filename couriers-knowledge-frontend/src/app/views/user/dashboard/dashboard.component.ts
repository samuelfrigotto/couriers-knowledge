import { Component, HostListener , OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
    this.loadAllEvaluations();
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

  setupFilterListener(): void {
    this.filterForm.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    ).subscribe(() => {
      this.applyAllFilters();
    });
  }

  applyAllFilters(): void {
    const filters = this.filterForm.value;
    let filtered = [...this.allEvaluations];

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

  resetFilters(): void {
    this.filterForm.reset({
      playerName: '',
      heroId: null,
      role: null,
      minRating: null,
      maxRating: null,
      notes: '',
      tags: ''
    });
    this.activeFilter = null;
    this.toastr.info('Filtros limpos!');
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
        this.toastr.error('Ocorreu um erro ao tentar atualizar os nomes.', 'Falha');
        this.isRefreshing = false;
      }
    });
  }

  deleteEvaluation(id: string, event: MouseEvent): void {
    event.stopPropagation();
    const confirmed = window.confirm('Você tem certeza que deseja apagar esta avaliação? Esta ação não pode ser desfeita.');

    if (confirmed) {
      this.evaluationService.deleteEvaluation(id).subscribe({
        next: () => {
          this.toastr.success('Avaliação apagada com sucesso!');
          this.allEvaluations = this.allEvaluations.filter(e => e.id !== id);
          this.applyAllFilters();
        },
        error: (err) => {
          this.toastr.error('Erro ao apagar avaliação');
          console.error('Erro ao apagar avaliação', err);
        }
      });
    }
  }

  onFormSaved(): void {
    this.toastr.success('Avaliação salva com sucesso!');
    this.closeFormModal();
    this.loadAllEvaluations();
  }

  openFormModal(): void {
    this.selectedEvaluation = null;
    this.isFormModalVisible = true;
  }

  openEditModal(evaluation: any): void {
    this.selectedEvaluation = evaluation;
    this.isFormModalVisible = true;
  }

  closeFormModal(): void {
    this.isFormModalVisible = false;
    this.selectedEvaluation = null;
  }

  async shareEvaluation(evaluation: any): Promise<void> {
    try {
      const hero = await this.gameDataService.getHeroById(evaluation.hero_id);
      const heroName = hero ? hero.localized_name : 'Herói não informado';

      const rating = Number(evaluation.rating);
      // Formata a nota para não exibir ".0" para números inteiros
      const formattedRating = (rating % 1 === 0) ? rating.toFixed(0) : rating.toFixed(1);
      const ratingStars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));

      // Inicia a construção do texto de compartilhamento
      let shareText = `[Courier's Knowledge] Avaliação de jogador:\n`;

      // Adiciona o nome do jogador e, se disponível, o Steam ID
      shareText += `- Jogador: ${evaluation.targetPlayerName || 'Jogador Desconhecido'}`;
      // A propriedade do ID do jogador é 'target_player_steam_id'
      if (evaluation.target_player_steam_id) {
        shareText += ` (ID: ${evaluation.target_player_steam_id})`;
      }
      shareText += `\n`;

      shareText += `- Herói: ${heroName}\n`;

      // Adiciona a partida, se disponível
      if (evaluation.match_id) {
        shareText += `- Partida: ${evaluation.match_id}\n`;
      }

      // Adiciona o restante das informações
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
}

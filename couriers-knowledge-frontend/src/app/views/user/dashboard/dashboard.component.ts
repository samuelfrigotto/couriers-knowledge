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
  imports: [CommonModule, EvaluationFormComponent, ReactiveFormsModule, DecimalPipe, DatePipe, RatingDisplayComponent],
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

  constructor() {
    this.filterForm = this.fb.group({
      playerName: [''],
      heroId: [null],
      role: [null],
      rating: [null],
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

  // Detecta cliques fora dos filtros para fechá-los
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Se o clique não foi em um título de filtro, fecha o popover ativo
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
        // CORREÇÃO: Removemos a chamada ao setupFilterListener daqui
        this.applyAllFilters(); // Aplicamos o filtro inicial aqui
        this.setupFilterListener(); // E então configuramos o ouvinte para futuras mudanças
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
      // Quando qualquer valor do formulário muda, nós re-aplicamos todos os filtros.
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
    if (filters.rating) {
      // CORREÇÃO: Trocamos '>=' por '===' para uma busca exata.
      filtered = filtered.filter(e => e.rating === Number(filters.rating));
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
    event.stopPropagation(); // Impede que o clique no documento seja acionado
    this.activeFilter = this.activeFilter === filterName ? null : filterName;
  }

  resetFilters(): void {
    this.filterForm.reset({ 
      playerName: '', heroId: null, role: null, 
      rating: null, notes: '', tags: '' 
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
}
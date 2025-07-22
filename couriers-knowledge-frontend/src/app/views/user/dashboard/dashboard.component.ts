// ===== DASHBOARD.COMPONENT.TS ATUALIZADO =====

import { Component, HostListener, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { EvaluationService } from '../../../core/evaluation.service';
import { EvaluationFormComponent } from '../../../components/evaluation-form/evaluation-form.component';
import { GameDataService, Hero } from '../../../core/game-data.service';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
} from 'rxjs/operators';
import { RatingDisplayComponent } from '../../../components/rating-display/rating-display.component';
import { EmptyStateComponent } from '../../../components/empty-state/empty-state.component';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    EvaluationFormComponent,
    ReactiveFormsModule,
    DecimalPipe,
    DatePipe,
    RatingDisplayComponent,
    EmptyStateComponent,
    FormsModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private evaluationService = inject(EvaluationService);
  public gameDataService = inject(GameDataService);
  private toastr = inject(ToastrService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // Dados das avaliações
  private allEvaluations: any[] = [];
  public displayedEvaluations: any[] = [];
  public filteredBySearch: any[] = [];
  public permanentSearchControl = new FormControl('');

  // Estados gerais
  public isLoading = true;
  public isRefreshing = false;
  public isFormModalVisible = false;
  public selectedEvaluation: any = null;
  public isFilterVisible = false;
  public activeFilter: string | null = null;
  public filterForm: FormGroup;
  public heroes$!: Observable<Hero[]>;
  public filteredHeroes$!: Observable<Hero[]>;

  // Sistema de ações
  public activeActionMenu: number | null = null;

  // Limite de avaliações
  public evaluationStatus: any = null;
  public isLimitReached = false;

  // ===== NOVOS ESTADOS PARA IMPORT/EXPORT =====
  // Modals
  public showExportModal = false;
  public showImportModal = false;

  // Seleção múltipla
  public isSelectionMode = false;
  public selectedEvaluations: Set<number> = new Set();

  // Export
  public exportType: 'all' | 'selected' = 'all';
  public isExporting = false;

  // Import
  public importTab: 'file' | 'code' = 'file';
  public importMode: 'add' | 'merge' | 'replace' = 'add';
  public shareCode = '';
  public selectedFile: File | null = null;
  public isImporting = false;
  public importPreview: any = null;

  // Drag & Drop
  public isDragOver = false;

  constructor() {
    this.filterForm = this.fb.group({
      rating: [''],
      hero: [''],
      tags: [''],
      role: [''],
      notes: [''],
      matchId: [''],
      playerName: [''],
    });
  }

  ngOnInit(): void {
    this.loadAllEvaluations();
    this.checkEvaluationLimit();
    this.setupHeroes();
    this.setupPermanentSearch();
  }

  // ===== MÉTODOS EXISTENTES (mantidos) =====

  private setupHeroes(): void {
    // Corrigindo o método getAllHeroes - usando heroes$ diretamente
    this.heroes$ = this.gameDataService.heroes$.pipe(
      map((heroesMap) => {
        // Converter o mapa de heróis em array
        return Object.entries(heroesMap).map(([id, hero]) => ({
          ...hero,
          id: parseInt(id, 10)
        })).sort((a, b) => a.localized_name.localeCompare(b.localized_name));
      })
    );

    this.filteredHeroes$ = this.heroes$.pipe(
      map((heroes) => heroes.slice(0, 50))
    );
  }

  private setupPermanentSearch(): void {
    this.permanentSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.applyPermanentSearch(searchTerm || '');
      });
  }

  private applyPermanentSearch(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.filteredBySearch = [...this.allEvaluations];
    } else {
      const term = searchTerm.toLowerCase();
      this.filteredBySearch = this.allEvaluations.filter((evaluation) => {
        const playerName = evaluation.targetPlayerName?.toLowerCase() || '';
        const steamId = evaluation.target_player_steam_id?.toLowerCase() || '';
        return playerName.includes(term) || steamId.includes(term);
      });
    }
    this.applyFilters();
  }

  public clearPermanentSearch(): void {
    this.permanentSearchControl.setValue('');
  }

  private loadAllEvaluations(): void {
    this.isLoading = true;
    this.evaluationService.getMyEvaluations().subscribe({
      next: (evaluations) => {
        this.allEvaluations = evaluations;
        this.applyPermanentSearch(this.permanentSearchControl.value || '');
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar avaliações:', err);
        this.toastr.error('Falha ao carregar avaliações.');
        this.isLoading = false;
      },
    });
  }

  public refreshNames(): void {
    this.isRefreshing = true;
    this.evaluationService.refreshPlayerNames().subscribe({
      next: () => {
        this.toastr.success('Nomes de jogadores atualizados!');
        this.loadAllEvaluations();
        this.isRefreshing = false;
      },
      error: (err) => {
        this.toastr.error('Falha ao atualizar nomes.');
        this.isRefreshing = false;
      },
    });
  }

  private applyFilters(): void {
    let filtered = [...this.filteredBySearch];
    const filters = this.filterForm.value;

    // Aplicar filtros...
    if (filters.rating) {
      const rating = parseFloat(filters.rating);
      filtered = filtered.filter(
        (evaluation) => Math.floor(evaluation.rating) === Math.floor(rating)
      );
    }

    // ... outros filtros mantidos igual

    this.displayedEvaluations = filtered;
  }

  // ===== NOVOS MÉTODOS PARA IMPORT/EXPORT =====

  // ===== SELEÇÃO MÚLTIPLA =====

  public toggleSelectionMode(): void {
    this.isSelectionMode = !this.isSelectionMode;
    if (!this.isSelectionMode) {
      this.selectedEvaluations.clear();
    }
  }

  public toggleEvaluationSelection(evaluationId: number): void {
    if (this.selectedEvaluations.has(evaluationId)) {
      this.selectedEvaluations.delete(evaluationId);
    } else {
      this.selectedEvaluations.add(evaluationId);
    }
  }

  public selectAllEvaluations(): void {
    this.displayedEvaluations.forEach(evaluation => {
      this.selectedEvaluations.add(evaluation.id);
    });
  }

  public clearAllSelections(): void {
    this.selectedEvaluations.clear();
  }

  public isEvaluationSelected(evaluationId: number): boolean {
    return this.selectedEvaluations.has(evaluationId);
  }

  // ===== EXPORT =====

  public openExportModal(): void {
    this.showExportModal = true;
    this.exportType = this.selectedEvaluations.size > 0 ? 'selected' : 'all';
  }

  public closeExportModal(): void {
    this.showExportModal = false;
    this.isExporting = false;
  }

  public exportEvaluations(): void {
    if (this.isExporting) return;

    const evaluationIds = this.exportType === 'selected'
      ? Array.from(this.selectedEvaluations)
      : undefined;

    if (this.exportType === 'selected' && evaluationIds!.length === 0) {
      this.toastr.warning('Selecione pelo menos uma avaliação para exportar.');
      return;
    }

    this.isExporting = true;

    this.evaluationService.exportEvaluations(evaluationIds).subscribe({
      next: (response) => {
        // Download do arquivo JSON
        this.downloadJsonFile(response.exportData, 'avaliacoes-courier-knowledge.json');

        // Mostrar código de compartilhamento
        const message = `Exportação concluída! ${response.exportData.total_evaluations} avaliações exportadas.`;
        this.toastr.success(message);

        // Copiar código para clipboard
        if (response.shareCode) {
          navigator.clipboard.writeText(response.shareCode).then(() => {
            this.toastr.info(`Código de compartilhamento copiado: ${response.shareCode}`);
          });
        }

        this.closeExportModal();

        // Sair do modo de seleção se estava ativo
        if (this.isSelectionMode) {
          this.toggleSelectionMode();
        }
      },
      error: (error) => {
        console.error('Erro ao exportar:', error);
        this.toastr.error('Erro ao exportar avaliações.');
        this.isExporting = false;
      }
    });
  }

  private downloadJsonFile(data: any, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // ===== IMPORT =====

  public openImportModal(): void {
    this.showImportModal = true;
    this.resetImportState();
  }

  public closeImportModal(): void {
    this.showImportModal = false;
    this.resetImportState();
  }

  private resetImportState(): void {
    this.shareCode = '';
    this.selectedFile = null;
    this.importPreview = null;
    this.isImporting = false;
    this.importTab = 'file';
    this.importMode = 'add';

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  public onFileSelected(event: any): void {
    const file = event.target.files[0];
    this.processSelectedFile(file);
  }

  public onFileDropped(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processSelectedFile(files[0]);
    }
  }

  public onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  public onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  private processSelectedFile(file: File): void {
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      this.toastr.error('Por favor, selecione um arquivo JSON válido.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      this.toastr.error('Arquivo muito grande. Máximo: 10MB.');
      return;
    }

    this.selectedFile = file;
    this.previewImportFile(file);
  }

  private previewImportFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        // Validar estrutura do arquivo
        if (!this.validateImportData(data)) {
          this.toastr.error('Formato do arquivo de importação inválido.');
          this.selectedFile = null;
          return;
        }

        this.importPreview = {
          total: data.evaluations?.length || 0,
          version: data.version || 'Desconhecida',
          exportedBy: data.exported_by || 'Desconhecido',
          exportedAt: data.exported_at ? new Date(data.exported_at) : null
        };

      } catch (error) {
        this.toastr.error('Erro ao ler arquivo JSON. Verifique se o arquivo está correto.');
        this.selectedFile = null;
        this.importPreview = null;
      }
    };

    reader.onerror = () => {
      this.toastr.error('Erro ao ler arquivo.');
      this.selectedFile = null;
    };

    reader.readAsText(file);
  }

  private validateImportData(data: any): boolean {
    return data &&
           typeof data === 'object' &&
           Array.isArray(data.evaluations) &&
           data.evaluations.length > 0;
  }

  public importEvaluations(): void {
    console.log('API URL:', this.evaluationService['apiUrl']);
    console.log('Dados sendo enviados:', { shareCode: this.shareCode, mode: this.importMode });

    if (this.isImporting || !this.canImport()) return;

    this.isImporting = true;

    if (this.importTab === 'code' && this.shareCode.trim()) {
      // Importar por código
      this.evaluationService.importByShareCode(this.shareCode.trim(), this.importMode).subscribe({
        next: (response) => this.handleImportSuccess(response),
        error: (error) => this.handleImportError(error, 'Erro ao importar por código.')
      });

    } else if (this.importTab === 'file' && this.selectedFile) {
      // Importar por arquivo
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);

          this.evaluationService.importEvaluations(data, this.importMode).subscribe({
            next: (response) => this.handleImportSuccess(response),
            error: (error) => this.handleImportError(error, 'Erro ao importar arquivo.')
          });

        } catch (parseError) {
          this.handleImportError(parseError, 'Arquivo JSON inválido.');
        }
      };
      reader.readAsText(this.selectedFile);
    }
  }

  private handleImportSuccess(response: any): void {
    let message = `Importação concluída! ${response.imported} avaliação(ões) importada(s)`;

    if (response.skipped > 0) {
      message += `, ${response.skipped} ignorada(s) (duplicatas)`;
    }

    if (response.errors && response.errors.length > 0) {
      message += `. ${response.errors.length} erro(s) encontrado(s)`;
      console.warn('Erros na importação:', response.errors);
    }

    this.toastr.success(message);

    // Recarregar dados
    this.loadAllEvaluations();
    this.checkEvaluationLimit();

    this.closeImportModal();
  }

  private handleImportError(error: any, fallbackMessage: string): void {
    console.error('Erro na importação:', error);

    const errorMessage = error?.error?.message || error?.message || fallbackMessage;
    this.toastr.error(errorMessage);

    this.isImporting = false;
  }

  public canImport(): boolean {
    return (this.importTab === 'code' && this.shareCode.trim().length >= 8) ||
           (this.importTab === 'file' && this.selectedFile !== null);
  }

  // ===== MÉTODOS AUXILIARES =====

  public getImportModeDescription(): string {
    switch (this.importMode) {
      case 'add': return 'Adicionar novas avaliações (manter existentes)';
      case 'merge': return 'Mesclar avaliações (atualizar existentes)';
      case 'replace': return 'Substituir todas as avaliações';
      default: return '';
    }
  }

  public getSelectedCount(): number {
    return this.selectedEvaluations.size;
  }

  public getTotalDisplayed(): number {
    return this.displayedEvaluations.length;
  }

  // ===== MÉTODOS EXISTENTES MANTIDOS =====

  public openFormModal(evaluation?: any): void {
    console.log('Abrindo formulário:', evaluation);
    if (this.isLimitReached && !evaluation) {
      this.toastr.warning('Limite de avaliações atingido. Considere fazer upgrade para Premium!');
      return;
    }
    this.selectedEvaluation = evaluation || null;
    this.isFormModalVisible = true;
  }

  public deleteEvaluation(evaluationId: number): void {
    if (confirm('Tem certeza que deseja excluir esta avaliação?')) {
      this.evaluationService
        .deleteEvaluation(evaluationId.toString())
        .subscribe({
          next: () => {
            this.toastr.success('Avaliação excluída com sucesso!');
            this.loadAllEvaluations();
            this.activeActionMenu = null;

            // Remover da seleção se estava selecionada
            this.selectedEvaluations.delete(evaluationId);
          },
          error: (err) => {
            this.toastr.error('Falha ao excluir avaliação.');
          },
        });
    }
  }

  public onFormSubmitted(): void {
    this.isFormModalVisible = false;
    this.loadAllEvaluations();
    this.checkEvaluationLimit();
  }

  public onFormClosed(): void {
    this.isFormModalVisible = false;
    this.selectedEvaluation = null;
  }

  public async shareEvaluation(evaluation: any): Promise<void> {
    try {
      this.activeActionMenu = null;
      const heroName = evaluation.hero_id
        ? this.gameDataService.getHeroById(evaluation.hero_id)
            ?.localized_name || 'Herói não informado'
        : 'Herói não informado';

      const rating = Number(evaluation.rating);
      const formattedRating =
        rating % 1 === 0 ? rating.toFixed(0) : rating.toFixed(1);
      const ratingStars =
        '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));

      let shareText = `[Courier's Knowledge] Avaliação de jogador:\n`;
      shareText += `- Jogador: ${
        evaluation.targetPlayerName || 'Jogador Desconhecido'
      }`;
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
      shareText += `- Tags: ${
        evaluation.tags && evaluation.tags.length > 0
          ? '#' + evaluation.tags.join(' #')
          : 'Nenhuma.'
      }\n`;
      shareText += `\nAnote e avalie seus jogos com o Courier's Knowledge!`;

      await navigator.clipboard.writeText(shareText);
      this.toastr.success('Avaliação copiada para a área de transferência!');
    } catch (err) {
      console.error('Erro ao compartilhar avaliação:', err);
      this.toastr.error('Não foi possível copiar a avaliação.');
    }
  }

  public toggleActionMenu(event: MouseEvent, evaluationId: number): void {
    event.stopPropagation();
    this.activeActionMenu =
      this.activeActionMenu === evaluationId ? null : evaluationId;
  }

  private checkEvaluationLimit(): void {
    this.evaluationService.getEvaluationStatus().subscribe({
      next: (status) => {
        this.evaluationStatus = status;
        this.isLimitReached = status.limitReached;

        if (this.isLimitReached) {
          this.toastr.warning(
            `Você atingiu o limite de ${status.limit} avaliações do plano gratuito.`
          );
        }
      },
      error: (err) => {
        console.error('Erro ao verificar limite:', err);
      },
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.action-menu-container')) {
      this.activeActionMenu = null;
    }
    if (!target.closest('.filter-popover') && !target.closest('.header-title')) {
      this.activeFilter = null;
    }
  }

  public trackByEvaluationId(index: number, evaluation: any): number {
  return evaluation.id;
  }


  public onEvaluationError(error: any): void {
    console.error('❌ Erro na avaliação:', error);
    // O formulário já mostrou o toast, só precisamos logar
  }
}

// ===== DASHBOARD.COMPONENT.TS ATUALIZADO =====

import {
  Component,
  HostListener,
  OnInit,
  inject,
  ViewChild,
  ElementRef,
} from '@angular/core';
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
  public pastedText: string = '';
  public pastedPreview: any = null;
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
  public exportResult: any = null;

  // Import
  public importTab: 'file' | 'code' | 'paste' = 'paste';
  public importMode: 'add' | 'merge' | 'replace' = 'add';
  public shareCode = '';
  public selectedFile: File | null = null;
  public isImporting = false;
  public importPreview: any = null;

  // Drag & Drop
  public isDragOver = false;

  // NOVAS propriedades para rate limiting
  public importExportStats: any = null;
  public canExportToday: boolean = true;
  public canImportToday: boolean = true;
  public canExportThisMonth: boolean = true;
  public canImportThisMonth: boolean = true;

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
    this.loadImportExportStats();
    this.setupHeroes();
    this.setupPermanentSearch();
  }

  // ===== MÉTODOS EXISTENTES (mantidos) =====

  private setupHeroes(): void {
    // Corrigindo o método getAllHeroes - usando heroes$ diretamente
    this.heroes$ = this.gameDataService.heroes$.pipe(
      map((heroesMap) => {
        // Converter o mapa de heróis em array
        return Object.entries(heroesMap)
          .map(([id, hero]) => ({
            ...hero,
            id: parseInt(id, 10),
          }))
          .sort((a, b) => a.localized_name.localeCompare(b.localized_name));
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
    this.displayedEvaluations.forEach((evaluation) => {
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
    // Verificar limites antes de abrir modal
    if (!this.canExportToday) {
      this.toastr.warning(
        'Limite diário de exportações atingido. Upgrade para Premium para mais exportações!'
      );
      return;
    }

    if (!this.canExportThisMonth) {
      this.toastr.warning('Limite mensal de exportações atingido.');
      return;
    }

    this.showExportModal = true;
    this.resetExportState();
  }

  public closeExportModal(): void {
    this.showExportModal = false;
    this.isExporting = false;
    this.exportResult = null; // NOVA - limpar resultado
  }

  public exportEvaluations(): void {
    if (this.isExporting) return;

    const evaluationIds =
      this.exportType === 'selected'
        ? Array.from(this.selectedEvaluations)
        : undefined;

    if (this.exportType === 'selected' && evaluationIds!.length === 0) {
      this.toastr.warning('Selecione pelo menos uma avaliação para exportar.');
      return;
    }

    this.isExporting = true;

    this.evaluationService.exportEvaluations(evaluationIds).subscribe({
      next: (response) => {
        // Salvar resultado para mostrar no modal
        this.exportResult = {
          shareCode: response.shareCode,
          totalEvaluations: response.exportData.total_evaluations,
          exportedBy: response.exportData.exported_by,
          exportedAt: new Date(response.exportData.exported_at),
        };

        // Download do arquivo JSON
        this.downloadJsonFile(
          response.exportData,
          'avaliacoes-courier-knowledge.json'
        );

        // Mostrar sucesso
        const message = `Exportação concluída! ${response.exportData.total_evaluations} avaliações exportadas.`;
        this.toastr.success(message);

        this.isExporting = false;

        // Recarregar estatísticas após exportação
        this.loadImportExportStats();

        // Sair do modo de seleção se estava ativo
        if (this.isSelectionMode) {
          this.toggleSelectionMode();
        }
      },
      error: (error) => {
        console.error('Erro ao exportar:', error);

        // Tratamento específico para erro de rate limit
        if (error.status === 429) {
          const errorMsg =
            error.error?.message || 'Limite de exportações atingido.';
          this.toastr.error(errorMsg);
          this.loadImportExportStats(); // Recarregar para atualizar limites
        } else {
          this.toastr.error('Erro ao exportar avaliações.');
        }

        this.isExporting = false;
        this.exportResult = null;
      },
    });
  }

  private downloadJsonFile(data: any, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
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
    // Verificar limites antes de abrir modal
    if (!this.canImportToday) {
      this.toastr.warning(
        'Limite diário de importações atingido. Upgrade para Premium para mais importações!'
      );
      return;
    }

    if (!this.canImportThisMonth) {
      this.toastr.warning('Limite mensal de importações atingido.');
      return;
    }

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
    this.pastedText = '';
    this.pastedPreview = null;
    this.isImporting = false;
    this.importTab = 'paste'; // Começar com a aba de colar
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

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
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
          exportedAt: data.exported_at ? new Date(data.exported_at) : null,
        };
      } catch (error) {
        this.toastr.error(
          'Erro ao ler arquivo JSON. Verifique se o arquivo está correto.'
        );
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
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.evaluations) &&
      data.evaluations.length > 0
    );
  }

  public importEvaluations(): void {
    console.log('Iniciando importação...');
    console.log('Tab ativa:', this.importTab);

    if (this.isImporting || !this.canImport()) return;

    this.isImporting = true;

    if (this.importTab === 'code' && this.shareCode.trim()) {
      // Importar por código
      this.evaluationService
        .importByShareCode(this.shareCode.trim(), this.importMode)
        .subscribe({
          next: (response) => this.handleImportSuccess(response),
          error: (error) =>
            this.handleImportError(error, 'Erro ao importar por código.'),
        });
    } else if (this.importTab === 'file' && this.selectedFile) {
      // Importar por arquivo JSON
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          this.processImportData(data);
        } catch (parseError) {
          this.handleImportError(parseError, 'Arquivo JSON inválido.');
        }
      };
      reader.readAsText(this.selectedFile);
    } else if (this.importTab === 'paste' && this.pastedText.trim()) {
      // Importar por texto colado
      if (this.pastedPreview.type === 'json') {
        // É um JSON
        try {
          const data = JSON.parse(this.pastedText.trim());
          this.processImportData(data);
        } catch (parseError) {
          this.handleImportError(parseError, 'JSON colado inválido.');
        }
      } else if (this.pastedPreview.type === 'text') {
        // É texto amigável
        this.processTextImport(this.pastedPreview.evaluation);
      }
    }
  }

  private processImportData(data: any): void {
    if (!this.validateImportData(data)) {
      this.handleImportError(null, 'Formato dos dados de importação inválido.');
      return;
    }

    this.evaluationService.importEvaluations(data, this.importMode).subscribe({
      next: (response) => this.handleImportSuccess(response),
      error: (error) =>
        this.handleImportError(error, 'Erro ao importar dados.'),
    });
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
    this.loadImportExportStats(); // NOVA - recarregar estatísticas

    this.closeImportModal();
  }

  private handleImportError(error: any, fallbackMessage: string): void {
    console.error('Erro na importação:', error);

    // Tratamento específico para erro de rate limit
    if (error.status === 429) {
      const errorMsg =
        error.error?.message || 'Limite de importações atingido.';
      this.toastr.error(errorMsg);
      this.loadImportExportStats(); // Recarregar para atualizar limites
    } else {
      const errorMessage =
        error?.error?.message || error?.message || fallbackMessage;
      this.toastr.error(errorMessage);
    }

    this.isImporting = false;
  }

  public canImport(): boolean {
    if (this.importTab === 'code') {
      return this.shareCode.trim().length >= 8;
    } else if (this.importTab === 'file') {
      return this.selectedFile !== null;
    } else if (this.importTab === 'paste') {
      return this.pastedText.trim().length > 0 && this.pastedPreview !== null;
    }
    return false;
  }

  private processTextImport(evaluation: any): void {
    console.log('Processando importação de texto:', evaluation);

    // Criar estrutura similar ao JSON de exportação
    const importData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      exported_by: 'Compartilhamento de Texto',
      total_evaluations: 1,
      evaluations: [evaluation],
    };

    this.evaluationService
      .importEvaluations(importData, this.importMode)
      .subscribe({
        next: (response) => this.handleImportSuccess(response),
        error: (error) =>
          this.handleImportError(error, 'Erro ao importar avaliação de texto.'),
      });
  }

  public generateShareableText(evaluation: any): string {
    const heroName = evaluation.hero_name || 'Herói desconhecido';
    const playerName =
      evaluation.target_player_name || evaluation.target_steam_id || 'Jogador';
    const rating = evaluation.rating || 0;
    const stars =
      '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
    const notes = evaluation.notes || 'Nenhuma.';
    const tags =
      evaluation.tags && evaluation.tags.length > 0
        ? evaluation.tags.map((tag: string) => `#${tag}`).join(' ')
        : '#sem-tags';

    return `[Courier's Knowledge] Avaliação de jogador:
- Jogador: ${playerName}
- Herói: ${heroName}
- Partida: ${evaluation.match_id || 'N/A'}
- Nota: ${rating}/5 (${stars})
- Anotações: "${notes}"
- Tags: ${tags}
Anote e avalie seus jogos com o Courier's Knowledge!`;
  }

  // ===== MÉTODOS AUXILIARES =====

  public getImportModeDescription(): string {
    switch (this.importMode) {
      case 'add':
        return 'Adicionar novas avaliações (manter existentes)';
      case 'merge':
        return 'Mesclar avaliações (atualizar existentes)';
      case 'replace':
        return 'Substituir todas as avaliações';
      default:
        return '';
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
      this.toastr.warning(
        'Limite de avaliações atingido. Considere fazer upgrade para Premium!'
      );
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

      // Obter nome do herói
      const heroName = evaluation.hero_id
        ? this.gameDataService.getHeroById(evaluation.hero_id)
            ?.localized_name || 'Herói não informado'
        : 'Herói não informado';

      // Formatação da nota
      const rating = Number(evaluation.rating);
      const formattedRating =
        rating % 1 === 0 ? rating.toFixed(0) : rating.toFixed(1);
      const ratingStars =
        '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));

      // Construir texto de compartilhamento
      let shareText = `[Courier's Knowledge] Avaliação de jogador:\n`;

      // Nome do jogador + Steam ID (se disponível)
      const playerName =
        evaluation.target_player_name ||
        evaluation.targetPlayerName ||
        'Jogador Desconhecido';
      const steamId = evaluation.target_steam_id || evaluation.targetSteamId;

      shareText += `- Jogador: ${playerName}`;
      if (steamId) {
        shareText += ` (${steamId})`;
      }
      shareText += `\n`;

      shareText += `- Herói: ${heroName}\n`;

      if (evaluation.match_id) {
        shareText += `- Partida: ${evaluation.match_id}\n`;
      }

      shareText += `- Nota: ${formattedRating}/5 (${ratingStars})\n`;
      shareText += `- Anotações: "${evaluation.notes || 'Nenhuma.'}"\n`;

      // Tags formatadas
      if (evaluation.tags && evaluation.tags.length > 0) {
        shareText += `- Tags: #${evaluation.tags.join(' #')}\n`;
      } else {
        shareText += `- Tags: Nenhuma.\n`;
      }

      shareText += `Anote e avalie seus jogos com o Courier's Knowledge!`;

      // Copiar para clipboard
      await navigator.clipboard.writeText(shareText);
      this.toastr.success(
        'Avaliação compartilhada! Texto copiado para área de transferência.'
      );
    } catch (err) {
      console.error('Erro ao compartilhar avaliação:', err);
      this.toastr.error('Não foi possível compartilhar a avaliação.');
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
    if (
      !target.closest('.filter-popover') &&
      !target.closest('.header-title')
    ) {
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

  public onPastedTextChange(): void {
    this.pastedPreview = null;

    if (!this.pastedText.trim()) return;

    try {
      // Primeiro tenta JSON (para compatibilidade com exportação de arquivo)
      const jsonData = JSON.parse(this.pastedText.trim());

      if (this.validateImportData(jsonData)) {
        this.pastedPreview = {
          total: jsonData.evaluations?.length || 0,
          version: jsonData.version || 'Desconhecida',
          exportedBy: jsonData.exported_by || 'Desconhecido',
          exportedAt: jsonData.exported_at
            ? new Date(jsonData.exported_at)
            : null,
          type: 'json',
        };
        return;
      }
    } catch (error) {
      // Não é JSON, vamos tentar o formato de texto amigável
      const textEvaluation = this.parseTextEvaluation(this.pastedText.trim());

      if (textEvaluation) {
        this.pastedPreview = {
          total: 1,
          version: 'Texto',
          exportedBy: 'Compartilhamento',
          exportedAt: new Date(),
          type: 'text',
          evaluation: textEvaluation,
        };
      }
    }
  }

  private parseTextEvaluation(text: string): any | null {
    try {
      // Regex patterns para extrair dados do formato amigável
      const patterns = {
        // Aceita formato: "Nome (SteamID)" ou só "Nome"
        player: /(?:Jogador|Player):\s*(.+?)(?:\s*\(([^)]+)\))?\s*(?:\n|$)/i,
        hero: /(?:Herói|Hero):\s*(.+?)(?:\n|$)/i,
        match: /(?:Partida|Match):\s*(\d+)/i,
        rating: /(?:Nota|Rating):\s*(\d+(?:\.\d+)?)\s*\/\s*5/i,
        notes: /(?:Anotações|Notes):\s*["](.+?)["](?:\n|$)/i,
        tags: /(?:Tags):\s*(.+?)(?:\n|Anote|$)/i,
      };

      const evaluation: any = {};
      let hasValidData = false;

      // Extrair jogador e Steam ID
      const playerMatch = text.match(patterns.player);
      if (playerMatch) {
        evaluation.target_player_name = playerMatch[1].trim();

        // Se tem Steam ID entre parênteses
        if (playerMatch[2]) {
          evaluation.target_steam_id = playerMatch[2].trim();
        }

        hasValidData = true;
      }

      // Extrair herói
      const heroMatch = text.match(patterns.hero);
      if (heroMatch) {
        const heroName = heroMatch[1].trim();
        evaluation.hero_name = heroName;

        // Tentar encontrar o ID do herói
        this.gameDataService.heroes$.subscribe((heroesMap) => {
          const heroEntry = Object.entries(heroesMap).find(
            ([id, hero]) =>
              hero.localized_name.toLowerCase() === heroName.toLowerCase() ||
              hero.name.toLowerCase().includes(heroName.toLowerCase())
          );
          if (heroEntry) {
            evaluation.hero_id = parseInt(heroEntry[0]);
          }
        });

        hasValidData = true;
      }

      // Extrair ID da partida
      const matchMatch = text.match(patterns.match);
      if (matchMatch) {
        evaluation.match_id = matchMatch[1];
        hasValidData = true;
      }

      // Extrair nota
      const ratingMatch = text.match(patterns.rating);
      if (ratingMatch) {
        evaluation.rating = parseFloat(ratingMatch[1]);
        hasValidData = true;
      }

      // Extrair anotações
      const notesMatch = text.match(patterns.notes);
      if (notesMatch) {
        evaluation.notes = notesMatch[1].trim();
        hasValidData = true;
      }

      // Extrair tags
      const tagsMatch = text.match(patterns.tags);
      if (tagsMatch) {
        const tagsText = tagsMatch[1].trim();

        // Se não é "Nenhuma.", processar as tags
        if (tagsText.toLowerCase() !== 'nenhuma.') {
          evaluation.tags = tagsText
            .replace(/#/g, '')
            .split(/[,\s]+/)
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0);
        } else {
          evaluation.tags = [];
        }

        hasValidData = true;
      }

      // Valores padrão
      if (hasValidData) {
        evaluation.role = evaluation.role || '';
        evaluation.created_at = new Date().toISOString();
        evaluation.tags = evaluation.tags || [];
        evaluation.notes = evaluation.notes || '';

        return evaluation;
      }

      return null;
    } catch (error) {
      console.error('Erro ao fazer parse do texto de avaliação:', error);
      return null;
    }
  }

  public copyShareCode(): void {
    if (this.exportResult?.shareCode) {
      navigator.clipboard
        .writeText(this.exportResult.shareCode)
        .then(() => {
          this.toastr.success('Código copiado para área de transferência!');
        })
        .catch(() => {
          this.toastr.error('Erro ao copiar código.');
        });
    }
  }

  public formatShareCode(code: string): string {
    if (!code || code.length !== 8) return code;
    return `${code.slice(0, 4)}-${code.slice(4)}`;
  }

  private loadImportExportStats(): void {
    this.evaluationService.getImportExportStats().subscribe({
      next: (stats) => {
        this.importExportStats = stats;
        this.updateLimitFlags();
      },
      error: (error) => {
        console.error('Erro ao carregar estatísticas de import/export:', error);
      },
    });
  }

  // NOVO método para atualizar flags de limite
  private updateLimitFlags(): void {
    if (this.importExportStats) {
      this.canExportToday = this.importExportStats.canExport.daily;
      this.canImportToday = this.importExportStats.canImport.daily;
      this.canExportThisMonth = this.importExportStats.canExport.monthly;
      this.canImportThisMonth = this.importExportStats.canImport.monthly;
    }
  }

  public getExportLimitInfo(): string {
    if (!this.importExportStats) return '';

    const stats = this.importExportStats;
    if (stats.user.isPremium) {
      return `Premium: ${stats.usage.export.monthly.current}/${stats.usage.export.monthly.limit} este mês`;
    } else {
      return `Free: ${stats.usage.export.daily.current}/${stats.usage.export.daily.limit} hoje, ${stats.usage.export.monthly.current}/${stats.usage.export.monthly.limit} este mês`;
    }
  }

  public getImportLimitInfo(): string {
    if (!this.importExportStats) return '';

    const stats = this.importExportStats;
    if (stats.user.isPremium) {
      return `Premium: ${stats.usage.import.monthly.current}/${stats.usage.import.monthly.limit} este mês`;
    } else {
      return `Free: ${stats.usage.import.daily.current}/${stats.usage.import.daily.limit} hoje, ${stats.usage.import.monthly.current}/${stats.usage.import.monthly.limit} este mês`;
    }
  }

  public isExportLimitReached(): boolean {
    return !this.canExportToday || !this.canExportThisMonth;
  }

  public isImportLimitReached(): boolean {
    return !this.canImportToday || !this.canImportThisMonth;
  }

  private resetExportState(): void {
    this.exportType = 'all';
    this.isExporting = false;
    this.exportResult = null;
  }
}

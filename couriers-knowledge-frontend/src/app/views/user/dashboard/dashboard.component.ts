// ===== DASHBOARD.COMPONENT.TS - 100% TRADUZIDO =====

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
import { I18nService } from '../../../core/i18n.service'; // ← ADICIONAR
import { TranslatePipe } from '../../../pipes/translate.pipe'; // ← ADICIONAR

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
    TranslatePipe, // ← ADICIONAR
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
  private i18nService = inject(I18nService); // ← ADICIONAR

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

  // ===== ESTADOS PARA IMPORT/EXPORT =====
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

  // Rate limiting
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
    this.toastr.clear();
  }


  public clearAllToasts(): void {
  this.toastr.clear();
}

  // ===== MÉTODOS DE CONFIGURAÇÃO =====

  private setupHeroes(): void {
    this.heroes$ = this.gameDataService.heroes$.pipe(
      map((heroesMap) => {
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
      const lowerSearchTerm = searchTerm.toLowerCase();
      this.filteredBySearch = this.allEvaluations.filter((evaluation) => {
        const playerName = (
          evaluation.targetPlayerName ||
          evaluation.target_player_name ||
          ''
        ).toLowerCase();
        const steamId = (
          evaluation.target_steam_id ||
          evaluation.targetSteamId ||
          ''
        ).toLowerCase();
        const notes = (evaluation.notes || '').toLowerCase();
        const heroName =
          this.gameDataService
            .getHeroById(evaluation.hero_id)
            ?.localized_name?.toLowerCase() || '';
        const tags = (evaluation.tags || [])
          .join(' ')
          .toLowerCase();

        return (
          playerName.includes(lowerSearchTerm) ||
          steamId.includes(lowerSearchTerm) ||
          notes.includes(lowerSearchTerm) ||
          heroName.includes(lowerSearchTerm) ||
          tags.includes(lowerSearchTerm)
        );
      });
    }
    this.applyFilters();
  }

  public clearPermanentSearch(): void {
    this.permanentSearchControl.setValue('');
  }

  // ===== MÉTODOS DE DADOS =====

  private loadAllEvaluations(): void {
  this.isLoading = true;
  this.evaluationService.getMyEvaluations().subscribe({
    next: (evaluations) => {
      this.allEvaluations = evaluations;
      this.filteredBySearch = evaluations;
      this.displayedEvaluations = evaluations;
      this.isLoading = false;
    },
    error: (err) => {
  console.error('Erro ao carregar avaliações:', err);

  this.isLoading = false;
    },
  });
}

  private checkEvaluationLimit(): void {
    this.evaluationService.getEvaluationStatus().subscribe({
      next: (status) => {
        this.evaluationStatus = status;
        this.isLimitReached = status.limitReached;

        if (this.isLimitReached) {
          this.toastr.warning(
            this.i18nService.translate('dashboard.errors.evaluationLimit', {
              limit: status.limit
            })
          );
        }
      },
      error: (err) => {
        console.error('Erro ao verificar limite:', err);
      },
    });
  }

  private loadImportExportStats(): void {
  this.evaluationService.getImportExportStats().subscribe({
    next: (stats) => {
      this.importExportStats = stats;
      this.updateLimitFlags(stats);
    },
    error: (err) => {
      console.error('❌ [DASHBOARD] Erro ao carregar estatísticas de import/export:', err);

      // ✅ TRATAMENTO ESPECÍFICO POR TIPO DE ERRO
      if (err.status === 404) {
        // Não mostrar toast para 404, apenas logs
      } else if (err.status === 401) {
        console.warn('🔐 [DASHBOARD] Não autorizado para import/export stats');
        // Token pode ter expirado
      } else {
        console.warn('⚠️ [DASHBOARD] Erro inesperado no import/export:', err.status);
        // Mostrar toast apenas para erros realmente inesperados
        this.toastr.warning('Não foi possível verificar limites de import/export. Operações permitidas por segurança.');
      }

      // ✅ DEFINIR VALORES PADRÃO SEGUROS (permitir operações)
      this.importExportStats = null;
      this.canExportToday = true;
      this.canImportToday = true;
      this.canExportThisMonth = true;
      this.canImportThisMonth = true;
    },
  });
}

  private updateLimitFlags(stats: any): void {

  // ✅ VERIFICAÇÃO DEFENSIVA - estrutura do stats pode variar
  if (!stats) {
    this.canExportToday = false;
    this.canImportToday = false;
    this.canExportThisMonth = false;
    this.canImportThisMonth = false;
    return;
  }

  // ✅ VERIFICAR DIFERENTES ESTRUTURAS POSSÍVEIS
  // Estrutura 1: stats.exports.today / stats.imports.today
  if (stats.exports && stats.imports) {
    this.canExportToday = (stats.exports.today || 0) < (stats.exports.dailyLimit || 999);
    this.canImportToday = (stats.imports.today || 0) < (stats.imports.dailyLimit || 999);
    this.canExportThisMonth = (stats.exports.thisMonth || 0) < (stats.exports.monthlyLimit || 999);
    this.canImportThisMonth = (stats.imports.thisMonth || 0) < (stats.imports.monthlyLimit || 999);
    return;
  }

  // Estrutura 2: stats.usage.export.daily / stats.usage.import.daily
  if (stats.usage && stats.usage.export && stats.usage.import) {
    this.canExportToday = stats.canExport?.daily !== false;
    this.canImportToday = stats.canImport?.daily !== false;
    this.canExportThisMonth = stats.canExport?.monthly !== false;
    this.canImportThisMonth = stats.canImport?.monthly !== false;
    return;
  }

  // Estrutura 3: stats.canExport / stats.canImport (diretamente)
  if (stats.canExport !== undefined || stats.canImport !== undefined) {
    this.canExportToday = stats.canExport?.daily !== false;
    this.canImportToday = stats.canImport?.daily !== false;
    this.canExportThisMonth = stats.canExport?.monthly !== false;
    this.canImportThisMonth = stats.canImport?.monthly !== false;
    return;
  }
  this.canExportToday = true;
  this.canImportToday = true;
  this.canExportThisMonth = true;
  this.canImportThisMonth = true;
}

  // ===== MÉTODOS DE FILTROS =====

  private applyFilters(): void {
    let filtered = [...this.filteredBySearch];
    const filters = this.filterForm.value;

    if (filters.rating) {
      const rating = parseFloat(filters.rating);
      filtered = filtered.filter(
        (evaluation) => Math.floor(evaluation.rating) === Math.floor(rating)
      );
    }

    if (filters.hero) {
      filtered = filtered.filter(
        (evaluation) => evaluation.hero_id === parseInt(filters.hero)
      );
    }

    if (filters.role) {
      filtered = filtered.filter(
        (evaluation) => evaluation.role === filters.role
      );
    }

    if (filters.tags) {
      const searchTags = filters.tags.toLowerCase().split(',').map((t: string) => t.trim());
      filtered = filtered.filter((evaluation) => {
        if (!evaluation.tags || evaluation.tags.length === 0) return false;
        return searchTags.some((searchTag: string) =>
          evaluation.tags.some((tag: string) =>
            tag.toLowerCase().includes(searchTag)
          )
        );
      });
    }

    this.displayedEvaluations = filtered;
  }

  public refreshNames(): void {
    this.isRefreshing = true;
    this.evaluationService.refreshPlayerNames().subscribe({
      next: () => {
        this.toastr.success(this.i18nService.translate('dashboard.success.namesUpdated'));
        this.loadAllEvaluations();
        this.isRefreshing = false;
      },
      error: (err) => {
        this.toastr.error(this.i18nService.translate('dashboard.errors.updateNames'));
        this.isRefreshing = false;
      },
    });
  }

  // ===== MÉTODOS DE SELEÇÃO =====

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

  public getSelectedCount(): number {
    return this.selectedEvaluations.size;
  }

  public getTotalDisplayed(): number {
    return this.displayedEvaluations.length;
  }

  // ===== MÉTODOS DE EXPORTAÇÃO =====

  public isExportLimitReached(): boolean {
    return !this.canExportToday || !this.canExportThisMonth;
  }

  public openExportModal(): void {
    if (!this.canExportToday) {
      this.toastr.warning(this.i18nService.translate('dashboard.errors.exportLimitDaily'));
      return;
    }

    if (!this.canExportThisMonth) {
      this.toastr.warning(this.i18nService.translate('dashboard.errors.exportLimitMonthly'));
      return;
    }

    this.showExportModal = true;
    this.resetExportState();
  }

  public closeExportModal(): void {
    this.showExportModal = false;
    this.resetExportState();
  }

  private resetExportState(): void {
    this.isExporting = false;
    this.exportResult = null;
    this.exportType = 'all';
  }

  public exportEvaluations(): void {
    if (this.isExporting) return;

    const evaluationIds =
      this.exportType === 'selected'
        ? Array.from(this.selectedEvaluations)
        : undefined;

    if (this.exportType === 'selected' && evaluationIds!.length === 0) {
      this.toastr.warning(this.i18nService.translate('dashboard.errors.selectEvaluations'));
      return;
    }

    this.isExporting = true;

    this.evaluationService.exportEvaluations(evaluationIds).subscribe({
      next: (response) => {
        this.exportResult = response;
        this.isExporting = false;
        this.loadImportExportStats();
      },
      error: (error) => {
        console.error('Erro na exportação:', error);
        this.toastr.error(this.i18nService.translate('dashboard.errors.exportFailed'));
        this.isExporting = false;
      },
    });
  }

  public copyShareCode(): void {
    if (this.exportResult?.shareCode) {
      navigator.clipboard
        .writeText(this.exportResult.shareCode)
        .then(() => {
          this.toastr.success(this.i18nService.translate('dashboard.success.codeCopied'));
        })
        .catch(() => {
          this.toastr.error(this.i18nService.translate('dashboard.errors.copyCode'));
        });
    }
  }

  public formatShareCode(code: string): string {
    if (!code) return '';
    return code.match(/.{1,4}/g)?.join('-') || code;
  }

  // ===== MÉTODOS DE IMPORTAÇÃO =====

  public isImportLimitReached(): boolean {
    return !this.canImportToday || !this.canImportThisMonth;
  }

  public openImportModal(): void {
    if (!this.canImportToday) {
      this.toastr.warning(this.i18nService.translate('dashboard.errors.importLimitDaily'));
      return;
    }

    if (!this.canImportThisMonth) {
      this.toastr.warning(this.i18nService.translate('dashboard.errors.importLimitMonthly'));
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
    this.importTab = 'paste';
    this.importMode = 'add';

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  // ===== MÉTODOS DE IMPORTAÇÃO POR ARQUIVO =====

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
      this.toastr.error(this.i18nService.translate('dashboard.errors.invalidFile'));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.toastr.error(this.i18nService.translate('dashboard.errors.fileTooLarge'));
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

        if (!this.validateImportData(data)) {
          this.toastr.error(this.i18nService.translate('dashboard.errors.invalidImportFormat'));
          this.selectedFile = null;
          return;
        }

        this.importPreview = {
          total: data.evaluations?.length || 0,
          version: data.version || this.i18nService.translate('dashboard.import.preview.unknown'),
          exportedBy: data.exported_by || this.i18nService.translate('dashboard.import.preview.unknown'),
          exportedAt: data.exported_at ? new Date(data.exported_at) : null,
        };
      } catch (error) {
        this.toastr.error(this.i18nService.translate('dashboard.errors.jsonReadError'));
        this.selectedFile = null;
        this.importPreview = null;
      }
    };

    reader.onerror = () => {
      this.toastr.error(this.i18nService.translate('dashboard.errors.fileReadError'));
      this.selectedFile = null;
    };

    reader.readAsText(file);
  }

  // ===== MÉTODOS DE IMPORTAÇÃO POR TEXTO =====

  public onPastedTextChange(): void {
    this.pastedPreview = null;

    if (!this.pastedText.trim()) return;

    try {
      // Primeiro tenta JSON
      const jsonData = JSON.parse(this.pastedText.trim());

      if (this.validateImportData(jsonData)) {
        this.pastedPreview = {
          total: jsonData.evaluations?.length || 0,
          version: jsonData.version || this.i18nService.translate('dashboard.import.preview.unknown'),
          exportedBy: jsonData.exported_by || this.i18nService.translate('dashboard.import.preview.unknown'),
          exportedAt: jsonData.exported_at ? new Date(jsonData.exported_at) : null,
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
          version: this.i18nService.translate('dashboard.import.preview.textVersion'),
          exportedBy: this.i18nService.translate('dashboard.import.preview.shareSource'),
          exportedAt: new Date(),
          type: 'text',
          evaluation: textEvaluation,
        };
      }
    }
  }

  private parseTextEvaluation(text: string): any | null {
    try {
      const patterns = {
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

  // ===== MÉTODOS DE PROCESSAMENTO DE IMPORTAÇÃO =====

  private validateImportData(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.evaluations) &&
      data.evaluations.length > 0
    );
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

  public importEvaluations(): void {
    if (this.isImporting || !this.canImport()) return;

    this.isImporting = true;

    if (this.importTab === 'code' && this.shareCode.trim()) {
      this.evaluationService
        .importByShareCode(this.shareCode.trim(), this.importMode)
        .subscribe({
          next: (response) => this.handleImportSuccess(response),
          error: (error) =>
            this.handleImportError(error, this.i18nService.translate('dashboard.errors.importByCode')),
        });
    } else if (this.importTab === 'file' && this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          this.processImportData(data);
        } catch (parseError) {
          this.handleImportError(parseError, this.i18nService.translate('dashboard.errors.invalidJson'));
        }
      };
      reader.readAsText(this.selectedFile);
    } else if (this.importTab === 'paste' && this.pastedText.trim()) {
      if (this.pastedPreview.type === 'json') {
        try {
          const data = JSON.parse(this.pastedText.trim());
          this.processImportData(data);
        } catch (parseError) {
          this.handleImportError(parseError, this.i18nService.translate('dashboard.errors.invalidPastedJson'));
        }
      } else if (this.pastedPreview.type === 'text') {
        this.processTextImport(this.pastedPreview.evaluation);
      }
    }
  }

  private processImportData(data: any): void {
    if (!this.validateImportData(data)) {
      this.handleImportError(null, this.i18nService.translate('dashboard.errors.invalidImportFormat'));
      return;
    }

    this.evaluationService.importEvaluations(data, this.importMode).subscribe({
      next: (response) => this.handleImportSuccess(response),
      error: (error) =>
        this.handleImportError(error, this.i18nService.translate('dashboard.errors.importData')),
    });
  }

  private processTextImport(evaluation: any): void {
    const importData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      exported_by: this.i18nService.translate('dashboard.import.textSharing'),
      total_evaluations: 1,
      evaluations: [evaluation],
    };

    this.evaluationService
      .importEvaluations(importData, this.importMode)
      .subscribe({
        next: (response) => this.handleImportSuccess(response),
        error: (error) =>
          this.handleImportError(error, this.i18nService.translate('dashboard.errors.importText')),
      });
  }

  private handleImportSuccess(response: any): void {
    let message = this.i18nService.translate('dashboard.success.importCompleted', {
      imported: response.imported
    });

    if (response.skipped > 0) {
      message += this.i18nService.translate('dashboard.success.importSkipped', {
        skipped: response.skipped
      });
    }

    if (response.errors && response.errors.length > 0) {
      message += this.i18nService.translate('dashboard.success.importErrors', {
        errors: response.errors.length
      });
      console.warn('Erros na importação:', response.errors);
    }

    this.toastr.success(message);

    this.loadAllEvaluations();
    this.checkEvaluationLimit();
    this.loadImportExportStats();
    this.closeImportModal();
  }

  private handleImportError(error: any, fallbackMessage: string): void {
    console.error('Erro na importação:', error);

    if (error.status === 429) {
      const errorMsg = error.error?.message || this.i18nService.translate('dashboard.errors.importLimit');
      this.toastr.error(errorMsg);
      this.loadImportExportStats();
    } else {
      const errorMessage = error?.error?.message || error?.message || fallbackMessage;
      this.toastr.error(errorMessage);
    }

    this.isImporting = false;
  }

  public getImportModeDescription(): string {
    switch (this.importMode) {
      case 'add':
        return this.i18nService.translate('dashboard.import.mode.add.description');
      case 'merge':
        return this.i18nService.translate('dashboard.import.mode.merge.description');
      case 'replace':
        return this.i18nService.translate('dashboard.import.mode.replace.description');
      default:
        return '';
    }
  }

  // ===== MÉTODOS DE FORMULÁRIO =====

  public openFormModal(evaluation?: any): void {
    if (this.isLimitReached && !evaluation) {
      this.toastr.warning(this.i18nService.translate('dashboard.tooltips.newEvaluationLimit'));
      return;
    }
    this.selectedEvaluation = evaluation || null;
    this.isFormModalVisible = true;
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

  public onEvaluationError(error: any): void {
    console.error('❌ Erro na avaliação:', error);
    // O formulário já mostrou o toast, só precisamos logar
  }

  // ===== MÉTODOS DE AÇÕES =====

  public toggleActionMenu(event: MouseEvent, evaluationId: number): void {
    event.stopPropagation();
    this.activeActionMenu =
      this.activeActionMenu === evaluationId ? null : evaluationId;
  }

  public deleteEvaluation(evaluationId: number): void {
    const confirmMessage = this.i18nService.translate('dashboard.confirm.deleteEvaluation');
    if (confirm(confirmMessage)) {
      this.evaluationService.deleteEvaluation(evaluationId.toString()).subscribe({
        next: () => {
          this.toastr.success(this.i18nService.translate('dashboard.success.evaluationDeleted'));
          this.loadAllEvaluations();
          this.checkEvaluationLimit();
        },
        error: (error) => {
          console.error('Erro ao deletar avaliação:', error);
          this.toastr.error(this.i18nService.translate('dashboard.errors.deleteEvaluation'));
        }
      });
    }
    this.activeActionMenu = null;
  }

  public async shareEvaluation(evaluation: any): Promise<void> {
    try {
      this.activeActionMenu = null;

      // Obter nome do herói
      const heroName = evaluation.hero_id
        ? this.gameDataService.getHeroById(evaluation.hero_id)?.localized_name ||
          this.i18nService.translate('dashboard.hero.notInformed')
        : this.i18nService.translate('dashboard.hero.notInformed');

      // Formatação da nota
      const rating = Number(evaluation.rating);
      const formattedRating = rating % 1 === 0 ? rating.toFixed(0) : rating.toFixed(1);
      const ratingStars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));

      // Construir texto de compartilhamento
      let shareText = `[Courier's Knowledge] ${this.i18nService.translate('dashboard.share.playerEvaluation')}:\n`;

      // Nome do jogador + Steam ID (se disponível)
      const playerName = evaluation.target_player_name ||
        evaluation.targetPlayerName ||
        this.i18nService.translate('dashboard.player.unknown');
      const steamId = evaluation.target_steam_id || evaluation.targetSteamId;

      shareText += `- ${this.i18nService.translate('dashboard.share.player')}: ${playerName}`;
      if (steamId) {
        shareText += ` (${steamId})`;
      }
      shareText += `\n`;

      shareText += `- ${this.i18nService.translate('dashboard.share.hero')}: ${heroName}\n`;

      if (evaluation.match_id) {
        shareText += `- ${this.i18nService.translate('dashboard.share.match')}: ${evaluation.match_id}\n`;
      }

      shareText += `- ${this.i18nService.translate('dashboard.share.rating')}: ${formattedRating}/5 (${ratingStars})\n`;
      shareText += `- ${this.i18nService.translate('dashboard.share.notes')}: "${evaluation.notes || this.i18nService.translate('dashboard.share.noNotes')}"\n`;

      // Tags formatadas
      if (evaluation.tags && evaluation.tags.length > 0) {
        shareText += `- ${this.i18nService.translate('dashboard.share.tags')}: #${evaluation.tags.join(' #')}\n`;
      } else {
        shareText += `- ${this.i18nService.translate('dashboard.share.tags')}: ${this.i18nService.translate('dashboard.share.noTags')}\n`;
      }

      shareText += this.i18nService.translate('dashboard.share.footer');

      // Copiar para clipboard
      await navigator.clipboard.writeText(shareText);
      this.toastr.success(this.i18nService.translate('dashboard.success.evaluationShared'));
    } catch (err) {
      console.error('Erro ao compartilhar avaliação:', err);
      this.toastr.error(this.i18nService.translate('dashboard.errors.shareEvaluation'));
    }
  }

  // ===== MÉTODOS DE UTILITÁRIOS =====

  public trackByEvaluationId(index: number, evaluation: any): number {
    return evaluation.id;
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
}

import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  ValidationErrors,
} from '@angular/forms';
import { FormsModule } from '@angular/forms'; // ← ADICIONAR ESTA IMPORTAÇÃO
import { EvaluationService } from '../../core/evaluation.service';
import { GameDataService, Hero } from '../../core/game-data.service';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

function tagsValidator(control: AbstractControl): ValidationErrors | null {
  if (typeof control.value !== 'string') {
    return null;
  }
  const tags = control.value.split(',').map((tag: string) => tag.trim());
  if (tags.some((tag: string) => tag.length > 20)) {
    return { tagTooLong: true };
  }
  return null;
}

@Component({
  selector: 'app-evaluation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule, // ← ADICIONAR ESTA LINHA
  ],
  templateUrl: './evaluation-form.component.html',
  styleUrl: './evaluation-form.component.css',
})
export class EvaluationFormComponent implements OnInit {
  @Input() evaluationData: any | null = null;
  @Output() formSubmitted = new EventEmitter<void>(); // ← CORRIGIR NOME
  @Output() formClosed = new EventEmitter<void>(); // ← CORRIGIR NOME
  @Output() evaluationError = new EventEmitter<any>();

  private fb = inject(FormBuilder);
  private evaluationService = inject(EvaluationService);
  public gameDataService = inject(GameDataService);
  private toastr = inject(ToastrService);

  evaluationForm: FormGroup;
  isEditMode = false;
  public hoverRating = 0;
  public currentStep = 1;

  heroes$!: Observable<Hero[]>;
  roles = ['hc', 'mid', 'off', 'sup 4', 'sup 5', 'outro'];
  private allUserTags: string[] = [];
  public suggestedTags$: Observable<string[]> = of([]);

  public prefilledHeroName: string | null = null;
  public prefilledPlayerName: string | null = null;
  public prefilledMatchId: string | null = null;
  public isFromMatch = false; // ← Indica se veio de uma partida
  public shouldLockFields = false; // ← Controla se os campos devem ser bloqueados

  constructor() {
    this.evaluationForm = this.fb.group({
      targetSteamId: [
        '',
        [Validators.required, Validators.pattern(/^[0-9]{17}$/)],
      ],
      rating: [
        null,
        [Validators.required, Validators.min(0.5), Validators.max(5)],
      ],
      notes: ['', [Validators.maxLength(200)]],
      matchId: [''],
      role: [null],
      hero_id: [null],
      tags: ['', [tagsValidator]],
    });
  }

  ngOnInit(): void {
    console.log('🚀 Evaluation form iniciado');
    console.log('📥 Dados recebidos:', this.evaluationData);

    this.heroes$ = this.gameDataService.heroes$.pipe(
      map((heroesMap) =>
        Object.values(heroesMap).sort((a, b) =>
          a.localized_name.localeCompare(b.localized_name)
        )
      )
    );

    this.evaluationService.getUniqueTags().subscribe({
      next: (tags) => {
        this.allUserTags = tags;
        console.log('🏷️ Tags carregadas:', tags);
      },
      error: (err) => {
        console.error('❌ Erro ao carregar tags:', err);
        this.allUserTags = [];
      },
    });

    this.suggestedTags$ = this.evaluationForm.get('tags')!.valueChanges.pipe(
      startWith(''),
      map((value) => this._filterTags(value || ''))
    );

    // ✅ DETECTAR TIPO DE FORMULÁRIO
    this.isEditMode = this.evaluationData && this.evaluationData.id;
    this.isFromMatch =
      this.evaluationData &&
      !this.evaluationData.id &&
      (this.evaluationData.matchId ||
        this.evaluationData.match_id ||
        this.evaluationData.hero_id);

    console.log('📝 Modo de edição:', this.isEditMode);
    console.log('🎮 Vem de partida:', this.isFromMatch);

    if (this.evaluationData) {
      this.populateForm();
    }
  }

  private populateForm(): void {
    console.log('🔄 Preenchendo formulário com:', this.evaluationData);

    // ✅ PREENCHER DADOS VISUAIS
    this.prefilledPlayerName = this.evaluationData.targetPlayerName || null;
    this.prefilledMatchId =
      this.evaluationData.matchId || this.evaluationData.match_id || null;

    // ✅ BUSCAR NOME DO HERÓI SE TIVER ID
    if (this.evaluationData.hero_id) {
      const hero = this.gameDataService.getHeroById(
        parseInt(this.evaluationData.hero_id)
      );
      this.prefilledHeroName = hero
        ? hero.localized_name
        : 'Herói Desconhecido';
    }

    // ✅ DECIDIR SE DEVE BLOQUEAR CAMPOS
    this.shouldLockFields = this.isFromMatch; // Bloquear se veio de partida

    this.evaluationForm.patchValue({
      targetSteamId:
        this.evaluationData.targetSteamId ||
        this.evaluationData.target_player_steam_id,
      rating: this.evaluationData.rating
        ? parseFloat(this.evaluationData.rating)
        : null,
      notes: this.evaluationData.notes || null,
      matchId:
        this.evaluationData.matchId || this.evaluationData.match_id || null,
      role: this.evaluationData.role || null,
      hero_id: this.evaluationData.hero_id
        ? parseInt(this.evaluationData.hero_id)
        : null,
      tags: Array.isArray(this.evaluationData.tags)
        ? this.evaluationData.tags.join(', ')
        : this.evaluationData.tags || '',
    });

    // ✅ BLOQUEAR CAMPOS SE NECESSÁRIO (EXCETO ROLE)
    if (this.shouldLockFields) {
      if (
        this.evaluationData.targetSteamId ||
        this.evaluationData.target_player_steam_id
      ) {
        this.evaluationForm.get('targetSteamId')?.disable();
      }
      if (this.evaluationData.hero_id) {
        this.evaluationForm.get('hero_id')?.disable();
      }
      if (this.evaluationData.matchId || this.evaluationData.match_id) {
        this.evaluationForm.get('matchId')?.disable();
      }
      // ROLE SEMPRE PERMANECE EDITÁVEL - não desabilitar
    }

    console.log('✅ Formulário preenchido:', this.evaluationForm.value);
    console.log('🔒 Campos bloqueados:', this.shouldLockFields);
    console.log(
      '🎭 Role editável:',
      !this.evaluationForm.get('role')?.disabled
    );
  }

  public getPlayerDisplayText(): string {
    if (this.prefilledPlayerName) {
      return `${this.prefilledPlayerName} (${
        this.evaluationForm.get('targetSteamId')?.value
      })`;
    }
    return this.evaluationForm.get('targetSteamId')?.value || '';
  }

  // ✅ MÉTODO PARA OBTER TEXTO DO CAMPO MATCH ID
  public getMatchDisplayText(): string {
    if (this.prefilledMatchId) {
      return `Partida: ${this.prefilledMatchId}`;
    }
    return this.evaluationForm.get('matchId')?.value || '';
  }

  private _filterTags(value: string): string[] {
    const val = typeof value === 'string' ? value : '';
    if (!val) return [];

    const currentTags = val.split(',').map((t) => t.trim());
    const lastTag = currentTags.pop()?.toLowerCase() || '';
    if (!lastTag) return [];

    return this.allUserTags.filter(
      (tag) => tag.toLowerCase().includes(lastTag) && !currentTags.includes(tag)
    );
  }

  public setRating(rating: number, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.evaluationForm.get('rating')?.setValue(rating);
    console.log('⭐ Rating definido:', rating); // Debug
  }

  public addTag(tagToAdd: string): void {
    const currentTagsValue = this.evaluationForm.get('tags')?.value || '';
    let tags: string[];

    if (typeof currentTagsValue === 'string') {
      tags = currentTagsValue.split(',').map((t: string) => t.trim());
    } else if (Array.isArray(currentTagsValue)) {
      tags = [...currentTagsValue];
    } else {
      tags = [];
    }

    if (tags.length > 0 && !tags[tags.length - 1]) {
      tags.pop();
    }

    if (!tags.includes(tagToAdd)) {
      tags.push(tagToAdd);
    }

    this.evaluationForm.get('tags')?.setValue(tags.join(', ') + ', ');
  }

  public nextStep(): void {
    console.log('➡️ Próximo passo - tentando ir para passo 2');
    console.log(
      '📋 Valor do targetSteamId:',
      this.evaluationForm.get('targetSteamId')?.value
    );
    console.log(
      '✅ targetSteamId válido?',
      this.evaluationForm.get('targetSteamId')?.valid
    );
    console.log(
      '🔒 targetSteamId desabilitado?',
      this.evaluationForm.get('targetSteamId')?.disabled
    );
    console.log('📊 Current step antes:', this.currentStep);

    // ✅ CORREÇÃO: Verificar se está válido OU desabilitado (campos bloqueados são válidos)
    const steamIdControl = this.evaluationForm.get('targetSteamId');
    const isValidOrDisabled = steamIdControl?.valid || steamIdControl?.disabled;

    console.log('🎯 Pode prosseguir?', isValidOrDisabled);

    if (isValidOrDisabled) {
      this.currentStep = 2;
      console.log('✅ Mudou para passo:', this.currentStep);
    } else {
      console.log('❌ Não pode prosseguir - campo inválido');
      // Marcar campo como touched para mostrar erro
      steamIdControl?.markAsTouched();
    }
  }

  public prevStep(): void {
    console.log('⬅️ Passo anterior');
    console.log('📊 Current step antes:', this.currentStep);
    this.currentStep = 1;
    console.log('✅ Mudou para passo:', this.currentStep);
  }

  public isStepOneValid(): boolean {
    const steamIdControl = this.evaluationForm.get('targetSteamId');
    return steamIdControl?.valid || steamIdControl?.disabled || false;
  }

  // ===== EVALUATION-FORM.COMPONENT.TS - CORREÇÃO DO MÉTODO SUBMITFORM =====

  public submitForm(): void {
    console.log('📤 Enviando formulário');
    console.log('📋 Dados do formulário:', this.evaluationForm.value);
    console.log('✅ Formulário válido:', this.evaluationForm.valid);

    if (this.evaluationForm.invalid) {
      this.evaluationForm.markAllAsTouched();
      console.log('❌ Formulário inválido:', this.evaluationForm.errors);
      return;
    }

    const formData = this.evaluationForm.getRawValue();

    // Processar tags
    if (formData.tags) {
      if (Array.isArray(formData.tags)) {
        formData.tags = formData.tags.filter(
          (tag: string) => tag && tag.trim()
        );
      } else if (typeof formData.tags === 'string') {
        formData.tags = formData.tags
          .split(',')
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag);
      } else {
        formData.tags = [];
      }
    } else {
      formData.tags = [];
    }

    // ✅ CORREÇÃO: Processar matchId (pode ser number ou string)
    if (
      !formData.matchId ||
      formData.matchId === '' ||
      formData.matchId === null ||
      formData.matchId === undefined
    ) {
      formData.matchId = null;
    } else {
      // Converter para string se for número, depois verificar se está vazio
      const matchIdStr = String(formData.matchId);
      if (
        matchIdStr.trim() === '' ||
        matchIdStr === 'null' ||
        matchIdStr === 'undefined'
      ) {
        formData.matchId = null;
      } else {
        // Manter como string para o backend
        formData.matchId = matchIdStr;
      }
    }

    // ✅ CORREÇÃO: Processar hero_id
    if (
      !formData.hero_id ||
      formData.hero_id === '' ||
      formData.hero_id === null ||
      formData.hero_id === undefined
    ) {
      formData.hero_id = null;
    } else {
      // Garantir que seja um número
      const heroId =
        typeof formData.hero_id === 'string'
          ? parseInt(formData.hero_id, 10)
          : Number(formData.hero_id);
      formData.hero_id = isNaN(heroId) ? null : heroId;
    }

    // ✅ CORREÇÃO: Processar role
    if (
      !formData.role ||
      formData.role === '' ||
      formData.role === null ||
      formData.role === undefined ||
      formData.role === 'null'
    ) {
      formData.role = null;
    }

    // ✅ CORREÇÃO: Processar notes
    if (
      !formData.notes ||
      formData.notes === null ||
      formData.notes === undefined
    ) {
      formData.notes = null;
    } else if (typeof formData.notes === 'string') {
      const trimmedNotes = formData.notes.trim();
      formData.notes = trimmedNotes === '' ? null : trimmedNotes;
    }

    // ✅ CORREÇÃO: Processar rating
    if (formData.rating !== null && formData.rating !== undefined) {
      const rating =
        typeof formData.rating === 'string'
          ? parseFloat(formData.rating)
          : Number(formData.rating);
      formData.rating = isNaN(rating) ? null : rating;
    }

    console.log('📤 Dados processados:', formData);

    const apiCall$ = this.isEditMode
      ? this.evaluationService.updateEvaluation(
          this.evaluationData.id,
          formData
        )
      : this.evaluationService.createEvaluation(formData);

    apiCall$.subscribe({
      next: (response) => {
        console.log('✅ Sucesso:', response);
        this.toastr.success(
          this.isEditMode
            ? 'Avaliação atualizada com sucesso!'
            : 'Avaliação criada com sucesso!'
        );
        this.formSubmitted.emit();
      },
      error: (err) => {
        console.error('❌ Erro ao salvar:', err);
        this.evaluationError.emit(err);

        if (err.status === 403) {
          this.toastr.error(
            err.error.details || 'Limite de avaliações atingido!',
            'Upgrade Necessário'
          );
        } else {
          this.toastr.error('Erro ao salvar avaliação. Tente novamente.');
        }
      },
    });
  }

  public onClose(): void {
    console.log('❌ Fechando formulário'); // Debug
    this.formClosed.emit(); // ← CORRIGIR NOME DO EVENTO
  }

  public getRoleDisplayName(role: string): string {
    const roleNames: { [key: string]: string } = {
      hc: 'Hard Carry (Pos 1)',
      mid: 'Mid Lane (Pos 2)',
      off: 'Offlaner (Pos 3)',
      'sup 4': 'Support (Pos 4)',
      'sup 5': 'Hard Support (Pos 5)',
      outro: 'Outro',
    };

    return roleNames[role] || role.toUpperCase();
  }
}

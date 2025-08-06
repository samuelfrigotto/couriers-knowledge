import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  OnDestroy,
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
import { TranslatePipe } from '../../pipes/translate.pipe';

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
    FormsModule,
    TranslatePipe,// ← ADICIONAR ESTA LINHA
  ],
  templateUrl: './evaluation-form.component.html',
  styleUrl: './evaluation-form.component.css',
})
export class EvaluationFormComponent implements OnInit, OnDestroy {
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
    this.preventBodyScroll(true);
  }

  ngOnDestroy(): void {
    this.preventBodyScroll(false);
  }

   onTagsInput(event: any): void {
    const value = event.target.value;
    // Remove espaços duplos e vírgulas duplas
    const cleanValue = value
      .replace(/,,+/g, ',')  // Remove vírgulas duplas
      .replace(/\s+,/g, ',') // Remove espaços antes de vírgulas
      .replace(/,\s+/g, ', '); // Normaliza espaços após vírgulas

    if (cleanValue !== value) {
      this.evaluationForm.get('tags')?.setValue(cleanValue, { emitEvent: false });
    }
  }


  // evaluation-form.component.ts - CORREÇÃO PARA BLOQUEAR CAMPOS NA EDIÇÃO

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
    // IMPORTANTE: Agora bloquea campos tanto se vem de partida QUANTO se está em modo de edição
    this.shouldLockFields = this.isFromMatch || this.isEditMode;

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
      // SEMPRE bloquear Steam ID quando shouldLockFields for true
      if (
        this.evaluationData.targetSteamId ||
        this.evaluationData.target_player_steam_id
      ) {
        this.evaluationForm.get('targetSteamId')?.disable();
      }

      // SEMPRE bloquear hero_id quando shouldLockFields for true
      if (this.evaluationData.hero_id) {
        this.evaluationForm.get('hero_id')?.disable();
      }

      // SEMPRE bloquear matchId quando shouldLockFields for true
      if (this.evaluationData.matchId || this.evaluationData.match_id) {
        this.evaluationForm.get('matchId')?.disable();
      }

      // ROLE SEMPRE PERMANECE EDITÁVEL - nunca desabilitar
      // this.evaluationForm.get('role') - não mexer neste campo
    }

    console.log('✅ Formulário preenchido:', this.evaluationForm.value);
    console.log('🔒 Campos bloqueados:', this.shouldLockFields);
    console.log('📝 Modo de edição:', this.isEditMode);
    console.log('🎮 Vem de partida:', this.isFromMatch);
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

    // ✅ MÉTODO ADDTAG CORRIGIDO - Lógica simplificada e mais robusta
  public addTag(tagToAdd: string): void {
    const currentValue = this.evaluationForm.get('tags')?.value || '';

    console.log('🏷️ Debug - Valor atual:', `"${currentValue}"`);
    console.log('🏷️ Debug - Tag a adicionar:', tagToAdd);

    // ✅ Se o campo está vazio, apenas adicionar a tag
    if (!currentValue.trim()) {
      const newValue = tagToAdd + ', ';
      this.evaluationForm.get('tags')?.setValue(newValue);
      this.focusTagsInput(newValue.length);
      return;
    }

    // ✅ Verificar se o valor atual termina com vírgula seguida de espaço
    const endsWithCommaSpace = currentValue.endsWith(', ') || currentValue.endsWith(',');

    console.log('🏷️ Debug - Termina com vírgula?', endsWithCommaSpace);

    if (endsWithCommaSpace) {
      // ✅ Já termina com vírgula = adicionar nova tag
      console.log('➕ Adicionando nova tag (após vírgula)');
      const newValue = currentValue + (currentValue.endsWith(', ') ? '' : ' ') + tagToAdd + ', ';
      this.evaluationForm.get('tags')?.setValue(newValue);
      this.focusTagsInput(newValue.length);

    } else {
      // ✅ NÃO termina com vírgula = substituir a última tag parcial
      console.log('🔄 Substituindo última tag parcial');

      const parts = currentValue.split(',').map((part: string) => part.trim());
      const completeTags = parts.slice(0, -1); // Remove a última parte (tag parcial)
      completeTags.push(tagToAdd); // Adiciona a tag sugerida

      const newValue = completeTags.join(', ') + ', ';
      this.evaluationForm.get('tags')?.setValue(newValue);
      this.focusTagsInput(newValue.length);
    }
  }

  private focusTagsInput(cursorPosition: number): void {
    setTimeout(() => {
      const inputElement = document.getElementById('tags') as HTMLInputElement;
      inputElement?.focus();
      inputElement?.setSelectionRange(cursorPosition, cursorPosition);
    }, 10);
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

  removeTag(tagToRemove: string): void {
    const currentTagsValue = this.evaluationForm.get('tags')?.value || '';
    const tags = currentTagsValue
      .split(',')
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0 && t !== tagToRemove);

    this.evaluationForm.get('tags')?.setValue(tags.join(', '));
  }

  private validateTags(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'string') {
      return null;
    }

    const tags = control.value
      .split(',')
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.length > 0);

    // Máximo de tags
    if (tags.length > 5) {
      return { maxTags: true };
    }

    // Tag muito longa
    const longTag = tags.find((tag: string) => tag.length > 25);
    if (longTag) {
      return { maxTagLength: { value: longTag } };
    }

    return null;
  }

  private preventBodyScroll(prevent: boolean): void {
    if (prevent) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '15px'; // Compensa a scrollbar
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  }


  public onClose(): void {
    this.formClosed.emit();
    this.preventBodyScroll(false);
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

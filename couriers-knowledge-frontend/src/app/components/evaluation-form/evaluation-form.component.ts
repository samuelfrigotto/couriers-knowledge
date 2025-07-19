import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators, ValidationErrors  } from '@angular/forms';
import { EvaluationService } from '../../core/evaluation.service';
import { GameDataService, Hero } from '../../core/game-data.service';
import { Observable, of } from 'rxjs';
import { map, startWith, take } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';


function tagsValidator(control: AbstractControl): ValidationErrors | null {
  // A verificação abaixo agora é segura, pois garantimos que o valor sempre será uma string.
  if (typeof control.value !== 'string') {
    return null; // Se não for string, não valida (evita o erro)
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
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './evaluation-form.component.html',
  styleUrl: './evaluation-form.component.css'
})


export class EvaluationFormComponent implements OnInit {
  @Input() evaluationData: any | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() evaluationSaved = new EventEmitter<void>();
  @Output() evaluationError = new EventEmitter<any>();

  private fb = inject(FormBuilder);
  private evaluationService = inject(EvaluationService);
  public gameDataService = inject(GameDataService);
  private toastr = inject(ToastrService);

  evaluationForm: FormGroup;
  isEditMode = false;
  public hoverRating = 0;
  public currentStep = 1;

  // NOVA VARIÁVEL para guardar o nome do herói
  public prefilledHeroName: string | null = null;

  heroes$!: Observable<Hero[]>;
  roles = ['hc', 'mid', 'off', 'sup 4', 'sup 5', 'outro'];
  private allUserTags: string[] = [];
  public suggestedTags$: Observable<string[]> = of([]);

  constructor() {
    this.evaluationForm = this.fb.group({
      targetSteamId: ['', [Validators.required, Validators.pattern(/^[0-9]{17}$/)]],
      rating: [null, [Validators.required, Validators.min(0.5), Validators.max(5)]],
      notes: ['', [Validators.maxLength(200)]],
      matchId: [''],
      role: [null],
      hero_id: [null],
      tags: ['', [tagsValidator]],
    });
  }

  ngOnInit(): void {
    this.heroes$ = this.gameDataService.heroes$.pipe(
      map(heroesMap => Object.values(heroesMap).sort((a, b) => a.localized_name.localeCompare(b.localized_name)))
    );

    this.evaluationService.getUsedTags().subscribe(tags => {
      this.allUserTags = tags;
    });

    this.suggestedTags$ = this.evaluationForm.get('tags')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterTags(value || ''))
    );

    this.isEditMode = !!(this.evaluationData && this.evaluationData.id);
    const prefillData = this.evaluationData;

    if (prefillData) {
      if (this.isEditMode) {
        this.currentStep = 2; // Pula para a etapa 2 na edição
      }

      // ✅ CORREÇÃO: Preparar dados corretamente
      const formDataToPatch = {
        ...prefillData,
        targetSteamId: prefillData.target_player_steam_id || prefillData.targetSteamId
      };

      // ✅ CORREÇÃO: Tratar tags corretamente antes do patchValue
      if (Array.isArray(formDataToPatch.tags)) {
        formDataToPatch.tags = formDataToPatch.tags.join(', ');
      } else if (!formDataToPatch.tags) {
        formDataToPatch.tags = '';
      }

      // ✅ CORREÇÃO: Usar formDataToPatch em vez de prefillData
      this.evaluationForm.patchValue(formDataToPatch);

      // Desabilitar campos se necessário
      if (formDataToPatch.targetSteamId) {
        this.evaluationForm.get('targetSteamId')?.disable();
      }
      if (formDataToPatch.matchId || formDataToPatch.match_id) {
        this.evaluationForm.get('matchId')?.disable();
      }

      // NOVA LÓGICA: Se o herói for pré-definido, busca o nome e desabilita o campo
      if (formDataToPatch.hero_id) {
        this.evaluationForm.get('hero_id')?.disable();
        this.gameDataService.heroes$.pipe(take(1)).subscribe(heroesMap => {
          const hero = heroesMap[formDataToPatch.hero_id];
          if (hero) {
            this.prefilledHeroName = hero.localized_name;
          }
        });
      }
    }
  }



  // ... (o resto do arquivo .ts permanece igual)
  nextStep(): void {
    const targetSteamIdControl = this.evaluationForm.get('targetSteamId');
    if (targetSteamIdControl?.status === 'VALID' || targetSteamIdControl?.status === 'DISABLED') {
      this.currentStep = 2;
    } else {
      targetSteamIdControl?.markAsTouched();
    }
  }

  prevStep(): void {
    this.currentStep = 1;
  }

  private _filterTags(value: string): string[] {
    // ✅ CORREÇÃO: Garantir que value seja sempre uma string
    const val = (typeof value === 'string') ? value : '';

    if (!val) return [];

    const currentTags = val.split(',').map(t => t.trim());
    const lastTag = currentTags.pop()?.toLowerCase() || '';

    if (!lastTag) return [];

    return this.allUserTags.filter(tag =>
      tag.toLowerCase().includes(lastTag) && !currentTags.includes(tag)
    );
  }

  setRating(rating: number, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.evaluationForm.get('rating')?.setValue(rating);
  }

  addTag(tagToAdd: string): void {
    const currentTagsValue = this.evaluationForm.get('tags')?.value || '';

    // ✅ CORREÇÃO: Verificar se o valor atual é string antes de fazer split
    let tags: string[];
    if (typeof currentTagsValue === 'string') {
      tags = currentTagsValue.split(',').map((t: string) => t.trim());
    } else if (Array.isArray(currentTagsValue)) {
      tags = [...currentTagsValue];
    } else {
      tags = [];
    }

    // Remove o último elemento se estiver vazio (caso o usuário esteja digitando)
    if (tags.length > 0 && !tags[tags.length - 1]) {
      tags.pop();
    }

    // Adiciona a nova tag se ela ainda não existir
    if (!tags.includes(tagToAdd)) {
      tags.push(tagToAdd);
    }

    // Atualiza o formulário
    this.evaluationForm.get('tags')?.setValue(tags.join(', ') + ', ');
  }

// Arquivo: couriers-knowledge-frontend/src/app/components/evaluation-form/evaluation-form.component.ts
// SUBSTITUIR o método submitForm() por esta versão corrigida:

  submitForm(): void {
    if (this.evaluationForm.invalid) {
      this.evaluationForm.markAllAsTouched();
      return;
    }

    const formData = this.evaluationForm.getRawValue();

    // ✅ CORREÇÃO: Tratar tags corretamente
    if (formData.tags) {
      if (Array.isArray(formData.tags)) {
        formData.tags = formData.tags.filter((tag: string) => tag && tag.trim());
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

    // ✅ CORREÇÃO: Verificar tipo antes de chamar .trim()
    // matchId: deve ser null se vazio (campo integer no backend)
    if (!formData.matchId ||
        (typeof formData.matchId === 'string' && formData.matchId.trim() === '') ||
        (typeof formData.matchId === 'number' && formData.matchId === 0)) {
      formData.matchId = null;
    } else if (typeof formData.matchId === 'string') {
      // Se for string, converter para número se possível
      const numValue = parseInt(formData.matchId.trim(), 10);
      formData.matchId = isNaN(numValue) ? null : numValue;
    }
    // Se já for número, manter como está

    // ✅ CORREÇÃO: hero_id - verificar tipo antes de processar
    if (!formData.hero_id ||
        formData.hero_id === '' ||
        formData.hero_id === 'null' ||
        formData.hero_id === null ||
        formData.hero_id === 0) {
      formData.hero_id = null;
    } else {
      // Garantir que hero_id seja um número válido
      const heroId = typeof formData.hero_id === 'string' ?
        parseInt(formData.hero_id, 10) :
        Number(formData.hero_id);
      formData.hero_id = isNaN(heroId) ? null : heroId;
    }

    // ✅ CORREÇÃO: role - verificar se não é null antes de comparar
    if (!formData.role ||
        formData.role === '' ||
        formData.role === 'null' ||
        formData.role === null) {
      formData.role = null;
    }

    // ✅ CORREÇÃO: notes - verificar tipo antes de chamar .trim()
    if (!formData.notes ||
        (typeof formData.notes === 'string' && formData.notes.trim() === '') ||
        formData.notes === null) {
      formData.notes = null;
    } else if (typeof formData.notes === 'string') {
      formData.notes = formData.notes.trim();
    }

    // ✅ CORREÇÃO: rating - garantir que seja um número válido
    if (formData.rating) {
      const rating = typeof formData.rating === 'string' ?
        parseFloat(formData.rating) :
        Number(formData.rating);
      formData.rating = isNaN(rating) ? null : rating;
    }

    // Debug - ver o que está sendo enviado (remover após testar)
    console.log('📤 Dados sendo enviados:', formData);

    const apiCall$ = this.isEditMode
      ? this.evaluationService.updateEvaluation(this.evaluationData.id, formData)
      : this.evaluationService.createEvaluation(formData);

    apiCall$.subscribe({
      next: () => {
        this.evaluationSaved.emit();
      },
      error: (err) => {
        console.error('Erro ao salvar avaliação', err);

        // Emitir erro para componente pai
        this.evaluationError.emit(err);

        // Tratamento específico para erro 403 (limite atingido)
        if (err.status === 403) {
          this.toastr.error(
            err.error.details || 'Limite de avaliações atingido! Considere fazer upgrade para Premium.',
            'Upgrade Necessário',
            {
              timeOut: 10000,
              closeButton: true
            }
          );

          // Fechar o modal após mostrar o erro
          this.closeModal.emit();
        } else {
          // Outros erros
          this.toastr.error(
            'Erro ao salvar avaliação. Tente novamente.',
            'Erro',
            { timeOut: 5000 }
          );
        }
      }
    });
  }




  onClose(): void {
    this.closeModal.emit();
  }
}

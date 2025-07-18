import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { EvaluationService } from '../../core/evaluation.service';
import { GameDataService, Hero } from '../../core/game-data.service';
import { Observable, of } from 'rxjs';
import { map, startWith, take } from 'rxjs/operators';

// Validador customizado para as tags (sem alterações)
export function tagsValidator(maxTags: number, maxTagLength: number): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const tags = (control.value || '').split(',').map((t: string) => t.trim()).filter((t: string) => t);
    if (tags.length > maxTags) {
      return { maxTags: { value: control.value } };
    }
    for (const tag of tags) {
      if (tag.length > maxTagLength) {
        return { maxTagLength: { value: tag } };
      }
    }
    return null;
  };
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

  private fb = inject(FormBuilder);
  private evaluationService = inject(EvaluationService);
  public gameDataService = inject(GameDataService);

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
      tags: ['', [tagsValidator(5, 25)]]
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

      this.evaluationForm.patchValue(prefillData);

      if (prefillData.targetSteamId) { this.evaluationForm.get('targetSteamId')?.disable(); }
      if (prefillData.matchId) { this.evaluationForm.get('matchId')?.disable(); }

      // NOVA LÓGICA: Se o herói for pré-definido, busca o nome e desabilita o campo
      if (prefillData.hero_id) {
        this.evaluationForm.get('hero_id')?.disable();
        this.gameDataService.heroes$.pipe(take(1)).subscribe(heroesMap => {
          const hero = heroesMap[prefillData.hero_id];
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
    const currentTags = value.split(',').map(t => t.trim());
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
    const tags = currentTagsValue.split(',').map((t: string) => t.trim());
    tags.pop();
    tags.push(tagToAdd);
    this.evaluationForm.get('tags')?.setValue(tags.join(', ') + ', ');
  }

  submitForm(): void {
    if (this.evaluationForm.invalid) {
      this.evaluationForm.markAllAsTouched();
      return;
    }

    const formData = this.evaluationForm.getRawValue();
    formData.tags = formData.tags ? formData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [];

    const apiCall$ = this.isEditMode
      ? this.evaluationService.updateEvaluation(this.evaluationData.id, formData)
      : this.evaluationService.createEvaluation(formData);

    apiCall$.subscribe({
      next: () => this.evaluationSaved.emit(),
      error: (err) => console.error('Erro ao salvar avaliação', err)
    });
  }

  onClose(): void {
    this.closeModal.emit();
  }
}

import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { EvaluationService } from '../../core/evaluation.service';
import { GameDataService, Hero } from '../../core/game-data.service';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

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
  // CORREÇÃO: Usaremos um único evento para simplificar
  @Output() evaluationSaved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private evaluationService = inject(EvaluationService);
  public gameDataService = inject(GameDataService);
  
  evaluationForm: FormGroup;
  isEditMode = false;
  public hoverRating = 0; // Para o efeito visual de hover

  heroes$!: Observable<Hero[]>;
  roles = ['hc', 'mid', 'off', 'sup 4', 'sup 5', 'outro'];

  private allUserTags: string[] = [];
  public suggestedTags$: Observable<string[]> = of([]);

  constructor() {
    this.evaluationForm = this.fb.group({
      targetSteamId: ['', [Validators.required, Validators.pattern(/^[0-9]{17}$/)]],
      rating: [null, [Validators.required, Validators.min(1), Validators.max(5)]],
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
    if (this.isEditMode && this.evaluationData) {
      const editableData = {
        ...this.evaluationData,
        tags: this.evaluationData.tags ? this.evaluationData.tags.join(', ') : ''
      };
      this.evaluationForm.patchValue(editableData);
      this.evaluationForm.get('targetSteamId')?.disable();
    } else if (this.evaluationData) {
      this.evaluationForm.patchValue(this.evaluationData);
      if (this.evaluationData.hero_id) { this.evaluationForm.get('hero_id')?.disable(); }
      if (this.evaluationData.matchId) { this.evaluationForm.get('matchId')?.disable(); }
      if (this.evaluationData.targetSteamId) { this.evaluationForm.get('targetSteamId')?.disable(); }
    }
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
      // Força a validação a aparecer na tela se o usuário clicar em salvar com erros
      this.evaluationForm.markAllAsTouched();
      return;
    }
    
    const formData = this.evaluationForm.getRawValue();

    if (formData.tags && typeof formData.tags === 'string') {
        formData.tags = formData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
    } else {
        formData.tags = [];
    }
    
    if (this.isEditMode && this.evaluationData) {
      const evaluationId = this.evaluationData.id;
      this.evaluationService.updateEvaluation(evaluationId, formData).subscribe({
        next: () => this.evaluationSaved.emit(),
        error: (err) => console.error('Erro ao atualizar avaliação', err)
      });
    } else {
      this.evaluationService.createEvaluation(formData).subscribe({
        next: () => this.evaluationSaved.emit(),
        error: (err) => console.error('Erro ao criar avaliação', err)
      });
    }
  }

  onClose(): void {
    this.closeModal.emit();
  }
}
// src/app/components/mmr-verification/mmr-verification.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';

import { MmrVerificationService, MMRVerificationRequest } from '../../core/mmr-verification.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-mmr-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <div class="mmr-verification-container">
      <div class="header">
        <h2>🎯 Verificação de MMR</h2>
        <p>Envie uma screenshot do seu MMR para verificação e upgrade automático para Premium!</p>
      </div>

      <!-- Formulário de Envio -->
      <div class="form-section" *ngIf="!hasPendingRequest">
        <form [formGroup]="verificationForm" (ngSubmit)="onSubmit()" class="verification-form">

          <div class="form-group">
            <label for="claimed_mmr">Seu MMR Atual *</label>
            <input
              type="number"
              id="claimed_mmr"
              formControlName="claimed_mmr"
              placeholder="Ex: 7500"
              min="0"
              max="15000"
            >
            <div class="error" *ngIf="verificationForm.get('claimed_mmr')?.invalid && verificationForm.get('claimed_mmr')?.touched">
              MMR deve ser um número válido entre 0 e 15000
            </div>
          </div>

          <div class="form-group">
            <label for="screenshot">Screenshot do MMR *</label>
            <input
              type="file"
              id="screenshot"
              (change)="onFileSelected($event)"
              accept="image/*"
              required
            >
            <div class="file-info" *ngIf="selectedFile">
              📁 Arquivo selecionado: {{ selectedFile.name }}
            </div>
            <div class="help-text">
              Aceita: JPG, PNG, GIF (máx. 5MB)
            </div>
          </div>

          <div class="form-group">
            <label for="notes">Observações (opcional)</label>
            <textarea
              id="notes"
              formControlName="notes"
              placeholder="Adicione qualquer informação adicional..."
              rows="3"
            ></textarea>
          </div>

          <button
            type="submit"
            class="submit-btn"
            [disabled]="verificationForm.invalid || !selectedFile || isSubmitting"
          >
            <span *ngIf="!isSubmitting">📤 Enviar Verificação</span>
            <span *ngIf="isSubmitting">⏳ Enviando...</span>
          </button>

        </form>
      </div>

      <!-- Aviso de Solicitação Pendente -->
      <div class="pending-notice" *ngIf="hasPendingRequest">
        <div class="notice-icon">⏳</div>
        <h3>Solicitação Pendente</h3>
        <p>Você já possui uma solicitação de verificação pendente. Aguarde a análise do administrador.</p>
      </div>

      <!-- Histórico de Solicitações -->
      <div class="history-section">
        <h3>📊 Histórico de Solicitações</h3>

        <div class="requests-list" *ngIf="userRequests$ | async as requests; else noRequests">
          <div
            class="request-item"
            *ngFor="let request of requests"
            [ngClass]="'status-' + request.status"
          >
            <div class="request-header">
              <span class="mmr-badge">MMR: {{ request.claimed_mmr }}</span>
              <span class="status-badge">{{ getStatusText(request.status) }}</span>
              <span class="date">{{ request.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>

            <div class="request-details" *ngIf="request.status !== 'pending'">
              <div class="admin-notes" *ngIf="request.admin_notes">
                <strong>Observações do Admin:</strong>
                <p>{{ request.admin_notes }}</p>
              </div>
              <div class="review-date" *ngIf="request.reviewed_at">
                <small>Revisado em: {{ request.reviewed_at | date:'dd/MM/yyyy HH:mm' }}</small>
              </div>
            </div>
          </div>
        </div>

        <ng-template #noRequests>
          <div class="empty-state">
            <p>Nenhuma solicitação encontrada.</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styleUrls: ['./mmr-verification.component.css']
})
export class MmrVerificationComponent implements OnInit {
  private mmrService = inject(MmrVerificationService);
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);

  verificationForm: FormGroup;
  selectedFile: File | null = null;
  isSubmitting = false;
  hasPendingRequest = false;

  userRequests$: Observable<MMRVerificationRequest[]>;

  constructor() {
    this.verificationForm = this.fb.group({
      claimed_mmr: ['', [Validators.required, Validators.min(0), Validators.max(15000)]],
      notes: ['']
    });

    this.userRequests$ = this.mmrService.getUserRequests();
  }

  ngOnInit() {
    this.loadUserRequests();
  }

  loadUserRequests() {
    this.userRequests$ = this.mmrService.getUserRequests();

    // Verificar se há solicitação pendente
    this.userRequests$.subscribe(requests => {
      this.hasPendingRequest = requests.some(r => r.status === 'pending');
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        this.toastr.error('Arquivo muito grande! Máximo 5MB permitido.');
        return;
      }
      this.selectedFile = file;
    }
  }

  onSubmit() {
    if (this.verificationForm.valid && this.selectedFile) {
      this.isSubmitting = true;

      const formData = new FormData();
      formData.append('claimed_mmr', this.verificationForm.get('claimed_mmr')?.value);
      formData.append('notes', this.verificationForm.get('notes')?.value || '');
      formData.append('screenshot', this.selectedFile);

      this.mmrService.submitVerification(formData).subscribe({
        next: (response) => {
          this.toastr.success('Solicitação enviada com sucesso!');
          this.verificationForm.reset();
          this.selectedFile = null;
          this.loadUserRequests();
        },
        error: (error) => {
          this.toastr.error(error.error?.error || 'Erro ao enviar solicitação');
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    }
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': '⏳ Pendente',
      'approved': '✅ Aprovado',
      'rejected': '❌ Rejeitado'
    };
    return statusMap[status] || status;
  }
}

// src/app/components/admin/mmr-review/mmr-review.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';

import { MmrVerificationService, MMRVerificationRequestWithUser } from '../../../core/mmr-verification.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-mmr-review',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="admin-review-container">
      <div class="header">
        <h2>🛡️ Painel Admin - Verificações MMR</h2>
        <p>Gerencie as solicitações de verificação de MMR dos usuários</p>
      </div>

      <div class="requests-container" *ngIf="allRequests$ | async as requests; else loading">

        <!-- Filtros -->
        <div class="filters">
          <button
            *ngFor="let filter of filters"
            [class.active]="activeFilter === filter.value"
            (click)="setFilter(filter.value)"
            class="filter-btn"
          >
            {{ filter.label }}
            <span class="count">({{ getFilteredCount(requests, filter.value) }})</span>
          </button>
        </div>

        <!-- Lista de Solicitações -->
        <div class="requests-list">
          <div
            class="request-card"
            *ngFor="let request of getFilteredRequests(requests)"
            [ngClass]="'status-' + request.status"
          >

            <!-- Cabeçalho do Card -->
            <div class="card-header">
              <div class="user-info">
                <h4>{{ request.username }}</h4>
                <span class="email">{{ request.email }}</span>
                <span class="current-mmr">MMR Atual: {{ request.current_mmr }}</span>
                <span class="account-status">{{ request.account_status }}</span>
              </div>
              <div class="request-info">
                <span class="claimed-mmr">MMR Solicitado: {{ request.claimed_mmr }}</span>
                <span class="status">{{ getStatusText(request.status) }}</span>
                <span class="date">{{ request.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
            </div>

            <!-- Screenshot -->
            <div class="screenshot-section">
              <h5>📸 Screenshot:</h5>
              <img
                [src]="getScreenshotUrl(request.screenshot_path)"
                [alt]="'Screenshot MMR de ' + request.username"
                class="screenshot-img"
                (error)="onImageError($event)"
              >
            </div>

            <!-- Notas do Usuário -->
            <div class="notes-section" *ngIf="request.notes">
              <h5>📝 Observações do Usuário:</h5>
              <p>{{ request.notes }}</p>
            </div>

            <!-- Ações Admin (apenas para pendentes) -->
            <div class="admin-actions" *ngIf="request.status === 'pending'">
              <div class="admin-notes-input">
                <label for="admin_notes_{{request.id}}">Observações do Admin:</label>
                <textarea
                  id="admin_notes_{{request.id}}"
                  [(ngModel)]="request.admin_notes"
                  placeholder="Adicione observações sobre sua decisão..."
                  rows="3"
                ></textarea>
              </div>

              <div class="action-buttons">
                <button
                  (click)="reviewRequest(request.id, 'approve', request.admin_notes)"
                  class="approve-btn"
                  [disabled]="isProcessing"
                >
                  ✅ Aprovar
                </button>
                <button
                  (click)="reviewRequest(request.id, 'reject', request.admin_notes)"
                  class="reject-btn"
                  [disabled]="isProcessing"
                >
                  ❌ Rejeitar
                </button>
              </div>
            </div>

            <!-- Informações da Revisão (para já revisados) -->
            <div class="review-info" *ngIf="request.status !== 'pending'">
              <div class="admin-notes" *ngIf="request.admin_notes">
                <h5>💬 Observações do Admin:</h5>
                <p>{{ request.admin_notes }}</p>
              </div>
              <div class="review-meta">
                <small>
                  Revisado em: {{ request.reviewed_at | date:'dd/MM/yyyy HH:mm' }}
                  por Admin ID: {{ request.reviewed_by }}
                </small>
              </div>
            </div>

          </div>
        </div>

        <!-- Estado Vazio -->
        <div class="empty-state" *ngIf="getFilteredRequests(requests).length === 0">
          <h3>🗂️ Nenhuma solicitação encontrada</h3>
          <p>Não há solicitações {{ activeFilter }} no momento.</p>
        </div>

      </div>

      <ng-template #loading>
        <div class="loading-state">
          <p>⏳ Carregando solicitações...</p>
        </div>
      </ng-template>
    </div>
  `,
  styleUrls: ['./mmr-review.component.css']
})
export class MmrReviewComponent implements OnInit {
  private mmrService = inject(MmrVerificationService);
  private toastr = inject(ToastrService);

  allRequests$!: Observable<MMRVerificationRequestWithUser[]>;
  isProcessing = false;
  activeFilter: string = 'all';

  filters = [
    { value: 'all', label: 'Todas' },
    { value: 'pending', label: 'Pendentes' },
    { value: 'approved', label: 'Aprovadas' },
    { value: 'rejected', label: 'Rejeitadas' }
  ];

  ngOnInit() {
    this.loadRequests();
  }

  loadRequests() {
    this.allRequests$ = this.mmrService.getAllRequests();
  }

  setFilter(filter: string) {
    this.activeFilter = filter;
  }

  getFilteredRequests(requests: MMRVerificationRequestWithUser[]): MMRVerificationRequestWithUser[] {
    if (this.activeFilter === 'all') {
      return requests;
    }
    return requests.filter(req => req.status === this.activeFilter);
  }

  getFilteredCount(requests: MMRVerificationRequestWithUser[], filter: string): number {
    if (filter === 'all') {
      return requests.length;
    }
    return requests.filter(req => req.status === filter).length;
  }

  reviewRequest(id: number, action: 'approve' | 'reject', adminNotes?: string) {
    this.isProcessing = true;

    this.mmrService.reviewRequest(id, action, adminNotes).subscribe({
      next: (response) => {
        this.toastr.success(response.message);
        this.loadRequests(); // Recarregar a lista
      },
      error: (error) => {
        this.toastr.error(error.error?.error || 'Erro ao processar solicitação');
      },
      complete: () => {
        this.isProcessing = false;
      }
    });
  }

  getScreenshotUrl(filename: string): string {
    return this.mmrService.getScreenshotUrl(filename);
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': '⏳ Pendente',
      'approved': '✅ Aprovado',
      'rejected': '❌ Rejeitado'
    };
    return statusMap[status] || status;
  }

  onImageError(event: any) {
    event.target.style.display = 'none';
    // Pode adicionar um placeholder aqui
  }
}

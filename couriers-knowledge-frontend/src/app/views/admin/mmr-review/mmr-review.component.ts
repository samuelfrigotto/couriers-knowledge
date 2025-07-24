// src/app/views/admin/mmr-review/mmr-review.component.ts - CÓDIGO COMPLETO

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { MmrVerificationService, MMRVerificationRequestWithUser } from '../../../core/mmr-verification.service';

@Component({
  selector: 'app-mmr-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">

      <!-- Header com botão de volta -->
      <div class="admin-header">
        <div class="header-left">
          <button class="back-btn" (click)="goBackToApp()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            Voltar ao App
          </button>
          <div class="header-info">
            <h1>🛡️ Painel Admin - Verificação MMR</h1>
            <p>Gerencie solicitações de verificação de MMR dos usuários</p>
          </div>
        </div>
        <div class="header-right">
          <button class="refresh-btn" (click)="loadRequests()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            Atualizar
          </button>
        </div>
      </div>

      <!-- Filtros -->
      <div class="filters-section">
        <div class="filter-tabs">
          <button
            *ngFor="let filter of filters"
            class="filter-tab"
            [class.active]="activeFilter === filter.value"
            (click)="setFilter(filter.value)"
          >
            {{ filter.label }}
            <span class="count"
                  *ngIf="allRequests$ | async as requests">
              ({{ getFilteredCount(requests, filter.value) }})
            </span>
          </button>
        </div>
      </div>

      <!-- Lista de Solicitações -->
      <div class="requests-section">
        <div *ngIf="allRequests$ | async as requests; else loading">

          <!-- Cards de Solicitações -->
          <div class="request-card"
               *ngFor="let request of getFilteredRequests(requests)"
               [class]="'status-' + request.status">

            <!-- Header do Card -->
            <div class="card-header">
              <div class="user-info">
                <h3>{{ request.username }}</h3>
                <span class="current-status">{{ request.account_status }}</span>
              </div>
              <div class="status-badge" [class]="'status-' + request.status">
                {{ getStatusText(request.status) }}
              </div>
            </div>

            <!-- Conteúdo Principal -->
            <div class="card-content">

              <!-- Informações MMR -->
              <div class="mmr-section">
                <div class="mmr-info">
                  <div class="mmr-current">
                    <label>MMR Atual no Sistema:</label>
                    <span class="value">{{ request.current_mmr || 'N/A' }}</span>
                  </div>
                  <div class="mmr-claimed">
                    <label>MMR Reivindicado:</label>
                    <span class="value claimed">{{ request.claimed_mmr }}</span>
                  </div>
                  <div class="mmr-difference" *ngIf="request.current_mmr">
                    <label>Diferença:</label>
                    <span class="value"
                          [class]="getDifferenceClass(request.claimed_mmr - request.current_mmr)">
                      {{ getDifferenceText(request.claimed_mmr - request.current_mmr) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Screenshot -->
              <div class="screenshot-section">
                <label>Screenshot:</label>
                <div class="screenshot-container">
                  <!-- ✅ CORRIGIDO: Usar data-filename para controle -->
                  <img
                    [src]="getImagePlaceholder()"
                    [attr.data-filename]="request.screenshot_path"
                    [alt]="'Screenshot MMR de ' + request.username"
                    class="screenshot-image"
                    (load)="onImageLoad($event, request.screenshot_path)"
                  >
                  <div class="loading-overlay" [attr.data-filename]="request.screenshot_path">
                    <div class="spinner"></div>
                    <span>Carregando imagem...</span>
                  </div>
                  <button class="view-full" (click)="viewFullScreenshot(request.screenshot_path)">
                    🔍 Ver Tamanho Completo
                  </button>
                </div>
              </div>

              <!-- Observações do Usuário -->
              <div class="user-notes" *ngIf="request.notes">
                <label>Observações do Usuário:</label>
                <p>{{ request.notes }}</p>
              </div>

              <!-- Data da Solicitação -->
              <div class="request-meta">
                <span class="created-at">
                  📅 Solicitado em: {{ request.created_at | date:'dd/MM/yyyy HH:mm' }}
                </span>
              </div>

            </div>

            <!-- Ações de Admin -->
            <div class="card-actions" *ngIf="request.status === 'pending'">
              <div class="admin-notes-input">
                <label for="admin-notes-{{ request.id }}">Observações do Admin:</label>
                <textarea
                  id="admin-notes-{{ request.id }}"
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
                  ✅ {{ getApprovalButtonText(request.claimed_mmr) }}
                </button>
                <button
                  (click)="reviewRequest(request.id, 'reject', request.admin_notes)"
                  class="reject-btn"
                  [disabled]="isProcessing"
                >
                  ❌ Rejeitar Solicitação
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

          <!-- Estado Vazio -->
          <div class="empty-state" *ngIf="getFilteredRequests(requests).length === 0">
            <h3>🗂️ Nenhuma solicitação encontrada</h3>
            <p>Não há solicitações {{ activeFilter === 'all' ? '' : activeFilter }} no momento.</p>
          </div>

        </div>

        <ng-template #loading>
          <div class="loading-state">
            <div class="spinner"></div>
            <p>⏳ Carregando solicitações...</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styleUrls: ['./mmr-review.component.css']
})
export class MmrReviewComponent implements OnInit, OnDestroy {
  private mmrService = inject(MmrVerificationService);
  private toastr = inject(ToastrService);
  private router = inject(Router);
  private http = inject(HttpClient);

  allRequests$!: Observable<MMRVerificationRequestWithUser[]>;
  isProcessing = false;
  activeFilter: string = 'pending';

  // ✅ Cache para URLs de imagens carregadas
  private imageCache = new Map<string, string>();
  private loadingImages = new Set<string>();

  filters = [
    { value: 'all', label: 'Todas' },
    { value: 'pending', label: 'Pendentes' },
    { value: 'approved', label: 'Aprovadas' },
    { value: 'rejected', label: 'Rejeitadas' }
  ];

  ngOnInit() {
    this.loadRequests();
  }

  ngOnDestroy() {
    // ✅ Limpeza: liberar URLs de blob para evitar memory leaks
    this.imageCache.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    this.imageCache.clear();
  }

  loadRequests() {
    this.allRequests$ = this.mmrService.getAllRequests();
  }

  goBackToApp() {
    this.router.navigate(['/app/dashboard']);
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

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': '⏳ Pendente',
      'approved': '✅ Aprovado',
      'rejected': '❌ Rejeitado'
    };
    return statusMap[status] || status;
  }

  getDifferenceText(difference: number): string {
    if (difference > 0) {
      return `+${difference}`;
    } else if (difference < 0) {
      return `${difference}`;
    }
    return '0';
  }

  getDifferenceClass(difference: number): string {
    if (difference > 0) {
      return 'positive';
    } else if (difference < 0) {
      return 'negative';
    }
    return 'neutral';
  }

  getApprovalButtonText(claimedMMR: number): string {
    if (claimedMMR >= 8500) {
      return `✅ Aprovar → IMMORTAL (${claimedMMR} MMR)`;
    } else {
      return `✅ Aprovar MMR (${claimedMMR})`;
    }
  }

  // ✅ NOVOS MÉTODOS PARA CARREGAR IMAGENS COM AUTENTICAÇÃO

  getImagePlaceholder(): string {
    // SVG placeholder enquanto carrega a imagem real
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjhmOWZhIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNmM3NTdkIiBmb250LXNpemU9IjE0Ij7wn5OU77iPIENhcnJlZ2FuZG8uLi48L3RleHQ+Cjwvc3ZnPgo=';
  }

  onImageLoad(event: any, filename: string) {
    // Quando a imagem placeholder carrega, iniciar carregamento da imagem real
    if (!this.imageCache.has(filename) && !this.loadingImages.has(filename)) {
      this.loadSecureImage(filename);
    }
  }

  private async loadSecureImage(filename: string) {
    if (this.loadingImages.has(filename)) {
      return; // Já está carregando
    }

    this.loadingImages.add(filename);

    try {
      // ✅ Fazer requisição com headers de autorização
      const response = await this.http.get(
        `http://localhost:3001/api/mmr-verification/screenshot/${filename}`,
        { responseType: 'blob' }
      ).toPromise();

      if (response) {
        // Criar URL do blob
        const imageUrl = URL.createObjectURL(response);
        this.imageCache.set(filename, imageUrl);

        // Atualizar imagem no DOM
        this.updateImageInDOM(filename, imageUrl);
      }
    } catch (error) {
      console.error('Erro ao carregar imagem:', error);
      this.showImageError(filename);
    } finally {
      this.loadingImages.delete(filename);
    }
  }

  private updateImageInDOM(filename: string, newUrl: string) {
    // Encontrar e atualizar a imagem
    const img = document.querySelector(`img[data-filename="${filename}"]`) as HTMLImageElement;
    if (img) {
      img.src = newUrl;

      // Remover overlay de loading
      const loadingOverlay = document.querySelector(`.loading-overlay[data-filename="${filename}"]`) as HTMLElement;
      if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
      }
    }
  }

  private showImageError(filename: string) {
    const img = document.querySelector(`img[data-filename="${filename}"]`) as HTMLImageElement;
    if (img) {
      // Mostrar imagem de erro
      img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZmVmMmYyIiBzdHJva2U9IiNmZWNhY2EiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWRhc2hhcnJheT0iNSw1Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZGM0NDQ0IiBmb250LXNpemU9IjI0Ij7wn5OU77iP8J+UuDwvdGV4dD4KPHRleHQgeD0iMjAwIiB5PSIxNzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2Yzc1N2QiIGZvbnQtc2l6ZT0iMTQiPkVycm8gYW8gY2FycmVnYXIgaW1hZ2VtPC90ZXh0Pgo8L3N2Zz4K';

      // Remover overlay de loading
      const loadingOverlay = document.querySelector(`.loading-overlay[data-filename="${filename}"]`) as HTMLElement;
      if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
      }
    }
  }

  viewFullScreenshot(filename: string) {
    // Se já temos a imagem no cache, usar ela
    if (this.imageCache.has(filename)) {
      const url = this.imageCache.get(filename)!;
      window.open(url, '_blank', 'width=1000,height=700,scrollbars=yes,resizable=yes');
    } else {
      // Carregar e abrir
      this.loadSecureImage(filename).then(() => {
        if (this.imageCache.has(filename)) {
          const url = this.imageCache.get(filename)!;
          window.open(url, '_blank', 'width=1000,height=700,scrollbars=yes,resizable=yes');
        }
      });
    }
  }

  reviewRequest(id: number, action: 'approve' | 'reject', adminNotes?: string) {
    if (this.isProcessing) return;

    const actionText = action === 'approve' ? 'aprovar' : 'rejeitar';

    if (!confirm(`Tem certeza que deseja ${actionText} esta solicitação?`)) {
      return;
    }

    this.isProcessing = true;

    this.mmrService.reviewRequest(id, action, adminNotes).subscribe({
      next: (response) => {
        this.toastr.success(response.message);
        this.loadRequests(); // Recarregar lista
      },
      error: (error) => {
        this.toastr.error(error.error?.error || 'Erro ao processar solicitação');
      },
      complete: () => {
        this.isProcessing = false;
      }
    });
  }
}

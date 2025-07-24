// src/app/core/mmr-verification.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/environment';


export interface MMRVerificationRequest {
  id: number;
  user_id: number;
  claimed_mmr: number;
  screenshot_path: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  reviewed_by?: number;
  created_at: string;
  reviewed_at?: string;
}

export interface MMRVerificationRequestWithUser extends MMRVerificationRequest {
  username: string;
  email: string;
  current_mmr: number;
  account_status: string;
}

@Injectable({
  providedIn: 'root'
})
export class MmrVerificationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/mmr-verification`;

  // Enviar solicitação de verificação
  submitVerification(data: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/submit`, data);
  }

  // Buscar solicitações do usuário atual
  getUserRequests(): Observable<MMRVerificationRequest[]> {
    return this.http.get<MMRVerificationRequest[]>(`${this.apiUrl}/my-requests`);
  }

  // Admin: Buscar todas as solicitações
  getAllRequests(): Observable<MMRVerificationRequestWithUser[]> {
    return this.http.get<MMRVerificationRequestWithUser[]>(`${this.apiUrl}/admin/all`);
  }

  // Admin: Aprovar/Rejeitar solicitação
  reviewRequest(id: number, action: 'approve' | 'reject', adminNotes?: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admin/review/${id}`, {
      action,
      admin_notes: adminNotes
    });
  }

  // Obter URL do screenshot
  getScreenshotUrl(filename: string): string {
    return `${this.apiUrl}/screenshot/${filename}`;
  }
}

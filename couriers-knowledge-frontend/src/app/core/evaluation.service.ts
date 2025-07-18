import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/environment';

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Busca as avaliações feitas pelo usuário logado
  getMyEvaluations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/evaluations/me`);
  }

  createEvaluation(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/evaluations`, data);
  }

  deleteEvaluation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/evaluations/${id}`);
  }

  updateEvaluation(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/evaluations/${id}`, data);
  }

  refreshPlayerNames(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users/me/refresh-names`, {});
  }

  getUsedTags(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/evaluations/tags`);
  }

  getEvaluationsForPlayer(steamId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/evaluations/player/${steamId}`);
  }

  getSharedEvaluation(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/evaluations/share/${id}`);
  }


}

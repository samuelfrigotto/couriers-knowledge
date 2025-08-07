// src/app/core/version.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../enviroments/environment';

@Injectable({
  providedIn: 'root'
})
export class VersionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/system`;

  private currentVersionSubject = new BehaviorSubject<string>('v0.0.30');
  public currentVersion$ = this.currentVersionSubject.asObservable();

  constructor() {
    this.loadCurrentVersion();
  }

  /**
   * Carrega a versão atual do servidor
   */
  async loadCurrentVersion(): Promise<void> {
    try {
      const response = await this.http.get<{success: boolean, version: string}>(`${this.apiUrl}/version`).toPromise();
      if (response && response.success) {
        this.currentVersionSubject.next(response.version);
      }
    } catch (error) {
      console.warn('Erro ao carregar versão, usando padrão:', error);
    }
  }

  /**
   * Atualiza a versão (apenas admin)
   */
  updateVersion(newVersion: string): Observable<{success: boolean, version: string, message: string}> {
    return this.http.patch<{success: boolean, version: string, message: string}>(`${this.apiUrl}/version`, {
      version: newVersion
    });
  }

  /**
   * Obtém a versão atual
   */
  getCurrentVersion(): string {
    return this.currentVersionSubject.value;
  }
}

import { Injectable, NgZone, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../enviroments/environment';

// Declaração global (sem alterações)
declare global {
  interface Window {
    electronAPI: {
      onGsiData: (callback: (data: any) => void) => void;
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class GsiService {
  private gsiDataSource = new BehaviorSubject<any>(null);
  public gsiData$ = this.gsiDataSource.asObservable();

  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // CORREÇÃO: O construtor agora usa o NgZone que já estava injetado
  constructor(private ngZone: NgZone) {
    if (window.electronAPI) {
      window.electronAPI.onGsiData((data) => {
        // Usamos NgZone.run() para garantir que a atualização dos dados
        // seja detectada corretamente pelo sistema de detecção de mudanças do Angular.
        this.ngZone.run(() => {
          console.log('[GsiService] Dados recebidos do preload. Atualizando a interface.');
          this.gsiDataSource.next(data);
        });
      });
    } else {
      console.warn('Electron API não encontrada. O GSI não funcionará no navegador comum.');
    }
  }

  // Seu método existente para buscar estatísticas (sem alterações)
  getPlayerStats(steamIds: string[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/gsi/player-stats`, { steamIds });
  }
}

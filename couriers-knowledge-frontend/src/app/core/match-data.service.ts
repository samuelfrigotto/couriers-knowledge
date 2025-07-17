import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../enviroments/environment';

@Injectable({
  providedIn: 'root'
})
export class MatchDataService {
  // BehaviorSubject para armazenar e distribuir os dados das partidas
  private matchesSubject = new BehaviorSubject<any[]>([]);
  public matches$ = this.matchesSubject.asObservable();

  // BehaviorSubject para controlar o estado de "carregando"
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Busca os dados mais recentes do backend e atualiza o estado.
   * Esta é a ÚNICA função que fala com o endpoint de dados de partidas.
   */
  refreshMatchData() {
    this.isLoadingSubject.next(true); // Inicia o carregamento

    return this.http.get<{ data: { matchHistory: any[] } }>(`${this.apiUrl}/users/me/match-data`).pipe(
      tap(response => {
        // Quando a resposta chega, atualiza o subject com os novos dados
        this.matchesSubject.next(response.data.matchHistory);
        this.isLoadingSubject.next(false); // Finaliza o carregamento
      })
    ).subscribe({
      error: (err) => {
        console.error('Falha ao buscar dados das partidas', err);
        this.isLoadingSubject.next(false); // Finaliza o carregamento mesmo em caso de erro
      }
    });
  }
}

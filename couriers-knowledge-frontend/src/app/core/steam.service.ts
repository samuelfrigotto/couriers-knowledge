import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/environment';

@Injectable({ providedIn: 'root' })
export class SteamService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getMatchHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/steam/match-history`);
  }

  getMatchDetails(matchId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/steam/match-details/${matchId}`);
  }
}
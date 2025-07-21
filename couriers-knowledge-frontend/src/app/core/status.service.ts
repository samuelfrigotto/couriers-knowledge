// couriers-knowledge-frontend/src/app/core/status.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/environment';

export interface StatusPlayer {
  slot: number;
  name: string;
  isBot: boolean;
  time: string;
  ping: number;
  loss: number;
  state: string;
  rate: number;
  team: 'radiant' | 'dire';
  hasEvaluations: boolean;
  evaluations: StatusEvaluation[];
  stats?: {
    totalEvaluations: number;
    averageRating: number;
    lastEvaluated: string;
    allTags: string[];
    mostCommonRole: string | null;
  } | null;
}

export interface StatusEvaluation {
  id: number;
  rating: number;
  notes: string | null;
  tags: string[];
  role: string | null;
  hero_id: number | null;
  match_id: number | null;
  created_at: string;
  steam_id: string;
}

export interface StatusParseResponse {
  success: boolean;
  gameState: {
    raw: string;
    translated: string;
  };
  statistics: {
    totalPlayers: number;
    humanPlayers: number;
    botPlayers: number;
    evaluatedPlayers: number;
  };
  teams: {
    radiant: StatusPlayer[];
    dire: StatusPlayer[];
  };
  evaluationsSummary: {
    totalFound: number;
    playersWithEvaluations: number;
    playerNames: string[];
  };
  error?: string;
  details?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StatusService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Envia o output do comando status para processamento
   */
  parseStatus(statusOutput: string): Observable<StatusParseResponse> {
    return this.http.post<StatusParseResponse>(`${this.apiUrl}/status/parse`, {
      statusOutput: statusOutput.trim()
    });
  }

  /**
   * Valida se o texto parece ser um comando status válido
   */
  validateStatusInput(input: string): { valid: boolean; error?: string } {
    if (!input || input.trim().length === 0) {
      return { valid: false, error: 'Comando status não pode estar vazio' };
    }

    const requiredElements = [
      'Server:',
      'Client:',
      'Status',
      'players',
      'name'
    ];

    const hasRequired = requiredElements.every(element =>
      input.includes(element)
    );

    if (!hasRequired) {
      return {
        valid: false,
        error: 'Não parece ser um output válido do comando "status" do Dota 2'
      };
    }

    return { valid: true };
  }

  /**
   * Formata rating para exibição
   */
  formatRating(rating: number): string {
    return rating % 1 === 0 ? rating.toFixed(0) : rating.toFixed(1);
  }

  /**
   * Retorna cor baseada na rating média
   */
  getRatingColor(rating: number): string {
    if (rating >= 4.5) return '#00ff88'; // Verde
    if (rating >= 3.5) return '#34c759'; // Verde claro
    if (rating >= 2.5) return '#ffd700'; // Amarelo
    if (rating >= 1.5) return '#ff9500'; // Laranja
    return '#ff3b30'; // Vermelho
  }

  /**
   * Retorna classe CSS baseada na rating
   */
  getRatingClass(rating: number): string {
    if (rating >= 4.5) return 'rating-excellent';
    if (rating >= 3.5) return 'rating-good';
    if (rating >= 2.5) return 'rating-average';
    if (rating >= 1.5) return 'rating-poor';
    return 'rating-bad';
  }

  /**
   * Formata tempo para exibição
   */
  formatTime(timeStr: string): string {
    if (timeStr === 'BOT') return 'BOT';
    if (!timeStr || timeStr.length === 0) return '-';
    return timeStr;
  }

  /**
   * Retorna instruções de uso do comando status
   */
  getStatusInstructions(): string[] {
    return [
      'Abra o Dota 2 e entre em uma partida',
      'Abra o console (precisa estar habilitado nas configurações)',
      'Digite o comando: status',
      'Copie todo o texto que aparecer',
      'Cole aqui no campo abaixo',
      'Clique em "Analisar Status"'
    ];
  }

  /**
   * Retorna dicas sobre o sistema
   */
  getSystemTips(): string[] {
    return [
      'O sistema compara nomes exatos dos jogadores',
      'Nomes são atualizados automaticamente da Steam',
      'Funciona melhor em partidas com jogadores reais',
      'Copie do console do Dota 2, a partir da linha "status Server: Running"',
      'Até a linha "[Client] #end"'
    ];
  }
}

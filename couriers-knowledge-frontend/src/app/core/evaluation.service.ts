// ===== ATUALIZAÇÃO DO EVALUATION.SERVICE.TS =====

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/environment';

// Interface para definir o tipo da avaliação
interface ImportEvaluation {
  target_steam_id?: string;
  target_player_name?: string;
  hero_id?: number;
  notes?: string;
  tags?: string[];
  rating: number;
  created_at?: string;
}

// Interface para a distribuição de rating
interface RatingDistribution {
  [key: number]: number;
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}



@Injectable({
  providedIn: 'root'
})
export class EvaluationService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // ===== MÉTODOS EXISTENTES (mantidos) =====

  createEvaluation(evaluation: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/evaluations`, evaluation);
  }

  getMyEvaluations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/evaluations/me`);
  }

  getPlayerEvaluations(steamId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/evaluations/player/${steamId}`);
  }

  updateEvaluation(id: string, evaluation: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/evaluations/${id}`, evaluation);
  }

  deleteEvaluation(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/evaluations/${id}`);
  }

  refreshPlayerNames(): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/me/refresh-names`, {});
  }

  getUniqueTags(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/evaluations/tags`);
  }

  getEvaluationStatus(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/evaluations/status`);
  }

  getEvaluationsByPlayerName(playerName: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/evaluations/by-name/${playerName}`);
  }

  // ===== NOVOS MÉTODOS PARA IMPORT/EXPORT =====

  /**
   * Exporta avaliações selecionadas ou todas as avaliações do usuário
   * @param evaluationIds Array opcional de IDs das avaliações a serem exportadas
   * @returns Observable com dados da exportação e código de compartilhamento
   */
  exportEvaluations(evaluationIds?: number[]): Observable<any> {
    const body = evaluationIds ? { evaluationIds } : {};
    return this.http.post(`${this.apiUrl}/evaluations/export`, body);
  }

  /**
   * Importa avaliações a partir de dados JSON
   * @param importData Dados das avaliações no formato de exportação
   * @param mode Modo de importação ('add' | 'merge' | 'replace')
   * @returns Observable com resultado da importação
   */
  importEvaluations(importData: any, mode: 'add' | 'merge' | 'replace' = 'add'): Observable<any> {
    return this.http.post(`${this.apiUrl}/evaluations/import`, {
      importData,
      mode
    });
  }

  /**
   * Importa avaliações usando código de compartilhamento
   * @param shareCode Código de 8 caracteres gerado na exportação
   * @param mode Modo de importação ('add' | 'merge' | 'replace')
   * @returns Observable com resultado da importação
   */
  importByShareCode(shareCode: string, mode: 'add' | 'merge' | 'replace' = 'add'): Observable<any> {
    return this.http.post(`${this.apiUrl}/evaluations/import`, {
      shareCode: shareCode.toUpperCase().trim(),
      mode
    });
  }

  /**
   * Valida um código de compartilhamento (verifica formato)
   * @param shareCode Código a ser validado
   * @returns boolean indicando se o código tem formato válido
   */
  validateShareCode(shareCode: string): boolean {
    if (!shareCode || typeof shareCode !== 'string') {
      return false;
    }

    const cleanCode = shareCode.trim().toUpperCase();

    // Deve ter exatamente 8 caracteres alfanuméricos
    const codeRegex = /^[A-Z0-9]{8}$/;
    return codeRegex.test(cleanCode);
  }

  /**
   * Formata um código de compartilhamento para exibição
   * @param shareCode Código bruto
   * @returns Código formatado (ex: "AB12" -> "AB12-CD34")
   */
  formatShareCode(shareCode: string): string {
    if (!shareCode) return '';

    const cleanCode = shareCode.trim().toUpperCase();
    if (cleanCode.length === 8) {
      return `${cleanCode.slice(0, 4)}-${cleanCode.slice(4)}`;
    }

    return cleanCode;
  }

  /**
   * Valida dados de importação antes de enviar ao servidor
   * @param data Dados de importação a serem validados
   * @returns objeto com resultado da validação
   */
  validateImportData(data: any): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Verificações básicas de estrutura
    if (!data || typeof data !== 'object') {
      errors.push('Dados de importação inválidos');
      return { valid: false, errors, warnings };
    }

    if (!data.evaluations || !Array.isArray(data.evaluations)) {
      errors.push('Propriedade "evaluations" não encontrada ou não é um array');
      return { valid: false, errors, warnings };
    }

    if (data.evaluations.length === 0) {
      errors.push('Nenhuma avaliação encontrada para importar');
      return { valid: false, errors, warnings };
    }

    // Verificar se é muito antigo
    if (data.version && data.version !== '1.0') {
      warnings.push(`Versão do arquivo (${data.version}) pode não ser totalmente compatível`);
    }

    // Verificar limite recomendado
    if (data.evaluations.length > 1000) {
      warnings.push('Arquivo muito grande (>1000 avaliações). A importação pode demorar.');
    }

    // Verificar estrutura das avaliações
    let validEvaluations = 0;
    for (let i = 0; i < Math.min(data.evaluations.length, 5); i++) {
      const evaluation = data.evaluations[i];

      if (!evaluation.rating || typeof evaluation.rating !== 'number') {
        warnings.push(`Avaliação ${i + 1}: rating inválido ou ausente`);
        continue;
      }

      if (!evaluation.target_player_name && !evaluation.target_steam_id) {
        warnings.push(`Avaliação ${i + 1}: informações do jogador ausentes`);
        continue;
      }

      validEvaluations++;
    }

    if (validEvaluations === 0 && data.evaluations.length <= 5) {
      errors.push('Nenhuma avaliação válida encontrada nas primeiras 5 entradas');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Busca avaliação compartilhada publicamente (sem autenticação)
   * @param id ID da avaliação compartilhada
   * @returns Observable com dados da avaliação
   */
  getSharedEvaluation(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/share/${id}`);
  }

  generateImportSummary(data: any): any {
    if (!data?.evaluations || !Array.isArray(data.evaluations)) {
      return null;
    }

    const evaluations: ImportEvaluation[] = data.evaluations;
    const summary = {
      total: evaluations.length,
      withSteamId: 0,
      withHero: 0,
      withNotes: 0,
      withTags: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as RatingDistribution,
      uniquePlayers: new Set<string>(),
      uniqueHeroes: new Set<number>(),
      dateRange: {
        oldest: null as Date | null,
        newest: null as Date | null
      }
    };

    let totalRating = 0;

    evaluations.forEach((evaluation: ImportEvaluation) => {
      // Contadores
      if (evaluation.target_steam_id) summary.withSteamId++;
      if (evaluation.hero_id) summary.withHero++;
      if (evaluation.notes && evaluation.notes.trim()) summary.withNotes++;
      if (evaluation.tags && evaluation.tags.length > 0) summary.withTags++;

      // Rating - corrigindo o erro de índice
      const rating = Math.floor(evaluation.rating);
      if (rating >= 1 && rating <= 5) {
        (summary.ratingDistribution as any)[rating]++;
        totalRating += evaluation.rating;
      }

      // Jogadores únicos
      if (evaluation.target_steam_id) {
        summary.uniquePlayers.add(evaluation.target_steam_id);
      } else if (evaluation.target_player_name) {
        summary.uniquePlayers.add(evaluation.target_player_name);
      }

      // Heróis únicos
      if (evaluation.hero_id) {
        summary.uniqueHeroes.add(evaluation.hero_id);
      }

      // Datas - corrigindo o erro de comparação
      if (evaluation.created_at) {
        const date = new Date(evaluation.created_at);
        if (!summary.dateRange.oldest || date < summary.dateRange.oldest) {
          summary.dateRange.oldest = date;
        }
        if (!summary.dateRange.newest || date > summary.dateRange.newest) {
          summary.dateRange.newest = date;
        }
      }
    });

    summary.averageRating = totalRating / evaluations.length;

    return {
      ...summary,
      uniquePlayers: summary.uniquePlayers.size,
      uniqueHeroes: summary.uniqueHeroes.size
    };
  }


  getImportExportStats(): Observable<any> {
  return this.http.get(`${this.apiUrl}/evaluations/import-export-stats`);
}

}

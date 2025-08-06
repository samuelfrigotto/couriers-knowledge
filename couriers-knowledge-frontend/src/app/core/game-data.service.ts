import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, tap, BehaviorSubject } from 'rxjs';

export interface Hero {
  id: number;
  name: string;
  localized_name: string;
}

// CORREÇÃO: A interface do Item agora espera a propriedade 'img'
export interface Item {
  name: string;
  localized_name: string;
  img: string;
}

@Injectable({
  providedIn: 'root'
})
export class GameDataService {
  private http = inject(HttpClient);

  private heroesSubject = new BehaviorSubject<{ [key: number]: Hero }>({});
  public heroes$ = this.heroesSubject.asObservable();

  private itemsSubject = new BehaviorSubject<{ [key: number]: Item }>({});
  public items$ = this.itemsSubject.asObservable();

  // ✅ URLS DE FALLBACK PARA IMAGENS DOS HERÓIS
  private readonly HERO_IMAGE_URLS = [
    // URL primária (Steamcommunity - mais confiável)
    'https://steamcdn-a.akamaihd.net/apps/dota2/images/dota_react/heroes/',
    // URL secundária (OpenDota CDN)
    'https://api.opendota.com/apps/dota2/images/heroes/',
    // URL terciária (Steam CDN oficial)
    'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/'
  ];

  public load(): Observable<any> {
    const heroes$ = this.http.get<{ [key: number]: Hero }>('/assets/data/heroes.json');
    // Agora esperamos que o JSON dos itens tenha a propriedade 'img'
    const items$ = this.http.get<{ [key: number]: Item }>('/assets/data/items.json');

    return forkJoin({ heroes: heroes$, items: items$ }).pipe(
      tap(data => {
        this.heroesSubject.next(data.heroes);
        this.itemsSubject.next(data.items);
        console.log('Dados de Heróis e Itens carregados dos arquivos LOCAIS com sucesso!');
      })
    );
  }

  // --- Métodos dos Heróis ---
  getHeroById(id: number): Hero | null {
    return this.heroesSubject.getValue()[id] || null;
  }

  /**
   * Retorna todos os heróis como um array
   * Útil para dropdowns e seletores
   */
  getHeroes(): Hero[] {
    const heroesMap = this.heroesSubject.getValue();
    return Object.values(heroesMap).sort((a, b) => {
      // Ordena alfabeticamente pelo nome localizado
      return a.localized_name.localeCompare(b.localized_name);
    });
  }

  /**
   * Retorna todos os heróis como um mapa (objeto)
   * Útil quando você precisa do formato original
   */
  getHeroesMap(): { [key: number]: Hero } {
    return this.heroesSubject.getValue();
  }

  /**
   * ✅ GERA A URL DA IMAGEM DO HERÓI COM FALLBACKS
   * Retorna uma URL confiável ou uma imagem padrão em caso de erro
   */
  getHeroImageUrl(heroId: number): string {
    const hero = this.getHeroById(heroId);

    if (!hero) {
      console.warn(`Herói com ID ${heroId} não encontrado`);
      return this.getDefaultHeroImage();
    }

    const heroNameForUrl = hero.name.replace(/^npc_dota_hero_/, '');

    // ✅ USAR URL STEAMCDN (MAIS CONFIÁVEL QUE VALVE CDN)
    return `${this.HERO_IMAGE_URLS[0]}${heroNameForUrl}.png`;
  }

  /**
   * ✅ GERA URL COM FALLBACK ESPECÍFICO PARA CASOS PROBLEMÁTICOS
   * Esta função pode ser usada em um pipe ou directive que detecta erro de carregamento
   */
  getHeroImageUrlWithFallback(heroId: number, fallbackIndex: number = 0): string {
    const hero = this.getHeroById(heroId);

    if (!hero) {
      return this.getDefaultHeroImage();
    }

    const heroNameForUrl = hero.name.replace(/^npc_dota_hero_/, '');

    // Se o índice de fallback exceder as opções disponíveis, usa imagem padrão
    if (fallbackIndex >= this.HERO_IMAGE_URLS.length) {
      return this.getDefaultHeroImage();
    }

    return `${this.HERO_IMAGE_URLS[fallbackIndex]}${heroNameForUrl}.png`;
  }

  /**
   * ✅ RETORNA IMAGEM PADRÃO EM CASO DE ERRO
   */
  private getDefaultHeroImage(): string {
    // Imagem transparente 1x1 pixel como fallback final
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  }

  // --- Métodos dos Itens (ATUALIZADOS) ---
  getItemById(id: number): Item | null {
    return this.itemsSubject.getValue()[id] || null;
  }

  getItemImageUrl(itemId: number): string {
    if (itemId === 0) {
      return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }
    const item = this.getItemById(itemId);

    // Se não encontrarmos o item ou for uma receita, usamos a imagem de receita genérica.
    if (!item || item.name.includes('recipe')) {
      return 'https://steamcdn-a.akamaihd.net/apps/dota2/images/dota_react/items/recipe.png';
    }

    // CORREÇÃO: Agora montamos a URL usando a propriedade 'img' do nosso JSON.
    // ✅ MUDANÇA PARA CDN MAIS CONFIÁVEL
    return `https://steamcdn-a.akamaihd.net${item.img}`;
  }
}

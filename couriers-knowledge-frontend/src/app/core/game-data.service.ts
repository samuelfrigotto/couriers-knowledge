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

  // --- Métodos dos Heróis (sem alteração) ---
  getHeroById(id: number): Hero | null {
    return this.heroesSubject.getValue()[id] || null;
  }
  
  getHeroImageUrl(heroId: number): string {
    const hero = this.getHeroById(heroId);
    const heroNameForUrl = hero ? hero.name.replace(/^npc_dota_hero_/, '') : 'default';
    return `https://cdn.dota2.com/apps/dota2/images/dota_react/heroes/${heroNameForUrl}.png`;
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
      return 'https://cdn.dota2.com/apps/dota2/images/dota_react/items/recipe.png';
    }
    
    // CORREÇÃO: Agora montamos a URL usando a propriedade 'img' do nosso JSON.
    return `https://cdn.dota2.com${item.img}`;
  }
}
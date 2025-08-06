import { Directive, ElementRef, Input, Renderer2, inject } from '@angular/core';
import { GameDataService } from '../../core/game-data.service';

@Directive({
  selector: 'img[appImageFallback]',
  standalone: true
})
export class ImageFallbackDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private gameDataService = inject(GameDataService);

  @Input() heroId: number | null = null;
  @Input() itemId: number | null = null;

  private fallbackIndex = 0;
  private maxRetries = 3;

  ngOnInit() {
    // Adiciona listener para erro de carregamento
    this.renderer.listen(this.el.nativeElement, 'error', () => {
      this.handleImageError();
    });

    // Adiciona listener para carregamento bem-sucedido (para reset)
    this.renderer.listen(this.el.nativeElement, 'load', () => {
      this.fallbackIndex = 0; // Reset para próxima tentativa
    });
  }

  private handleImageError(): void {
    console.warn(`Erro ao carregar imagem. Tentativa ${this.fallbackIndex + 1}/${this.maxRetries + 1}`);

    this.fallbackIndex++;

    // Se ainda há fallbacks disponíveis
    if (this.fallbackIndex <= this.maxRetries) {
      if (this.heroId) {
        // Tenta próximo fallback para herói
        const newSrc = this.gameDataService.getHeroImageUrlWithFallback(this.heroId, this.fallbackIndex);
        this.renderer.setAttribute(this.el.nativeElement, 'src', newSrc);
        console.log(`Tentando fallback ${this.fallbackIndex} para herói ${this.heroId}: ${newSrc}`);
      } else if (this.itemId) {
        // Para itens, pode implementar lógica similar se necessário
        // Por enquanto, usa a lógica existente do GameDataService
      }
    } else {
      // Todos os fallbacks falharam, usa imagem padrão
      console.error(`Todas as tentativas de carregamento falharam para ${this.heroId ? 'herói' : 'item'} ID: ${this.heroId || this.itemId}`);

      // Imagem padrão transparente
      const defaultSrc = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      this.renderer.setAttribute(this.el.nativeElement, 'src', defaultSrc);

      // Adiciona classe CSS para estilização de erro (opcional)
      this.renderer.addClass(this.el.nativeElement, 'image-error');
    }
  }
}

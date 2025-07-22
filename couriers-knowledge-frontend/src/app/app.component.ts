// src/app/app.component.ts - VERSÃO ATUALIZADA
import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LoadingScreenComponent } from './components/loading-screen/loading-screen.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LoadingScreenComponent],
  template: `
    <!-- Loading Screen aparece primeiro -->
    <app-loading-screen *ngIf="showLoadingScreen"></app-loading-screen>

    <!-- Aplicação principal (suas rotas atuais) -->
    <div class="app-container" [class.loaded]="!showLoadingScreen">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .app-container {
      opacity: 0;
      transition: opacity 0.6s ease-in-out;
      min-height: 100vh;
    }

    .app-container.loaded {
      opacity: 1;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'frontend';
  showLoadingScreen = true;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    // Só executa loading no browser
    if (isPlatformBrowser(this.platformId)) {
      this.initializeApp();
    } else {
      // No servidor, desabilita o loading imediatamente
      this.showLoadingScreen = false;
    }
  }

  private initializeApp() {
    // Define tempo mínimo para mostrar o loading (UX)
    const minLoadingTime = 3000; // 3 segundos
    const startTime = Date.now();

    // Simula inicializações (você pode substituir por suas inicializações reais)
    Promise.all([
      this.waitForDOMReady(),
      this.preloadCriticalAssets(),
      this.initializeServices()
    ]).then(() => {
      // Garante tempo mínimo de loading
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

      setTimeout(() => {
        this.showLoadingScreen = false;
      }, remainingTime);
    }).catch(error => {
      console.error('Erro na inicialização:', error);
      // Remove loading mesmo com erro após 4 segundos
      setTimeout(() => {
        this.showLoadingScreen = false;
      }, 4000);
    });
  }

  private waitForDOMReady(): Promise<void> {
    return new Promise(resolve => {
      // Verifica se está no browser antes de acessar document
      if (typeof document !== 'undefined') {
        if (document.readyState === 'complete') {
          resolve();
        } else {
          window.addEventListener('load', () => resolve());
        }
      } else {
        // No servidor, resolve imediatamente
        resolve();
      }
    });
  }

  private preloadCriticalAssets(): Promise<void> {
    // Simula carregamento de assets críticos
    return new Promise(resolve => setTimeout(resolve, 1000));
  }

  private initializeServices(): Promise<void> {
    // Simula inicialização de serviços
    return new Promise(resolve => setTimeout(resolve, 800));
  }
}

// loading-screen.component.ts
import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-loading-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-screen" [class.fade-out]="isLoading === false">
      <div class="loading-content">
        <!-- Logo com animação -->
        <div class="logo-container">
          <img src="../../../assets/images/logo-sem-fundo.png"
               alt="Courier's Knowledge"
               class="loading-logo">
          <div class="logo-glow"></div>
        </div>

        <!-- Texto principal -->
        <h1 class="loading-title">Courier's Knowledge</h1>
        <p class="loading-subtitle">Smart Notes</p>

        <!-- Slogan -->
        <p class="loading-slogan">
          Os segredos dos jogadores, repassados de entregador para entregador.
        </p>

        <!-- Barra de progresso -->
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <div class="progress-dots">
            <span class="dot" [class.active]="currentDot >= 1"></span>
            <span class="dot" [class.active]="currentDot >= 2"></span>
            <span class="dot" [class.active]="currentDot >= 3"></span>
          </div>
        </div>

        <!-- Status text -->
        <p class="loading-status">{{ loadingStatus }}</p>
      </div>

      <!-- Particles background effect -->
      <div class="particles">
        <div class="particle" *ngFor="let particle of particles"
             [style.left.px]="particle.x"
             [style.top.px]="particle.y"
             [style.animation-delay.ms]="particle.delay">
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./loading-screen.component.css']
})
export class LoadingScreenComponent implements OnInit, OnDestroy {
  isLoading = true;
  currentDot = 0;
  loadingStatus = 'Iniciando aplicação...';
  particles: any[] = [];

  private statusMessages = [
    'Iniciando aplicação...',
    'Carregando componentes...',
    'Conectando ao Steam...',
    'Quase pronto!'
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    // Só executa no browser, não no servidor
    if (isPlatformBrowser(this.platformId)) {
      this.generateParticles();
      this.simulateLoading();
    }
  }

  ngOnDestroy() {
    // Cleanup any intervals if needed
  }

  private generateParticles() {
    // Verifica se está no browser antes de acessar window
    if (typeof window !== 'undefined') {
      // Gera partículas aleatórias para efeito visual
      for (let i = 0; i < 15; i++) {
        this.particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          delay: Math.random() * 2000
        });
      }
    }
  }

  private simulateLoading() {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 0.5 + 0.2;

      if (progress > 1) this.currentDot = 1;
      if (progress > 2) this.currentDot = 2;
      if (progress > 3) this.currentDot = 3;

      // Atualiza status
      const statusIndex = Math.min(Math.floor(progress), this.statusMessages.length - 1);
      this.loadingStatus = this.statusMessages[statusIndex];

      // Simula carregamento completo após 3-4 segundos
      if (progress >= 4) {
        this.loadingStatus = 'Pronto!';
        setTimeout(() => {
          this.isLoading = false;
          // Emite evento para o componente pai
          setTimeout(() => {
            // Remove o loading screen do DOM (só no browser)
            if (typeof document !== 'undefined') {
              const element = document.querySelector('.loading-screen');
              if (element) {
                element.remove();
              }
            }
          }, 500);
        }, 300);
        clearInterval(interval);
      }
    }, 400);
  }
}

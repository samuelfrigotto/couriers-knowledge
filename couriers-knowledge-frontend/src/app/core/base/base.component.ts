// src/app/core/base.component.ts
import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs';

/**
 * Componente base que implementa gerenciamento automático de subscriptions
 * para evitar memory leaks. Todos os componentes devem estender esta classe.
 */
@Component({
  template: ''
})
export abstract class BaseComponent implements OnDestroy {
  /**
   * Subject usado para fazer unsubscribe de todos os observables
   * quando o componente é destruído
   */
  protected readonly destroy$ = new Subject<void>();

  /**
   * Implementação do OnDestroy que automaticamente
   * completa todas as subscriptions ativas
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Método helper para fazer subscribe de forma segura
   * @param observable$ Observable para fazer subscribe
   * @param nextCallback Callback para next
   * @param errorCallback Callback opcional para error
   * @param completeCallback Callback opcional para complete
   */
  protected safeSubscribe<T>(
    observable$: any,
    nextCallback: (value: T) => void,
    errorCallback?: (error: any) => void,
    completeCallback?: () => void
  ): void {
    observable$.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: nextCallback,
      error: errorCallback || ((error: any) => console.error('Subscription error:', error)),
      complete: completeCallback
    });
  }
}

// Função helper para importar junto com takeUntil
export { takeUntil } from 'rxjs/operators';

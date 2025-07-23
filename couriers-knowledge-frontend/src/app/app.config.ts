import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authTokenInterceptor } from './core/auth-token.interceptor';
import { GameDataService } from './core/game-data.service';
import { Observable } from 'rxjs';
import { provideAnimations } from '@angular/platform-browser/animations'; // 1. Importe provideAnimations
import { provideToastr } from 'ngx-toastr'; // 2. Importe provideToastr
import { SteamChatService } from './core/steam-chat.service';
import { I18nService } from './core/i18n.service';


// Função factory que o Angular usará para inicializar o app
export function initializeApp(gameDataService: GameDataService): () => Observable<any> {
  return () => gameDataService.load();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authTokenInterceptor])),
    I18nService,
    provideAnimations(),
    provideToastr({
        timeOut: 3000, // Duração do toast em milissegundos
        positionClass: 'toast-bottom-right', // Posição na tela
        preventDuplicates: true,
    }),
    SteamChatService,
    // Provedor que executa a função 'initializeApp' antes da aplicação iniciar
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [GameDataService], // Diz ao Angular para injetar o GameDataService na nossa função
      multi: true
    }
  ]
};

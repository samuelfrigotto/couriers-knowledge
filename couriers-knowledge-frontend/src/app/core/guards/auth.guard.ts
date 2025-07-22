import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true; // Se o usuário está autenticado, permite o acesso
  } else {
    // Se não está autenticado, redireciona para a página de login
    router.navigate(['/login']);
    return false; // E bloqueia o acesso à rota original
  }
};

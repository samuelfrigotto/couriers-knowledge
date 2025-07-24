// src/app/core/guards/auth.guard.ts - VERSÃO COM DEBUG

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🔍 [AUTH GUARD] ===== VERIFICANDO AUTENTICAÇÃO =====');
  console.log('🔍 [AUTH GUARD] Rota solicitada:', state.url);

  const token = authService.getToken();
  console.log('🔍 [AUTH GUARD] Token existe?', !!token);

  if (token) {
    console.log('🔍 [AUTH GUARD] Token preview:', token.substring(0, 50) + '...');

    const decodedToken = authService.getDecodedToken();
    console.log('🔍 [AUTH GUARD] Token decodificado:', decodedToken);

    const isAuthenticated = authService.isAuthenticated();
    console.log('🔍 [AUTH GUARD] Está autenticado?', isAuthenticated);

    if (isAuthenticated) {
      console.log('✅ [AUTH GUARD] Acesso permitido');
      return true;
    } else {
      console.warn('❌ [AUTH GUARD] Token inválido ou expirado');
    }
  } else {
    console.warn('❌ [AUTH GUARD] Nenhum token encontrado');
  }

  console.log('🔄 [AUTH GUARD] Redirecionando para login...');
  router.navigate(['/login']);
  return false;
};

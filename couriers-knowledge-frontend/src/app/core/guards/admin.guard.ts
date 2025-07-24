import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getDecodedToken();

  console.log('🛡️ [ADMIN GUARD] Token decodificado:', token);
  console.log('🛡️ [ADMIN GUARD] User ID:', token?.id, 'Tipo:', typeof token?.id);

  // ✅ CORREÇÃO: Verificar tanto string quanto number
  if (token && (token.id === 1 || token.id === '1')) {
    console.log('✅ [ADMIN GUARD] Usuário é admin!');
    return true;
  }

  console.log('❌ [ADMIN GUARD] Usuário não é admin, redirecionando...');
  // Redirecionar para dashboard se não for admin
  router.navigate(['/app/dashboard']);
  return false;
};

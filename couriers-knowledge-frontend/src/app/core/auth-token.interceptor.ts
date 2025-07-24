import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../enviroments/environment';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  console.log('🔍 [INTERCEPTOR] ===== NOVA REQUISIÇÃO =====');
  console.log('🔍 [INTERCEPTOR] URL completa:', req.url);
  console.log('🔍 [INTERCEPTOR] environment.apiUrl:', environment.apiUrl);
  console.log('🔍 [INTERCEPTOR] Token disponível:', !!token);
  console.log('🔍 [INTERCEPTOR] Token preview:', token ? token.substring(0, 50) + '...' : 'NENHUM');
  console.log('🔍 [INTERCEPTOR] Método:', req.method);

  // ✅ VERIFICAÇÃO DETALHADA DA URL
  const isApiRequest = req.url.startsWith(environment.apiUrl);
  console.log('🔍 [INTERCEPTOR] É para nossa API?', isApiRequest);

  if (token && isApiRequest) {
    console.log('✅ [INTERCEPTOR] ADICIONANDO TOKEN ao header Authorization');

    const clonedReq = req.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('🔍 [INTERCEPTOR] Headers da requisição:', clonedReq.headers.keys());
    console.log('🔍 [INTERCEPTOR] Authorization header:', clonedReq.headers.get('Authorization')?.substring(0, 30) + '...');

    return next(clonedReq);
  } else {
    console.log('⚠️ [INTERCEPTOR] NÃO ADICIONANDO TOKEN');

    if (!token) {
      console.warn('❌ [INTERCEPTOR] Motivo: Token não encontrado');
    }
    if (!isApiRequest) {
      console.log('📡 [INTERCEPTOR] Motivo: Requisição externa:', req.url);
    }
  }

  console.log('🔍 [INTERCEPTOR] ===== FIM REQUISIÇÃO =====');
  return next(req);
};

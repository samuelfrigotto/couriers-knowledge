import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../enviroments/environment'; // 1. Importe o ambiente

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  
  // 2. Verificamos se a URL da requisição começa com a URL da nossa API
  if (token && req.url.startsWith(environment.apiUrl)) {
    // Se for para a nossa API e tivermos um token, clonamos e adicionamos o cabeçalho
    const clonedReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(clonedReq);
  }

  // Para todas as outras requisições (ex: para a OpenDota), passamos sem modificar
  return next(req);
};
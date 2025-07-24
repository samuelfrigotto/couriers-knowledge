// src/app/interceptors/auth-token.interceptor.ts - VERSÃO LIMPA SEM DEBUG

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { environment } from '../../enviroments/environment';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Verificar se é uma requisição para nossa API
  const isApiRequest = req.url.startsWith(environment.apiUrl);

  if (!isApiRequest) {
    // Para requisições externas (assets, etc), não adicionar token
    return next(req);
  }

  const token = authService.getToken();

  if (!token) {
    // Sem token disponível
    return next(req);
  }

  // Adicionar token ao header Authorization
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq);
};

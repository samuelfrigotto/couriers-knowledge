// src/app/core/auth.service.ts - VERSÃO COM DEBUG MELHORADO

import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private tokenKey = 'authToken';

  // ✅ MÉTODO MELHORADO COM DEBUG
  saveToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(this.tokenKey, token);
        console.log('✅ [AUTH SERVICE] Token salvo com sucesso');

        // ✅ VERIFICAR SE FOI SALVO
        const saved = localStorage.getItem(this.tokenKey);
        console.log('🔍 [AUTH SERVICE] Verificação: token salvo?', !!saved);
      } catch (error) {
        console.error('❌ [AUTH SERVICE] Erro ao salvar token:', error);
      }
    } else {
      console.warn('⚠️ [AUTH SERVICE] Tentativa de salvar token fora do browser');
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const token = localStorage.getItem(this.tokenKey);
        console.log('🔍 [AUTH SERVICE] getToken chamado, token existe?', !!token);
        return token;
      } catch (error) {
        console.error('❌ [AUTH SERVICE] Erro ao buscar token:', error);
        return null;
      }
    }
    console.log('🔍 [AUTH SERVICE] getToken chamado fora do browser');
    return null;
  }

  removeToken(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.removeItem(this.tokenKey);
        console.log('✅ [AUTH SERVICE] Token removido');
      } catch (error) {
        console.error('❌ [AUTH SERVICE] Erro ao remover token:', error);
      }
    }
  }

  getDecodedToken(): any | null {
    const token = this.getToken();
    if (!token) {
      console.log('🔍 [AUTH SERVICE] Sem token para decodificar');
      return null;
    }

    try {
      const decoded = jwtDecode(token);
      console.log('✅ [AUTH SERVICE] Token decodificado:', decoded);
      return decoded;
    } catch (error) {
      console.error('❌ [AUTH SERVICE] Erro ao decodificar token:', error);
      // ✅ REMOVER TOKEN INVÁLIDO
      this.removeToken();
      return null;
    }
  }

  isAuthenticated(): boolean {
    const decodedToken = this.getDecodedToken();
    if (!decodedToken) {
      console.log('🔍 [AUTH SERVICE] Não autenticado - sem token válido');
      return false;
    }

    const isExpired = decodedToken.exp * 1000 < Date.now();
    console.log('🔍 [AUTH SERVICE] Token expirado?', isExpired);

    if (isExpired) {
      console.log('⚠️ [AUTH SERVICE] Token expirado, removendo');
      this.removeToken();
      return false;
    }

    console.log('✅ [AUTH SERVICE] Usuário autenticado');
    return true;
  }

  logout(): void {
    console.log('🔍 [AUTH SERVICE] Fazendo logout');
    this.removeToken();
    this.router.navigate(['/login']);
  }
}

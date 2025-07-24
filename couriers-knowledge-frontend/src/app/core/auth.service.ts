// src/app/core/auth.service.ts - VERSÃO LIMPA SEM DEBUG

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

  saveToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(this.tokenKey, token);
      } catch (error) {
        console.error('Erro ao salvar token:', error);
      }
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      try {
        return localStorage.getItem(this.tokenKey);
      } catch (error) {
        console.error('Erro ao buscar token:', error);
        return null;
      }
    }
    return null;
  }

  removeToken(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.removeItem(this.tokenKey);
      } catch (error) {
        console.error('Erro ao remover token:', error);
      }
    }
  }

  getDecodedToken(): any | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      return jwtDecode(token);
    } catch (error) {
      console.error('Erro ao decodificar token:', error);
      // Remover token inválido
      this.removeToken();
      return null;
    }
  }

  isAuthenticated(): boolean {
    const decodedToken = this.getDecodedToken();
    if (!decodedToken) {
      return false;
    }

    const isExpired = decodedToken.exp * 1000 < Date.now();

    if (isExpired) {
      this.removeToken();
      return false;
    }

    return true;
  }

  logout(): void {
    this.removeToken();
    this.router.navigate(['/login']);
  }

  getUserId(): string | null {
    const decodedToken = this.getDecodedToken();
    return decodedToken?.id || null;
  }

  getSteamId(): string | null {
    const decodedToken = this.getDecodedToken();
    return decodedToken?.steam_id || null;
  }
}

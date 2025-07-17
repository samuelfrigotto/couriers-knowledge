import { Injectable, inject, PLATFORM_ID } from '@angular/core'; // 1. Importe PLATFORM_ID
import { isPlatformBrowser } from '@angular/common'; // 2. Importe isPlatformBrowser
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID); // 3. Injete o PLATFORM_ID
  private tokenKey = 'authToken';

  // --- Wrappers para interagir com o localStorage de forma segura ---

  saveToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) { // 4. Verifique a plataforma
      localStorage.setItem(this.tokenKey, token);
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) { // 4. Verifique a plataforma
      return localStorage.getItem(this.tokenKey);
    }
    return null; // Se não for o navegador, não há token
  }

  removeToken(): void {
    if (isPlatformBrowser(this.platformId)) { // 4. Verifique a plataforma
      localStorage.removeItem(this.tokenKey);
    }
  }

  // --- A lógica restante continua a mesma ---

  getDecodedToken(): any | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }

  isAuthenticated(): boolean {
    const decodedToken = this.getDecodedToken();
    if (!decodedToken) {
      return false;
    }
    const isExpired = decodedToken.exp * 1000 < Date.now();
    return !isExpired;
  }

  logout(): void {
    this.removeToken();
    this.router.navigate(['/login']);
  }
}
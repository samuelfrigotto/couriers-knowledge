import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../enviroments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  
  login(): void {
    console.log('Botão de login clicado! Redirecionando para o backend...')
    // ATIVANDO ESTA LINHA:
    // Esta linha de código instrui a janela do Electron a navegar
    // para a nossa rota de backend, que por sua vez, redirecionará para a Steam.
    window.location.href = `${environment.apiUrl}/auth/steam`;
  }
}

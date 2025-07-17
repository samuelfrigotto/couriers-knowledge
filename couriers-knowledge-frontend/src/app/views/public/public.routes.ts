import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { LoginSuccessComponent } from './login-success/login-success.component';

// Exportamos a constante com as rotas, em vez de uma classe de módulo
export const PUBLIC_ROUTES: Routes = [
  {
    path: 'login/success', // <-- Adicione esta rota
    component: LoginSuccessComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Rotas públicas (aponta para public.routes.ts)
  {
    path: '',
    loadChildren: () =>
      import('./views/public/public.routes').then((m) => m.PUBLIC_ROUTES),
  },

  // Rotas do usuário logado (aponta para user.routes.ts)
  {
    path: 'app',
    loadChildren: () =>
      import('./views/user/user.routes').then((m) => m.USER_ROUTES),
    canActivate: [authGuard], // <-- Adicione esta linha para proteger a rota e suas filhas
  },

  // Rotas do usuário premium (aponta para premium.routes.ts)
  {
    path: 'premium',
    loadChildren: () =>
      import('./views/premium/premium.routes').then((m) => m.PREMIUM_ROUTES),
  },

  // Rotas do admin (aponta para admin.routes.ts)
  {
    path: 'admin',
    loadChildren: () =>
      import('./views/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },

  // Redirecionamento para qualquer rota não encontrada
  // Esta deve ser a ÚLTIMA rota da lista.
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];

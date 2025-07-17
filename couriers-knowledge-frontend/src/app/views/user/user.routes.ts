import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component'; // Importe o Layout
import { DashboardComponent } from './dashboard/dashboard.component';
import { RecentMatchesComponent } from './recent-matches/recent-matches.component';
import { ProfileComponent } from './profile/profile.component';
import { LiveMatchComponent } from './live-match/live-match.component';
export const USER_ROUTES: Routes = [
  {
    path: '',
    component: LayoutComponent, // O Layout é o componente principal desta visão
    children: [
      // Rotas filhas que serão renderizadas dentro do <router-outlet> do Layout
      { path: 'dashboard', component: DashboardComponent},
      { path: 'matches', component: RecentMatchesComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'live', component: LiveMatchComponent },
      
      
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
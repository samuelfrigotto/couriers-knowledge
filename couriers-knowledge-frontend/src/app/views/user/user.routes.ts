import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component'; // Importe o Layout
import { DashboardComponent } from './dashboard/dashboard.component';
import { RecentMatchesComponent } from './recent-matches/recent-matches.component';
import { ProfileComponent } from './profile/profile.component';
import { LiveMatchComponent } from './live-match/live-match.component';
import { FriendsComponent } from './friends/friends.component';
import { GetPremiumComponent } from './get-premium/get-premium.component';
import { PaymentSuccessComponent } from './payment-success/payment-success.component';
import { SettingsComponent } from '../../components/settings/settings.component';
import { ImmortalLiveMatchComponent } from './immortal-live-match/immortal-live-match.component';
import { ImmortalRecentMatchesComponent } from './immortal-recent-matches/immortal-recent-matches.component';
import { ProComponent } from './pro/pro.component';

export const USER_ROUTES: Routes = [
  {
    path: '',
    component: LayoutComponent, // O Layout é o componente principal desta visão
    children: [
      // Rotas filhas que serão renderizadas dentro do <router-outlet> do Layout
      { path: 'dashboard', component: DashboardComponent},
      { path: 'matches', component: RecentMatchesComponent },
      { path: 'friends', component: FriendsComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'live', component: LiveMatchComponent },
      { path: 'get-premium',component: GetPremiumComponent },
      { path: 'payment-success', component: PaymentSuccessComponent },
      { path: 'settings', component: SettingsComponent },
      // Rotas para Immortals
      { path: 'immortal-live', component: ImmortalLiveMatchComponent },
      { path: 'immortal-matches', component: ImmortalRecentMatchesComponent },
      { path: 'pro', component: ProComponent},
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

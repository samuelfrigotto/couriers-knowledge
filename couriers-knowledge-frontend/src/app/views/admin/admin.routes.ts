// src/app/admin/admin.routes.ts

import { Routes } from '@angular/router';
import { MmrReviewComponent } from './mmr-review/mmr-review.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: 'mmr-review', component: MmrReviewComponent },
      { path: '', redirectTo: 'mmr-review', pathMatch: 'full' }
    ]
  }
];

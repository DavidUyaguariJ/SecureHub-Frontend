import type {Routes} from '@angular/router';
import {Home} from './components/home/home';
import {AuthGuard} from './security/auth.guard';

export const routes: Routes = [
  {path: '', component: Home, canActivate: [AuthGuard]},
  {
    path: 'manage-consent',
    loadComponent: () => import('./components/manage-consent/manage-consent').then(m => m.ManageConsent),
    canActivate: [AuthGuard],
    data: {
      roles: ['admin_role']
    }
  },
];

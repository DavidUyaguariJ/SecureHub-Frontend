import type { Routes } from '@angular/router';
import {Home} from './components/home/home';
import {AuthGuard} from './security/auth.guard';

export const routes: Routes = [
  {path: '', component: Home, canActivate: [AuthGuard]},
];

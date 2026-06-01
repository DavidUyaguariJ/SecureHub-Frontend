import type {Routes} from '@angular/router';
import {Home} from './components/home/home';
import {AuthGuard} from './security/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    canActivate: [AuthGuard]
  },
  {
    path: 'manage-consent',
    loadComponent: () => import('./components/manage-consent/manage-consent').then(m => m.ManageConsent),
    canActivate: [AuthGuard],
    data: { roles: ['admin_role', 'technician_role'] }
  },
  {
    path: 'arco-manage',
    loadComponent: () => import('./components/arco-management/arco-manage/arco-manage').then(m => m.ArcoManage),
    canActivate: [AuthGuard],
    data: { roles: ['admin_role', 'technician_role'] }
  },
  {
    path: 'arco-request',
    loadComponent: () => import('./components/arco-management/arco-request/arco-request').then(m => m.ArcoRequest),
    canActivate: [AuthGuard],
    data: { roles: ['admin_role', 'applicant_role'] }
  },
  {
    path: 'my-data',
    loadComponent: () => import('./components/subject-portal/subject-portal').then(m => m.SubjectPortal),
    canActivate: [AuthGuard],
    data: { roles: ['applicant_role', 'admin_role'] }
  },
  {
    path: 'part-contracts',
    canActivate: [AuthGuard],
    data: { roles: ['admin_role', 'external_role'] },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/part-contract/part-contracts-list')
            .then(m => m.PartContractsList)
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./components/part-contract/form/part-contract-form')
            .then(m => m.PartContractForm)
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./components/part-contract/detail/part-contract-detail')
            .then(m => m.PartContractDetail)
      }
    ]
  },
  {
    path: 'external-portal',
    loadComponent: () => import('./components/external-portal/external-portal').then(m => m.ExternalPortal),
    canActivate: [AuthGuard],
    data: { roles: ['admin_role', 'external_role'] }
  }
];

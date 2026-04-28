import {Component, type OnInit} from '@angular/core';

import {Menubar} from 'primeng/menubar';
import {RouterOutlet} from '@angular/router';

import {PrimeTemplate, type MenuItem} from 'primeng/api';

import {AuthService} from './security/auth.service';
import {ButtonModule} from 'primeng/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    Menubar,
    RouterOutlet,
    PrimeTemplate,
    ButtonModule
  ],
  template: `
    <p-menubar [model]="items">
      <ng-template pTemplate="end">
        <p-button icon="pi pi-sign-out" (onClick)="logout()" severity="secondary">
        </p-button>
      </ng-template>
    </p-menubar>
    <router-outlet></router-outlet>
  `
})
export class App implements OnInit {

  items: MenuItem[] = [];

  constructor(private auth: AuthService) {
  }

  ngOnInit(): void {
    this.items = [
      {
        label: 'Home',
        icon: 'pi pi-home',
        routerLink: '/'
      },
      ...(this.auth.hasAnyRole(['admin_role', 'applicant_role']) ? [{
        label: 'Gestión de consentimientos',
        icon: 'pi pi-book',
        routerLink: '/manage-consent'
      }] : []),
      {
        label: 'Derechos ARCO',
        icon: 'pi pi-list-check',
        items: [
          ...(this.auth.hasAnyRole(['admin_role', 'technician_role']) ? [{
            label: 'Gestionar Solicitudes ARCO',
            icon: 'pi pi-cog',
            routerLink: '/arco-manage'
          }] : []),

          ...(this.auth.hasAnyRole(['admin_role', 'applicant_role']) ? [{
            label: 'Generar Solicitud ARCO',
            icon: 'pi pi-plus',
            routerLink: '/arco-request'
          }] : [])
        ]
      }
    ];
  }

  logout(): void {
    this.auth.logout();
  }
}

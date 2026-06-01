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
    const isAdmin: boolean = this.auth.hasAnyRole(['admin_role']);
    const isTechnician: boolean = this.auth.hasAnyRole(['admin_role', 'technician_role']);
    const isApplicant: boolean = this.auth.hasAnyRole(['admin_role', 'applicant_role']);
    const isExternal: boolean = this.auth.hasAnyRole(['admin_role', 'external_role']);

    const arcoItems: MenuItem[] = [
      ...(isTechnician ? [{
        label: 'Gestionar Solicitudes ARCO',
        icon: 'pi pi-cog',
        routerLink: '/arco-manage'
      }] : []),
      ...(isApplicant ? [{
        label: 'Generar Solicitud ARCO',
        icon: 'pi pi-plus',
        routerLink: '/arco-request'
      }] : [])
    ];

    this.items = [
      {
        label: 'Home',
        icon: 'pi pi-home',
        routerLink: '/'
      },
      ...(isTechnician ? [{
        label: 'Gestión de Consentimientos',
        icon: 'pi pi-book',
        routerLink: '/manage-consent'
      }] : []),
      ...(isApplicant ? [{
        label: 'Registro Biométrico — Mis Datos',
        icon: 'pi pi-face-smile',
        routerLink: '/my-data'
      }] : []),
      ...(arcoItems.length > 0 ? [{
        label: 'Derechos ARCO',
        icon: 'pi pi-list-check',
        items: arcoItems
      }] : []),
      ...(isAdmin ? [{
        label: 'Encargados',
        icon: 'pi pi-building',
        routerLink: '/part-contracts'
      }] : []),
      ...(isExternal ? [{
        label: 'Portal Externo',
        icon: 'pi pi-lock-open',
        routerLink: '/external-portal'
      }] : [])
    ];
  }

  logout(): void {
    this.auth.logout();
  }
}

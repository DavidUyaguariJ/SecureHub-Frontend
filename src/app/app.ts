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
      {label: 'Home', icon: 'pi pi-home', routerLink: '/'},
      {
        label: 'Datos personales',
        icon: 'pi pi-list-check',
        items: [
          ...(this.auth.hasRole('admin_role') ? [
            {
              label: 'Gestión de consentimientos',
              icon: 'pi pi-book',
              routerLink: '/manage-consent'
            }
          ] : [])
        ]
      },
    ];
  }

  logout(): void {
    this.auth.logout();
  }
}

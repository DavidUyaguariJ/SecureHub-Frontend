import { Injectable, inject } from '@angular/core';
import Keycloak, { type KeycloakTokenParsed } from 'keycloak-js';
import { environment } from '../../environments/environment';

interface TokenParsed extends KeycloakTokenParsed {
  preferred_username?: string;

  realm_access?: {
    roles: string[];
  };

  resource_access?: {
    [clientId: string]: {
      roles: string[];
    };
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private keycloak = inject(Keycloak);

  isAuthenticated(): boolean {
    return this.keycloak.authenticated;
  }

  getUsername(): string {
    const token = this.keycloak.tokenParsed as TokenParsed;
    return token?.preferred_username ?? '';
  }

  hasRole(role: string): boolean {
    const token = this.keycloak.tokenParsed as TokenParsed;
    const clientId = environment.keycloak.clientId;
    const realmRoles = token?.realm_access?.roles ?? [];
    const clientRoles = token?.resource_access?.[clientId]?.roles ?? [];
    return [...realmRoles, ...clientRoles].includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  logout(): void {
    this.keycloak.logout();
  }

  getTokenParsed(): TokenParsed | undefined {
    return this.keycloak.tokenParsed as TokenParsed;
  }

}

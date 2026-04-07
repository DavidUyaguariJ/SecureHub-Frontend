import { createAuthGuard, type AuthGuardData } from 'keycloak-angular';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

export const AuthGuard = createAuthGuard(
  async (
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
    authData: AuthGuardData
  ): Promise<boolean> => {
    return authData.authenticated;
  }
);

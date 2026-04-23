import {createAuthGuard, type AuthGuardData} from 'keycloak-angular';
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot} from '@angular/router';
import {inject} from '@angular/core';

export const AuthGuard = createAuthGuard(
  async (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
    authData: AuthGuardData
  ): Promise<boolean> => {

    const router = inject(Router);

    if (!authData.authenticated) {
      await authData.keycloak.login({
        redirectUri: window.location.origin + state.url
      });
      return false;
    }
    const requiredRoles = route.data?.['roles'] as string[] | undefined;
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const realmRoles = authData.grantedRoles?.realmRoles ?? [];
    const resourceRoles = Object.values(authData.grantedRoles?.resourceRoles ?? {})
      .flat();
    const userRoles = [...realmRoles, ...resourceRoles];
    const hasRole = requiredRoles.some(role => userRoles.includes(role));
    if (!hasRole) {
      router.navigate(['/']);
      return false;
    }
    return true;
  }
);

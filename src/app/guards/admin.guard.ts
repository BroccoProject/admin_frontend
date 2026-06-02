import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Allows access only to users with the 'admin' role. */
export const adminGuard: CanActivateFn = async (_route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  let user = authService.currentUser();
  if (!user) {
    user = await authService.loadUser();
  }

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  if (!authService.isAdmin()) {
    return router.createUrlTree(['/forbidden']);
  }

  return true;
};

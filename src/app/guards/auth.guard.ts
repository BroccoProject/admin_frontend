import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (_route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Use the cached signal first — avoids redundant HTTP request on every navigation.
  // APP_INITIALIZER already called loadUser() at startup; if the signal is still null
  // after initialization we perform one fresh load (handles hard refresh edge case).
  let user = authService.currentUser();

  if (!user) {
    user = await authService.loadUser();
  }

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  // Redirect users awaiting approval to the pending page
  if (user.access_status === 'pending') {
    return router.createUrlTree(['/auth/pending']);
  }

  return true;
};

import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { throwError, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const authReq = req.clone({ withCredentials: true });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Clear session and redirect — swallow error so components don't show
        // a redundant toast before the redirect happens.
        authService.logout();
        router.navigate(['/login']);
        return EMPTY;
      }

      if (error.status === 403 && !req.url.includes('/auth/')) {
        router.navigate(['/forbidden']);
        return EMPTY;
      }

      return throwError(() => error);
    })
  );
};

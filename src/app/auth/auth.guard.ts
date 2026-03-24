import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';
import { GlobalService } from '../services/global.service';
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const global = inject(GlobalService);
  if (authService.isAuthenticated()) {
    return true;
  } else {
    // Redirect to login page if not authenticated
    global.SnackBar('error', 'Login to access your Account');
    router.navigate(['/login']);
    return false;
  }
};

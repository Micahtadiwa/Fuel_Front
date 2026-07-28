import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const expectedRoles = (route.data['roles'] || []) as string[];
  const userRole = auth.getUserRole().toUpperCase();

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  if (expectedRoles.length > 0 && !expectedRoles.map(r => r.toUpperCase()).includes(userRole)) {
    router.navigate(['/unauthorized']);
    return false;
  }

  return true;
};

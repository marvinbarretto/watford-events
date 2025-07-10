import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../data-access/auth.store';
import { Roles } from '../utils/roles.enum';

/**
 * Role guard that checks if the current user has the required role(s)
 * @param requiredRoles - Array of roles that are allowed to access the route
 * @returns CanActivateFn that checks user role
 */
export const roleGuard = (requiredRoles: Roles[]): CanActivateFn => {
  return (route, state) => {
    const authStore = inject(AuthStore);
    const router = inject(Router);

    const user = authStore.user();
    
    if (!user) {
      router.navigate(['/login']);
      return false;
    }

    if (!user.role) {
      // If user has no role, deny access
      router.navigate(['/']);
      return false;
    }

    if (requiredRoles.includes(user.role)) {
      return true;
    } else {
      // User doesn't have required role, redirect to home
      router.navigate(['/']);
      return false;
    }
  };
};
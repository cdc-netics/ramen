import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({providedIn:'root'})
export class RbacGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}
  
  canActivate(route: ActivatedRouteSnapshot): boolean {
    // Verificar si está autenticado
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    // Verificar roles si están especificados
    const allowed: string[] = route.data['allowedRoles'] || [];
    if(allowed.length === 0) return true;
    
    for(const r of allowed) {
      if(this.auth.hasRole(r)) return true;
    }
    
    this.router.navigate(['/login']);
    return false;
  }
}

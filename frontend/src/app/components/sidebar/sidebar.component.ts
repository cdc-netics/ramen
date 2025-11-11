import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModuleRegistryService } from '../../core/services/module-registry.service';
import { AuthService } from '../../core/services/auth.service';

declare var anime: any;

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  open = true;
  modules: any[] = [];
  filteredModules: any[] = [];
  username = '';
  primaryRole = '';
  userRoles: string[] = [];
  
  // Branding personalizado
  brandingName = 'Ramen SOC';
  brandingLogo = '';

  constructor(
    private reg: ModuleRegistryService, 
    public auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() { 
    this.reg.modules$.subscribe(m => {
      this.modules = m;
      this.filterModules();
    }); 
    this.reg.loadModules();
    
    // Obtener info del usuario
    this.auth.user$.subscribe(user => {
      if (user) {
        this.username = user.username || 'Usuario';
        this.userRoles = user.roles || [];
        this.primaryRole = this.userRoles[0] || 'User';
        this.filterModules();
      }
    });
    
    // Cargar branding personalizado
    this.loadBranding();
  }

  filterModules() {
    if (!this.userRoles || this.userRoles.length === 0) {
      this.filteredModules = [];
      return;
    }

    // Filtrar módulos según roles del usuario
    this.filteredModules = this.modules.filter(module => {
      // Si no tiene allowedRoles definido, permitir a todos
      if (!module.allowedRoles || module.allowedRoles.length === 0) {
        return true;
      }
      
      // Verificar si alguno de los roles del usuario está en allowedRoles del módulo
      return module.allowedRoles.some((role: string) => 
        this.userRoles.includes(role)
      );
    });
  }

  loadBranding() {
    try {
      const branding = JSON.parse(localStorage.getItem('branding') || '{}');
      if (branding.appName) {
        this.brandingName = branding.appName;
      }
      if (branding.logoUrl) {
        this.brandingLogo = branding.logoUrl;
      }
    } catch (err) {
      console.log('Using default branding');
    }
  }

  toggle() {
    this.open = !this.open;
    anime({ 
      targets: '.sidebar', 
      width: this.open ? '280px' : '72px', 
      easing: 'easeInOutQuad', 
      duration: 300 
    });
  }

  logout() {
    anime({
      targets: '.sidebar',
      translateX: [-280, 0],
      opacity: [0, 1],
      duration: 300,
      easing: 'easeOutQuad',
      complete: () => {
        this.auth.logout();
        this.router.navigate(['/login']);
      }
    });
  }

  isOwnerOrAdmin(): boolean {
    const user = this.auth.getCurrentUser();
    return user?.roles?.some((r: string) => r === 'Owner' || r === 'Admin') || false;
  }
}

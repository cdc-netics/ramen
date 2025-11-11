import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface UserModuleAccess {
  userId: string;
  username: string;
  fullName: string;
  moduleAccess: {
    [moduleId: string]: {
      canRead: boolean;
      canWrite: boolean;
      canExecute: boolean;
    }
  };
}

@Component({
  selector: 'app-module-user-access',
  templateUrl: './module-user-access.component.html',
  styleUrls: ['./module-user-access.component.scss']
})
export class ModuleUserAccessComponent implements OnInit {
  users: any[] = [];
  modules: any[] = [];
  userAccess: UserModuleAccess[] = [];
  loading = false;
  message = '';

  constructor(private http: HttpClient) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.loading = true;
    try {
      // Cargar usuarios
      this.users = await this.http.get<any[]>('http://localhost:4000/api/users').toPromise() || [];
      
      // Cargar módulos
      this.modules = await this.http.get<any[]>('http://localhost:4000/api/modules').toPromise() || [];
      
      // Cargar accesos (si existe endpoint en backend)
      // this.userAccess = await this.http.get<any>('http://localhost:4000/api/user-module-access').toPromise() || [];
      
      // Inicializar estructura de accesos
      this.initializeAccess();
    } catch (err) {
      console.error('Error cargando datos:', err);
      this.message = '❌ Error al cargar datos';
    } finally {
      this.loading = false;
    }
  }

  initializeAccess() {
    // Crear estructura de acceso para cada usuario
    this.userAccess = this.users.map(user => {
      const moduleAccess: any = {};
      
      // Por cada módulo, inicializar permisos
      this.modules.forEach(module => {
        moduleAccess[module._id] = {
          canRead: false,
          canWrite: false,
          canExecute: false
        };
      });

      return {
        userId: user._id,
        username: user.username,
        fullName: user.fullName,
        moduleAccess
      };
    });
  }

  toggleAccess(userId: string, moduleId: string, permission: 'canRead' | 'canWrite' | 'canExecute') {
    const userAccess = this.userAccess.find(ua => ua.userId === userId);
    if (userAccess && userAccess.moduleAccess[moduleId]) {
      userAccess.moduleAccess[moduleId][permission] = !userAccess.moduleAccess[moduleId][permission];
    }
  }

  hasAccess(userId: string, moduleId: string, permission: 'canRead' | 'canWrite' | 'canExecute'): boolean {
    const userAccess = this.userAccess.find(ua => ua.userId === userId);
    return userAccess?.moduleAccess[moduleId]?.[permission] || false;
  }

  async saveAccess() {
    this.loading = true;
    this.message = '';
    
    try {
      const token = localStorage.getItem('ramen_token');
      
      // Guardar en backend
      await this.http.post('http://localhost:4000/api/user-module-access', {
        userAccess: this.userAccess
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).toPromise();
      
      this.message = '✅ Permisos de acceso guardados correctamente';
      
      setTimeout(() => {
        this.message = '';
      }, 3000);
    } catch (err: any) {
      console.error('Error guardando accesos:', err);
      this.message = '❌ Error al guardar: ' + (err.error?.error || err.message);
    } finally {
      this.loading = false;
    }
  }

  selectAll(userId: string, permission: 'canRead' | 'canWrite' | 'canExecute') {
    const userAccess = this.userAccess.find(ua => ua.userId === userId);
    if (userAccess) {
      Object.keys(userAccess.moduleAccess).forEach(moduleId => {
        userAccess.moduleAccess[moduleId][permission] = true;
      });
    }
  }

  unselectAll(userId: string, permission: 'canRead' | 'canWrite' | 'canExecute') {
    const userAccess = this.userAccess.find(ua => ua.userId === userId);
    if (userAccess) {
      Object.keys(userAccess.moduleAccess).forEach(moduleId => {
        userAccess.moduleAccess[moduleId][permission] = false;
      });
    }
  }
}

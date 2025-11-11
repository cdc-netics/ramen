import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Permission {
  resource: string;
  actions: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
}

interface RoleConfig {
  role: string;
  permissions: Permission[];
}

@Component({
  selector: 'app-rbac-config',
  templateUrl: './rbac-config.component.html',
  styleUrls: ['./rbac-config.component.scss']
})
export class RbacConfigComponent implements OnInit {
  roles: RoleConfig[] = [
    {
      role: 'Owner',
      permissions: [
        { resource: 'modules', actions: { create: true, read: true, update: true, delete: true } },
        { resource: 'users', actions: { create: true, read: true, update: true, delete: true } },
        { resource: 'roles', actions: { create: true, read: true, update: true, delete: true } },
        { resource: 'settings', actions: { create: true, read: true, update: true, delete: true } },
        { resource: 'logs', actions: { create: false, read: true, update: false, delete: true } }
      ]
    },
    {
      role: 'Admin',
      permissions: [
        { resource: 'modules', actions: { create: false, read: true, update: false, delete: false } },
        { resource: 'users', actions: { create: true, read: true, update: true, delete: true } },
        { resource: 'roles', actions: { create: false, read: true, update: false, delete: false } },
        { resource: 'settings', actions: { create: false, read: true, update: true, delete: false } },
        { resource: 'logs', actions: { create: false, read: true, update: false, delete: false } }
      ]
    },
    {
      role: 'User',
      permissions: [
        { resource: 'modules', actions: { create: false, read: true, update: false, delete: false } },
        { resource: 'users', actions: { create: false, read: false, update: false, delete: false } },
        { resource: 'roles', actions: { create: false, read: false, update: false, delete: false } },
        { resource: 'settings', actions: { create: false, read: false, update: false, delete: false } },
        { resource: 'logs', actions: { create: false, read: false, update: false, delete: false } }
      ]
    },
    {
      role: 'Visor',
      permissions: [
        { resource: 'modules', actions: { create: false, read: true, update: false, delete: false } },
        { resource: 'users', actions: { create: false, read: false, update: false, delete: false } },
        { resource: 'roles', actions: { create: false, read: false, update: false, delete: false } },
        { resource: 'settings', actions: { create: false, read: false, update: false, delete: false } },
        { resource: 'logs', actions: { create: false, read: false, update: false, delete: false } }
      ]
    }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {}

  togglePermission(role: string, resource: string, action: string) {
    const roleConfig = this.roles.find(r => r.role === role);
    if (!roleConfig) return;

    const permission = roleConfig.permissions.find(p => p.resource === resource);
    if (!permission) return;

    (permission.actions as any)[action] = !(permission.actions as any)[action];
  }

  async saveChanges() {
    try {
      // TODO: Implementar guardado en backend
      console.log('Guardando configuración RBAC:', this.roles);
      alert('Configuración guardada (demo)');
    } catch(err) {
      console.error('Error saving RBAC config:', err);
      alert('Error al guardar configuración');
    }
  }

  getActionIcon(allowed: boolean): string {
    return allowed ? 'check_circle' : 'cancel';
  }

  getActionClass(allowed: boolean): string {
    return allowed ? 'allowed' : 'denied';
  }
}

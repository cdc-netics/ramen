import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { BitacoraWrapperComponent } from './features/bitacora/bitacora-wrapper.component';
import { DashboardComponent } from './features/admin/dashboard.component';
import { ModuleAdminComponent } from './features/admin/module-admin.component';
import { UserAdminComponent } from './features/admin/user-admin.component';
import { RbacConfigComponent } from './features/admin/rbac-config.component';
import { LogsComponent } from './features/admin/logs.component';
import { CodeEditorComponent } from './features/admin/code-editor.component';
import { BrandingSettingsComponent } from './features/admin/branding-settings.component';
import { ModuleUserAccessComponent } from './features/admin/module-user-access.component';
import { RbacGuard } from './core/guards/rbac.guard';
import { ModuleConfigComponent } from './features/admin/module-config/module-config.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'bitacora', component: BitacoraWrapperComponent, canActivate: [RbacGuard] },
  { 
    path: 'admin', 
    canActivate: [RbacGuard],
    data: { allowedRoles: ['Owner', 'Admin'] },
    children: [
      { path: '', component: DashboardComponent },
      { path: 'modules', component: ModuleAdminComponent, data: { allowedRoles: ['Owner'] } },
      { path: 'modules/:id/code', component: CodeEditorComponent, data: { allowedRoles: ['Owner'] } },
      { path: 'users', component: UserAdminComponent },
      { path: 'rbac', component: RbacConfigComponent, data: { allowedRoles: ['Owner'] } },
      { path: 'module-access', component: ModuleUserAccessComponent, data: { allowedRoles: ['Owner', 'Admin'] } },
      { path: 'module-config/:moduleId', component: ModuleConfigComponent, data: { allowedRoles: ['Owner', 'Admin'] } },
      { path: 'logs', component: LogsComponent },
      { path: 'branding', component: BrandingSettingsComponent, data: { allowedRoles: ['Owner'] } }
    ]
  },
  { path: 'modules', loadChildren: () => import('./features/modules-shell.module').then(m=>m.ModulesShellModule), canActivate: [RbacGuard] }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}

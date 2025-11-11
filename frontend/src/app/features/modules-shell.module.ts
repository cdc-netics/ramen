import { NgModule, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ModuleViewerComponent } from './module-viewer/module-viewer.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-dashboard',
  template: '<h2>Dashboard de Módulos</h2><p>Aquí se cargarán los módulos dinámicamente</p>'
})
export class DashboardComponent { }

@NgModule({
  declarations: [DashboardComponent, ModuleViewerComponent],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    RouterModule.forChild([
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: ':id', component: ModuleViewerComponent }
    ])
  ]
})
export class ModulesShellModule { }
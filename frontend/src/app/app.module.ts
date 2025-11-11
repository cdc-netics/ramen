import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { BitacoraWrapperComponent } from './features/bitacora/bitacora-wrapper.component';
import { LoginComponent } from './features/auth/login.component';
import { DashboardComponent } from './features/admin/dashboard.component';
import { ModuleAdminComponent } from './features/admin/module-admin.component';
import { UserAdminComponent } from './features/admin/user-admin.component';
import { RbacConfigComponent } from './features/admin/rbac-config.component';
import { LogsComponent } from './features/admin/logs.component';
import { CodeEditorComponent } from './features/admin/code-editor.component';
import { BrandingSettingsComponent } from './features/admin/branding-settings.component';
import { ModuleUserAccessComponent } from './features/admin/module-user-access.component';
import { LoadingAnimationComponent } from './shared/components/loading-animation.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ModuleConfigComponent } from './features/admin/module-config/module-config.component';

@NgModule({
  declarations: [
    AppComponent, 
    SidebarComponent, 
    BitacoraWrapperComponent, 
    LoginComponent,
    DashboardComponent,
    ModuleAdminComponent,
    UserAdminComponent,
    RbacConfigComponent,
    LogsComponent,
    CodeEditorComponent,
    BrandingSettingsComponent,
    ModuleUserAccessComponent,
    LoadingAnimationComponent,
    ModuleConfigComponent
  ],
  imports: [BrowserModule, CommonModule, FormsModule, AppRoutingModule, HttpClientModule, BrowserAnimationsModule, MatIconModule, MatButtonModule, MatTooltipModule, MatProgressSpinnerModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}

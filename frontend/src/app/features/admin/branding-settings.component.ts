import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface BrandingConfig {
  appName: string;
  logoUrl: string;
  loginLogoUrl: string;
  loadingAnimationUrl: string;
  primaryColor: string;
  secondaryColor: string;
}

@Component({
  selector: 'app-branding-settings',
  templateUrl: './branding-settings.component.html',
  styleUrls: ['./branding-settings.component.scss']
})
export class BrandingSettingsComponent implements OnInit {
  branding: BrandingConfig = {
    appName: 'Ramen SOC',
    logoUrl: '',
    loginLogoUrl: '',
    loadingAnimationUrl: '',
    primaryColor: '#667eea',
    secondaryColor: '#764ba2'
  };

  previewLogo = false;
  previewLoginLogo = false;
  previewLoadingAnimation = false;
  saving = false;
  message = '';

  constructor(private http: HttpClient) {
    console.log('🎨 BrandingSettingsComponent constructor');
  }

  ngOnInit() {
    console.log('🎨 BrandingSettingsComponent ngOnInit');
    const token = localStorage.getItem('ramen_token');
    console.log('🔍 Token en ngOnInit:', token ? 'EXISTE' : '❌ NO EXISTE');
    
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log('👤 Usuario actual:', payload);
          console.log('🔑 Roles:', payload.roles);
          console.log('📛 Username:', payload.username);
        }
      } catch (e) {
        console.error('❌ Error parseando token:', e);
      }
    }
    
    this.loadBranding();
  }

  async loadBranding() {
    try {
      const response: any = await this.http.get('http://localhost:4000/api/branding').toPromise();
      if (response) {
        this.branding = { ...this.branding, ...response };
        // Actualizar previews
        this.previewLogo = !!response.logoUrl;
        this.previewLoginLogo = !!response.loginLogoUrl;
        this.previewLoadingAnimation = !!response.loadingAnimationUrl;
      }
    } catch (err) {
      console.log('Using default branding', err);
    }
  }

  onLogoFileSelect(event: any, type: 'logo' | 'loginLogo' | 'loadingAnimation') {
    const file = event.target.files[0];
    if (!file) return;

    // Convertir a base64
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64 = e.target.result;
      
      switch(type) {
        case 'logo':
          this.branding.logoUrl = base64;
          this.previewLogo = true;
          break;
        case 'loginLogo':
          this.branding.loginLogoUrl = base64;
          this.previewLoginLogo = true;
          break;
        case 'loadingAnimation':
          this.branding.loadingAnimationUrl = base64;
          this.previewLoadingAnimation = true;
          break;
      }
    };
    reader.readAsDataURL(file);
  }

  onLogoUrlChange(type: 'logo' | 'loginLogo' | 'loadingAnimation') {
    switch(type) {
      case 'logo':
        this.previewLogo = !!this.branding.logoUrl;
        break;
      case 'loginLogo':
        this.previewLoginLogo = !!this.branding.loginLogoUrl;
        break;
      case 'loadingAnimation':
        this.previewLoadingAnimation = !!this.branding.loadingAnimationUrl;
        break;
    }
  }

  removeLogo(type: 'logo' | 'loginLogo' | 'loadingAnimation') {
    switch(type) {
      case 'logo':
        this.branding.logoUrl = '';
        this.previewLogo = false;
        break;
      case 'loginLogo':
        this.branding.loginLogoUrl = '';
        this.previewLoginLogo = false;
        break;
      case 'loadingAnimation':
        this.branding.loadingAnimationUrl = '';
        this.previewLoadingAnimation = false;
        break;
    }
  }

  async saveBranding() {
    this.saving = true;
    this.message = '';

    try {
      const token = localStorage.getItem('ramen_token');
      
      // Debug: verificar token y roles
      console.log('🔍 Token:', token ? 'Existe' : 'NO EXISTE');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('🔍 Roles del usuario:', payload.roles);
          console.log('🔍 Username:', payload.username);
        } catch (e) {
          console.error('Error parseando token:', e);
        }
      }
      
      console.log('📤 Enviando branding:', this.branding);
      
      const response: any = await this.http.post('http://localhost:4000/api/branding', this.branding, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).toPromise();
      
      console.log('✅ Respuesta exitosa:', response);
      
      this.message = '✅ Configuración guardada correctamente';
      
      // Guardar en localStorage también para cambios inmediatos
      localStorage.setItem('branding', JSON.stringify(this.branding));
      
      // Recargar branding desde el servidor para asegurar que se muestre el valor guardado
      await this.loadBranding();
      
      // NO recargar automáticamente - el usuario puede refrescar manualmente si quiere
      // setTimeout(() => {
      //   window.location.reload();
      // }, 2000);
    } catch (err: any) {
      console.error('❌ Error completo:', err);
      console.error('❌ Status:', err.status);
      console.error('❌ Error body:', err.error);
      
      this.message = '❌ Error: ' + (err.error?.error || err.error?.message || err.message || 'No se pudo guardar');
      
      // Mostrar más detalles en consola
      if (err.status === 403) {
        this.message = '❌ Error 403: Solo el Owner puede cambiar la personalización. Verifica la consola para más detalles.';
      } else if (err.status === 401) {
        this.message = '❌ Error 401: Sesión expirada. Inicia sesión de nuevo';
      }
    } finally {
      this.saving = false;
    }
  }

  resetToDefault() {
    if (!confirm('¿Restaurar configuración por defecto?')) return;
    
    this.branding = {
      appName: 'Ramen SOC',
      logoUrl: '',
      loginLogoUrl: '',
      loadingAnimationUrl: '',
      primaryColor: '#667eea',
      secondaryColor: '#764ba2'
    };
    
    this.previewLogo = false;
    this.previewLoginLogo = false;
    this.previewLoadingAnimation = false;
  }
}

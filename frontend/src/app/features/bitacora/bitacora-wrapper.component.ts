import { Component, OnInit, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({ 
  selector: 'app-bitacora-wrapper', 
  templateUrl: './bitacora-wrapper.component.html' 
})
export class BitacoraWrapperComponent implements OnInit {
  @Input() url = 'http://localhost:3001';
  @Input() moduleId: string = '';
  @Input() moduleType: string = 'external';
  @Input() embedType: string = 'iframe';
  
  iframeUrl: SafeResourceUrl | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  async ngOnInit() {
    try {
      // Si es módulo externo, usar SSO
      if (this.moduleType === 'external') {
        await this.loadModuleWithSSO();
      } else {
        // Módulo interno - cargar directamente
        this.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
        this.loading = false;
      }
    } catch (err) {
      console.error('Error loading module:', err);
      this.error = 'Error al cargar módulo';
      this.loading = false;
    }
  }

  async loadModuleWithSSO() {
    try {
      this.loading = true;
      
      // Generar token SSO
      const response = await this.http.post<any>('http://localhost:4000/api/auth/sso-token', {
        moduleId: this.moduleId
      }).toPromise();
      
      if (!response || !response.ssoToken) {
        throw new Error('No se pudo generar token SSO');
      }
      
      const ssoToken = response.ssoToken;
      
      // Agregar token a la URL
      const urlWithToken = `${this.url}${this.url.includes('?') ? '&' : '?'}sso_token=${ssoToken}`;
      
      // Si es iframe, usar postMessage (más seguro)
      if (this.embedType === 'iframe') {
        this.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
        
        // Esperar a que el iframe cargue
        setTimeout(() => {
          const iframe = document.querySelector('iframe') as HTMLIFrameElement;
          if (iframe) {
            iframe.addEventListener('load', () => {
              // Enviar token vía postMessage
              iframe.contentWindow?.postMessage({
                type: 'SSO_TOKEN',
                token: ssoToken,
                user: response.user
              }, this.url);
              
              console.log('✅ Token SSO enviado al módulo vía postMessage');
            });
          }
        }, 500);
      } 
      // Si es link externo, abrir en nueva pestaña con token en URL
      else if (this.embedType === 'link') {
        window.open(urlWithToken, '_blank');
      }
      
      this.loading = false;
    } catch (err: any) {
      console.error('❌ Error en SSO:', err);
      
      if (err.status === 403) {
        this.error = 'No tienes permisos para acceder a este módulo';
      } else if (err.status === 404) {
        this.error = 'Módulo no encontrado';
      } else {
        this.error = 'Error al generar token SSO: ' + (err.error?.error || err.message);
      }
      
      this.loading = false;
    }
  }
}

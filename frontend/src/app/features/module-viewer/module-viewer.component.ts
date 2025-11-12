import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-module-viewer',
  templateUrl: './module-viewer.component.html',
  styleUrls: ['./module-viewer.component.scss']
})
export class ModuleViewerComponent implements OnInit {
  module: any = null;
  safeUrl: SafeResourceUrl | null = null;
  loading = true;
  error = '';
  readonly apiUrl = environment.apiUrl.replace(/\/$/, '');
  readonly apiBaseUrl = this.apiUrl.replace(/\/api$/, '');
  resolvedUrl: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  async ngOnInit() {
    const moduleId = this.route.snapshot.params['id'];

    try {
      this.module = await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/modules/${moduleId}`)
      );

      if (!this.module) {
        this.handleErrorState('Módulo no encontrado');
        return;
      }

      const embedUrl = this.getEmbedUrl(moduleId, this.module);

      if (!embedUrl) {
        this.handleErrorState('El módulo no tiene una URL embebible configurada');
        return;
      }

      this.resolvedUrl = embedUrl;

      if (this.module.embedType !== 'link') {
        this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
      }

      this.loading = false;
      console.log('✅ Módulo cargado:', this.module.name, '- embed URL:', embedUrl, '- embedType:', this.module.embedType);
    } catch (err: any) {
      console.error('❌ Error cargando módulo:', err);
      this.handleErrorState(err.error?.error || 'Error al cargar el módulo');
    }
  }

  openInNewTab() {
    if (this.resolvedUrl) {
      window.open(this.resolvedUrl, '_blank');
    }
  }

  private resolveUrl(url?: string): string | null {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    const separator = url.startsWith('/') ? '' : '/';
    return `${this.apiBaseUrl}${separator}${url}`;
  }

  private getEmbedUrl(moduleId: string, module: any): string | null {
    console.log('[getEmbedUrl] moduleId:', moduleId);
    console.log('[getEmbedUrl] module.useProxy:', module.useProxy);
    console.log('[getEmbedUrl] module.embedType:', module.embedType);
    console.log('[getEmbedUrl] module.baseUrl:', module.baseUrl);
    
    if (module.useProxy) {
      const proxyUrl = `${this.apiBaseUrl}/proxy/${moduleId}`;
      console.log('[getEmbedUrl] Usando PROXY:', proxyUrl);
      return proxyUrl;
    }

    if (module.embedType === 'proxy') {
      return (
        this.resolveUrl(module.baseUrl) ||
        (module.devPort ? `http://localhost:${module.devPort}` : null)
      );
    }

    if (module.embedType === 'iframe' || module.embedType === 'link') {
      const directUrl = this.resolveUrl(module.baseUrl);
      console.log('[getEmbedUrl] Usando URL DIRECTA:', directUrl);
      return directUrl;
    }

    return null;
  }

  private handleErrorState(message: string) {
    this.error = message;
    this.loading = false;
  }
}

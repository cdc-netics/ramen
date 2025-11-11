import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  async ngOnInit() {
    const moduleId = this.route.snapshot.params['id'];
    
    try {
      // Cargar información del módulo
      this.module = await this.http.get<any>(`http://localhost:4000/api/modules/${moduleId}`).toPromise();
      
      if (!this.module) {
        this.error = 'Módulo no encontrado';
        this.loading = false;
        return;
      }

      // Procesar según el tipo de embed
      if (this.module.embedType === 'iframe' || this.module.embedType === 'link') {
        // Para iframes y links, sanitizar la URL
        console.log('🔗 URL original:', this.module.baseUrl);
        this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.module.baseUrl);
        console.log('✅ URL sanitizada:', this.safeUrl);
      } else if (this.module.embedType === 'proxy') {
        // Para proxy, construir URL local
        const proxyUrl = `http://localhost:${this.module.devPort || 3000}`;
        console.log('🔗 URL proxy:', proxyUrl);
        this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(proxyUrl);
      }

      this.loading = false;
      console.log('✅ Módulo cargado:', this.module.name, '- baseUrl:', this.module.baseUrl, '- embedType:', this.module.embedType);
    } catch (err: any) {
      console.error('❌ Error cargando módulo:', err);
      this.error = err.error?.error || 'Error al cargar el módulo';
      this.loading = false;
    }
  }

  openInNewTab() {
    if (this.module && this.module.baseUrl) {
      window.open(this.module.baseUrl, '_blank');
    }
  }
}

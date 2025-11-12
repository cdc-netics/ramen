import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

declare var anime: any;

@Component({
  selector: 'app-module-admin',
  templateUrl: './module-admin.component.html',
  styleUrls: ['./module-admin.component.scss']
})
export class ModuleAdminComponent implements OnInit {
  modules: any[] = [];
  showForm = false;
  editingModule: any = null;
  uploadedFiles: any[] = [];
  moduleStatuses: Map<string, any> = new Map(); // Estado de cada módulo
  loadingActions: Map<string, string> = new Map(); // Acciones en progreso

  newModule = {
    name: '',
    icon: '',
    baseUrl: 'http://localhost:3001',
    embedType: 'iframe',
    useProxy: false,
    proxyTarget: '',
    moduleType: 'internal', // Por defecto INTERNO para desarrollo
    // Campos para módulos internos
    framework: 'react',
    devPort: 3001,
    repositoryUrl: '',
    version: '1.0.0',
    database: 'mongodb',
    dbCollection: '',
    dependencies: '',
    envVars: '',
    // Campos comunes
    allowedRoles: [] as string[],
    description: '',
    status: 'development'
  };

  allRoles = ['Owner', 'Admin', 'User', 'Visor'];
  embedTypes = ['iframe', 'proxy', 'link'];
  moduleTypes = [
    { value: 'internal', label: 'Interno (Desarrollo Propio) ⭐' },
    { value: 'external', label: 'Externo (Third-party)' }
  ];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadModules();
    // Actualizar estados cada 5 segundos
    setInterval(() => {
      this.updateModuleStatuses();
    }, 5000);
  }

  async loadModules() {
    try {
      this.modules = await this.http.get<any[]>('http://localhost:4000/api/modules').toPromise() || [];
      await this.updateModuleStatuses();
    } catch (err) {
      console.error('Error loading modules:', err);
    }
  }

  async updateModuleStatuses() {
    for (const module of this.modules) {
      try {
        const status = await this.http.get<any>(`http://localhost:4000/api/modules/${module._id}/status`).toPromise();
        this.moduleStatuses.set(module._id, status);
      } catch (err) {
        // Módulo no tiene estado
        this.moduleStatuses.set(module._id, { status: 'not_running' });
      }
    }
  }

  openForm(module?: any) {
    if (module) {
      this.editingModule = module;
      this.newModule = { 
        name: module.name || '',
        icon: module.icon || '',
        baseUrl: module.baseUrl || '',
        embedType: module.embedType || 'iframe',
        useProxy: !!module.useProxy,
        proxyTarget: module.proxyTarget || '',
        moduleType: module.moduleType || 'external',
        framework: module.framework || 'react',
        devPort: module.devPort || 3001,
        repositoryUrl: module.repositoryUrl || '',
        version: module.version || '1.0.0',
        database: module.database || 'mongodb',
        dbCollection: module.dbCollection || '',
        dependencies: module.dependencies || '',
        envVars: module.envVars || '',
        allowedRoles: module.allowedRoles || [],
        description: module.description || '',
        status: module.status || 'development'
      };
    } else {
      this.editingModule = null;
      this.newModule = {
        name: '',
        icon: '',
        baseUrl: 'http://localhost:3001',
        embedType: 'iframe',
        useProxy: false,
        proxyTarget: '',
        moduleType: 'internal', // Por defecto INTERNO
        framework: 'react',
        devPort: 3001,
        repositoryUrl: '',
        version: '1.0.0',
        database: 'mongodb',
        dbCollection: '',
        dependencies: '',
        envVars: '',
        allowedRoles: [],
        description: '',
        status: 'development'
      };
    }
    this.showForm = true;
    
    setTimeout(() => {
      anime({
        targets: '.module-form',
        translateX: [-300, 0],
        opacity: [0, 1],
        duration: 400,
        easing: 'easeOutExpo'
      });
    }, 10);
  }

  closeForm() {
    anime({
      targets: '.module-form',
      translateX: [0, -300],
      opacity: [1, 0],
      duration: 300,
      easing: 'easeInQuad',
      complete: () => {
        this.showForm = false;
        this.editingModule = null;
        this.selectedIconFile = null;
      }
    });
  }

  toggleRole(role: string) {
    const index = this.newModule.allowedRoles.indexOf(role);
    if (index > -1) {
      this.newModule.allowedRoles.splice(index, 1);
    } else {
      this.newModule.allowedRoles.push(role);
    }
  }

  async saveModule() {
    try {
      let savedModule: any;
      
      // Guardar el ícono temporalmente y quitarlo del objeto para no enviar base64
      const tempIcon = this.newModule.icon;
      if (this.selectedIconFile) {
        delete this.newModule.icon; // No enviar base64 en el PUT
      }
      
      if (this.editingModule) {
        // Update existing
        savedModule = await this.http.put(`http://localhost:4000/api/modules/${this.editingModule._id}`, this.newModule).toPromise();
        savedModule = { ...this.editingModule, ...savedModule };
      } else {
        // Create new
        savedModule = await this.http.post('http://localhost:4000/api/modules', this.newModule).toPromise();
      }
      
      // Si hay un ícono seleccionado, subirlo por separado
      if (this.selectedIconFile) {
        await this.uploadIcon(savedModule._id);
      } else {
        this.newModule.icon = tempIcon; // Restaurar si no había archivo nuevo
      }
      
      await this.loadModules();
      this.closeForm();
    } catch (err: any) {
      console.error('Error saving module:', err);
      const errorMsg = err.error?.error || err.message || 'Error desconocido';
      alert(`Error al guardar módulo: ${errorMsg}`);
    }
  }

  async saveAndOpenEditor() {
    try {
      let savedModule;
      if (this.editingModule) {
        // Update existing
        savedModule = await this.http.put(`http://localhost:4000/api/modules/${this.editingModule._id}`, this.newModule).toPromise();
        savedModule = this.editingModule; // Use existing ID
      } else {
        // Create new
        savedModule = await this.http.post('http://localhost:4000/api/modules', this.newModule).toPromise();
      }
      
      // Si hay archivos subidos, guardarlos
      if (this.uploadedFiles && this.uploadedFiles.length > 0) {
        await this.http.post(`http://localhost:4000/api/modules/${(savedModule as any)._id}/files`, {
          files: this.uploadedFiles
        }).toPromise();
        console.log(`${this.uploadedFiles.length} archivos guardados en el servidor`);
      }
      
      await this.loadModules();
      this.showForm = false;
      this.uploadedFiles = [];
      
      // Navegar al editor de código
      this.router.navigate(['/admin/modules', (savedModule as any)._id, 'code']);
    } catch (err) {
      console.error('Error saving module:', err);
      alert('Error al guardar módulo');
    }
  }

  async deleteModule(module: any) {
    if (!confirm(`¿Eliminar módulo "${module.name}"?`)) return;
    
    try {
      await this.http.delete(`http://localhost:4000/api/modules/${module._id}`).toPromise();
      await this.loadModules();
    } catch (err) {
      console.error('Error deleting module:', err);
      alert('Error al eliminar módulo');
    }
  }

  openCodeEditor(module: any) {
    this.router.navigate(['/admin/modules', module._id, 'code']);
  }

  openModuleConfig(module: any) {
    const targetId = module?.configModuleId || module?.moduleId || module?._id;
    if (!targetId) {
      alert('Este módulo no tiene identificador para configuración');
      return;
    }
    this.router.navigate(['/admin/module-config', targetId]);
  }

  selectedIconFile: File | null = null;

  onIconSelect(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no debe superar 2MB');
      return;
    }

    // Guardar el archivo para subirlo después
    this.selectedIconFile = file;

    // Mostrar preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.newModule.icon = e.target.result; // Solo para preview
    };
    reader.readAsDataURL(file);
  }

  async uploadIcon(moduleId: string) {
    if (!this.selectedIconFile) return;

    const formData = new FormData();
    formData.append('icon', this.selectedIconFile);

    try {
      const result: any = await this.http.post(
        `http://localhost:4000/api/modules/${moduleId}/icon`,
        formData
      ).toPromise();
      
      console.log('Ícono subido exitosamente:', result.iconUrl);
      
      // Actualizar el módulo en la lista con la nueva URL del ícono
      const moduleIndex = this.modules.findIndex(m => m._id === moduleId);
      if (moduleIndex !== -1) {
        this.modules[moduleIndex].icon = result.iconUrl;
      }
    } catch (err) {
      console.error('Error subiendo ícono:', err);
      alert('Error al subir el ícono');
    }
  }

  removeIcon() {
    this.newModule.icon = '';
    this.selectedIconFile = null;
  }

  onModuleTypeChange() {
    // Actualizar baseUrl según tipo
    if (this.newModule.moduleType === 'internal') {
      this.newModule.baseUrl = `http://localhost:${this.newModule.devPort}`;
      this.newModule.embedType = 'iframe';
      this.newModule.useProxy = false;
      this.newModule.proxyTarget = '';
    } else {
      this.newModule.baseUrl = '';
    }
  }

  async onProjectUpload(event: any) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    this.uploadedFiles = [];
    
    // Procesar cada archivo
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Filtrar archivos no deseados (node_modules, .git, dist, etc.)
      const relativePath = file.webkitRelativePath || file.name;
      if (this.shouldSkipFile(relativePath)) {
        continue;
      }

      // Leer contenido del archivo
      const content = await this.readFileAsText(file);
      const language = this.getLanguageFromExtension(file.name);

      this.uploadedFiles.push({
        path: relativePath,
        name: file.name,
        type: 'file',
        content: content,
        language: language
      });
    }

    console.log(`${this.uploadedFiles.length} archivos procesados`);
  }

  shouldSkipFile(path: string): boolean {
    const skipPatterns = [
      'node_modules/',
      '.git/',
      'dist/',
      'build/',
      '.angular/',
      '.vscode/',
      '.DS_Store',
      'package-lock.json',
      'yarn.lock'
    ];
    
    return skipPatterns.some(pattern => path.includes(pattern));
  }

  readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  getLanguageFromExtension(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: any = {
      'ts': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'cs': 'csharp'
    };
    return langMap[ext || ''] || 'plaintext';
  }

  getFileIcon(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const iconMap: any = {
      'ts': 'code',
      'js': 'code',
      'html': 'web',
      'css': 'style',
      'scss': 'style',
      'json': 'settings',
      'md': 'description',
      'py': 'code',
      'png': 'image',
      'jpg': 'image',
      'svg': 'image'
    };
    return iconMap[ext || ''] || 'insert_drive_file';
  }

  clearUploadedFiles(event: Event) {
    event.stopPropagation();
    this.uploadedFiles = [];
  }

  // ==========================================
  // NUEVAS FUNCIONES: Gestión de Módulos Aislados
  // ==========================================

  /**
   * Obtiene el estado de un módulo
   */
  getModuleStatus(moduleId: string): any {
    return this.moduleStatuses.get(moduleId) || { status: 'unknown' };
  }

  /**
   * Verifica si una acción está en progreso
   */
  isActionLoading(moduleId: string, action: string): boolean {
    return this.loadingActions.get(moduleId) === action;
  }

  /**
   * Obtiene el color del estado
   */
  getStatusColor(status: string): string {
    const colors: any = {
      'running': 'green',
      'external': 'blue', // Módulos externos (proxy activo)
      'starting': 'orange',
      'stopping': 'orange',
      'stopped': 'gray',
      'error': 'red',
      'not_running': 'gray',
      'unknown': 'gray'
    };
    return colors[status] || 'gray';
  }

  /**
   * Formatea el uptime
   */
  formatUptime(ms: number): string {
    if (!ms) return '-';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  }

  /**
   * Validar package.json del módulo
   */
  async validateModule(module: any) {
    this.loadingActions.set(module._id, 'validate');
    
    try {
      const result = await this.http.get<any>(`http://localhost:4000/api/modules/${module._id}/validate`).toPromise();
      
      if (result.valid) {
        alert(`✅ package.json válido\n\nNombre: ${result.packageJson.name}\nVersión: ${result.packageJson.version}\nDependencias: ${Object.keys(result.packageJson.dependencies || {}).length}`);
      } else {
        alert(`❌ package.json inválido\n\nErrores:\n${result.errors.join('\n')}\n\nAdvertencias:\n${result.warnings.join('\n')}`);
      }
    } catch (err: any) {
      alert(`❌ Error al validar: ${err.error?.error || err.message}`);
    } finally {
      this.loadingActions.delete(module._id);
    }
  }

  /**
   * Instalar dependencias del módulo
   */
  async installDependencies(module: any, force: boolean = false) {
    if (!confirm(`¿Instalar dependencias de "${module.name}"?\n\nEsto ejecutará npm install en la carpeta del módulo.`)) {
      return;
    }

    this.loadingActions.set(module._id, 'install');
    
    try {
      const result = await this.http.post<any>(`http://localhost:4000/api/modules/${module._id}/install`, {
        force
      }).toPromise();
      
      if (result.success) {
        const msg = result.status === 'already_installed' 
          ? `✅ Dependencias ya instaladas en:\n${result.moduleDir}\n\nDependencias: ${Object.keys(result.dependencies).length}`
          : `✅ Dependencias instaladas exitosamente\n\nCarpeta: ${result.moduleDir}\nDependencias: ${Object.keys(result.dependencies).length}\n\n${result.output?.substring(0, 200)}`;
        
        alert(msg);
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (err: any) {
      alert(`❌ Error al instalar dependencias:\n${err.error?.error || err.message}`);
    } finally {
      this.loadingActions.delete(module._id);
    }
  }

  /**
   * Iniciar módulo
   */
  async startModule(module: any) {
    this.loadingActions.set(module._id, 'start');
    
    try {
      const result = await this.http.post<any>(`http://localhost:4000/api/modules/${module._id}/start`, {
        port: module.devPort || 3001,
        dbCollection: module.dbCollection || module._id,
        entryPoint: module.entryPoint || 'server.js',
        envVars: this.parseEnvVars(module.envVars)
      }).toPromise();
      
      if (result.success) {
        await this.updateModuleStatuses();
        
        // Esperar 2 segundos y mostrar logs
        setTimeout(async () => {
          await this.showModuleLogs(module);
        }, 2000);
        
        alert(`✅ Módulo iniciado\n\nTipo: ${result.type}\nPuerto: ${result.port || 'N/A'}\nPID: ${result.pid || 'N/A'}\nEstado: ${result.status}\n\n💡 Se abrirán los logs en 2 segundos...`);
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (err: any) {
      const errorMsg = err.error?.error || err.message || 'Error desconocido';
      alert(`❌ Error al iniciar módulo:\n\n${errorMsg}\n\n💡 Revisa los logs del backend en la consola del servidor`);
    } finally {
      this.loadingActions.delete(module._id);
    }
  }

  /**
   * Detener módulo
   */
  async stopModule(module: any) {
    if (!confirm(`¿Detener módulo "${module.name}"?`)) {
      return;
    }

    this.loadingActions.set(module._id, 'stop');
    
    try {
      const result = await this.http.post<any>(`http://localhost:4000/api/modules/${module._id}/stop`, {}).toPromise();
      
      if (result.success) {
        alert(`✅ Módulo detenido: ${module.name}`);
        await this.updateModuleStatuses();
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (err: any) {
      alert(`❌ Error al detener módulo:\n${err.error?.error || err.message}`);
    } finally {
      this.loadingActions.delete(module._id);
    }
  }

  /**
   * Reiniciar módulo
   */
  async restartModule(module: any) {
    this.loadingActions.set(module._id, 'restart');
    
    try {
      const result = await this.http.post<any>(`http://localhost:4000/api/modules/${module._id}/restart`, {
        port: module.devPort || 3001,
        dbCollection: module.dbCollection || module._id,
        entryPoint: module.entryPoint || 'server.js',
        envVars: this.parseEnvVars(module.envVars)
      }).toPromise();
      
      if (result.success) {
        alert(`✅ Módulo reiniciado\n\nPuerto: ${result.port}\nPID: ${result.pid}`);
        await this.updateModuleStatuses();
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (err: any) {
      alert(`❌ Error al reiniciar módulo:\n${err.error?.error || err.message}`);
    } finally {
      this.loadingActions.delete(module._id);
    }
  }

  /**
   * Ver información completa del módulo
   */
  async showModuleInfo(module: any) {
    this.loadingActions.set(module._id, 'info');
    
    try {
      const info = await this.http.get<any>(`http://localhost:4000/api/modules/${module._id}/info`).toPromise();
      
      if (info.exists) {
        const msg = `📦 Información del Módulo\n\n` +
          `Carpeta: ${info.moduleDir}\n` +
          `package.json: ${info.hasPackageJson ? '✅' : '❌'}\n` +
          `node_modules: ${info.hasNodeModules ? '✅' : '❌'}\n` +
          `Archivos: ${info.fileCount}\n\n` +
          (info.packageJson ? `Nombre: ${info.packageJson.name}\nVersión: ${info.packageJson.version}\nDependencias: ${Object.keys(info.packageJson.dependencies || {}).length}` : '');
        
        alert(msg);
      } else {
        alert(`⚠️ El módulo aún no ha sido subido al servidor`);
      }
    } catch (err: any) {
      alert(`❌ Error al obtener información:\n${err.error?.error || err.message}`);
    } finally {
      this.loadingActions.delete(module._id);
    }
  }

  /**
   * Ver logs del módulo
   */
  async showModuleLogs(module: any) {
    this.loadingActions.set(module._id, 'logs');
    
    try {
      const logsResponse = await this.http.get<any>(`http://localhost:4000/api/modules/${module._id}/logs?limit=100`).toPromise();
      
      let msg = `📋 Logs del Módulo: ${module.name}\n\n`;
      
      // Si es un módulo externo con proxy
      if (logsResponse.moduleType === 'external' && logsResponse.logs?.proxy) {
        msg += `Tipo: Módulo Externo (iframe con proxy)\n`;
        msg += `Estado: ${logsResponse.status}\n`;
        msg += `Total de peticiones: ${logsResponse.logs.total}\n\n`;
        
        msg += `=== LOGS DEL PROXY (últimas ${logsResponse.logs.proxy.length} peticiones) ===\n`;
        logsResponse.logs.proxy.forEach((log: any) => {
          const time = new Date(log.timestamp).toLocaleTimeString();
          const icon = log.type === 'error' ? '❌' : log.type === 'response' ? '✅' : '📤';
          msg += `${icon} [${time}] ${log.message}\n`;
        });
      } 
      // Módulo interno
      else if (logsResponse.status === 'not_running') {
        alert(`⚠️ El módulo no está corriendo`);
        return;
      } else {
        const stdoutLogs = logsResponse.logs?.stdout || [];
        const stderrLogs = logsResponse.logs?.stderr || [];
        
        msg += `Estado: ${logsResponse.status}\n`;
        msg += `Puerto: ${logsResponse.port}\n`;
        msg += `Uptime: ${this.formatUptime(logsResponse.uptime)}\n\n`;
        
        if (stdoutLogs.length > 0) {
          msg += `=== STDOUT (últimos ${stdoutLogs.length}) ===\n`;
          stdoutLogs.forEach((log: any) => {
            const time = new Date(log.timestamp).toLocaleTimeString();
            msg += `[${time}] ${log.message}\n`;
          });
        }
        
        if (stderrLogs.length > 0) {
          msg += `\n=== STDERR (últimos ${stderrLogs.length}) ===\n`;
          stderrLogs.forEach((log: any) => {
            const time = new Date(log.timestamp).toLocaleTimeString();
            msg += `[${time}] ${log.message}\n`;
          });
        }
      }
      
      alert(msg);
    } catch (err: any) {
      alert(`❌ Error al obtener logs:\n${err.error?.error || err.message}`);
    } finally {
      this.loadingActions.delete(module._id);
    }
  }

  /**
   * Parsear variables de entorno del string
   */
  private parseEnvVars(envVarsString: string): any {
    if (!envVarsString) return {};
    
    const envVars: any = {};
    const lines = envVarsString.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
    
    return envVars;
  }
}

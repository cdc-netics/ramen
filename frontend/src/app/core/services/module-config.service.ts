import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Interfaces para configuración de módulos
export interface FieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  email?: boolean;
  url?: boolean;
}

export interface FieldOption {
  value: string;
  label: string;
  description?: string;
}

export interface Field {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'datetime' | 'boolean' | 'contact' | 'duration';
  editable: boolean;
  required?: boolean;
  adminOnly?: boolean;
  defaultValue?: any;
  placeholder?: string;
  hint?: string;
  options?: FieldOption[];
  validation?: FieldValidation;
}

export interface TemplateSection {
  id: string;
  title: string;
  description?: string;
  fields: string[];
  order: number;
}

export interface TemplateWorkflow {
  enabled: boolean;
  initialStatus: string;
  statuses: Array<{
    id: string;
    label: string;
    color: string;
    allowedTransitions: string[];
  }>;
}

export interface Template {
  _id: string;
  name: string;
  description: string;
  category: string;
  fields: Field[];
  sections?: TemplateSection[];
  workflow?: TemplateWorkflow;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ListItem {
  value: string;
  label: string;
  description?: string;
  color?: string;
  icon?: string;
  slaResponse?: string;
  slaResolution?: string;
  [key: string]: any;
}

export interface Policy {
  id: string;
  title: string;
  description: string;
  url: string;
  version: string;
  lastUpdated: Date;
}

export interface SLAs {
  responseTime?: { [key: string]: string };
  resolutionTime?: { [key: string]: string };
}

export interface ModuleConfig {
  _id: string;
  moduleId: string;
  moduleName: string;
  config: {
    templates: Template[];
    lists: { [listName: string]: ListItem[] };
    defaultValues?: { [key: string]: any };
    policies?: Policy[];
    slas?: SLAs;
  };
  permissions: {
    canEdit: string[];
    canView: string[];
    canDelete: string[];
  };
  version: number;
  lastModifiedBy: string;
  lastModifiedAt: Date;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ModuleConfigService {
  private readonly baseApiUrl = environment.apiUrl.replace(/\/$/, '');
  private readonly apiUrl = `${this.baseApiUrl}/module-config`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return of(result as T);
    };
  }

  // ==========================================
  // CONFIGURACIÓN GENERAL
  // ==========================================

  /**
   * Obtiene la configuración completa de un módulo
   */
  getModuleConfig(moduleId: string): Observable<ModuleConfig> {
    return this.http.get<ModuleConfig>(
      `${this.apiUrl}/${moduleId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(config => console.log(`✅ Configuración de ${moduleId} obtenida`, config)),
      catchError(this.handleError<ModuleConfig>('getModuleConfig'))
    );
  }

  /**
   * Actualiza la configuración completa de un módulo (solo Admin)
   */
  updateModuleConfig(moduleId: string, config: any): Observable<ModuleConfig> {
    return this.http.put<ModuleConfig>(
      `${this.apiUrl}/${moduleId}`,
      { config },
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => console.log(`✅ Configuración de ${moduleId} actualizada`)),
      catchError(this.handleError<ModuleConfig>('updateModuleConfig'))
    );
  }

  // ==========================================
  // PLANTILLAS
  // ==========================================

  /**
   * Lista todas las plantillas de un módulo
   */
  getTemplates(moduleId: string): Observable<{ templates: Template[] }> {
    return this.http.get<{ templates: Template[] }>(
      `${this.apiUrl}/${moduleId}/templates`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(data => console.log(`✅ ${data.templates.length} plantillas obtenidas de ${moduleId}`)),
      catchError(this.handleError<{ templates: Template[] }>('getTemplates', { templates: [] }))
    );
  }

  /**
   * Obtiene una plantilla específica
   * - Admins ven todos los campos
   * - Analistas ven campos adminOnly como solo lectura
   */
  getTemplate(moduleId: string, templateId: string): Observable<Template> {
    return this.http.get<Template>(
      `${this.apiUrl}/${moduleId}/templates/${templateId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(template => console.log(`✅ Plantilla ${template.name} obtenida`)),
      catchError(this.handleError<Template>('getTemplate'))
    );
  }

  /**
   * Crea una nueva plantilla (solo Admin)
   */
  createTemplate(moduleId: string, template: Partial<Template>): Observable<Template> {
    return this.http.post<Template>(
      `${this.apiUrl}/${moduleId}/templates`,
      template,
      { headers: this.getHeaders() }
    ).pipe(
      tap(newTemplate => console.log(`✅ Plantilla ${newTemplate.name} creada`)),
      catchError(this.handleError<Template>('createTemplate'))
    );
  }

  /**
   * Actualiza una plantilla existente (solo Admin)
   */
  updateTemplate(moduleId: string, templateId: string, template: Partial<Template>): Observable<Template> {
    return this.http.put<Template>(
      `${this.apiUrl}/${moduleId}/templates/${templateId}`,
      template,
      { headers: this.getHeaders() }
    ).pipe(
      tap(updated => console.log(`✅ Plantilla ${updated.name} actualizada`)),
      catchError(this.handleError<Template>('updateTemplate'))
    );
  }

  /**
   * Elimina una plantilla (solo Owner)
   */
  deleteTemplate(moduleId: string, templateId: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/${moduleId}/templates/${templateId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => console.log(`✅ Plantilla ${templateId} eliminada`)),
      catchError(this.handleError('deleteTemplate'))
    );
  }

  // ==========================================
  // LISTAS CONFIGURABLES
  // ==========================================

  /**
   * Obtiene una lista configurable (ej: severidades, tipos de incidente)
   */
  getList(moduleId: string, listName: string): Observable<{ items: ListItem[] }> {
    return this.http.get<{ items: ListItem[] }>(
      `${this.apiUrl}/${moduleId}/lists/${listName}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(data => console.log(`✅ Lista ${listName} obtenida: ${data.items.length} items`)),
      catchError(this.handleError<{ items: ListItem[] }>('getList', { items: [] }))
    );
  }

  /**
   * Actualiza una lista configurable (solo Admin)
   */
  updateList(moduleId: string, listName: string, items: ListItem[]): Observable<{ items: ListItem[] }> {
    return this.http.put<{ items: ListItem[] }>(
      `${this.apiUrl}/${moduleId}/lists/${listName}`,
      { items },
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => console.log(`✅ Lista ${listName} actualizada`)),
      catchError(this.handleError<{ items: ListItem[] }>('updateList', { items: [] }))
    );
  }

  // ==========================================
  // POLÍTICAS Y PROCEDIMIENTOS
  // ==========================================

  /**
   * Obtiene todas las políticas de un módulo
   */
  getPolicies(moduleId: string): Observable<{ policies: Policy[] }> {
    return this.http.get<{ policies: Policy[] }>(
      `${this.apiUrl}/${moduleId}/policies`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(data => console.log(`✅ ${data.policies.length} políticas obtenidas`)),
      catchError(this.handleError<{ policies: Policy[] }>('getPolicies', { policies: [] }))
    );
  }

  /**
   * Agrega una nueva política (solo Admin)
   */
  addPolicy(moduleId: string, policy: Omit<Policy, 'id' | 'lastUpdated'>): Observable<Policy> {
    return this.http.post<Policy>(
      `${this.apiUrl}/${moduleId}/policies`,
      policy,
      { headers: this.getHeaders() }
    ).pipe(
      tap(newPolicy => console.log(`✅ Política ${newPolicy.title} agregada`)),
      catchError(this.handleError<Policy>('addPolicy'))
    );
  }

  // ==========================================
  // SLAs
  // ==========================================

  /**
   * Obtiene los SLAs de un módulo
   */
  getSLAs(moduleId: string): Observable<{ slas: SLAs }> {
    return this.http.get<{ slas: SLAs }>(
      `${this.apiUrl}/${moduleId}/slas`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => console.log(`✅ SLAs obtenidos de ${moduleId}`)),
      catchError(this.handleError<{ slas: SLAs }>('getSLAs', { slas: {} }))
    );
  }

  /**
   * Actualiza los SLAs de un módulo (solo Admin)
   */
  updateSLAs(moduleId: string, slas: SLAs): Observable<{ slas: SLAs }> {
    return this.http.put<{ slas: SLAs }>(
      `${this.apiUrl}/${moduleId}/slas`,
      { slas },
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => console.log(`✅ SLAs de ${moduleId} actualizados`)),
      catchError(this.handleError<{ slas: SLAs }>('updateSLAs', { slas: {} }))
    );
  }

  // ==========================================
  // HELPERS
  // ==========================================

  /**
   * Valida si el usuario tiene permisos de Admin
   */
  isAdmin(): boolean {
    const token = localStorage.getItem('ramen_token');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.roles?.includes('Admin') || payload.roles?.includes('Owner');
    } catch (e) {
      return false;
    }
  }

  /**
   * Filtra campos editables para un usuario según su rol
   */
  getEditableFields(fields: Field[]): Field[] {
    const isAdmin = this.isAdmin();
    
    if (isAdmin) {
      return fields; // Admin ve todos los campos
    }
    
    // Analistas solo ven campos no adminOnly
    return fields.filter(f => !f.adminOnly);
  }

  /**
   * Obtiene campos de solo lectura (adminOnly) con sus valores
   */
  getReadOnlyFields(fields: Field[]): Field[] {
    return fields.filter(f => f.adminOnly);
  }
}

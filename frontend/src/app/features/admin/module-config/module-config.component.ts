import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  ModuleConfigService, 
  ModuleConfig, 
  Template, 
  Field, 
  ListItem, 
  Policy, 
  SLAs 
} from '../../../core/services/module-config.service';

@Component({
  selector: 'app-module-config',
  templateUrl: './module-config.component.html',
  styleUrls: ['./module-config.component.scss']
})
export class ModuleConfigComponent implements OnInit {
  moduleId: string = '';
  config?: ModuleConfig;
  templates: Template[] = [];
  selectedTemplate?: Template;
  isLoading = false;
  isAdmin = false;
  
  // Pestañas de configuración
  activeTab: 'templates' | 'lists' | 'policies' | 'slas' = 'templates';
  
  // Modo de edición
  editMode: 'view' | 'create' | 'edit' = 'view';
  editingTemplate?: Partial<Template>;
  
  // Listas configurables
  lists: { [key: string]: ListItem[] } = {};
  private readonly defaultLists = ['severities', 'incidentTypes', 'contacts'];
  availableLists: string[] = [...this.defaultLists];
  selectedList?: string;
  editingList: ListItem[] = [];
  
  // Políticas
  policies: Policy[] = [];
  editingPolicy?: Partial<Policy>;
  
  // SLAs
  slas: SLAs = {};
  editingSLAs = false;
  
  // Tipos de campo disponibles
  fieldTypes = [
    { value: 'text', label: 'Texto Simple' },
    { value: 'textarea', label: 'Texto Largo' },
    { value: 'select', label: 'Selección Simple' },
    { value: 'multiselect', label: 'Selección Múltiple' },
    { value: 'number', label: 'Número' },
    { value: 'datetime', label: 'Fecha y Hora' },
    { value: 'boolean', label: 'Sí/No' },
    { value: 'contact', label: 'Contacto' },
    { value: 'duration', label: 'Duración' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private configService: ModuleConfigService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.configService.isAdmin();
    
    if (!this.isAdmin) {
      alert('⚠️ Solo los administradores pueden acceder a esta página');
      this.router.navigate(['/']);
      return;
    }
    
    this.route.params.subscribe(params => {
      this.moduleId = params['moduleId'];
      if (this.moduleId) {
        this.loadModuleConfig();
      }
    });
  }

  // ==========================================
  // CARGAR DATOS
  // ==========================================

  loadModuleConfig(): void {
    this.isLoading = true;
    
    this.configService.getModuleConfig(this.moduleId).subscribe(config => {
      this.config = config;
      this.templates = config?.config?.templates || [];
      this.lists = config?.config?.lists || {};
      this.policies = config?.config?.policies || [];
      this.slas = config?.config?.slas || {};
      const dynamicLists = Object.keys(this.lists || {});
      this.availableLists = dynamicLists.length > 0 ? dynamicLists : [...this.defaultLists];
      this.isLoading = false;
    });
  }

  loadTemplates(): void {
    this.configService.getTemplates(this.moduleId).subscribe(data => {
      this.templates = data.templates;
    });
  }

  loadList(listName: string): void {
    this.selectedList = listName;
    this.configService.getList(this.moduleId, listName).subscribe(data => {
      this.editingList = JSON.parse(JSON.stringify(data.items)); // Deep copy
    });
  }

  loadPolicies(): void {
    this.configService.getPolicies(this.moduleId).subscribe(data => {
      this.policies = data.policies;
    });
  }

  loadSLAs(): void {
    this.configService.getSLAs(this.moduleId).subscribe(data => {
      this.slas = data.slas;
    });
  }

  // ==========================================
  // PLANTILLAS - CRUD
  // ==========================================

  selectTemplate(template: Template): void {
    this.selectedTemplate = template;
    this.editMode = 'view';
  }

  createNewTemplate(): void {
    this.editMode = 'create';
    this.editingTemplate = {
      name: '',
      description: '',
      category: 'general',
      fields: []
    };
    this.selectedTemplate = undefined;
  }

  editTemplate(template: Template): void {
    this.editMode = 'edit';
    this.editingTemplate = JSON.parse(JSON.stringify(template)); // Deep copy
    this.selectedTemplate = template;
  }

  saveTemplate(): void {
    if (!this.editingTemplate) return;
    
    if (this.editMode === 'create') {
      this.configService.createTemplate(this.moduleId, this.editingTemplate).subscribe(
        newTemplate => {
          this.templates.push(newTemplate);
          this.editMode = 'view';
          this.selectedTemplate = newTemplate;
          alert('✅ Plantilla creada exitosamente');
        },
        error => alert('❌ Error al crear plantilla: ' + error.message)
      );
    } else if (this.editMode === 'edit' && this.editingTemplate._id) {
      this.configService.updateTemplate(
        this.moduleId, 
        this.editingTemplate._id, 
        this.editingTemplate
      ).subscribe(
        updated => {
          const index = this.templates.findIndex(t => t._id === updated._id);
          if (index !== -1) {
            this.templates[index] = updated;
          }
          this.editMode = 'view';
          this.selectedTemplate = updated;
          alert('✅ Plantilla actualizada exitosamente');
        },
        error => alert('❌ Error al actualizar plantilla: ' + error.message)
      );
    }
  }

  cancelEdit(): void {
    this.editMode = 'view';
    this.editingTemplate = undefined;
  }

  deleteTemplate(template: Template): void {
    if (!confirm(`¿Eliminar la plantilla "${template.name}"?`)) return;
    
    this.configService.deleteTemplate(this.moduleId, template._id).subscribe(
      () => {
        this.templates = this.templates.filter(t => t._id !== template._id);
        this.selectedTemplate = undefined;
        alert('✅ Plantilla eliminada');
      },
      error => {
        if (error.status === 403) {
          alert('❌ Solo el Owner puede eliminar plantillas');
        } else {
          alert('❌ Error al eliminar: ' + error.message);
        }
      }
    );
  }

  // ==========================================
  // CAMPOS - CRUD
  // ==========================================

  addField(): void {
    if (!this.editingTemplate) return;
    
    if (!this.editingTemplate.fields) {
      this.editingTemplate.fields = [];
    }
    
    const newField: Field = {
      id: 'field_' + Date.now(),
      label: 'Nuevo Campo',
      type: 'text',
      editable: true,
      required: false,
      adminOnly: false
    };
    
    this.editingTemplate.fields.push(newField);
  }

  removeField(index: number): void {
    if (!this.editingTemplate?.fields) return;
    this.editingTemplate.fields.splice(index, 1);
  }

  moveFieldUp(index: number): void {
    if (!this.editingTemplate?.fields || index === 0) return;
    const temp = this.editingTemplate.fields[index];
    this.editingTemplate.fields[index] = this.editingTemplate.fields[index - 1];
    this.editingTemplate.fields[index - 1] = temp;
  }

  moveFieldDown(index: number): void {
    if (!this.editingTemplate?.fields || index === this.editingTemplate.fields.length - 1) return;
    const temp = this.editingTemplate.fields[index];
    this.editingTemplate.fields[index] = this.editingTemplate.fields[index + 1];
    this.editingTemplate.fields[index + 1] = temp;
  }

  toggleAdminOnly(field: Field): void {
    field.adminOnly = !field.adminOnly;
    if (field.adminOnly) {
      field.editable = false; // Los campos adminOnly no son editables por analistas
    }
  }

  // ==========================================
  // LISTAS - CRUD
  // ==========================================

  saveList(): void {
    if (!this.selectedList) return;
    
    this.configService.updateList(this.moduleId, this.selectedList, this.editingList).subscribe(
      data => {
        this.lists[this.selectedList!] = data.items;
        alert('✅ Lista actualizada exitosamente');
      },
      error => alert('❌ Error al actualizar lista: ' + error.message)
    );
  }

  addListItem(): void {
    this.editingList.push({
      value: '',
      label: ''
    });
  }

  removeListItem(index: number): void {
    this.editingList.splice(index, 1);
  }

  // ==========================================
  // POLÍTICAS - CRUD
  // ==========================================

  createNewPolicy(): void {
    this.editingPolicy = {
      title: '',
      description: '',
      url: '',
      version: '1.0'
    };
  }

  savePolicy(): void {
    if (!this.editingPolicy) return;
    
    this.configService.addPolicy(this.moduleId, this.editingPolicy as any).subscribe(
      newPolicy => {
        this.policies.push(newPolicy);
        this.editingPolicy = undefined;
        alert('✅ Política agregada exitosamente');
      },
      error => alert('❌ Error al agregar política: ' + error.message)
    );
  }

  cancelPolicyEdit(): void {
    this.editingPolicy = undefined;
  }

  // ==========================================
  // SLAs - CRUD
  // ==========================================

  editSLAs(): void {
    this.editingSLAs = true;
  }

  saveSLAs(): void {
    this.configService.updateSLAs(this.moduleId, this.slas).subscribe(
      data => {
        this.slas = data.slas;
        this.editingSLAs = false;
        alert('✅ SLAs actualizados exitosamente');
      },
      error => alert('❌ Error al actualizar SLAs: ' + error.message)
    );
  }

  cancelSLAsEdit(): void {
    this.editingSLAs = false;
    this.loadSLAs();
  }

  // ==========================================
  // HELPERS
  // ==========================================

  getFieldTypeLabel(type: string): string {
    return this.fieldTypes.find(ft => ft.value === type)?.label || type;
  }

  getAdminOnlyFields(template: Template): Field[] {
    return template.fields.filter(f => f.adminOnly);
  }

  getEditableFields(template: Template): Field[] {
    return template.fields.filter(f => !f.adminOnly);
  }

  goBack(): void {
    this.router.navigate(['/admin']);
  }

  objectKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }
}

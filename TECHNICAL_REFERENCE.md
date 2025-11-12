# 🔧 DOCUMENTACIÓN TÉCNICA - Proyecto Ramen Orquestador

**Propósito:** Referencia técnica completa para desarrolladores y asistentes de IA  
**Última actualización:** 11 de Noviembre, 2025  
**Versión:** 1.0.0

---

## 📑 Tabla de Contenidos

1. [Stack Tecnológico](#stack-tecnológico)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Base de Datos (In-Memory/MongoDB)](#base-de-datos)
4. [Autenticación y Autorización](#autenticación-y-autorización)
5. [Sistema de Almacenamiento](#sistema-de-almacenamiento)
6. [Sistema de Configuración de Módulos](#sistema-de-configuración-de-módulos)
7. [API REST Endpoints](#api-rest-endpoints)
8. [Frontend Angular](#frontend-angular)
9. [Flujos de Datos Críticos](#flujos-de-datos-críticos)
10. [Testing y QA](#testing-y-qa)

---

## Stack Tecnológico

### Backend
```jsonc
// Versiones exactas en backend/package.json
{
  "express": "^4.18.2",              // API REST
  "helmet": "^6.0.0",                // Security headers
  "cors": "^2.8.5",                  // CORS policy
  "jsonwebtoken": "^9.0.0",          // JWT auth
  "bcryptjs": "^2.4.3",              // Password hashing
  "http-proxy-middleware": "^2.0.9", // Reverse proxy / iframe fix
  "multer": "^1.4.5-lts.1",          // File uploads
  "mongoose": "^7.0.0"               // ODM (opcional, usado por server.js)
}
```

**Notas clave:**
- Node.js 18+ obligatorio (aprovecha la versión LTS para crypto/stream).
- `simple-server.js` funciona 100 % in-memory (sin Mongo) y expone storage + module manager.
- `server.js` conecta a MongoDB usando las mismas rutas (`/api/module-config`, `/api/modules`, etc.).
- PowerShell scripts (`test-*.ps1`) cubren API, module-config y validación ZIP.

### Frontend
```jsonc
// Versiones exactas en frontend/package.json
{
  "@angular/core": "^16.2.0",
  "@angular/material": "^16.2.0",
  "@angular/cdk": "^16.2.0",
  "rxjs": "~7.8.0",
  "animejs": "^3.2.1",
  "jwt-decode": "^4.0.0",
  "typescript": "~5.1.3"
}
```

**Notas clave:**
- Angular 16.2 con módulos tradicionales (`AppModule`) y guards basados en `RbacGuard`.
- Angular Material para botones, iconos y tooltips en el panel admin.
- `ModuleConfigService` consume los endpoints `/api/module-config/**` desde `environment.apiUrl`.
- Anime.js se usa para animaciones (dashboard y formularios deslizables).

---

## Arquitectura del Sistema

### Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Angular)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Login      │  │   Dashboard  │  │  Admin Panel │         │
│  │  Component   │  │  Component   │  │  Component   │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                  │
│  ┌──────▼──────────────────▼──────────────────▼───────┐        │
│  │              AuthService / Guards                   │        │
│  │  - authenticateJWT()                                 │        │
│  │  - RBAC: Owner, Admin, SOC Analyst                  │        │
│  └──────────────────────────────────────────────────────┘        │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTP + JWT Bearer Token
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                    BACKEND (Express + Node.js)                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   simple-server.js                         │  │
│  │  - Express app                                             │  │
│  │  - CORS middleware                                         │  │
│  │  - Body parser (JSON)                                      │  │
│  │  - JWT authentication middleware                           │  │
│  │  - Static file serving                                     │  │
│  └───────────┬───────────────────────────────────────────────┘  │
│              │                                                    │
│  ┌───────────▼───────────────────────────────────────────────┐  │
│  │                   ROUTING LAYER                            │  │
│  │  /api/auth           → Login, OAuth (routes/auth.js)       │  │
│  │  /api/modules        → CRUD módulos                        │  │
│  │  /api/users          → CRUD usuarios                       │  │
│  │  /api/findings       → Gestión de hallazgos                │  │
│  │  /api/storage        → Upload/Download archivos            │  │
│  │  /api/module-config  → Configuración módulos (NUEVO)       │  │
│  │  /proxy/:moduleId    → Proxy reverso dinámico para iframes │  │
│  └───────────┬───────────────────────────────────────────────┘  │
│              │                                                    │
│  ┌───────────▼───────────────────────────────────────────────┐  │
│  │                   SERVICE LAYER                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │
│  │  │ ModuleManager│  │StorageManager│  │    Logger    │    │  │
│  │  │              │  │              │  │              │    │  │
│  │  │ - loadModule │  │ - saveFile   │  │ - success()  │    │  │
│  │  │ - stopModule │  │ - getFile    │  │ - error()    │    │  │
│  │  │ - listActive │  │ - deleteFile │  │ - warning()  │    │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │  │
│  └────────────────────────────────────────────────────────────┘  │
│              │                                                    │
│  ┌───────────▼───────────────────────────────────────────────┐  │
│  │                   DATA LAYER                               │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │
│  │  │  In-Memory   │  │   MongoDB    │  │    Models    │    │  │
│  │  │  Database    │  │  (opcional)  │  │  - User      │    │  │
│  │  │              │  │              │  │  - Module    │    │  │
│  │  │  database = {│  │              │  │  - Finding   │    │  │
│  │  │    users:[],  │  │              │  │  - ModuleConf│    │  │
│  │  │    modules:[] │  │              │  │              │    │  │
│  │  │  }           │  │              │  │              │    │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                   STORAGE BACKENDS                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │    Local     │  │   AWS S3     │  │ Azure Blob   │         │
│  │  Filesystem  │  │              │  │   Storage    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└──────────────────────────────────────────────────────────────────┘
```

---

## Base de Datos

### Estructura In-Memory (Demo Mode)

```javascript
// backend/simple-server.js - líneas 52-79
const database = {
  users: [
    {
      _id: '1',
      username: 'owner',
      fullName: 'Owner',
      passwordHash: '$2a$10$...', // bcrypt hash de 'admin123'
      roles: ['Owner', 'Admin'],
      createdAt: Date
    }
  ],
  modules: [
    {
      _id: 'bitacora-soc',
      name: 'Bitácora SOC',
      baseUrl: 'http://10.0.100.13:8477',
      embedType: 'iframe',
      useProxy: true,
      proxyTarget: 'http://10.0.100.13:8477',
      allowedRoles: ['Owner', 'Admin'],
      description: 'Sistema de bitácora SOC externo',
      status: 'online',
      icon: 'security'
    }
  ],
  findings: [],
  leakedPasswords: [],
  moduleConfigs: [  // NUEVO - Sistema de configuración
    {
      _id: 'cfg-bitacora-soc',
      moduleId: 'bitacora-soc',
      moduleName: 'Bitácora SOC',
      config: {
        templates: [...],
        lists: {...},
        policies: [...],
        slas: {...}
      },
      version: 1,
      lastModifiedAt: Date
    }
  ],
  branding: {
    companyName: 'Ramen Security',
    logo: '/assets/logo.png',
    primaryColor: '#1976d2'
  },
  logs: []  // Sistema de auditoría
};
```

### Mongoose Models (Producción)

#### User Model
```javascript
// backend/models/user.model.js
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  passwordHash: { type: String, required: true },
  roles: [{ type: String, enum: ['Owner', 'Admin', 'SOC Analyst'] }],
  email: String,
  phone: String,
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

// Índices
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
```

#### Module Config Model (CRÍTICO)
```javascript
// backend/models/moduleConfig.model.js
const fieldSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['text', 'textarea', 'select', 'multiselect', 'number', 
           'datetime', 'boolean', 'contact', 'duration'],
    required: true 
  },
  editable: { type: Boolean, default: true },
  required: { type: Boolean, default: false },
  adminOnly: { type: Boolean, default: false },  // ⭐ CAMPO CLAVE
  defaultValue: mongoose.Schema.Types.Mixed,
  placeholder: String,
  hint: String,
  options: [mongoose.Schema.Types.Mixed],
  validation: {
    min: Number,
    max: Number,
    minLength: Number,
    maxLength: Number,
    pattern: String,
    email: Boolean,
    url: Boolean
  }
});

const templateSchema = new mongoose.Schema({
  _id: String,
  name: { type: String, required: true },
  description: String,
  category: String,
  fields: [fieldSchema],
  sections: [{
    id: String,
    title: String,
    description: String,
    fields: [String],
    order: Number
  }],
  workflow: {
    enabled: Boolean,
    initialStatus: String,
    statuses: [{
      id: String,
      label: String,
      color: String,
      allowedTransitions: [String]
    }]
  }
});

const moduleConfigSchema = new mongoose.Schema({
  moduleId: { type: String, required: true, unique: true },
  moduleName: { type: String, required: true },
  config: {
    templates: [templateSchema],
    lists: mongoose.Schema.Types.Mixed,
    defaultValues: mongoose.Schema.Types.Mixed,
    policies: [{
      id: String,
      title: String,
      description: String,
      url: String,
      version: String,
      lastUpdated: Date
    }],
    slas: {
      responseTime: mongoose.Schema.Types.Mixed,
      resolutionTime: mongoose.Schema.Types.Mixed
    }
  },
  permissions: {
    canEdit: [String],
    canView: [String],
    canDelete: [String]
  },
  version: { type: Number, default: 1 },
  lastModifiedBy: String,
  lastModifiedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Índices para performance
moduleConfigSchema.index({ moduleId: 1 });
moduleConfigSchema.index({ lastModifiedAt: -1 });
```

---

## Autenticación y Autorización

### JWT Implementation

```javascript
// backend/simple-server.js - líneas 140-167
const JWT_SECRET = process.env.JWT_SECRET || 'ramen-secret-key-2024';

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = database.users.find(u => u.username === username);
  
  if (!user) {
    return res.status(401).json({ msg: 'invalid credentials' });
  }
  
  // Verificar password con bcrypt
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ msg: 'invalid credentials' });
  }
  
  // Generar JWT
  const token = jwt.sign(
    { 
      sub: user._id,           // Subject (user ID)
      username: user.username,
      roles: user.roles        // ⭐ CRÍTICO para RBAC
    }, 
    JWT_SECRET, 
    { expiresIn: '8h' }
  );
  
  res.json({ token });
});
```

### Middleware de Autenticación

```javascript
// backend/simple-server.js - líneas 178-210
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }
  
  // Formato: "Bearer <token>"
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Payload del token:
    // {
    //   sub: '1',
    //   username: 'owner',
    //   roles: ['Owner', 'Admin'],
    //   iat: 1699700000,
    //   exp: 1699728800
    // }
    
    req.user = decoded;  // ⭐ Adjuntar usuario al request
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Alias para compatibilidad
const authenticateToken = authenticateJWT;
```

### RBAC (Role-Based Access Control)

```javascript
// backend/routes/moduleConfig.js - líneas 8-23
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Verificar si el usuario tiene al menos uno de los roles permitidos
    const hasPermission = req.user.roles.some(role => 
      allowedRoles.includes(role)
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Acceso denegado',
        required: allowedRoles,
        current: req.user.roles
      });
    }

    next();
  };
}

// Uso:
const requireAdminAccess = requireRole(['Owner', 'Admin']);

router.put('/:moduleId', requireAdminAccess, async (req, res) => {
  // Solo Owner/Admin pueden actualizar configuración
});
```

### Frontend: AuthService

```typescript
// frontend/src/app/core/services/auth.service.ts
export class AuthService {
  private tokenKey = 'token';
  
  login(username: string, password: string): Observable<any> {
    return this.http.post('http://localhost:4000/api/auth/login', 
      { username, password }
    ).pipe(
      tap((response: any) => {
        // Guardar token en localStorage
        localStorage.setItem(this.tokenKey, response.token);
      })
    );
  }
  
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
  
  getUserRoles(): string[] {
    const token = this.getToken();
    if (!token) return [];
    
    try {
      // Decodificar JWT (parte del payload es base64)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.roles || [];
    } catch {
      return [];
    }
  }
  
  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }
  
  isAdmin(): boolean {
    const roles = this.getUserRoles();
    return roles.includes('Owner') || roles.includes('Admin');
  }
}
```

### Frontend: RBAC Guard

```typescript
// frontend/src/app/core/guards/rbac.guard.ts
@Injectable({ providedIn: 'root' })
export class RbacGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRoles = route.data['requiredRoles'] as string[];
    
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;  // No hay restricción
    }
    
    const userRoles = this.authService.getUserRoles();
    const hasPermission = requiredRoles.some(role => 
      userRoles.includes(role)
    );
    
    if (!hasPermission) {
      this.router.navigate(['/login']);
      return false;
    }
    
    return true;
  }
}

// Uso en routing:
{
  path: 'admin/module-config/:moduleId',
  component: ModuleConfigComponent,
  canActivate: [RbacGuard],
  data: { requiredRoles: ['Admin', 'Owner'] }
}
```

---

## Sistema de Almacenamiento

### StorageManager Architecture

```javascript
// backend/storage-manager.js - Clase principal
class StorageManager {
  constructor(config) {
    this.config = config;
    this.storageType = config.storageType || 'local';
    this.storagePath = config.storagePath || './storage';
    
    // Inicializar según tipo
    if (this.storageType === 'local') {
      this.initializeLocalStorage();
    } else if (this.storageType === 's3') {
      this.initializeS3();
    } else if (this.storageType === 'azure') {
      this.initializeAzure();
    }
  }
  
  async saveFile(moduleId, filename, buffer, metadata = {}) {
    const filepath = this.generatePath(moduleId, filename);
    
    switch (this.storageType) {
      case 'local':
        return await this.saveToLocal(filepath, buffer, metadata);
      case 's3':
        return await this.saveToS3(filepath, buffer, metadata);
      case 'azure':
        return await this.saveToAzure(filepath, buffer, metadata);
    }
  }
  
  async getFile(moduleId, filename) {
    const filepath = this.generatePath(moduleId, filename);
    
    switch (this.storageType) {
      case 'local':
        return await this.getFromLocal(filepath);
      case 's3':
        return await this.getFromS3(filepath);
      case 'azure':
        return await this.getFromAzure(filepath);
    }
  }
  
  // Método crítico para migración
  async migrate(targetType, targetConfig) {
    const files = await this.listAllFiles();
    
    const targetManager = new StorageManager({
      storageType: targetType,
      ...targetConfig
    });
    
    for (const file of files) {
      const buffer = await this.getFile(file.moduleId, file.filename);
      await targetManager.saveFile(
        file.moduleId, 
        file.filename, 
        buffer, 
        file.metadata
      );
    }
  }
}
```

### Multer Configuration

```javascript
// backend/simple-server.js - líneas 11-15
const multer = require('multer');
const upload = multer({ 
  storage: multer.memoryStorage(),  // Almacenar en RAM primero
  limits: { 
    fileSize: 50 * 1024 * 1024  // 50 MB límite
  }
});
```

### Storage Endpoints

```javascript
// POST /api/storage/upload
app.post('/api/storage/upload', 
  authenticateJWT, 
  upload.single('file'),  // Multer middleware
  async (req, res) => {
    const { moduleId } = req.body;
    const file = req.file;  // Multer adjunta el archivo
    
    // file.buffer contiene el contenido binario
    // file.originalname contiene el nombre original
    // file.mimetype contiene el tipo MIME
    
    const result = await storageManager.saveFile(
      moduleId,
      file.originalname,
      file.buffer,
      {
        uploadedBy: req.user.username,
        uploadedAt: new Date(),
        mimetype: file.mimetype,
        size: file.size
      }
    );
    
    res.json({ 
      success: true, 
      filename: file.originalname,
      path: result.path 
    });
  }
);

// GET /api/storage/download/:moduleId/:filename
app.get('/api/storage/download/:moduleId/:filename',
  authenticateJWT,
  async (req, res) => {
    const { moduleId, filename } = req.params;
    
    const file = await storageManager.getFile(moduleId, filename);
    
    // Enviar como descarga con headers apropiados
    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Disposition', 
      `attachment; filename="${filename}"`
    );
    
    res.send(file.buffer);
  }
);
```

---

## Sistema de Configuración de Módulos

### Field Types y AdminOnly

```javascript
// ⭐ CONCEPTO CLAVE: adminOnly
// Un campo marcado con adminOnly: true significa:
// 1. Solo Admin/Owner pueden configurar su valor
// 2. Analistas lo ven como SOLO LECTURA
// 3. El valor viene pre-configurado (defaultValue)

const exampleTemplate = {
  _id: 'tpl-incident-report',
  name: 'Reporte de Incidente',
  fields: [
    // Campo EDITABLE por analistas
    {
      id: 'incident_date',
      label: 'Fecha del Incidente',
      type: 'datetime',
      editable: true,
      required: true,
      adminOnly: false  // ← Analistas pueden modificar
    },
    
    // Campo BLOQUEADO (solo admin configura)
    {
      id: 'company_policy',
      label: 'Política Aplicable',
      type: 'text',
      editable: false,
      adminOnly: true,  // ← BLOQUEADO para analistas
      defaultValue: 'POL-SEC-001: Respuesta a Incidentes',
      hint: 'Configurado por administración - No modificable'
    }
  ]
};
```

### API Endpoint con Filtrado por Rol

```javascript
// backend/routes/moduleConfig.js - líneas 111-151
// GET /api/module-config/:moduleId/templates/:templateId
router.get('/:moduleId/templates/:templateId', async (req, res) => {
  const config = req.app.locals.database.moduleConfigs.find(
    c => c.moduleId === req.params.moduleId
  );
  
  const template = config.config.templates.find(
    t => t._id === req.params.templateId
  );
  
  // ⭐ FILTRADO CRÍTICO POR ROL
  let responseTemplate = { ...template };
  
  // Si NO es Admin/Owner, modificar campos adminOnly
  if (!['Owner', 'Admin'].includes(req.user.roles[0])) {
    responseTemplate.fields = template.fields.map(field => {
      if (field.adminOnly) {
        return {
          ...field,
          editable: false,  // Forzar como no editable
          hint: field.hint || 'Solo lectura - Configurado por Admin'
        };
      }
      return field;
    });
  }
  
  res.json(responseTemplate);
});
```

### Frontend: Formulario Dinámico

```typescript
// frontend/src/app/core/services/module-config.service.ts
export class ModuleConfigService {
  /**
   * Obtiene campos editables según el rol del usuario
   */
  getEditableFields(fields: Field[]): Field[] {
    const isAdmin = this.isAdmin();
    
    if (isAdmin) {
      return fields;  // Admin ve todos los campos
    }
    
    // Analistas solo ven campos no adminOnly
    return fields.filter(f => !f.adminOnly);
  }
  
  /**
   * Obtiene campos de solo lectura (adminOnly)
   */
  getReadOnlyFields(fields: Field[]): Field[] {
    return fields.filter(f => f.adminOnly);
  }
  
  /**
   * Valida si el usuario tiene permisos de Admin
   */
  isAdmin(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.roles?.includes('Admin') || 
             payload.roles?.includes('Owner');
    } catch (e) {
      return false;
    }
  }
}
```

---

## API REST Endpoints

### Endpoints Principales

```javascript
// ==========================================
// AUTH
// ==========================================
POST   /api/auth/login
Body:  { username: string, password: string }
Response: { token: string }

POST   /api/auth/microsoft    // OAuth Microsoft (pendiente)
POST   /api/auth/google       // OAuth Google (pendiente)

// ==========================================
// MODULES
// ==========================================
GET    /api/modules           // Listar módulos (filtrado por rol)
Headers: Authorization: Bearer <token>
Response: [{ _id, name, baseUrl, embedType, allowedRoles, status }]

POST   /api/modules           // Crear módulo (Admin)
GET    /api/modules/:id       // Obtener módulo específico
PUT    /api/modules/:id       // Actualizar módulo (Admin)
DELETE /api/modules/:id       // Eliminar módulo (Owner)

// ==========================================
// USERS
// ==========================================
GET    /api/users             // Listar usuarios (Admin)
POST   /api/users             // Crear usuario (Admin)
GET    /api/users/:id         // Obtener usuario
PUT    /api/users/:id         // Actualizar usuario (Admin/Self)
DELETE /api/users/:id         // Eliminar usuario (Owner)

// ==========================================
// STORAGE
// ==========================================
POST   /api/storage/upload
Headers: Authorization: Bearer <token>
Body: FormData { file: File, moduleId: string }
Response: { success: true, filename: string, path: string }

GET    /api/storage/download/:moduleId/:filename
Headers: Authorization: Bearer <token>
Response: Binary file

GET    /api/storage/list/:moduleId
Response: [{ filename, size, uploadedAt, uploadedBy }]

DELETE /api/storage/delete/:moduleId/:filename
Response: { success: true }

POST   /api/storage/migrate
Body: { targetType: 'local'|'s3'|'azure', config: {...} }
Response: { success: true, migratedFiles: number }

GET    /api/storage/folder/:moduleId
Response: { url: string }  // URL del explorador de archivos

// ==========================================
// MODULE CONFIG (NUEVO - 15 endpoints)
// ==========================================

// Configuración General
GET    /api/module-config/:moduleId
Headers: Authorization: Bearer <token>
Roles: Admin, Owner
Response: ModuleConfig completo

PUT    /api/module-config/:moduleId
Body: { config: {...} }
Roles: Admin, Owner
Response: ModuleConfig actualizado

// Templates
GET    /api/module-config/:moduleId/templates
Response: { templates: Template[] }

GET    /api/module-config/:moduleId/templates/:templateId
Response: Template (con filtrado adminOnly según rol)

POST   /api/module-config/:moduleId/templates
Body: Partial<Template>
Roles: Admin, Owner
Response: Template creado

PUT    /api/module-config/:moduleId/templates/:templateId
Body: Partial<Template>
Roles: Admin, Owner
Response: Template actualizado

DELETE /api/module-config/:moduleId/templates/:templateId
Roles: Owner
Response: { message, templateId }

// Listas Configurables
GET    /api/module-config/:moduleId/lists/:listName
Response: { items: ListItem[] }

PUT    /api/module-config/:moduleId/lists/:listName
Body: { items: ListItem[] }
Roles: Admin, Owner
Response: { items: ListItem[] }

// Políticas
GET    /api/module-config/:moduleId/policies
Response: { policies: Policy[] }

POST   /api/module-config/:moduleId/policies
Body: Omit<Policy, 'id' | 'lastUpdated'>
Roles: Admin, Owner
Response: Policy

// SLAs
GET    /api/module-config/:moduleId/slas
Response: { slas: SLAs }

PUT    /api/module-config/:moduleId/slas
Body: { slas: SLAs }
Roles: Admin, Owner
Response: { slas: SLAs }

// ==========================================
// BRANDING
// ==========================================
GET    /api/branding
Response: { companyName, logo, primaryColor, secondaryColor }

PUT    /api/branding
Body: { companyName?, logo?, primaryColor?, secondaryColor? }
Roles: Owner
Response: Branding actualizado

// ==========================================
// LOGS (Auditoría)
// ==========================================
GET    /api/logs
Query: ?limit=100&skip=0&level=success|error|warning
Roles: Admin, Owner
Response: [{ timestamp, username, action, module, description, level }]
```

### Ejemplo de Request Completo

```javascript
// Crear template con campos bloqueados
const createTemplate = async () => {
  const token = localStorage.getItem('token');
  
  const newTemplate = {
    name: 'Reporte de Vulnerabilidad',
    description: 'Plantilla para reportar vulnerabilidades',
    category: 'security',
    fields: [
      {
        id: 'vuln_id',
        label: 'ID Vulnerabilidad',
        type: 'text',
        editable: true,
        required: true,
        adminOnly: false
      },
      {
        id: 'cvss_score',
        label: 'CVSS Score',
        type: 'number',
        editable: true,
        required: true,
        adminOnly: false,
        validation: { min: 0, max: 10 }
      },
      {
        id: 'remediation_sla',
        label: 'SLA de Remediación',
        type: 'text',
        editable: false,
        adminOnly: true,  // ⭐ BLOQUEADO
        defaultValue: '30 días laborales',
        hint: 'Definido por política de seguridad'
      }
    ]
  };
  
  const response = await fetch(
    'http://localhost:4000/api/module-config/bitacora-soc/templates',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newTemplate)
    }
  );
  
  const created = await response.json();
  console.log('Template creado:', created);
};
```

---

## Frontend Angular

### Estructura de Componentes

```
src/app/
├── core/
│   ├── services/
│   │   ├── auth.service.ts              # Autenticación JWT
│   │   ├── module-registry.service.ts   # Gestión de módulos
│   │   └── module-config.service.ts     # Config de módulos (NUEVO)
│   └── guards/
│       └── rbac.guard.ts                # Protección de rutas
│
├── features/
│   ├── bitacora/
│   │   ├── bitacora-wrapper.component.ts
│   │   └── bitacora-wrapper.component.html
│   └── admin/
│       └── module-config/               # NUEVO
│           ├── module-config.component.ts
│           ├── module-config.component.html
│           └── module-config.component.scss
│
├── shared/
│   └── models/
│       └── interfaces.ts                # Interfaces compartidas
│
├── app-routing.module.ts
├── app.component.ts
└── app.module.ts
```

### Routing con Guards

```typescript
// frontend/src/app/app-routing.module.ts
const routes: Routes = [
  { path: 'login', component: LoginComponent },
  
  // Ruta protegida con RBAC
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [RbacGuard],
    data: { requiredRoles: ['Owner', 'Admin', 'SOC Analyst'] }
  },
  
  // Admin panel - solo Admin/Owner
  {
    path: 'admin',
    component: AdminPanelComponent,
    canActivate: [RbacGuard],
    data: { requiredRoles: ['Owner', 'Admin'] }
  },
  
  // Module config - solo Admin/Owner
  {
    path: 'admin/module-config/:moduleId',
    component: ModuleConfigComponent,
    canActivate: [RbacGuard],
    data: { requiredRoles: ['Owner', 'Admin'] }
  },
  
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
```

### HTTP Interceptor para JWT

```typescript
// frontend/src/app/core/interceptors/auth.interceptor.ts
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Clonar request y agregar Authorization header
      const cloned = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      
      return next.handle(cloned);
    }
    
    return next.handle(req);
  }
}

// Registrar en app.module.ts
providers: [
  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
  }
]
```

---

## Flujos de Datos Críticos

### Flujo 1: Login y Autenticación

```
┌─────────┐           ┌─────────┐           ┌─────────┐
│ Usuario │           │ Angular │           │ Backend │
└────┬────┘           └────┬────┘           └────┬────┘
     │                     │                     │
     │ 1. Ingresa user/pass│                     │
     ├────────────────────>│                     │
     │                     │                     │
     │                     │ 2. POST /api/auth/login
     │                     │    { username, password }
     │                     ├────────────────────>│
     │                     │                     │
     │                     │                     │ 3. Verifica con bcrypt
     │                     │                     │    database.users.find()
     │                     │                     │    bcrypt.compare()
     │                     │                     │
     │                     │ 4. { token: 'eyJ...' }
     │                     │<────────────────────┤
     │                     │                     │
     │                     │ 5. localStorage.setItem('token', token)
     │                     │                     │
     │ 6. Redirect /dashboard                    │
     │<────────────────────┤                     │
     │                     │                     │
```

### Flujo 2: Request con JWT

```
┌─────────┐           ┌─────────┐           ┌─────────┐
│ Angular │           │Interceptor          │ Backend │
└────┬────┘           └────┬────┘           └────┬────┘
     │                     │                     │
     │ 1. http.get('/api/modules')              │
     ├────────────────────>│                     │
     │                     │                     │
     │                     │ 2. Agrega header    │
     │                     │    Authorization: Bearer <token>
     │                     │                     │
     │                     │ 3. Request con header
     │                     ├────────────────────>│
     │                     │                     │
     │                     │                     │ 4. authenticateJWT()
     │                     │                     │    jwt.verify(token)
     │                     │                     │    req.user = decoded
     │                     │                     │
     │                     │ 5. Response { data }│
     │<─────────────────────────────────────────┤
     │                     │                     │
```

### Flujo 3: Crear Template con Campo AdminOnly

```
┌─────────┐           ┌─────────┐           ┌─────────┐
│  Admin  │           │ Angular │           │ Backend │
└────┬────┘           └────┬────┘           └────┬────┘
     │                     │                     │
     │ 1. Crea template    │                     │
     │    Marca campo como adminOnly=true        │
     ├────────────────────>│                     │
     │                     │                     │
     │                     │ 2. POST /api/module-config/.../templates
     │                     │    { name, fields: [
     │                     │      { id: 'policy', adminOnly: true, ... }
     │                     │    ]}
     │                     ├────────────────────>│
     │                     │                     │
     │                     │                     │ 3. requireRole(['Admin'])
     │                     │                     │    Verifica req.user.roles
     │                     │                     │
     │                     │                     │ 4. Guarda en database
     │                     │                     │    database.moduleConfigs[].
     │                     │                     │    config.templates.push()
     │                     │                     │
     │                     │ 5. { template creado }
     │                     │<────────────────────┤
     │                     │                     │
     │ 6. "✅ Plantilla creada"                 │
     │<────────────────────┤                     │
     │                     │                     │

     AHORA UN ANALISTA USA EL TEMPLATE:

┌─────────┐           ┌─────────┐           ┌─────────┐
│Analista │           │ Angular │           │ Backend │
└────┬────┘           └────┬────┘           └────┬────┘
     │                     │                     │
     │ 7. Abre formulario  │                     │
     │    (usa template)   │                     │
     ├────────────────────>│                     │
     │                     │                     │
     │                     │ 8. GET /api/module-config/.../templates/:id
     │                     ├────────────────────>│
     │                     │                     │
     │                     │                     │ 9. Verifica rol
     │                     │                     │    req.user.roles = ['SOC Analyst']
     │                     │                     │
     │                     │                     │ 10. FILTRA campos adminOnly:
     │                     │                     │     field.adminOnly = true
     │                     │                     │       → editable = false
     │                     │                     │       → hint = 'Solo lectura'
     │                     │                     │
     │                     │ 11. { template con campos filtrados }
     │                     │<────────────────────┤
     │                     │                     │
     │ 12. Formulario con:  │                     │
     │     - Campos editables (puede llenar)     │
     │     - Campos bloqueados (solo lectura) 🔒│
     │<────────────────────┤                     │
     │                     │                     │
```

---

## Testing y QA

### Test Scripts

```powershell
# Backend: Test general API
.\backend\test-api.ps1

# Tests ejecutados:
# 1. Health check
# 2. Login
# 3. GET modules
# 4. GET users
# 5. POST storage/upload
# 6. GET storage/list
# 7. GET branding
# 8. GET logs
# 9. GET storage/folder

# Backend: Test module config
.\backend\test-module-config.ps1

# Tests ejecutados:
# 1. Login (obtener token)
# 2. GET configuración completa
# 3. GET listar templates
# 4. GET template específico (con campos adminOnly)
# 5. GET lista severities
# 6. GET lista incidentTypes
# 7. GET lista contacts
# 8. GET políticas
# 9. GET SLAs
# 10. POST crear template
# 11. PUT actualizar lista
# 12. DELETE eliminar template
```

### Unit Testing Pattern

```javascript
// Ejemplo de test con Jest/Mocha
describe('ModuleConfig API', () => {
  let token;
  
  beforeAll(async () => {
    // Login para obtener token
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'owner', password: 'admin123' });
    
    token = response.body.token;
  });
  
  describe('GET /api/module-config/:moduleId/templates/:templateId', () => {
    it('Admin ve todos los campos', async () => {
      const response = await request(app)
        .get('/api/module-config/bitacora-soc/templates/tpl-incident-report')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.fields).toHaveLength(8);
      
      // Verificar campo adminOnly
      const adminField = response.body.fields.find(f => f.adminOnly);
      expect(adminField).toBeDefined();
      expect(adminField.id).toBe('company_policy');
    });
    
    it('Analyst ve campos adminOnly como solo lectura', async () => {
      // Login como analista
      const analystResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'analyst', password: 'analyst123' });
      
      const analystToken = analystResponse.body.token;
      
      const response = await request(app)
        .get('/api/module-config/bitacora-soc/templates/tpl-incident-report')
        .set('Authorization', `Bearer ${analystToken}`);
      
      const adminField = response.body.fields.find(f => f.adminOnly);
      expect(adminField.editable).toBe(false);
      expect(adminField.hint).toContain('Solo lectura');
    });
  });
});
```

---

## Variables de Entorno

```bash
# .env (backend)
NODE_ENV=development
PORT=4000
JWT_SECRET=ramen-secret-key-2024

# Base de datos
MONGODB_URI=mongodb://localhost:27017/ramen
USE_MONGODB=false  # false = in-memory, true = MongoDB

# Storage
STORAGE_TYPE=local  # local, s3, azure
STORAGE_PATH=./storage

# AWS S3 (si STORAGE_TYPE=s3)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET=ramen-storage

# Azure Blob (si STORAGE_TYPE=azure)
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
AZURE_CONTAINER_NAME=ramen-storage

# OAuth (pendiente)
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## Comandos Útiles

```bash
# Backend
cd backend
node simple-server.js                    # Iniciar servidor
npm install                              # Instalar dependencias
.\test-api.ps1                          # Ejecutar tests generales
.\test-module-config.ps1                # Ejecutar tests config

# Frontend
cd frontend
ng serve                                # Desarrollo (port 4200)
ng build                                # Build producción
ng build --watch                        # Build incremental
ng test                                 # Unit tests
ng e2e                                  # End-to-end tests

# Full stack
# Terminal 1: Backend
cd backend && node simple-server.js

# Terminal 2: Frontend
cd frontend && ng serve

# Acceder: http://localhost:4200
```

---

## Troubleshooting Común

### Error: "Invalid or expired token"
```javascript
// Causa: Token JWT expirado (8 horas)
// Solución: Re-login

// Verificar token en browser console:
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token expira:', new Date(payload.exp * 1000));
```

### Error: "Access denied" (403)
```javascript
// Causa: Usuario no tiene rol requerido
// Solución: Verificar roles del usuario

// Backend - verificar:
console.log('User roles:', req.user.roles);
console.log('Required:', allowedRoles);

// Frontend - verificar:
const roles = authService.getUserRoles();
console.log('User roles:', roles);
```

### Error: "No authorization header" (401)
```javascript
// Causa: Token no se envía en request
// Solución: Verificar interceptor

// Frontend - verificar:
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);

// Verificar headers en Network tab del browser
```

---

## Glosario Técnico

- **adminOnly**: Flag que marca un campo como configurable solo por Admin/Owner
- **RBAC**: Role-Based Access Control - Control de acceso basado en roles
- **JWT**: JSON Web Token - Token de autenticación con payload firmado
- **Template**: Plantilla de formulario con campos configurables
- **Field**: Campo individual de un template con tipo, validación, permisos
- **ModuleConfig**: Configuración completa de un módulo (templates, listas, políticas, SLAs)
- **StorageManager**: Gestor de almacenamiento multi-backend (local/S3/Azure)
- **Middleware**: Función que procesa requests antes de llegar al endpoint
- **Guard**: Protección de rutas en Angular basada en condiciones
- **Interceptor**: Middleware de HTTP en Angular que modifica requests/responses

---

**Última actualización:** 11 de Noviembre, 2025  
**Versión del documento:** 1.0.0  
**Mantenedor:** Equipo Ramen - Synet SPA

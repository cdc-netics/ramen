# 📦 Guía para Agregar Módulos Internos a Ramen

## 🎯 Tabla de Contenidos

1. [Tipos de Módulos](#tipos-de-módulos)
2. [Módulos Internos vs Externos](#diferencias-internos-externos)
3. [Estructura de un Módulo Interno](#estructura-módulo-interno)
4. [Paso a Paso: Crear Módulo Interno](#crear-módulo-interno)
5. [Configuración en el Orquestador](#configuración-orquestador)
6. [Testing y Validación](#testing-validación)
7. [Mejores Prácticas](#mejores-prácticas)
8. [Ejemplos Completos](#ejemplos)

---

## 🔍 Tipos de Módulos

### 1. Módulo Externo (iframe)
**Características:**
- ✅ Sistema independiente con su propio servidor
- ✅ Puede estar en otro servidor/puerto
- ✅ Tiene su propia base de datos
- ✅ Se carga en iframe dentro de Ramen
- ⚠️ **Requiere que el servidor permita iframe** (sin X-Frame-Options)

**Ejemplo:**
```javascript
{
  name: 'Bitacora SOC Externa',
  baseUrl: 'http://10.0.100.13:8477',
  embedType: 'iframe',  // Se carga dentro de Ramen
  allowedRoles: ['Owner', 'Admin']
}
```

### 2. Módulo Externo (link)
**Características:**
- ✅ Sistema independiente con su propio servidor
- ✅ Se abre en nueva pestaña
- ✅ No tiene restricciones de iframe
- ⚠️ Usuario sale de Ramen

**Ejemplo:**
```javascript
{
  name: 'Sistema Legacy',
  baseUrl: 'http://old-system.local:3000',
  embedType: 'link',  // Se abre en nueva pestaña
  allowedRoles: ['Owner', 'Admin', 'SOC']
}
```

### 3. Módulo Interno (Angular Component)
**Características:**
- ✅ Componente Angular dentro de Ramen
- ✅ Comparte autenticación y estado
- ✅ Usa API de Ramen directamente
- ✅ NO tiene restricciones de CORS o iframe
- ✅ Mejor rendimiento e integración

**Ejemplo:**
```javascript
{
  name: 'Gestión de Hallazgos',
  type: 'internal',
  componentPath: 'findings',  // Ruta Angular
  allowedRoles: ['Owner', 'Admin', 'SOC']
}
```

---

## ⚖️ Diferencias: Internos vs Externos

| Característica | Módulo Interno | Módulo Externo (iframe) | Módulo Externo (link) |
|----------------|----------------|-------------------------|----------------------|
| **Servidor** | Usa backend Ramen | Propio servidor | Propio servidor |
| **Base de Datos** | MongoDB Ramen | Propia BD | Propia BD |
| **Autenticación** | JWT Ramen | Propia auth | Propia auth |
| **Integración** | Total | Media | Baja |
| **CORS** | No aplica | Puede tener problemas | No aplica |
| **X-Frame-Options** | No aplica | ⚠️ **Puede bloquear** | No aplica |
| **Experiencia Usuario** | Fluida | Integrada | Sale de Ramen |
| **Desarrollo** | Dentro Ramen | Independiente | Independiente |
| **Despliegue** | Con Ramen | Por separado | Por separado |

---

## 🏗️ Estructura de un Módulo Interno

### Arquitectura
```
frontend/src/app/
├── features/
│   └── [nombre-modulo]/
│       ├── [nombre]-wrapper.component.ts    # Componente principal
│       ├── [nombre]-wrapper.component.html  # Template
│       ├── [nombre]-wrapper.component.scss  # Estilos
│       ├── [nombre].module.ts (opcional)    # Módulo Angular si es complejo
│       ├── services/
│       │   └── [nombre].service.ts          # Servicio API
│       ├── models/
│       │   └── [nombre].model.ts            # Interfaces TypeScript
│       └── components/                      # Sub-componentes
│           ├── [sub-componente].component.ts
│           └── ...
│
backend/
├── routes/
│   └── [nombre].js                          # API endpoints
├── models/
│   └── [nombre].model.js                    # Mongoose schema
└── simple-server.js                         # Registrar rutas
```

---

## 🚀 Paso a Paso: Crear Módulo Interno

### Ejemplo: Módulo "Vulnerabilidades"

---

### PASO 1: Crear Modelo en Backend

```javascript
// backend/models/vulnerability.model.js

const mongoose = require('mongoose');

const vulnerabilitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  severity: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low', 'Info'],
    required: true
  },
  cvss: {
    type: Number,
    min: 0,
    max: 10
  },
  description: {
    type: String,
    required: true
  },
  affectedSystems: [{
    hostname: String,
    ip: String,
    os: String
  }],
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Mitigated', 'Closed'],
    default: 'Open'
  },
  cve: {
    type: String,
    sparse: true,
    unique: true
  },
  discoveryDate: {
    type: Date,
    default: Date.now
  },
  remediationDate: Date,
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  evidence: [{
    filename: String,
    path: String,
    uploadDate: Date
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Índices para búsquedas rápidas
vulnerabilitySchema.index({ severity: 1, status: 1 });
vulnerabilitySchema.index({ discoveryDate: -1 });
vulnerabilitySchema.index({ cve: 1 });

module.exports = mongoose.model('Vulnerability', vulnerabilitySchema);
```

---

### PASO 2: Crear Rutas API en Backend

```javascript
// backend/routes/vulnerabilities.js

const express = require('express');
const router = express.Router();
const Vulnerability = require('../models/vulnerability.model');
const { authenticateToken } = require('../middleware/auth');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// GET /api/vulnerabilities - Listar con filtros
router.get('/', async (req, res) => {
  try {
    const { severity, status, page = 1, limit = 50 } = req.query;
    
    const filter = {};
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    
    const vulnerabilities = await Vulnerability.find(filter)
      .populate('assignedTo', 'username email')
      .populate('createdBy', 'username')
      .sort({ discoveryDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Vulnerability.countDocuments(filter);
    
    res.json({
      vulnerabilities,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/vulnerabilities/:id - Obtener una
router.get('/:id', async (req, res) => {
  try {
    const vuln = await Vulnerability.findById(req.params.id)
      .populate('assignedTo', 'username email')
      .populate('createdBy', 'username email');
    
    if (!vuln) {
      return res.status(404).json({ error: 'Vulnerabilidad no encontrada' });
    }
    
    res.json(vuln);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/vulnerabilities - Crear nueva
router.post('/', async (req, res) => {
  try {
    const vulnerability = new Vulnerability({
      ...req.body,
      createdBy: req.user.userId
    });
    
    await vulnerability.save();
    
    res.status(201).json(vulnerability);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/vulnerabilities/:id - Actualizar
router.put('/:id', async (req, res) => {
  try {
    const vuln = await Vulnerability.findById(req.params.id);
    
    if (!vuln) {
      return res.status(404).json({ error: 'Vulnerabilidad no encontrada' });
    }
    
    // Verificar permisos (Owner/Admin o creador)
    if (!['Owner', 'Admin'].includes(req.user.role) && 
        vuln.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    Object.assign(vuln, req.body);
    vuln.updatedAt = new Date();
    await vuln.save();
    
    res.json(vuln);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/vulnerabilities/:id - Eliminar (Owner/Admin)
router.delete('/:id', async (req, res) => {
  try {
    if (!['Owner', 'Admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Solo Owner/Admin pueden eliminar' });
    }
    
    const vuln = await Vulnerability.findByIdAndDelete(req.params.id);
    
    if (!vuln) {
      return res.status(404).json({ error: 'Vulnerabilidad no encontrada' });
    }
    
    res.json({ message: 'Vulnerabilidad eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/vulnerabilities/stats/summary - Estadísticas
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await Vulnerability.aggregate([
      {
        $group: {
          _id: {
            severity: '$severity',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const total = await Vulnerability.countDocuments();
    const critical = await Vulnerability.countDocuments({ severity: 'Critical', status: 'Open' });
    const avgCvss = await Vulnerability.aggregate([
      { $group: { _id: null, avg: { $avg: '$cvss' } } }
    ]);
    
    res.json({
      total,
      criticalOpen: critical,
      averageCvss: avgCvss[0]?.avg || 0,
      bySeverityAndStatus: stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

### PASO 3: Registrar Rutas en simple-server.js

```javascript
// En backend/simple-server.js

// Agregar después de las otras rutas
const vulnerabilitiesRoutes = require('./routes/vulnerabilities');
app.use('/api/vulnerabilities', vulnerabilitiesRoutes);

console.log('✅ Rutas de vulnerabilidades registradas');
```

---

### PASO 4: Crear Servicio Angular

```typescript
// frontend/src/app/features/vulnerabilities/services/vulnerability.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Vulnerability {
  _id?: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  cvss?: number;
  description: string;
  affectedSystems?: Array<{
    hostname: string;
    ip: string;
    os: string;
  }>;
  status: 'Open' | 'In Progress' | 'Mitigated' | 'Closed';
  cve?: string;
  discoveryDate?: Date;
  remediationDate?: Date;
  assignedTo?: any;
  createdBy?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VulnerabilityListResponse {
  vulnerabilities: Vulnerability[];
  totalPages: number;
  currentPage: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class VulnerabilityService {
  private apiUrl = `${environment.apiUrl}/api/vulnerabilities`;

  constructor(private http: HttpClient) {}

  getVulnerabilities(filters?: {
    severity?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Observable<VulnerabilityListResponse> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.severity) params = params.set('severity', filters.severity);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }
    
    return this.http.get<VulnerabilityListResponse>(this.apiUrl, { params });
  }

  getVulnerability(id: string): Observable<Vulnerability> {
    return this.http.get<Vulnerability>(`${this.apiUrl}/${id}`);
  }

  createVulnerability(vuln: Vulnerability): Observable<Vulnerability> {
    return this.http.post<Vulnerability>(this.apiUrl, vuln);
  }

  updateVulnerability(id: string, vuln: Partial<Vulnerability>): Observable<Vulnerability> {
    return this.http.put<Vulnerability>(`${this.apiUrl}/${id}`, vuln);
  }

  deleteVulnerability(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats/summary`);
  }
}
```

---

### PASO 5: Crear Componente Angular

```typescript
// frontend/src/app/features/vulnerabilities/vulnerabilities-wrapper.component.ts

import { Component, OnInit } from '@angular/core';
import { VulnerabilityService, Vulnerability } from './services/vulnerability.service';

@Component({
  selector: 'app-vulnerabilities-wrapper',
  templateUrl: './vulnerabilities-wrapper.component.html',
  styleUrls: ['./vulnerabilities-wrapper.component.scss']
})
export class VulnerabilitiesWrapperComponent implements OnInit {
  vulnerabilities: Vulnerability[] = [];
  loading = false;
  error: string | null = null;
  
  // Filtros
  selectedSeverity = '';
  selectedStatus = '';
  currentPage = 1;
  totalPages = 1;
  
  // Estadísticas
  stats: any = null;

  constructor(private vulnService: VulnerabilityService) {}

  ngOnInit() {
    this.loadVulnerabilities();
    this.loadStats();
  }

  loadVulnerabilities() {
    this.loading = true;
    this.error = null;
    
    this.vulnService.getVulnerabilities({
      severity: this.selectedSeverity || undefined,
      status: this.selectedStatus || undefined,
      page: this.currentPage,
      limit: 20
    }).subscribe({
      next: (response) => {
        this.vulnerabilities = response.vulnerabilities;
        this.totalPages = response.totalPages;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error cargando vulnerabilidades: ' + err.message;
        this.loading = false;
      }
    });
  }

  loadStats() {
    this.vulnService.getStats().subscribe({
      next: (stats) => this.stats = stats,
      error: (err) => console.error('Error cargando stats:', err)
    });
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadVulnerabilities();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadVulnerabilities();
  }

  getSeverityColor(severity: string): string {
    const colors: any = {
      'Critical': 'red',
      'High': 'orange',
      'Medium': 'yellow',
      'Low': 'blue',
      'Info': 'gray'
    };
    return colors[severity] || 'gray';
  }

  getStatusColor(status: string): string {
    const colors: any = {
      'Open': 'red',
      'In Progress': 'yellow',
      'Mitigated': 'blue',
      'Closed': 'green'
    };
    return colors[status] || 'gray';
  }
}
```

---

### PASO 6: Crear Template HTML

```html
<!-- frontend/src/app/features/vulnerabilities/vulnerabilities-wrapper.component.html -->

<div class="vulnerabilities-container">
  <h1>Gestión de Vulnerabilidades</h1>

  <!-- Estadísticas -->
  <div class="stats-row" *ngIf="stats">
    <div class="stat-card">
      <h3>{{ stats.total }}</h3>
      <p>Total</p>
    </div>
    <div class="stat-card critical">
      <h3>{{ stats.criticalOpen }}</h3>
      <p>Críticas Abiertas</p>
    </div>
    <div class="stat-card">
      <h3>{{ stats.averageCvss | number:'1.1-1' }}</h3>
      <p>CVSS Promedio</p>
    </div>
  </div>

  <!-- Filtros -->
  <div class="filters">
    <select [(ngModel)]="selectedSeverity" (change)="onFilterChange()">
      <option value="">Todas las severidades</option>
      <option value="Critical">Critical</option>
      <option value="High">High</option>
      <option value="Medium">Medium</option>
      <option value="Low">Low</option>
      <option value="Info">Info</option>
    </select>

    <select [(ngModel)]="selectedStatus" (change)="onFilterChange()">
      <option value="">Todos los estados</option>
      <option value="Open">Open</option>
      <option value="In Progress">In Progress</option>
      <option value="Mitigated">Mitigated</option>
      <option value="Closed">Closed</option>
    </select>

    <button (click)="loadVulnerabilities()">🔄 Actualizar</button>
  </div>

  <!-- Loader -->
  <div *ngIf="loading" class="loader">Cargando...</div>

  <!-- Error -->
  <div *ngIf="error" class="error">{{ error }}</div>

  <!-- Tabla de vulnerabilidades -->
  <table *ngIf="!loading && vulnerabilities.length > 0">
    <thead>
      <tr>
        <th>Título</th>
        <th>Severidad</th>
        <th>CVSS</th>
        <th>Estado</th>
        <th>CVE</th>
        <th>Descubierta</th>
        <th>Asignada a</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let vuln of vulnerabilities">
        <td>{{ vuln.title }}</td>
        <td>
          <span class="badge" [ngClass]="getSeverityColor(vuln.severity)">
            {{ vuln.severity }}
          </span>
        </td>
        <td>{{ vuln.cvss || '-' }}</td>
        <td>
          <span class="badge" [ngClass]="getStatusColor(vuln.status)">
            {{ vuln.status }}
          </span>
        </td>
        <td>{{ vuln.cve || '-' }}</td>
        <td>{{ vuln.discoveryDate | date:'short' }}</td>
        <td>{{ vuln.assignedTo?.username || 'Sin asignar' }}</td>
        <td>
          <button (click)="viewDetails(vuln._id)">Ver</button>
          <button (click)="editVulnerability(vuln._id)">Editar</button>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- Sin resultados -->
  <div *ngIf="!loading && vulnerabilities.length === 0" class="no-results">
    No se encontraron vulnerabilidades
  </div>

  <!-- Paginación -->
  <div class="pagination" *ngIf="totalPages > 1">
    <button 
      [disabled]="currentPage === 1" 
      (click)="onPageChange(currentPage - 1)">
      Anterior
    </button>
    <span>Página {{ currentPage }} de {{ totalPages }}</span>
    <button 
      [disabled]="currentPage === totalPages" 
      (click)="onPageChange(currentPage + 1)">
      Siguiente
    </button>
  </div>
</div>
```

---

### PASO 7: Estilos SCSS

```scss
// frontend/src/app/features/vulnerabilities/vulnerabilities-wrapper.component.scss

.vulnerabilities-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;

  h1 {
    margin-bottom: 30px;
    color: #333;
  }

  .stats-row {
    display: flex;
    gap: 20px;
    margin-bottom: 30px;

    .stat-card {
      flex: 1;
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;

      &.critical {
        background: #fff5f5;
        border-left: 4px solid #e53935;
      }

      h3 {
        font-size: 32px;
        margin: 0 0 10px 0;
        color: #333;
      }

      p {
        margin: 0;
        color: #666;
      }
    }
  }

  .filters {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;

    select, button {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    button {
      background: #007bff;
      color: white;
      cursor: pointer;

      &:hover {
        background: #0056b3;
      }
    }
  }

  table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);

    thead {
      background: #f5f5f5;

      th {
        padding: 12px;
        text-align: left;
        font-weight: 600;
        border-bottom: 2px solid #ddd;
      }
    }

    tbody {
      tr {
        border-bottom: 1px solid #eee;

        &:hover {
          background: #f9f9f9;
        }

        td {
          padding: 12px;

          .badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;

            &.red {
              background: #ffebee;
              color: #c62828;
            }

            &.orange {
              background: #fff3e0;
              color: #ef6c00;
            }

            &.yellow {
              background: #fffde7;
              color: #f57f17;
            }

            &.blue {
              background: #e3f2fd;
              color: #1565c0;
            }

            &.green {
              background: #e8f5e9;
              color: #2e7d32;
            }

            &.gray {
              background: #f5f5f5;
              color: #616161;
            }
          }

          button {
            padding: 4px 8px;
            margin-right: 5px;
            border: none;
            background: #007bff;
            color: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;

            &:hover {
              background: #0056b3;
            }
          }
        }
      }
    }
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;

    button {
      padding: 8px 16px;
      border: 1px solid #ddd;
      background: white;
      border-radius: 4px;
      cursor: pointer;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &:not(:disabled):hover {
        background: #f5f5f5;
      }
    }
  }

  .loader, .error, .no-results {
    padding: 40px;
    text-align: center;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .error {
    color: #c62828;
    background: #ffebee;
  }
}
```

---

### PASO 8: Registrar Ruta en app-routing.module.ts

```typescript
// frontend/src/app/app-routing.module.ts

import { VulnerabilitiesWrapperComponent } from './features/vulnerabilities/vulnerabilities-wrapper.component';

const routes: Routes = [
  // ... otras rutas ...
  {
    path: 'vulnerabilities',
    component: VulnerabilitiesWrapperComponent,
    canActivate: [RbacGuard],
    data: { allowedRoles: ['Owner', 'Admin', 'SOC'] }
  },
  // ... otras rutas ...
];
```

---

### PASO 9: Declarar Componente en app.module.ts

```typescript
// frontend/src/app/app.module.ts

import { VulnerabilitiesWrapperComponent } from './features/vulnerabilities/vulnerabilities-wrapper.component';

@NgModule({
  declarations: [
    // ... otros componentes ...
    VulnerabilitiesWrapperComponent
  ],
  // ... resto de configuración ...
})
export class AppModule { }
```

---

### PASO 10: Registrar Módulo en Backend

```javascript
// En backend/simple-server.js

// Agregar a la lista de módulos disponibles
const availableModules = [
  // ... módulos existentes ...
  {
    _id: '6',
    name: 'Vulnerabilidades',
    type: 'internal',
    componentPath: 'vulnerabilities',  // Coincide con ruta Angular
    allowedRoles: ['Owner', 'Admin', 'SOC'],
    icon: 'security',
    description: 'Gestión de vulnerabilidades detectadas',
    category: 'Security'
  }
];
```

---

## ✅ Testing y Validación

### Test 1: Backend API

```powershell
# Obtener token
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Crear vulnerabilidad
$body = @{
  title = "SQL Injection en login"
  severity = "Critical"
  cvss = 9.8
  description = "Vulnerabilidad de inyección SQL detectada"
  status = "Open"
  cve = "CVE-2024-12345"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/vulnerabilities" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $body

# Listar vulnerabilidades
Invoke-RestMethod -Uri "http://localhost:4000/api/vulnerabilities" `
  -Headers @{ Authorization = "Bearer $token" }
```

### Test 2: Frontend

1. Iniciar sesión en Ramen
2. Ir a sidebar, clic en "Vulnerabilidades"
3. Verificar que se carga la tabla
4. Probar filtros de severidad y estado
5. Crear nueva vulnerabilidad
6. Verificar estadísticas

### Test 3: Permisos

```javascript
// Usuario SOC debería poder:
✅ Ver vulnerabilidades
✅ Crear vulnerabilidades
✅ Editar sus propias vulnerabilidades
❌ Eliminar vulnerabilidades (solo Owner/Admin)

// Usuario Admin debería poder:
✅ Todo lo anterior
✅ Editar cualquier vulnerabilidad
✅ Eliminar vulnerabilidades

// Usuario Owner debería poder:
✅ Todo sin restricciones
```

---

## ⚠️ NO Puedes Poner "Cualquier Cosa"

### ❌ Cosas que NO funcionan como módulo interno:

1. **Aplicaciones con tecnología diferente**
   - ❌ PHP, Java, Python Flask (requieren su propio servidor)
   - ✅ Solución: Usar como módulo externo (iframe o link)

2. **Aplicaciones que requieren autenticación separada**
   - ❌ Sistemas con login propio incompatible
   - ✅ Solución: Integrar con JWT de Ramen o usar módulo externo

3. **Aplicaciones con base de datos incompatible**
   - ❌ PostgreSQL, MySQL (Ramen usa MongoDB)
   - ✅ Solución: Módulo externo con su propia BD

4. **Aplicaciones con UI no-Angular**
   - ❌ React, Vue, Svelte apps
   - ✅ Solución: Cargar en iframe (si permiten) o link

5. **Aplicaciones legacy sin API**
   - ❌ Sistemas viejos sin endpoints REST
   - ✅ Solución: Crear wrapper API o usar link externo

### ✅ Criterios para Módulo Interno:

1. **Componente Angular** o puede convertirse a Angular
2. **USA API de Ramen** (Node.js + MongoDB)
3. **Comparte autenticación JWT** con Ramen
4. **Lógica de negocio SOC** (no herramientas genéricas)
5. **Fuertemente integrado** con otros módulos

---

## 🎯 Mejores Prácticas

### 1. Organización de Código

✅ **HACER:**
- Un feature por carpeta en `frontend/src/app/features/`
- Servicios separados de componentes
- Modelos TypeScript para type safety
- Reutilizar componentes compartidos de `shared/`

❌ **NO HACER:**
- Poner todo en un solo archivo
- Componentes gigantes (>500 líneas)
- Lógica de negocio en componentes (va en servicios)

### 2. API Design

✅ **HACER:**
- RESTful endpoints (`GET /api/recurso`, `POST /api/recurso`)
- Validación en backend (nunca confiar en frontend)
- Paginación para listas grandes
- Filtros y búsqueda
- Respuestas consistentes

❌ **NO HACER:**
- Endpoints sin autenticación
- Queries sin límites (DoS risk)
- Exponer datos sensibles sin filtrar

### 3. Seguridad

✅ **HACER:**
- Verificar JWT en todas las rutas
- Validar permisos por rol
- Sanitizar inputs
- Usar HTTPS en producción
- Logs de auditoría

❌ **NO HACER:**
- Confiar en datos del cliente
- Hardcodear secrets
- Exponer stack traces

### 4. Performance

✅ **HACER:**
- Índices en MongoDB para queries frecuentes
- Lazy loading de componentes
- Caché cuando sea apropiado
- Paginación por defecto

❌ **NO HACER:**
- Cargar todos los datos de una vez
- N+1 queries
- Sin límites de tamaño

---

## 📚 Ejemplos Adicionales

### Ejemplo: Módulo Simple (Timeline)

```typescript
// frontend/src/app/features/timeline/timeline-wrapper.component.ts

import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-timeline',
  template: `
    <div class="timeline-container">
      <h1>Timeline de Eventos</h1>
      <div *ngFor="let event of events" class="event-card">
        <div class="event-time">{{ event.timestamp | date:'short' }}</div>
        <div class="event-description">{{ event.description }}</div>
      </div>
    </div>
  `,
  styles: [`
    .timeline-container { padding: 20px; }
    .event-card {
      border-left: 4px solid #007bff;
      padding-left: 15px;
      margin-bottom: 15px;
    }
  `]
})
export class TimelineWrapperComponent implements OnInit {
  events: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get('/api/timeline/events').subscribe(
      (data: any) => this.events = data
    );
  }
}
```

Registrar en backend:
```javascript
app.get('/api/timeline/events', authenticateToken, async (req, res) => {
  // Obtener eventos de múltiples colecciones
  const findings = await Finding.find().sort({ createdAt: -1 }).limit(10);
  const vulns = await Vulnerability.find().sort({ discoveryDate: -1 }).limit(10);
  
  const events = [
    ...findings.map(f => ({
      timestamp: f.createdAt,
      description: `Hallazgo: ${f.title}`,
      type: 'finding'
    })),
    ...vulns.map(v => ({
      timestamp: v.discoveryDate,
      description: `Vulnerabilidad: ${v.title}`,
      type: 'vulnerability'
    }))
  ].sort((a, b) => b.timestamp - a.timestamp);
  
  res.json(events);
});
```

---

## 🔧 Troubleshooting

### Problema: "Cannot GET /api/mymodule"

**Causa:** Ruta no registrada en simple-server.js

**Solución:**
```javascript
const myModuleRoutes = require('./routes/mymodule');
app.use('/api/mymodule', myModuleRoutes);
```

### Problema: "Component not found"

**Causa:** Componente no declarado en app.module.ts

**Solución:**
```typescript
import { MyComponent } from './features/mymodule/my.component';

@NgModule({
  declarations: [MyComponent],
  // ...
})
```

### Problema: "401 Unauthorized"

**Causa:** Falta autenticación

**Solución:**
```javascript
// Backend
router.use(authenticateToken);

// Frontend - HttpClient automáticamente incluye token si usas interceptor
```

### Problema: Módulo no aparece en sidebar

**Causa:** No registrado en `availableModules`

**Solución:**
```javascript
// backend/simple-server.js
const availableModules = [
  {
    _id: 'unique-id',
    name: 'Mi Módulo',
    type: 'internal',
    componentPath: 'mi-modulo',  // debe coincidir con ruta Angular
    allowedRoles: ['Owner', 'Admin'],
    icon: 'dashboard'
  }
];
```

---

**Documento creado:** Noviembre 2025
**Versión:** 1.0
**Para:** Ramen Security Orchestrator

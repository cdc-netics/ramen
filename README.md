<div align="center">

# 🍜 Ramen SOC - Orquestador de Módulos

**Sistema orquestador modular para centralizar aplicaciones SOC/seguridad en un único punto de acceso**

[![License: BSL 1.1](https://img.shields.io/badge/License-BSL%201.1-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Angular Version](https://img.shields.io/badge/angular-16.2.0-red)](https://angular.io/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Características](#-características-principales) • [Inicio Rápido](#-inicio-rápido) • [Documentación](#-documentación-adicional) • [API](#-api-endpoints) • [Contribuir](CONTRIBUTING.md)

</div>

---

## 📋 Características Principales



- ✅ **Autenticación JWT** unificada (token: `ramen_token`, exp: 8h)
- ✅ **Sistema RBAC** con 4 roles y 20 permisos granulares
- ✅ **Gestión de módulos** externos (iframe/link) e internos (proxy Node.js)
- ✅ **Validación de módulos ZIP** con reportes detallados (score 0-100)
- ✅ **Panel de administración** completo (usuarios, módulos, branding, RBAC, logs)
- ✅ **Branding personalizable** (logos, colores, animación de carga)
- ✅ **Sistema de logs** con filtros por nivel/módulo/usuario
- ✅ **Storage modular portable** con carpeta por módulo (migrable a NFS/Samba/nube/otro disco)
- ✅ **Base de datos en memoria** (demo mode, no requiere MongoDB)
- ✅ **Module Manager** para ejecutar módulos Node.js locales
- ✅ **Proxy inverso** para módulos externos con eliminación de X-Frame-Options
- ✅ **Eliminación completa de módulos** (memoria + disco + dependencias)
- ⚠️ **OAuth/OIDC** estructura preparada (pendiente configuración)

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js 18+
- npm 9+

### 1. Backend (API + Proxy + Storage)

- ✅ **Base de datos en memoria** (demo mode, no requiere MongoDB)

```bash

cd backend- ✅ **Module Manager** para ejecutar módulos Node.js locales- ✅ **Sistema RBAC** con 4 roles y 20 permisos granulares

npm install

node simple-server.js- ✅ **Proxy inverso** para módulos externos con eliminación de X-Frame-Options

```

- ⚠️ **OAuth/OIDC** estructura preparada (pendiente configuración)- ✅ **Gestión de módulos** externos (iframe/link) e internos (proxy Node.js)### Opción 1: Usar el script automático (RECOMENDADO)

**Servidor corriendo en:** `http://localhost:4000`



### 2. Frontend (Angular SPA)

## 🚀 Inicio Rápido- ✅ **Panel de administración** completo (usuarios, módulos, branding, RBAC, logs)

```bash

cd frontend

npm install

ng serve### Prerequisitos- ✅ **Branding personalizable** (logos, colores, animación de carga)### Windows - Script Automático (RECOMENDADO)```bash

# O compilar para producción:

# npx ng build- Node.js 18+

```

- npm 9+- ✅ **Sistema de logs** con filtros por nivel/módulo/usuario

**Aplicación en:** `http://localhost:4200` (dev) o `http://localhost:4000` (dist servido por backend)



### 3. Credenciales por Defecto

### 1. Backend (API + Proxy + Storage)- ✅ **Base de datos en memoria** (demo mode, no requiere MongoDB)Doble clic en: **`INICIAR.bat`**# Doble clic en el archivo:

- **Owner:** `owner` / `pass`

- **Admin:** `admin` / `pass````bash

- **SOC:** `soc_analyst` / `pass`

- **User:** `user` / `pass`cd backend- ✅ **Module Manager** para ejecutar módulos Node.js locales



## 📁 Estructura del Proyectonpm install



```node simple-server.js- ✅ **Proxy inverso** para módulos externos con eliminación de X-Frame-OptionsLEVANTAR_SISTEMA.bat

ramen/

├── backend/                        # Servidor Node.js```

│   ├── simple-server.js           # API principal + proxy + storage

│   ├── storage-manager.js         # Gestor de almacenamiento modular**Servidor corriendo en:** `http://localhost:4000`- ⚠️ **OAuth/OIDC** estructura preparada (pendiente configuración)

│   ├── storage-config.js          # Configuración storage (local/NFS/Samba/S3)

│   ├── storage-examples.js        # Ejemplos de uso del storage

│   ├── models/                    # Schemas Mongoose

│   │   ├── user.model.js### 2. Frontend (Angular SPA)### Manual```

│   │   ├── module.model.js

│   │   ├── finding.model.js```bash

│   │   └── leakedPassword.model.js

│   ├── routes/                    # Rutas APIcd frontend## 🚀 Inicio Rápido

│   │   ├── auth.js

│   │   ├── modules.jsnpm install

│   │   ├── findings.js

│   │   └── leakedPasswords.jsng serve```bash

│   └── package.json

│# O compilar para producción:

├── frontend/                       # Angular 18 SPA

│   ├── src/# npx ng build### Prerequisitos

│   │   ├── app/

│   │   │   ├── app.component.ts   # Componente raíz```

│   │   │   ├── app-routing.module.ts

│   │   │   ├── components/**Aplicación en:** `http://localhost:4200` (dev) o `http://localhost:4000` (dist servido por backend)- Node.js 18+cd backend### Opción 2: Manual

│   │   │   │   └── sidebar/       # Navegación lateral

│   │   │   ├── core/

│   │   │   │   ├── guards/

│   │   │   │   │   └── rbac.guard.ts### 3. Login- npm 9+

│   │   │   │   └── services/

│   │   │   │       ├── auth.service.ts```

│   │   │   │       └── module-registry.service.ts

│   │   │   ├── features/Usuario: ownernode simple-server.js```bash

│   │   │   │   └── bitacora/      # Módulo interno ejemplo

│   │   │   └── shared/Contraseña: admin123

│   │   │       └── models/

│   │   │           └── interfaces.ts```### 1. Backend (API + Proxy)

│   │   ├── index.html

│   │   ├── main.ts

│   │   └── styles.scss

│   └── package.json## 💾 Sistema de Storage```bash```# 1. Abrir una terminal y levantar el backend:

│

├── CHANGELOG.md                    # Historia del proyecto y problemas conocidos

├── README_FRONTEND.md              # Documentación específica Angular

├── STORAGE_SETUP.md                # Guía completa del sistema de storage**Ver documentación completa:** [STORAGE_SETUP.md](STORAGE_SETUP.md)cd backend

├── ARQUITECTURA_STORAGE.md         # Análisis arquitectura storage (3 opciones)

├── IFRAME_TROUBLESHOOTING.md       # ⚠️ Por qué falló iframe y soluciones

├── MODULOS_INTERNOS.md             # 📦 Guía completa para agregar módulos internos

└── README.md                       # Este archivoEl sistema incluye storage modular con:npm installAbrir navegador en: **http://localhost:4000**cd backend

```

- Carpeta separada por cada módulo (`bitacora-soc/`, `siem/`, `forensics/`, etc.)

## 🗄️ Storage Modular Portátil

- Fácil migración a NFS, Samba, otro disco o nubenode simple-server.js

El sistema incluye gestión de archivos modular con carpeta por módulo y capacidad de migración:

- Metadata en JSON (no requiere BD)

### Estructura de Carpetas

- API REST completa para upload/download/list/delete```node simple-server.js

```

C:\ramen-storage\                   # Ruta configurable- Control de acceso con JWT

├── _metadata\                      # Metadatos JSON de archivos

├── bitacora-soc\**Servidor corriendo en:** `http://localhost:4000`

│   ├── evidences\                  # Capturas, logs, reportes

│   ├── reports\```

│   └── attachments\

├── siem\C:\ramen-storage\## 🔐 Credenciales

│   ├── logs\

│   └── alerts\├── _metadata\          (JSON con info de archivos)

├── forensics\

│   ├── disk-images\├── bitacora-soc\       (Archivos del módulo)### 2. Frontend (Angular SPA)

│   └── memory-dumps\

└── vulnerability-scan\│   ├── images\

    ├── scan-results\

    └── reports\│   ├── documents\```bash# 2. Abrir demo.html en tu navegador (doble clic)

```

│   ├── evidences\

### Migración Fácil

│   └── logs\cd frontend

El storage puede moverse a cualquier ubicación sin modificar código:

├── siem\

```javascript

// Migrar a otro disco duro├── forensics\npm install- Usuario: **`owner`**```

POST /api/storage/migrate

{└── shared\

  "newPath": "D:\\ramen-backup",

  "operation": "copy"  // o "move"```ng serve

}



// Migrar a NFS

{### Migrar Storage a Otra Ubicación# O compilar para producción:- Contraseña: **`admin123`**

  "newPath": "Z:\\ramen-storage",  // Unidad de red montada

  "operation": "move"

}

```bash# npx ng build

// Migrar a Samba/CIFS

{# Desde API (sin reiniciar)

  "newPath": "\\\\servidor\\share\\ramen",

  "operation": "copy"curl -X POST http://localhost:4000/api/storage/migrate \```### 🔑 Credenciales de acceso:

}

```  -H "Authorization: Bearer OWNER_TOKEN" \



**Ver documentación completa:** [STORAGE_SETUP.md](STORAGE_SETUP.md)  -d '{"newPath": "D:\\ramen-storage", "copyOnly": false}'**Aplicación en:** `http://localhost:4200` (dev) o `http://localhost:4000` (dist servido por backend)



## 🔑 Autenticación y Roles



### Sistema de Roles (RBAC)# O editar backend/storage-config.js y reiniciar## ✨ Características- **Usuario:** `owner`



| Rol | Permisos | Descripción |```

|-----|----------|-------------|

| **Owner** | Todos | Control total del sistema |### 3. Login

| **Admin** | Gestión usuarios, módulos, RBAC, branding | Administrador operacional |

| **SOC** | Visualizar módulos asignados, crear hallazgos | Analista de seguridad |## 🏗️ Arquitectura

| **User** | Visualizar módulos básicos | Usuario final limitado |

```- **Password:** `admin123`

### Permisos Disponibles (20)

```

```javascript

[ramen/Usuario: owner

  'view.dashboard',

  'view.modules',├── backend/

  'manage.users',

  'manage.modules',│   ├── simple-server.js          # API Express + static serverContraseña: admin123✅ Login animado con logo ramen SVG  

  'manage.rbac',

  'manage.branding',│   ├── storage-manager.js        # Sistema de storage modular

  'view.logs',

  'manage.storage',│   ├── storage-config.js         # Configuración de storage```

  'delete.storage',

  'migrate.storage',│   ├── module-manager.js         # Gestor de módulos locales

  // ... (ver lista completa en código)

]│   ├── logger.js                 # Sistema de logs✅ Autenticación JWT (8h expiry)  ## 📊 Estado Actual del Sistema

```

│   ├── routes/                   # OAuth routes (preparado)

## 🔌 API Endpoints

│   └── models/                   # Schemas Mongoose (no usado en demo)## 🏗️ Arquitectura

### Autenticación

├── frontend/

```http

POST /api/auth/login│   ├── src/app/✅ RBAC con 4 roles (Owner/Admin/User/Visor)  

POST /api/auth/logout

GET  /api/auth/validate│   │   ├── features/             # Módulos funcionales

GET  /api/auth/me

```│   │   │   ├── auth/             # Login + guards```



### Módulos│   │   │   ├── admin/            # Panel administración



```http│   │   │   ├── module-viewer/   # Visor de módulosramen/✅ Sidebar dinámico con animaciones  ### ✅ LO QUE FUNCIONA AHORA:

GET    /api/modules              # Listar módulos disponibles para el usuario

GET    /api/modules/all          # Todos los módulos (Admin)│   │   │   └── bitacora/         # Ejemplo módulo interno

POST   /api/modules              # Crear módulo (Admin)

PUT    /api/modules/:id          # Actualizar módulo (Admin)│   │   ├── components/           # Sidebar, etc.├── backend/

DELETE /api/modules/:id          # Eliminar módulo (Owner)

GET    /api/modules/:id/access   # Verificar acceso│   │   ├── core/                 # Services, guards, interceptors

```

│   │   └── shared/               # Modelos compartidos│   ├── simple-server.js          # API Express + static server✅ Backend Express + Frontend Angular  - **Backend API** en puerto 3001 (sin necesidad de MongoDB)

### Usuarios

│   └── dist/ramen-frontend/      # Build de producción

```http

GET    /api/users                # Listar usuarios (Admin)└── modules/                      # Módulos Node.js locales (ejecutados por module-manager)│   ├── module-manager.js         # Gestor de módulos locales

POST   /api/users                # Crear usuario (Admin)

PUT    /api/users/:id            # Actualizar usuario (Admin)```

DELETE /api/users/:id            # Eliminar usuario (Owner)

PATCH  /api/users/:id/password   # Cambiar contraseña│   ├── logger.js                 # Sistema de logs✅ Sin Docker, sin MongoDB (in-memory DB)- **Autenticación JWT** con bcrypt

```

### Stack Tecnológico

### Storage (Archivos/Evidencias)

│   ├── routes/                   # OAuth routes (preparado)

```http

POST   /api/storage/upload                 # Subir archivo**Backend:**

GET    /api/storage/files/:fileId          # Descargar archivo

GET    /api/storage/files                  # Listar archivos (con filtros)- Express 4.18.2│   └── models/                   # Schemas Mongoose (no usado en demo)- **Endpoints REST**:

DELETE /api/storage/files/:fileId          # Eliminar archivo (Admin/Owner)

GET    /api/storage/stats                  # Estadísticas de uso- JWT (jsonwebtoken 9.0.0)

POST   /api/storage/migrate                # Migrar storage (Owner)

```- Bcrypt 2.4.3├── frontend/



### Hallazgos (Findings)- Multer 1.4.5 (file uploads)



```http- http-proxy-middleware 2.0.9│   ├── src/app/## 🎨 Tecnologías  - `POST /api/auth/login` - Login con JWT

GET    /api/findings             # Listar hallazgos

POST   /api/findings             # Crear hallazgo- Helmet + CORS

GET    /api/findings/:id         # Obtener detalles

PUT    /api/findings/:id         # Actualizar│   │   ├── features/             # Módulos funcionales

DELETE /api/findings/:id         # Eliminar

```**Frontend:**



### Logs- Angular 16.2.0│   │   │   ├── auth/             # Login + guards  - `GET /api/modules` - Lista de módulos



```http- Angular Material 16.2.14

GET    /api/logs                 # Listar logs con filtros

POST   /api/logs                 # Crear log- RxJS 7.8.0│   │   │   ├── admin/            # Panel administración

DELETE /api/logs                 # Limpiar logs (Owner)

```- Anime.js (loading animation)



### RBAC- TypeScript 5.1.3│   │   │   ├── module-viewer/   # Visor de módulos**Frontend**: Angular 16, Material, anime.js, TypeScript    - `GET /api/leaked` - Contraseñas filtradas



```http

GET    /api/rbac/roles           # Listar roles

PUT    /api/rbac/roles/:role     # Actualizar permisos de rol## 📦 Tipos de Módulos│   │   │   └── bitacora/         # Ejemplo módulo interno

GET    /api/rbac/permissions     # Listar permisos disponibles

```



### Branding### 1. **iframe** - Aplicaciones externas embebidas│   │   ├── components/           # Sidebar, etc.**Backend**: Express, JWT, bcrypt, helmet, CORS  - `GET /api/findings` - Hallazgos



```http```javascript

GET    /api/branding             # Obtener configuración

PUT    /api/branding             # Actualizar (Admin){│   │   ├── core/                 # Services, guards, interceptors

POST   /api/branding/logo        # Subir logo

DELETE /api/branding/logo        # Eliminar logo  _id: '4',

```

  name: 'Bitacora SOC',│   │   └── shared/               # Modelos compartidos  - `GET /api/health` - Estado del sistema

## 🎨 Personalización (Branding)

  baseUrl: 'http://localhost:4000/proxy-bitacora',  // Proxy que elimina X-Frame-Options

El sistema permite personalizar:

  embedType: 'iframe',│   └── dist/ramen-frontend/      # Build de producción

- **Logos:** Principal y loading

- **Colores:** Primario, secundario, fondo  allowedRoles: ['Owner', 'Admin'],

- **Textos:** Nombre del sistema, título, descripción

- **Animación de carga:** Habilitar/deshabilitar  icon: 'security'└── modules/                      # Módulos Node.js locales (ejecutados por module-manager)## 📁 Estructura- **Demo HTML** funcional con login y navegación



```javascript}

// Ejemplo de configuración

{``````

  "systemName": "Mi SOC",

  "colors": {**Nota:** Si el servidor externo tiene `X-Frame-Options: SAMEORIGIN`, usar proxy o cambiar a `link`.

    "primary": "#1976d2",

    "secondary": "#424242",- **Base de datos en memoria** (no requiere MongoDB instalado)

    "background": "#fafafa"

  },### 2. **link** - Nueva pestaña

  "logos": {

    "main": "/assets/logos/main.svg",```javascript### Stack Tecnológico

    "loading": "/assets/logos/loading.gif"

  }{

}

```  _id: '5',```



## 📦 Tipos de Módulos  name: 'Tool Externa',



### 1. Módulos Externos (iframe)  baseUrl: 'https://external-tool.com',**Backend:**



Aplicaciones web existentes que se cargan dentro de Ramen en un iframe.  embedType: 'link',



```javascript  allowedRoles: ['Admin']- Express 4.18.2ramen/### 🔧 Verificar que todo funcione:

{

  name: 'Bitacora SOC',}

  baseUrl: 'http://10.0.100.13:8477',

  embedType: 'iframe',```- JWT (jsonwebtoken 9.0.0)

  allowedRoles: ['Owner', 'Admin', 'SOC']

}

```

### 3. **proxy** - Módulos Node.js locales- Bcrypt 2.4.3├── backend/simple-server.js    # API + Static server```powershell

⚠️ **IMPORTANTE:** El servidor externo debe permitir iframe. Ver [IFRAME_TROUBLESHOOTING.md](IFRAME_TROUBLESHOOTING.md) para problemas de `X-Frame-Options`.

```javascript

### 2. Módulos Externos (link)

{- http-proxy-middleware 2.0.9

Aplicaciones que se abren en nueva pestaña.

  _id: '2',

```javascript

{  name: 'Bitácora React',- Helmet + CORS├── frontend/# Probar el backend:

  name: 'Sistema Legacy',

  baseUrl: 'http://old-system.local:3000',  baseUrl: '/app/bitacora',

  embedType: 'link',

  allowedRoles: ['Owner', 'Admin']  embedType: 'proxy',

}

```  command: 'node',



### 3. Módulos Internos (Angular Component)  args: ['server.js'],**Frontend:**│   ├── src/app/Invoke-RestMethod -Uri "http://localhost:3001/api/health"



Componentes Angular integrados directamente en Ramen.  devPort: 3001,



```javascript  allowedRoles: ['Admin', 'Owner']- Angular 16.2.0

{

  name: 'Gestión de Hallazgos',}

  type: 'internal',

  componentPath: 'findings',```- Angular Material 16.2.14│   │   ├── features/auth/      # Login

  allowedRoles: ['Owner', 'Admin', 'SOC']

}**Module Manager** ejecuta y gestiona el proceso automáticamente.

```

- RxJS 7.8.0

📦 **Ver guía completa:** [MODULOS_INTERNOS.md](MODULOS_INTERNOS.md) - Tutorial paso a paso para crear módulos internos.

## 🔧 Panel de Administración

## 🔧 Configuración

- Anime.js (loading animation)│   │   ├── components/         # Sidebar# Probar login:

### Variables de Entorno (opcional)

Acceso: `Admin Panel` en sidebar (solo roles Owner/Admin)

```bash

# Backend (.env)- TypeScript 5.1.3

PORT=4000

JWT_SECRET=tu_secret_aqui### Gestión de Usuarios

MONGO_URI=mongodb://localhost:27017/ramen

USE_MEMORY_DB=true  # true para modo demo sin MongoDB- Crear usuarios con roles│   │   └── core/guards/        # RBAC$body = @{username="owner";password="admin123"} | ConvertTo-Json



# Storage- Cambiar contraseñas

STORAGE_TYPE=local  # local | nfs | smb | s3

STORAGE_PATH=C:\ramen-storage- Bloquear/desbloquear## 📦 Tipos de Módulos

MAX_FILE_SIZE=104857600  # 100MB

- Eliminar (protegido: no se puede eliminar Owner)

# Frontend (environment.ts)

apiUrl: 'http://localhost:4000'│   ├── assets/ramen-logo.svg   # LogoInvoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -Body $body -ContentType "application/json"

```

### Gestión de Módulos

### Base de Datos

- Agregar módulos externos (iframe/link)### 1. **iframe** - Aplicaciones externas embebidas

**Opción 1: MongoDB (Producción)**

- Configurar módulos locales (proxy)

```bash

# Instalar MongoDB- Asignar roles de acceso```javascript│   └── dist/                   # Build

# Windows: https://www.mongodb.com/try/download/community

- Iniciar/detener módulos locales

# Iniciar servicio

net start MongoDB- Ver estado en tiempo real{



# Conectar Ramen

USE_MEMORY_DB=false

MONGO_URI=mongodb://localhost:27017/ramen### Branding  _id: '4',└── INICIAR.bat                 # Launcher# Ver módulos:

```

- Nombre de la aplicación

**Opción 2: In-Memory (Demo/Desarrollo)**

- Logo navbar y login  name: 'Bitacora SOC',

```bash

# Ya configurado por defecto- Colores primario/secundario

USE_MEMORY_DB=true

# No requiere MongoDB instalado- Animación de carga personalizada (URL)  baseUrl: 'http://localhost:4000/proxy-bitacora',  // Proxy que elimina X-Frame-Options```Invoke-RestMethod -Uri "http://localhost:3001/api/modules"

```



## 🧪 Testing

### RBAC (Matriz de Permisos)  embedType: 'iframe',

### Test Backend API

- Vista completa de 4 roles × 20 permisos

```powershell

# Login- Modificación visual (próximamente)  allowedRoles: ['Owner', 'Admin'],```

$response = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" `

  -Method POST `

  -ContentType "application/json" `

  -Body '{"username":"owner","password":"pass"}'### Logs  icon: 'security'



$token = $response.token- Filtrar por nivel (info, warning, error, success)



# Listar módulos- Filtrar por módulo}## 🌐 API

Invoke-RestMethod -Uri "http://localhost:4000/api/modules" `

  -Headers @{ Authorization = "Bearer $token" }- Filtrar por usuario



# Subir archivo- Exportar (próximamente)```

$file = Get-Item "C:\test\evidence.png"

$form = @{

  file = $file

  moduleId = "bitacora-soc"## 📡 API Endpoints**Nota:** Si el servidor externo tiene `X-Frame-Options: SAMEORIGIN`, usar proxy o cambiar a `link`.**Notas importantes**

  category = "evidences"

}

Invoke-RestMethod -Uri "http://localhost:4000/api/storage/upload" `

  -Method POST `### Autenticación

  -Headers @{ Authorization = "Bearer $token" } `

  -Form $form```

```

POST   /api/auth/login              # { username, password }### 2. **link** - Nueva pestaña- `POST /api/auth/login` - Login- No incluye `node_modules`.

### Test Frontend

POST   /api/auth/change-password    # { oldPassword, newPassword }

```bash

# DesarrolloGET    /api/auth/me                 # Info usuario actual```javascript

cd frontend

ng serve```

# Abrir http://localhost:4200

{- `GET /api/modules` - Módulos- No levanta Docker (por petición). Debes tener MongoDB accesible (`mongodb://localhost:27017/ramen` por defecto).

# Producción

ng build### Módulos

# Archivos en frontend/dist/

# Servirlos desde backend en http://localhost:4000```  _id: '5',

```

GET    /api/modules                 # Lista todos

## 📊 Logs y Auditoría

GET    /api/modules/:id             # Detalle módulo  name: 'Tool Externa',- `GET /api/health` - Status- Ejecuta backend y frontend por separado.

El sistema registra todas las operaciones en la base de datos:

POST   /api/modules                 # Crear módulo

```javascript

{PUT    /api/modules/:id             # Actualizar  baseUrl: 'https://external-tool.com',

  level: 'info' | 'warn' | 'error',

  module: 'auth' | 'modules' | 'storage' | 'users',DELETE /api/modules/:id             # Eliminar

  message: 'Descripción del evento',

  userId: ObjectId,POST   /api/modules/:id/start       # Iniciar (solo proxy)  embedType: 'link',

  username: 'owner',

  metadata: { /* datos adicionales */ },POST   /api/modules/:id/stop        # Detener (solo proxy)

  timestamp: Date

}```  allowedRoles: ['Admin']

```



**Filtros disponibles:**

- Por nivel de severidad### Usuarios}## 🛠️ Desarrollo## Instalación en Windows

- Por módulo

- Por usuario```

- Por rango de fechas

GET    /api/users                   # Lista todos```

## 🚨 Problemas Conocidos y Soluciones

POST   /api/users                   # Crear { username, password, fullName, roles }

### Problema: Módulo externo no carga en iframe

PUT    /api/users/:id               # Actualizar

**Causa:** Servidor externo envía `X-Frame-Options: SAMEORIGIN` o `Content-Security-Policy: frame-ancestors 'self'`

DELETE /api/users/:id               # Eliminar (no Owner)

**Soluciones:**

1. **Modificar servidor externo** para permitir iframe (RECOMENDADO)PUT    /api/users/:id/block         # Bloquear### 3. **proxy** - Módulos Node.js locales

2. **Cambiar a `embedType: 'link'`** para abrir en nueva pestaña

3. **Usar proxy Nginx** como intermediarioPUT    /api/users/:id/unblock       # Desbloquear



📖 **Ver documentación completa:** [IFRAME_TROUBLESHOOTING.md](IFRAME_TROUBLESHOOTING.md)``````javascript```bash### Requisitos previos



### Problema: No puedo agregar módulos internos



**Causa:** Falta entender estructura de módulos internos### Storage (Nuevo){



**Solución:** Seguir guía paso a paso en [MODULOS_INTERNOS.md](MODULOS_INTERNOS.md)```



Los módulos internos requieren:POST   /api/storage/upload          # Subir archivo  _id: '2',# Backend1. Node.js 16+ instalado

- Componente Angular en `frontend/src/app/features/`

- API backend en `backend/routes/`GET    /api/storage/files/:fileId   # Descargar archivo

- Modelo Mongoose en `backend/models/`

- Registro en `app-routing.module.ts` y `simple-server.js`GET    /api/storage/files           # Listar archivos  name: 'Bitácora React',



### Problema: Error "Cannot connect to MongoDB"DELETE /api/storage/files/:fileId   # Eliminar (Admin/Owner)



**Solución:**GET    /api/storage/stats           # Estadísticas  baseUrl: '/app/bitacora',cd backend && npm install2. ~~MongoDB ejecutándose en `mongodb://localhost:27017`~~ ❌ NO NECESARIO para demo



```javascriptPOST   /api/storage/migrate         # Migrar ubicación (Owner)

// En backend/simple-server.js, habilitar modo in-memory

const USE_MEMORY_DB = true;  // Cambiar a true```  embedType: 'proxy',



// O instalar MongoDB y conectar

const USE_MEMORY_DB = false;

const MONGO_URI = 'mongodb://localhost:27017/ramen';### Branding  command: 'node',3. Angular CLI: `npm install -g @angular/cli` (solo para desarrollo Angular completo)

```

```

### Problema: Storage no guarda archivos

GET    /api/branding                # Obtener config  args: ['server.js'],

**Verificar:**

PUT    /api/branding                # Actualizar

1. Carpeta existe y tiene permisos de escritura

2. `STORAGE_PATH` configurado correctamente```  devPort: 3001,# Frontend

3. Archivo no excede `MAX_FILE_SIZE` (100MB default)

4. MIME type está en whitelist (`allowedMimeTypes`)



```javascript### Logs  allowedRoles: ['Admin', 'Owner']

// backend/storage-config.js

module.exports = {```

  storageType: 'local',

  local: {GET    /api/logs?level=info&module=auth&user=owner&limit=100}cd frontend && npm install && npx ng build### Configuración de dominio local (opcional)

    storagePath: 'C:\\ramen-storage'  // Verificar esta ruta

  },```

  maxFileSize: 104857600,  // 100MB

  allowedMimeTypes: [```

    'image/png',

    'image/jpeg',### Salud

    'application/pdf',

    // ... agregar tipos necesarios```**Module Manager** ejecuta y gestiona el proceso automáticamente.```Para usar `ramen.local` en Windows, edita el archivo hosts:

  ]

};GET    /api/health                  # Estado del sistema

```

```

## 📚 Documentación Adicional



- **[CHANGELOG.md](CHANGELOG.md)** - Historia del proyecto, versiones y problemas conocidos

- **[README_FRONTEND.md](README_FRONTEND.md)** - Documentación específica de Angular## 🔒 Seguridad## 🔧 Panel de Administración1. Abre como administrador: `C:\Windows\System32\drivers\etc\hosts`

- **[STORAGE_SETUP.md](STORAGE_SETUP.md)** - Guía completa del sistema de storage

- **[ARQUITECTURA_STORAGE.md](ARQUITECTURA_STORAGE.md)** - Análisis de arquitecturas de storage (3 opciones)

- **[IFRAME_TROUBLESHOOTING.md](IFRAME_TROUBLESHOOTING.md)** - Por qué falló iframe y cómo solucionarlo

- **[MODULOS_INTERNOS.md](MODULOS_INTERNOS.md)** - Guía completa para crear módulos internos- **JWT** con expiración 8h, almacenado en localStorage como `ramen_token`



## 🛠️ Stack Tecnológico- **Bcrypt** para passwords (10 rounds)



### Backend- **CORS** configurado para permitir frontendAcceso: `Admin Panel` en sidebar (solo roles Owner/Admin)---2. Agrega la línea: `127.0.0.1 ramen.local`



- Node.js 18+- **Helmet.js** para headers de seguridad (CSP deshabilitado para demo)

- Express 4.18.2

- MongoDB + Mongoose (opcional, con modo in-memory)- **Guards RBAC** en frontend verifican permisos en cada ruta

- JWT (jsonwebtoken 9.0.2)

- Multer 1.4.5 (file upload)- **Protección Owner:** No se puede eliminar el usuario Owner

- Bcrypt (password hashing)

- **Logout cache clear:** Redirect con `?nocache` timestamp### Gestión de UsuariosHecho con ❤️ y 🍜

### Frontend

- **File upload validation:** Tipos MIME whitelist, límite 100MB

- Angular 18.2.0

- TypeScript 5.5- Crear usuarios con roles

- RxJS 7.8

- Angular Material (futuro)## 🐛 Troubleshooting

- SCSS

- Cambiar contraseñas### Instalación y ejecución

## 👥 Usuarios de Ejemplo

### Puerto 4000 ocupado

El sistema viene con 4 usuarios precargados:

```powershell- Bloquear/desbloquear

| Username | Password | Rol | Descripción |

|----------|----------|-----|-------------|# Windows

| owner | pass | Owner | Control total del sistema |

| admin | pass | Admin | Administrador operacional |Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process -Force- Eliminar (protegido: no se puede eliminar Owner)1. **Backend**:

| soc_analyst | pass | SOC | Analista de seguridad |

| user | pass | User | Usuario final limitado |



⚠️ **CAMBIAR CONTRASEÑAS EN PRODUCCIÓN**# Linux/Mac```bash



## 🔐 Seguridadlsof -ti:4000 | xargs kill -9



### Implementado```### Gestión de Móduloscd backend



- ✅ JWT con expiración 8h

- ✅ Contraseñas hasheadas con bcrypt

- ✅ RBAC granular por endpoint### F5 muestra página en blanco (Angular)- Agregar módulos externos (iframe/link)npm install

- ✅ Validación de MIME types en uploads

- ✅ Límite de tamaño de archivos**Solución ya implementada:** `<base href="/">` en `index.html`

- ✅ Sanitización de nombres de archivo

- ✅ Hash SHA256 para verificación de integridad- Configurar módulos locales (proxy)npm run seed    # Crea usuario owner/admin123

- ✅ Logs de auditoría

### Módulos iframe no cargan

### Pendiente

**Problema:** Servidor externo envía `X-Frame-Options: SAMEORIGIN`  - Asignar roles de accesonpm start       # Puerto 4000

- ⚠️ HTTPS/TLS en producción

- ⚠️ Rate limiting**Soluciones:**

- ⚠️ CSRF tokens

- ⚠️ Helmet.js headers1. Usar proxy inverso configurado en backend (`/proxy-bitacora`)- Iniciar/detener módulos locales```

- ⚠️ OAuth/OIDC integration

2. Pedir al administrador del servidor externo que quite ese header

## 🚀 Despliegue en Producción

3. Cambiar módulo a `embedType: 'link'` para abrir en nueva pestaña- Ver estado en tiempo real

### Backend



```bash

cd backend### YouTube no carga en iframe2. **Frontend**:

npm install --production

NODE_ENV=production node simple-server.js**Error común:** Usar URL corta `https://youtu.be/...`  

```

**Solución:** Usar URL embed `https://www.youtube.com/embed/VIDEO_ID`### Branding```bash

**Recomendaciones:**

- Usar PM2 para gestión de procesos

- Configurar nginx como reverse proxy

- Habilitar HTTPS con certificado SSL### Brave Browser bloquea iframes- Nombre de la aplicacióncd frontend

- Configurar MongoDB con autenticación

- Mover storage a NFS/SAN/S3 para escalabilidad**Solución:** Desactivar Shields para `localhost` (icono del león en barra de direcciones)



### Frontend- Logo navbar y loginnpm install



```bash### Storage no se crea

cd frontend

npm install**Problema:** Permisos en carpeta destino  - Colores primario/secundariong serve --port 4200

npx ng build --configuration production

# Copiar dist/ a servidor web o servir desde backend**Solución Windows:** Ejecutar PowerShell como Administrador  

```

**Solución Linux:** `sudo chown -R $USER:$USER /var/ramen-storage`- Animación de carga personalizada (URL)```

### Docker (futuro)



```dockerfile

# Dockerfile pendiente de crear## 📊 Estado Actual (Noviembre 2025)

# docker build -t ramen-soc .

# docker run -p 4000:4000 ramen-soc

```

### ✅ Completamente Funcional### RBAC (Matriz de Permisos)**NOTA IMPORTANTE**: Si no tienes Angular CLI instalado:

## 🤝 Contribución

- Autenticación JWT

Para agregar nuevos módulos internos, seguir la guía en [MODULOS_INTERNOS.md](MODULOS_INTERNOS.md).

- Sistema de roles y permisos- Vista completa de 4 roles × 20 permisos```bash

Para reportar problemas de iframe con módulos externos, consultar [IFRAME_TROUBLESHOOTING.md](IFRAME_TROUBLESHOOTING.md).

- Panel de administración

## 📄 Licencia

- Gestión de usuarios (CRUD + bloqueo + cambio password)- Modificación visual (próximamente)npm install -g @angular/cli@16

[Licencia pendiente de definir]

- Gestión de módulos

## 📞 Soporte

- Branding personalizable```

Para problemas técnicos:

1. Revisar [CHANGELOG.md](CHANGELOG.md) - Problemas conocidos- Sistema de logs

2. Consultar [IFRAME_TROUBLESHOOTING.md](IFRAME_TROUBLESHOOTING.md) - Problemas de iframe

3. Ver [MODULOS_INTERNOS.md](MODULOS_INTERNOS.md) - Desarrollo de módulos- **Storage modular portable**### Logs

4. Contactar al equipo de desarrollo

- Module Manager (módulos locales Node.js)

---

- Module Viewer (iframe/link/proxy)- Filtrar por nivel (info, warning, error, success)### Verificar que todo funcione

**Desarrollado por:** [Tu equipo]  

**Versión:** 1.0.0  - Filtrado de módulos por roles en sidebar

**Última actualización:** Noviembre 2025

- Proxy inverso para módulos externos- Filtrar por módulo1. Backend en http://localhost:4000

- Routing dinámico

- Filtrar por usuario2. Frontend en http://localhost:4200  

### ⚠️ Limitaciones Conocidas

- **Base de datos en memoria:** Se resetea al reiniciar servidor- Exportar (próximamente)3. Login con usuario: `owner`, password: `admin123`

- **Iframes externos:** Requieren que servidor origen permita embeds o usar proxy

- **OAuth:** Estructura preparada pero no configurado para producción

- **Sin persistencia BD:** Cambios se pierden al reiniciar (storage SÍ persiste)

## 📡 API Endpoints### Problemas conocidos y soluciones

### 🔜 Roadmap

- [ ] Persistencia real (MongoDB/PostgreSQL)- Si hay errores de TypeScript en el frontend, ejecuta `npm install` en la carpeta frontend

- [ ] OAuth/OIDC producción

- [ ] Tests unitarios y e2e### Autenticación- Si JWT decode falla, verifica que estés usando jwt-decode v4.x

- [ ] CI/CD pipeline

- [ ] Documentación API (Swagger/OpenAPI)```- MongoDB debe estar ejecutándose en el puerto 27017

- [ ] Rate limiting activo

- [ ] Exportación de logsPOST   /api/auth/login              # { username, password }

- [ ] Edición visual de permisos RBAC

- [ ] Module Federation para microfrontendsPOST   /api/auth/change-password    # { oldPassword, newPassword }### Login inicial

- [ ] Respaldo automático de storage

- [ ] Limpieza automática de archivos antiguosGET    /api/auth/me                 # Info usuario actual- Usuario: `owner`

- [ ] Thumbnail generation para imágenes

- [ ] Virus scanning de uploads```- Password: `admin123`



## 📄 Documentación Adicional



- [STORAGE_SETUP.md](STORAGE_SETUP.md) - Sistema de almacenamiento modular### Módulos## Estructura generada según prompt

- [STORAGE_ARCHITECTURE.md](ARQUITECTURA_STORAGE.md) - Opciones de arquitectura storage

- [CHANGELOG.md](CHANGELOG.md) - Historia del proyecto y cambios```Este código fue generado siguiendo las especificaciones del archivo `pomp.md` que incluye:

- [frontend/README_FRONTEND.md](frontend/README_FRONTEND.md) - Documentación Angular

GET    /api/modules                 # Lista todos- Orquestador SOC con RBAC

## 📄 Licencia

GET    /api/modules/:id             # Detalle módulo- Integración de microfrontends (Module Federation, iframe, proxy)

Proyecto interno - Synet SPA © 2025

POST   /api/modules                 # Crear módulo- Autenticación JWT local con hooks para OIDC futuro

---

PUT    /api/modules/:id             # Actualizar- Sidebar animado con anime.js

Hecho con ❤️ y 🍜

DELETE /api/modules/:id             # Eliminar- MongoDB como base de datos

POST   /api/modules/:id/start       # Iniciar (solo proxy)
POST   /api/modules/:id/stop        # Detener (solo proxy)
```

### Usuarios
```
GET    /api/users                   # Lista todos
POST   /api/users                   # Crear { username, password, fullName, roles }
PUT    /api/users/:id               # Actualizar
DELETE /api/users/:id               # Eliminar (no Owner)
PUT    /api/users/:id/block         # Bloquear
PUT    /api/users/:id/unblock       # Desbloquear
```

### Branding
```
GET    /api/branding                # Obtener config
PUT    /api/branding                # Actualizar
```

### Logs
```
GET    /api/logs?level=info&module=auth&user=owner&limit=100
```

### Salud
```
GET    /api/health                  # Estado del sistema
```

## 🔒 Seguridad

- **JWT** con expiración 8h, almacenado en localStorage como `ramen_token`
- **Bcrypt** para passwords (10 rounds)
- **CORS** configurado para permitir frontend
- **Helmet.js** para headers de seguridad (CSP deshabilitado para demo)
- **Guards RBAC** en frontend verifican permisos en cada ruta
- **Protección Owner:** No se puede eliminar el usuario Owner
- **Logout cache clear:** Redirect con `?nocache` timestamp

## 🐛 Troubleshooting

### Puerto 4000 ocupado
```powershell
# Windows
Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process -Force

# Linux/Mac
lsof -ti:4000 | xargs kill -9
```

### F5 muestra página en blanco (Angular)
**Solución ya implementada:** `<base href="/">` en `index.html`

### Módulos iframe no cargan
**Problema:** Servidor externo envía `X-Frame-Options: SAMEORIGIN`  
**Soluciones:**
1. Usar proxy inverso configurado en backend (`/proxy-bitacora`)
2. Pedir al administrador del servidor externo que quite ese header
3. Cambiar módulo a `embedType: 'link'` para abrir en nueva pestaña

### YouTube no carga en iframe
**Error común:** Usar URL corta `https://youtu.be/...`  
**Solución:** Usar URL embed `https://www.youtube.com/embed/VIDEO_ID`

### Brave Browser bloquea iframes
**Solución:** Desactivar Shields para `localhost` (icono del león en barra de direcciones)

## 📊 Estado Actual (Noviembre 2025)

### ✅ Completamente Funcional
- Autenticación JWT
- Sistema de roles y permisos
- Panel de administración
- Gestión de usuarios (CRUD + bloqueo + cambio password)
- Gestión de módulos
- Branding personalizable
- Sistema de logs
- Module Manager (módulos locales Node.js)
- Module Viewer (iframe/link/proxy)
- Filtrado de módulos por roles en sidebar
- Proxy inverso para módulos externos
- Routing dinámico

### ⚠️ Limitaciones Conocidas
- **Base de datos en memoria:** Se resetea al reiniciar servidor
- **Iframes externos:** Requieren que servidor origen permita embeds o usar proxy
- **OAuth:** Estructura preparada pero no configurado para producción
- **Sin persistencia:** Cambios se pierden al reiniciar

### 🔜 Roadmap
- [ ] Persistencia real (MongoDB/PostgreSQL)
- [ ] OAuth/OIDC producción
- [ ] Tests unitarios y e2e
- [ ] CI/CD pipeline
- [ ] Documentación API (Swagger/OpenAPI)
- [ ] Rate limiting activo
- [ ] Exportación de logs
- [ ] Edición visual de permisos RBAC
- [ ] Module Federation para microfrontends

## 📄 Licencia

**Business Source License 1.1**

Copyright (c) 2025 Synet SPA

Este proyecto está licenciado bajo **Business Source License 1.1 (BSL 1.1)**.

### 📋 Resumen de la Licencia

- ✅ **Uso gratuito** para propósitos no comerciales, académicos, investigación y evaluación
- ✅ **Puede ofrecer servicios** de consultoría, instalación, soporte y capacitación
- ❌ **Requiere licencia comercial** para uso en producción comercial, SaaS, o reventa
- 📅 **Se convierte en MIT License** el 11 de noviembre de 2029 (4 años)

**Ver:** [LICENSE](LICENSE) para términos completos y detalles

**Licencia comercial:** Contactar a través de GitHub Issues para consultas comerciales

---

Hecho con ❤️ y 🍜 por Synet SPA

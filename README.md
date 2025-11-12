<div align="center">

# 🍜 Ramen SOC – Orquestador de Módulos

**Plataforma para centralizar módulos SOC (internos y externos) en un único acceso seguro.**

[![License: BSL 1.1](https://img.shields.io/badge/License-BSL%201.1-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen)](https://nodejs.org/en)
[![Angular](https://img.shields.io/badge/angular-16.2-red)](https://angular.io/)
[![Contributions](https://img.shields.io/badge/PRs-welcome-blue.svg)](CONTRIBUTING.md)

[Características](#-características-principales) · [Inicio Rápido](#-inicio-rápido) · [Documentación](#-documentación-clave) · [Estructura](#-estructura-del-proyecto)

</div>

---

## ✅ Características principales

### Identidad y gobierno
- Autenticación JWT integrada (8 h de validez) con un solo punto de login.
- RBAC con roles Owner / Admin / SOC / User y guardas en el frontend Angular.
- Logger estructurado centralizado que registra:
  - Acciones de usuarios (login, edición, consultas).
  - Peticiones y respuestas del proxy a módulos externos.
  - Códigos de estado HTTP (200, 304, 408, etc.) con nivel apropiado (info/warning/error).
  - Consultas por nivel, módulo, usuario y limpieza controlada.

### Orquestación de módulos
- Registro de módulos internos (proxy Node.js) y externos (iframe/link/proxy).
- **Module Manager** para validar, instalar dependencias y ejecutar módulos Node.js aislados.
- **Proxy inverso inteligente** con:
  - Limpieza de `X-Frame-Options` para módulos externos que deben mostrarse en iframes.
  - Reescritura automática de URLs en HTML y JavaScript para assets y APIs.
  - Inyección de interceptores JavaScript para fetch() y XMLHttpRequest.
  - Manejo correcto de POST/PUT/PATCH con reenvío de body JSON.
  - Timeouts configurables (60s) para servidores lentos.
  - Logging centralizado de todas las peticiones y respuestas del proxy.
- Eliminación de módulos completa (estado en memoria + archivos en disco).

### Configuración dinámica
- Sistema de plantillas y formularios por módulo (`/api/module-config`) con soporte para:
  - Campos `adminOnly`, secciones, workflows y valores por defecto.
  - Listas configurables (severidades, contactos, etc.).
  - Políticas y SLAs versionados por módulo.
- Servicio Angular y componente de administración (`ModuleConfigComponent`) para editar plantillas.

### Storage y utilidades
- Storage modular organizado por módulo/categoría con `StorageManager` y drivers configurables.
- Scripts de pruebas (`test-api.ps1`, `test-module-config.ps1`, `test-zip-validation.ps1`).
- Documentación extensa (más de 10 guías específicas) y scripts de bootstrap (`setup.sh`, `prepare-github.ps1`).

---

## 🚀 Inicio Rápido

> **Requisitos**: Node.js 18+

### Inicio Simple (1 comando)

El frontend ya está pre-compilado. Solo necesitas iniciar el backend:

#### Windows
```bash
# Opción 1: Doble clic en start.bat

# Opción 2: PowerShell
.\start.ps1

# Opción 3: Directo
cd backend
npm install
node simple-server.js
```

#### Linux/Mac
```bash
cd backend
npm install
node simple-server.js
```

**Eso es todo.** El servidor inicia en **3-5 segundos** y sirve:
- 🌐 Frontend (Angular) en: `http://localhost:4000`
- 📡 API REST en: `http://localhost:4000/api/*`

### 🔑 Acceso

Abre `http://localhost:4000` y usa:
- Usuario: `owner`
- Password: `admin123`

### ⚙️ Opciones Avanzadas

#### Recompilar el frontend (solo si modificas código Angular)

```bash
cd frontend
npm install
npm run build
```

El build genera `frontend/dist/ramen-frontend/` que el backend sirve automáticamente.

#### Backend con MongoDB (Producción)

Para persistencia real en lugar de memoria:

```bash
cd backend
npm install

# Linux/Mac:
export MONGO_URI="mongodb://localhost:27017/ramen"

# Windows PowerShell:
$env:MONGO_URI="mongodb://localhost:27017/ramen"

node server.js
```

> **⚠️ IMPORTANTE**: Cambia las credenciales `owner/admin123` en producción desde el panel de administración.

---

---

## 📁 Estructura del proyecto

```
ramen/
├── backend/                    # API Express, Module Manager y Storage
│   ├── simple-server.js        # Entrada principal (modo demo / in-memory)
│   ├── server.js               # Entrada con MongoDB
│   ├── routes/                 # Auth, modules, findings, module-config, storage
│   ├── models/                 # Schemas Mongoose (usuarios, módulos, findings, configs)
│   ├── module-manager.js       # Guardado, instalación y ejecución de módulos
│   ├── storage-manager.js      # API de almacenamiento por módulo/categoría
│   └── test-*.ps1              # Pruebas automáticas (API, módulos, ZIP, config)
├── frontend/                   # Angular 16 SPA
│   ├── src/app/core            # Servicios (auth, module-config, module registry) y guards
│   ├── src/app/features        # Panel admin, módulo Bitácora, configuración de módulos
│   └── README_FRONTEND.md      # Documentación específica del cliente
├── modules/                    # Carpeta destino para módulos internos generados
├── storage/                    # Raíz local del storage modular
├── CONFIGURACION_MODULOS.md    # Diseño detallado del sistema de plantillas
├── MODULOS_INTERNOS.md         # Tutorial para crear módulos internos
├── STORAGE_SETUP.md / ARQUITECTURA_STORAGE.md
├── IFRAME_TROUBLESHOOTING.md   # Guía para proxys y X-Frame-Options
└── TECHNICAL_REFERENCE.md      # Endpoints y notas técnicas adicionales
```

---

## 📚 Documentación clave

| Documento | Contenido |
|-----------|-----------|
| [`CONFIGURACION_MODULOS.md`](CONFIGURACION_MODULOS.md) | Arquitectura, endpoints y pruebas del sistema de plantillas/SLAs/listas. |
| [`MODULOS_INTERNOS.md`](MODULOS_INTERNOS.md) | Pasos para construir un módulo interno Angular y publicarlo en `modules/`. |
| [`MODULOS_EXTERNOS.md`](MODULOS_EXTERNOS.md) | **NUEVO** - Integración de sistemas externos vía proxy (Bitácora SOC, SIEM, etc.). |
| [`STORAGE_SETUP.md`](STORAGE_SETUP.md) & [`ARQUITECTURA_STORAGE.md`](ARQUITECTURA_STORAGE.md) | Diseño del storage modular, drivers soportados y estrategias de migración. |
| [`IFRAME_TROUBLESHOOTING.md`](IFRAME_TROUBLESHOOTING.md) | Motivos de bloqueos en iframes y configuración del proxy para evitarlos. |
| [`README_FRONTEND.md`](frontend/README_FRONTEND.md) | Instrucciones detalladas para el cliente Angular, guardas y componentes. |
| [`TECHNICAL_REFERENCE.md`](TECHNICAL_REFERENCE.md) | Resumen de endpoints REST, flujos y scripts de prueba. |
| [`pomp.md`](pomp.md) | Índice de documentación y estado general del proyecto. |

---

## 🧰 Utilidades y scripts

| Script | Uso |
|--------|-----|
| `INICIAR.bat` / `LEVANTAR_SISTEMA.bat` | Inician backend + frontend en Windows (modo demo). |
| `INICIAR_PROD.bat` | Variante para despliegues locales productivos. |
| `prepare-github.ps1` / `setup.sh` | Configuración rápida de repositorio y dependencias. |
| `test-api.ps1`, `test-module-config.ps1`, `test-zip-validation.ps1` | Suites de pruebas para API, sistema de plantillas y validación de módulos ZIP. |
| `EJEMPLO_SSO_THIRD_PARTY.html` | Ejemplo de consumo del endpoint SSO desde un módulo externo. |

---

## 🔐 Seguridad y contribuciones

- Revisa [SECURITY.md](SECURITY.md) antes de reportar vulnerabilidades.
- Las pautas de colaboración están en [CONTRIBUTING.md](CONTRIBUTING.md) y el checklist de GitHub en [GITHUB_SETUP.md](GITHUB_SETUP.md).

---

## 📄 Licencia

El código se distribuye bajo la [Business Source License 1.1](LICENSE). Consulta el archivo para conocer los términos completos.

---

¿Necesitas ayuda? Abre un issue o consulta los documentos especificados arriba. ¡Buen provecho! 🍜

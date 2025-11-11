# 📚 Estructura de Documentación - Proyecto Ramen

**Última actualización:** 11 de Noviembre, 2025

---

## 📖 Documentos Principales

### 1. **README.md** - Documentación General del Proyecto
**Ubicación:** `/README.md`  
**Propósito:** Punto de entrada, arquitectura, instalación, uso  
**Contenido:**
- Visión general del proyecto
- Arquitectura del sistema
- Instalación y configuración
- Estructura de carpetas
- Sistema de storage (local/S3/Azure)
- Autenticación y autorización
- API endpoints principales
- Módulos disponibles

**📌 Leer primero si eres nuevo en el proyecto**

---

### 2. **CONFIGURACION_MODULOS.md** - Sistema de Configuración ⭐
**Ubicación:** `/CONFIGURACION_MODULOS.md`  
**Propósito:** Diseño e implementación del sistema de configuración de módulos  
**Estado:** ✅ Backend completado | ⚠️ Frontend pendiente integración  
**Contenido:**
- Problema: Templates con campos bloqueados vs editables
- Arquitectura (3 opciones)
- Modelo de datos (Mongoose schema)
- API endpoints (15 endpoints)
- Control de acceso por rol
- Ejemplos de uso
- **Estado de implementación** (backend 100% funcional)

**📌 Leer para entender configuración de módulos y campos adminOnly**

---

### 3. **MODULOS_INTERNOS.md** - Guía para Agregar Módulos
**Ubicación:** `/MODULOS_INTERNOS.md`  
**Propósito:** Tutorial completo para desarrollar módulos internos en Angular  
**Contenido:**
- Diferencia entre módulos internos/externos
- Tutorial paso a paso (10 pasos)
- Estructura de archivos
- Routing y navegación
- Integración con sidebar
- RBAC y permisos
- Ejemplos completos
- Troubleshooting
- ❌ Lo que NO debes hacer

**📌 Leer antes de crear un nuevo módulo interno**

---

### 4. **IFRAME_TROUBLESHOOTING.md** - Solución de Problemas con Iframes
**Ubicación:** `/IFRAME_TROUBLESHOOTING.md`  
**Propósito:** Por qué fallan los iframes y cómo solucionarlo  
**Contenido:**
- El problema: X-Frame-Options: SAMEORIGIN
- 3 soluciones técnicas
- Solución implementada (proxy reverso)
- Email template para solicitar cambios
- Cómo agregar proxy en simple-server.js
- Testing y verificación

**📌 Leer si tienes problemas con módulos externos en iframe**

---

### 5. **frontend/README_FRONTEND.md** - Documentación del Frontend
**Ubicación:** `/frontend/README_FRONTEND.md`  
**Propósito:** Guía específica del frontend Angular  
**Contenido:**
- Estructura del proyecto Angular
- Componentes principales
- Servicios (auth, module-registry)
- Guards (RBAC)
- Configuración de desarrollo
- Build y deployment

**📌 Leer para trabajar en el frontend Angular**

---

## 🗂️ Estructura del Proyecto

```
ramen/
├── 📄 README.md                        # Documentación principal
├── 📄 CONFIGURACION_MODULOS.md        # Sistema de configuración ⭐ NUEVO
├── 📄 MODULOS_INTERNOS.md             # Guía para módulos internos
├── 📄 IFRAME_TROUBLESHOOTING.md       # Solución iframe
├── 📄 pomp.md                         # Este archivo (índice)
│
├── backend/
│   ├── simple-server.js               # Servidor principal
│   ├── module-manager.js              # Gestor de módulos
│   ├── storage-manager.js             # Sistema de almacenamiento
│   ├── logger.js                      # Sistema de logs
│   │
│   ├── models/
│   │   ├── user.model.js
│   │   ├── module.model.js
│   │   ├── finding.model.js
│   │   └── moduleConfig.model.js      # ⭐ NUEVO - Configuración
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── modules.js
│   │   ├── findings.js
│   │   └── moduleConfig.js            # ⭐ NUEVO - 15 endpoints
│   │
│   ├── seed-module-configs.js         # ⭐ NUEVO - Datos de ejemplo
│   ├── test-api.ps1                   # Tests generales
│   └── test-module-config.ps1         # ⭐ NUEVO - Tests config (12/12 ✅)
│
└── frontend/
    ├── 📄 README_FRONTEND.md
    └── src/app/
        ├── core/
        │   ├── services/
        │   │   ├── auth.service.ts
        │   │   ├── module-registry.service.ts
        │   │   └── module-config.service.ts     # ⭐ NUEVO
        │   └── guards/
        │       └── rbac.guard.ts
        │
        ├── features/
        │   ├── bitacora/
        │   └── admin/
        │       └── module-config/              # ⭐ NUEVO
        │           ├── module-config.component.ts
        │           ├── module-config.component.html
        │           └── module-config.component.scss
        │
        └── shared/
            └── models/
                └── interfaces.ts
```

---

## 🎯 Qué Leer Según tu Objetivo

### Si eres nuevo en el proyecto
1. **README.md** - Entender el proyecto completo
2. **MODULOS_INTERNOS.md** - Si vas a desarrollar módulos

### Si necesitas configurar módulos
1. **CONFIGURACION_MODULOS.md** - Sistema completo de configuración
2. Ver carpeta `backend/routes/moduleConfig.js` - API endpoints
3. Ver carpeta `backend/models/moduleConfig.model.js` - Modelo de datos

### Si tienes problemas con iframes
1. **IFRAME_TROUBLESHOOTING.md** - Solución completa

### Si vas a trabajar en el frontend
1. **frontend/README_FRONTEND.md** - Guía del frontend
2. **MODULOS_INTERNOS.md** - Para crear componentes

---

## ✅ Estado Actual del Proyecto

### Completado ✅
- [x] Backend base con Express
- [x] Autenticación JWT
- [x] RBAC (Owner/Admin/SOC Analyst)
- [x] Sistema de storage (local/S3/Azure)
- [x] Proxy reverso para iframes
- [x] Module Manager
- [x] Logger estructurado
- [x] **Sistema de configuración de módulos** (backend)
- [x] **15 API endpoints de configuración**
- [x] **Tests automatizados (21 tests totales)**

### En Progreso ⚠️
- [ ] Integración Angular de componentes de configuración
- [ ] Form builder dinámico usando templates
- [ ] Workflow de estados

### Pendiente ⏳
- [ ] Autenticación Microsoft/Google (OAuth)
- [ ] Dashboard principal
- [ ] Módulos adicionales (vulnerabilidades, compliance)

---

## 📊 Estadísticas del Proyecto

**Backend:**
- Servidor: Express 4.18.2
- Base de datos: In-memory (demo) / MongoDB (producción)
- Autenticación: JWT
- Storage: Local/S3/Azure
- Tests: 21 tests (9 generales + 12 configuración)

**Frontend:**
- Framework: Angular 17+
- UI: Material Design / Custom SCSS
- Estado: RxJS
- Guards: RBAC implementado

**Líneas de código (estimado):**
- Backend: ~3,500 líneas
- Frontend: ~2,500 líneas
- Documentación: ~6,000 líneas
- **Total: ~12,000 líneas**

---

## 🔄 Changelog Principal

### 11 de Noviembre, 2025
- ✅ Implementado sistema completo de configuración de módulos
- ✅ Creados 15 endpoints de API
- ✅ Modelo Mongoose con soporte para campos adminOnly
- ✅ Tests automatizados (12/12 pasando)
- ✅ Servicio y componentes Angular creados
- ✅ Consolidada documentación (5 archivos eliminados)

### Octubre 2025
- ✅ Sistema de storage con migración local/S3/Azure
- ✅ Documentación IFRAME_TROUBLESHOOTING.md
- ✅ Documentación MODULOS_INTERNOS.md
- ✅ Proxy reverso para módulos externos

### Septiembre 2025
- ✅ Backend base con autenticación
- ✅ RBAC implementado
- ✅ Module Manager

---

## 📞 Soporte y Contacto

**Documentación actualizada:** 11 de Noviembre, 2025  
**Mantenedor:** Equipo Ramen  
**Licencia:** Privado - Synet SPA

---

**💡 TIP:** Siempre revisa el README.md primero, luego consulta los documentos específicos según tu necesidad.

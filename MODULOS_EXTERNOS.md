# Módulos Externos en Ramen SOC

Este documento explica cómo integrar sistemas externos (como Bitácora SOC, SIEM, firewalls, etc.) que ya están desplegados en servidores independientes y necesitan ser accesibles desde Ramen SOC.

## 📋 Tabla de Contenidos

- [¿Qué es un módulo externo?](#qué-es-un-módulo-externo)
- [Tipos de integración](#tipos-de-integración)
- [Configuración del proxy](#configuración-del-proxy)
- [Ejemplo: Bitácora SOC](#ejemplo-bitácora-soc)
- [Solución de problemas](#solución-de-problemas)
- [Logs y monitoreo](#logs-y-monitoreo)

---

## ¿Qué es un módulo externo?

Un **módulo externo** es una aplicación web que:
- Ya está desplegada en su propio servidor (ej: `http://10.0.100.13:8477`)
- Tiene su propia interfaz de usuario (generalmente SPA con React, Vue, Angular, etc.)
- No puede ser ejecutada directamente por Ramen (a diferencia de módulos internos)
- Necesita ser accesible desde el orquestador Ramen sin requerir que los usuarios abran múltiples tabs

## Tipos de integración

Ramen soporta 3 formas de integrar módulos externos:

| Tipo | Uso | Ventajas | Limitaciones |
|------|-----|----------|--------------|
| **Link** | Aplicaciones en dominios diferentes | Simple, no requiere configuración | Abre en nueva pestaña |
| **iFrame directo** | Aplicaciones sin X-Frame-Options | Integración visual en Ramen | Bloqueado por headers de seguridad |
| **Proxy** | **RECOMENDADO** - Aplicaciones protegidas | Bypass de X-Frame-Options, URLs reescritas | Requiere configuración |

## Configuración del proxy

El proxy de Ramen resuelve automáticamente:
- ✅ Headers `X-Frame-Options` y `Content-Security-Policy` que bloquean iframes
- ✅ URLs absolutas en HTML (`/assets/logo.png` → `/proxy/module-id/assets/logo.png`)
- ✅ URLs hardcodeadas en JavaScript (bundles de Vite, Webpack, etc.)
- ✅ Peticiones fetch() y XMLHttpRequest del navegador
- ✅ POST/PUT/PATCH con body JSON
- ✅ Timeouts configurables para servidores lentos

### Paso 1: Crear módulo externo

En el panel de administración → Módulos → Crear Módulo:

```json
{
  "name": "Bitácora SOC",
  "moduleId": "bitacora-soc",
  "moduleType": "external",
  "baseUrl": "http://10.0.100.13:8477",
  "embedType": "iframe",
  "useProxy": true,
  "description": "Sistema de bitácora SOC externo (requiere proxy para eliminar X-Frame-Options)",
  "roles": ["Owner", "Admin"]
}
```

**Campos importantes:**
- `moduleType: "external"` - Indica que es un sistema externo
- `baseUrl` - URL del servidor donde está desplegada la aplicación
- `embedType: "iframe"` - Cómo se mostrará (iframe, link)
- `useProxy: true` - **CRÍTICO** - Activa el proxy inverso
- `roles` - Quién puede acceder al módulo

### Paso 2: Funcionamiento automático del proxy

Una vez creado, el proxy:

1. **Intercepta todas las peticiones** a `/proxy/bitacora-soc/*`
2. **Reescribe URLs en HTML:**
   ```html
   <!-- Original del servidor externo -->
   <script src="/assets/index.js"></script>
   
   <!-- Reescrito por el proxy -->
   <script src="/proxy/bitacora-soc/assets/index.js"></script>
   ```

3. **Reescribe URLs en JavaScript:**
   ```javascript
   // Original en el bundle
   fetch("/api/users")
   
   // Reescrito por el proxy
   fetch("/proxy/bitacora-soc/api/users")
   ```

4. **Inyecta interceptores** para fetch() y XMLHttpRequest:
   ```javascript
   // Automáticamente agregado al HTML
   window.fetch = new Proxy(originalFetch, {
     apply(target, thisArg, args) {
       let url = args[0];
       if (url.startsWith('/') && !url.startsWith('/proxy/')) {
         url = '/proxy/bitacora-soc' + url;
       }
       return target.apply(thisArg, [url, ...args.slice(1)]);
     }
   });
   ```

5. **Maneja POST/PUT/PATCH** reenviando el body:
   ```javascript
   // La petición original del navegador
   POST /proxy/bitacora-soc/api/auth/login
   Body: {"email": "user@example.com", "password": "***"}
   
   // El proxy la reenvía correctamente
   POST http://10.0.100.13:8477/api/auth/login
   Body: {"email": "user@example.com", "password": "***"}
   ```

### Paso 3: Estado del módulo

Los módulos externos muestran estado **"ONLINE"** (azul) en lugar de "RUNNING" porque:
- No son procesos ejecutados por Ramen
- No tienen PID
- Están activos si el proxy recibe tráfico

Los botones Start/Stop/Restart **no aparecen** para módulos externos.

---

## Ejemplo: Bitácora SOC

### Configuración completa

```json
{
  "_id": "bitacora-soc",
  "name": "Bitacora SOC",
  "moduleType": "external",
  "baseUrl": "http://10.0.100.13:8477",
  "embedType": "iframe",
  "useProxy": true,
  "proxyTarget": "http://10.0.100.13:8477",
  "description": "Sistema de bitácora SOC externo (requiere proxy para eliminar X-Frame-Options)",
  "icon": "description",
  "category": "security",
  "roles": ["Owner", "Admin"],
  "createdAt": "2025-11-12T10:00:00.000Z"
}
```

### Acceso

Una vez configurado:
1. Ir a **Módulos** en el sidebar
2. Click en **Bitacora SOC**
3. El iframe se carga con la URL: `http://localhost:4000/proxy/bitacora-soc`
4. El proxy reenvía al servidor real: `http://10.0.100.13:8477`
5. Login y navegación funcionan normalmente

### Tráfico del proxy

Ejemplo de logs del sistema:

```
12/11/2025 14:27:37 - info - proxy → request (bitacora-soc): POST /api/auth/login → http://10.0.100.13:8477
12/11/2025 14:27:37 - info - proxy → response (bitacora-soc): 200 POST /api/auth/login
12/11/2025 14:27:37 - info - proxy → request (bitacora-soc): GET /api/user/theme → http://10.0.100.13:8477
12/11/2025 14:27:37 - info - proxy → response (bitacora-soc): 200 GET /api/user/theme
```

---

## Solución de problemas

### El módulo no carga (pantalla en blanco)

**Causa:** URLs no reescritas correctamente

**Solución:**
1. Abrir DevTools (F12) → Console
2. Buscar errores de CORS o 404
3. Verificar que `useProxy: true` está configurado
4. Verificar que el servidor externo está accesible desde el backend de Ramen

### Login no funciona (timeout 408)

**Causa:** El body de POST no se envía correctamente

**Verificación:**
```bash
# En consola del servidor backend
[Proxy] Body a enviar: {"email":"user@example.com","password":"***"}
```

Si no aparece, el bodyParser de Express ya consumió el stream.

**Solución aplicada:** El proxy detecta POST/PUT/PATCH y reconstruye el body desde `req.body`.

### Assets retornan HTML en lugar de JS/CSS

**Causa:** El servidor externo retorna la página de índice para rutas desconocidas (SPA router)

**Solución:**
- El proxy reescribe las URLs para que los assets se soliciten con la ruta correcta
- Verificar que el `baseUrl` no tiene trailing slash: `http://10.0.100.13:8477` ✅ (no `http://10.0.100.13:8477/`)

### X-Frame-Options aún bloquea el iframe

**Causa:** El proxy no está activo o el navegador cachea headers antiguos

**Solución:**
1. Verificar que `useProxy: true` en la configuración del módulo
2. Limpiar caché del navegador (Ctrl+Shift+Del)
3. Abrir en modo incógnito
4. Verificar en DevTools → Network que la URL es `/proxy/module-id/` y no directa

### Timeout en peticiones lentas

**Causa:** Servidor externo tarda más de 60 segundos en responder

**Solución:** Aumentar timeout en `backend/simple-server.js`:

```javascript
const moduleProxyMiddleware = createProxyMiddleware({
  timeout: 120000, // 2 minutos
  proxyTimeout: 120000,
  // ... resto de configuración
});
```

---

## Logs y monitoreo

### Logs del sistema

Todos los eventos del proxy se registran en **Logs del Sistema**:
- 📤 Peticiones (info): `proxy → request (module-id): GET /api/data → http://...`
- ✅ Respuestas exitosas (info): `proxy → response (module-id): 200 GET /api/data`
- ⚠️ Errores HTTP (warning): `proxy → response (module-id): 404 GET /api/missing`
- ❌ Errores de proxy (error): `proxy → error (module-id): ECONNREFUSED ...`

### Logs específicos del módulo

Panel de administración → Módulos → [Módulo] → Logs:
- Muestra solo logs de ese módulo
- Filtra por tipo: request/response/error
- Últimas 100 entradas por defecto

### Consola del navegador

Para debugging detallado, abrir DevTools:

```
[Ramen Proxy] Interceptores activados para /proxy/bitacora-soc
[Ramen Proxy] /api/logo => /proxy/bitacora-soc/api/logo
```

---

## Configuración avanzada

### Proxy con autenticación

Si el servidor externo requiere autenticación básica:

```javascript
// En backend/simple-server.js, dentro de onProxyReq:
proxyReq.setHeader('Authorization', 'Basic ' + Buffer.from('user:pass').toString('base64'));
```

### Proxy con certificados SSL

Para HTTPS con certificados autofirmados:

```javascript
const moduleProxyMiddleware = createProxyMiddleware({
  // ... configuración existente
  secure: false, // Deshabilita verificación SSL
  ssl: {
    rejectUnauthorized: false
  }
});
```

### Múltiples módulos externos

Puedes tener varios módulos externos simultáneamente:
- Cada uno con su `moduleId` único
- Cada uno con su `baseUrl` diferente
- El proxy maneja todos automáticamente en `/proxy/{moduleId}/*`

Ejemplo:
- `http://localhost:4000/proxy/bitacora-soc/` → `http://10.0.100.13:8477`
- `http://localhost:4000/proxy/firewall-manager/` → `http://192.168.1.50:8080`
- `http://localhost:4000/proxy/siem-dashboard/` → `http://172.16.0.10:3000`

---

## Resumen

✅ **Módulos externos** permiten integrar sistemas desplegados independientemente  
✅ **Proxy inverso** resuelve X-Frame-Options, URLs y CORS automáticamente  
✅ **Estado ONLINE** indica que el proxy está activo  
✅ **Logs centralizados** muestran todo el tráfico en tiempo real  
✅ **Sin límite** de módulos externos simultáneos  

Para más detalles técnicos, ver [`IFRAME_TROUBLESHOOTING.md`](IFRAME_TROUBLESHOOTING.md).

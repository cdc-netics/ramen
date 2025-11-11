# ⚠️ PROBLEMA CRÍTICO: Módulos Externos en Iframe

## 🔴 Por Qué NO Funcionó el Módulo "Bitácora SOC"

### Causa Raíz Identificada

El módulo externo `http://10.0.100.13:8477` **NO puede cargarse en iframe** porque:

```http
HTTP/1.1 200 OK
X-Frame-Options: SAMEORIGIN
Content-Security-Policy: frame-ancestors 'self'
```

**Traducción:** El servidor en `10.0.100.13:8477` envía headers de seguridad que **explícitamente prohíben** ser cargado en un iframe desde otro origen.

### ¿Qué Significa `X-Frame-Options: SAMEORIGIN`?

Este header le dice al navegador:
> "Solo permite que este sitio sea cargado en un iframe SI el iframe está en el MISMO dominio"

**Ejemplo:**
- ✅ `http://10.0.100.13:8477` puede cargar `http://10.0.100.13:8477/pagina` en iframe
- ❌ `http://localhost:4000` NO puede cargar `http://10.0.100.13:8477` en iframe
- ❌ `http://ramen.local:4000` NO puede cargar `http://10.0.100.13:8477` en iframe

### Intentos Fallidos Durante Desarrollo

#### ❌ Intento 1: Proxy Básico
```javascript
app.use('/proxy-bitacora', createProxyMiddleware({
  target: 'http://10.0.100.13:8477',
  onProxyRes: (proxyRes) => {
    delete proxyRes.headers['x-frame-options']; // No funcionó
  }
}));
```
**Por qué falló:** El header ya fue procesado por el navegador antes de poder eliminarlo.

#### ❌ Intento 2: selfHandleResponse
```javascript
app.use('/proxy-bitacora', createProxyMiddleware({
  selfHandleResponse: true,
  onProxyRes: (proxyRes, req, res) => {
    // Intentar reescribir response completa
  }
}));
```
**Por qué falló:** Servidor crasheó, demasiado complejo, inestable.

#### ❌ Intento 3: responseInterceptor
```javascript
app.use('/proxy-bitacora', createProxyMiddleware({
  selfHandleResponse: true,
  onProxyRes: responseInterceptor(async (buffer, proxyRes, req, res) => {
    delete proxyRes.headers['x-frame-options'];
    // Intentar reescribir HTML
    return buffer;
  })
}));
```
**Por qué falló:** Headers seguían presentes, el navegador ya los había procesado.

#### ❌ Intento 4: Transform Streams
Manipulación directa del stream HTTP para reescribir headers.
**Por qué falló:** Inestable, servidor se volvía no confiable.

### 🎯 Conclusión Técnica

**NO es posible bypassear `X-Frame-Options` desde el proxy sin control del servidor origen.**

El header de seguridad es procesado por el navegador **antes** de que el proxy pueda modificarlo. Es una medida de seguridad intencional del navegador.

---

## ✅ SOLUCIONES DISPONIBLES

### Solución 1: Modificar Servidor Externo (RECOMENDADO)

**Contactar al administrador de `10.0.100.13:8477`** y pedirle que:

#### Opción A: Eliminar el header completamente
```apache
# Apache (.htaccess o httpd.conf)
Header unset X-Frame-Options

# Nginx (nginx.conf)
add_header X-Frame-Options "";
```

#### Opción B: Permitir dominio específico
```apache
# Apache
Header set X-Frame-Options "ALLOW-FROM http://localhost:4000"

# Nginx
add_header X-Frame-Options "ALLOW-FROM http://localhost:4000";
```

#### Opción C: Usar Content-Security-Policy más flexible
```apache
# Permitir iframe desde Ramen
Header set Content-Security-Policy "frame-ancestors 'self' http://localhost:4000 http://ramen.local:4000"
```

**Ventajas:**
- ✅ Solución definitiva
- ✅ No requiere cambios en Ramen
- ✅ Funciona correctamente

**Desventajas:**
- ⚠️ Requiere acceso al servidor externo
- ⚠️ Requiere coordinación con otro equipo

---

### Solución 2: Cambiar a `embedType: 'link'`

**Modificar el módulo para que se abra en nueva pestaña:**

```javascript
// En backend/simple-server.js
{
  _id: '4',
  name: 'Bitacora SOC',
  baseUrl: 'http://10.0.100.13:8477',
  embedType: 'link',  // <-- Cambiar de 'iframe' a 'link'
  allowedRoles: ['Owner', 'Admin'],
  icon: 'security'
}
```

**Ventajas:**
- ✅ Funciona inmediatamente
- ✅ No requiere cambios en servidor externo
- ✅ Usuario mantiene sesión JWT de Ramen

**Desventajas:**
- ⚠️ Se pierde experiencia integrada (nueva pestaña)
- ⚠️ Usuario debe alternar entre pestañas

---

### Solución 3: Proxy Reverso Nginx (Alternativa Avanzada)

Si tienes control de infraestructura, usar Nginx como proxy:

```nginx
# nginx.conf
server {
  listen 4001;
  server_name localhost;

  location / {
    proxy_pass http://10.0.100.13:8477;
    proxy_hide_header X-Frame-Options;
    proxy_hide_header Content-Security-Policy;
    
    # Agregar headers permisivos
    add_header X-Frame-Options "ALLOW-FROM http://localhost:4000";
  }
}
```

Luego cambiar el módulo:
```javascript
{
  baseUrl: 'http://localhost:4001',  // Apuntar a Nginx
  embedType: 'iframe'
}
```

**Ventajas:**
- ✅ Funciona correctamente
- ✅ No modifica servidor original
- ✅ Escalable

**Desventajas:**
- ⚠️ Requiere instalar/configurar Nginx
- ⚠️ Complejidad adicional

---

## 📊 Matriz de Decisión

| Solución | Complejidad | Requiere Acceso Servidor | Funciona 100% | Tiempo |
|----------|-------------|--------------------------|---------------|--------|
| **Modificar servidor externo** | 🟢 Baja | ✅ Sí | ✅ Sí | 10 min |
| **Cambiar a 'link'** | 🟢 Baja | ❌ No | ⚠️ Parcial | 1 min |
| **Nginx proxy** | 🟡 Media | ❌ No | ✅ Sí | 30 min |
| **Intentar con Node.js** | 🔴 Alta | ❌ No | ❌ No | ∞ (imposible) |

---

## 🎯 RECOMENDACIÓN FINAL

### Para Producción:
1. **Contactar administrador de `10.0.100.13:8477`**
2. **Solicitar eliminación de `X-Frame-Options`** o permitir origen Ramen
3. **Mantener `embedType: 'iframe'`** en configuración

### Para Demo/Temporal:
1. **Cambiar a `embedType: 'link'`** inmediatamente
2. **Funciona sin cambios en servidor externo**
3. **Planear solución definitiva para después**

---

## 📝 Cómo Notificar al Usuario Owner

### Mensaje en UI (Implementar en Angular)

```typescript
// En module-viewer.component.ts
ngOnInit() {
  if (this.module.embedType === 'iframe') {
    this.checkIframeCompatibility(this.module.baseUrl);
  }
}

async checkIframeCompatibility(url: string) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const xFrameOptions = response.headers.get('X-Frame-Options');
    
    if (xFrameOptions && xFrameOptions !== 'ALLOWALL') {
      this.showWarning(`
        ⚠️ Este módulo NO puede cargarse en iframe.
        
        Causa: El servidor envía X-Frame-Options: ${xFrameOptions}
        
        Soluciones:
        1. Contactar administrador del servidor
        2. Cambiar módulo a tipo "link" (nueva pestaña)
        
        Ver documentación: IFRAME_TROUBLESHOOTING.md
      `);
    }
  } catch (error) {
    console.warn('No se pudo verificar compatibilidad iframe');
  }
}
```

### Agregar en Panel Admin

En la gestión de módulos, mostrar warning si `embedType: 'iframe'`:

```html
<mat-card *ngIf="module.embedType === 'iframe'">
  <mat-icon color="warn">warning</mat-icon>
  <p>
    <strong>Advertencia:</strong> Los módulos tipo iframe requieren que el 
    servidor externo permita ser embebido.
  </p>
  <p>
    Si el módulo no carga, cambiar a tipo "link" o contactar al 
    administrador del servidor externo para eliminar X-Frame-Options.
  </p>
  <button mat-button (click)="openDocs()">Ver Documentación</button>
</mat-card>
```

---

## 🧪 Cómo Probar Si Un Servidor Permite Iframe

### Desde PowerShell:
```powershell
$response = Invoke-WebRequest -Uri "http://10.0.100.13:8477" -Method HEAD
$response.Headers['X-Frame-Options']

# Si retorna algo (DENY, SAMEORIGIN), NO funcionará en iframe
# Si no retorna nada o retorna ALLOWALL, SÍ funcionará
```

### Desde JavaScript:
```javascript
fetch('http://10.0.100.13:8477', { method: 'HEAD' })
  .then(res => {
    const xfo = res.headers.get('X-Frame-Options');
    if (xfo) {
      console.warn('❌ No se puede usar iframe:', xfo);
    } else {
      console.log('✅ Se puede usar iframe');
    }
  });
```

### Test Visual:
Crear archivo `test-iframe.html`:
```html
<!DOCTYPE html>
<html>
<head><title>Test Iframe</title></head>
<body>
  <h1>Test de Iframe</h1>
  <iframe src="http://10.0.100.13:8477" width="800" height="600"></iframe>
  <p>Si ves "La página ha rechazado la conexión", NO funciona.</p>
</body>
</html>
```

---

## 📞 Template de Email para Administrador

```
Asunto: Solicitud - Permitir embed de Bitácora SOC en Ramen

Hola [Administrador],

Estamos implementando un orquestador llamado "Ramen" que centraliza 
todas las herramientas SOC en una única interfaz.

Para integrar Bitácora SOC (http://10.0.100.13:8477), necesitamos que 
el servidor permita ser embebido en un iframe desde nuestro orquestador.

Actualmente el servidor envía estos headers que lo impiden:
- X-Frame-Options: SAMEORIGIN
- Content-Security-Policy: frame-ancestors 'self'

¿Podrías modificar la configuración para permitir el embed desde:
- http://localhost:4000
- http://ramen.local:4000

Opciones de configuración:

Opción 1 - Apache:
Header unset X-Frame-Options

Opción 2 - Nginx:
proxy_hide_header X-Frame-Options;

Opción 3 - CSP más flexible:
Header set Content-Security-Policy "frame-ancestors 'self' http://localhost:4000"

Gracias!
[Tu nombre]
```

---

## 🔐 Consideraciones de Seguridad

### ¿Por qué existe X-Frame-Options?

Protege contra ataques de **Clickjacking**:
1. Atacante crea sitio malicioso
2. Carga tu aplicación en iframe invisible
3. Usuario cree que hace click en sitio malicioso
4. Realmente hace click en tu aplicación (sin saberlo)

### ¿Es seguro quitarlo?

**SI:**
- ✅ Solo permites dominios específicos conocidos
- ✅ Usas autenticación fuerte (JWT en nuestro caso)
- ✅ Confías en el orquestador (Ramen)

**NO:**
- ❌ Quitas protección completamente sin restricciones
- ❌ Permites cualquier dominio (`ALLOWALL`)

### Recomendación Segura:

```apache
# Solo permitir Ramen, no cualquier sitio
Header set Content-Security-Policy "frame-ancestors 'self' http://localhost:4000 http://ramen.local:4000"
```

---

**Documento creado:** Noviembre 2025
**Estado:** Problema identificado, soluciones documentadas
**Próximos pasos:** Decidir solución e implementar

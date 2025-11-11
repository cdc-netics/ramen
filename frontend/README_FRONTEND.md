# Frontend - Angular 16

## Estructura del Proyecto

```
src/
├── app/
│   ├── features/                    # Módulos funcionales
│   │   ├── auth/                    # Login y autenticación
│   │   ├── admin/                   # Panel de administración
│   │   ├── module-viewer/           # Visor de módulos externos
│   │   └── bitacora/                # Ejemplo módulo interno
│   ├── components/                  # Componentes compartidos
│   │   └── sidebar/                 # Sidebar con animación
│   ├── core/                        # Servicios core
│   │   ├── services/
│   │   │   ├── auth.service.ts      # Autenticación JWT
│   │   │   └── module-registry.service.ts  # API de módulos
│   │   └── guards/
│   │       └── rbac.guard.ts        # Guard de permisos
│   └── shared/                      # Modelos compartidos
│       └── models/
│           └── interfaces.ts        # Interfaces TypeScript
├── assets/
│   └── ramen-logo.svg              # Logo de la aplicación
├── styles.scss                      # Estilos globales
└── index.html                       # HTML base (con <base href="/">)
```

## Tecnologías

- **Angular 16.2.0** - Framework principal
- **Angular Material 16.2.14** - Componentes UI
- **RxJS 7.8.0** - Programación reactiva
- **Anime.js** - Animaciones (loading spinner)
- **TypeScript 5.1.3** - Lenguaje
- **jwt-decode 4.0.0** - Decodificación JWT

## Desarrollo

### Instalar dependencias
```bash
npm install
```

### Servidor de desarrollo
```bash
ng serve
# Aplicación en http://localhost:4200
```

### Build producción
```bash
npx ng build
# Output en dist/ramen-frontend/
```

## Servicios Principales

### AuthService
```typescript
// Autenticación JWT
login(username: string, password: string): Observable<any>
logout(): void
getToken(): string | null
isAuthenticated(): boolean
getUserRoles(): string[]
changePassword(oldPassword: string, newPassword: string): Observable<any>
```

**Token storage:** localStorage key `ramen_token`  
**Expiración:** 8 horas

### ModuleRegistryService
```typescript
// Gestión de módulos
getModules(): Observable<Module[]>
getModuleById(id: string): Observable<Module>
```

## Guards

### RbacGuard
Protege rutas según roles del usuario. Se aplica en `app-routing.module.ts`:

```typescript
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [RbacGuard],
  data: { requiredRoles: ['Owner', 'Admin'] }
}
```

## Componentes Clave

### SidebarComponent
- Navegación dinámica basada en roles
- Filtrado automático de módulos según permisos
- Animación collapse/expand
- Iconos Material

### ModuleViewerComponent
- Renderiza módulos tipo `iframe` con DomSanitizer
- Abre módulos tipo `link` en nueva pestaña
- Maneja módulos tipo `proxy` internos

### AdminComponent
Tabs de administración:
1. **Usuarios** - CRUD + bloqueo
2. **Módulos** - CRUD + start/stop
3. **Branding** - Personalización
4. **RBAC** - Matriz de permisos
5. **Logs** - Filtros avanzados

## Routing

```typescript
const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'admin', component: AdminComponent, canActivate: [RbacGuard] },
  { path: 'module/:id', component: ModuleViewerComponent, canActivate: [RbacGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
```

## Estilos

- **Material Theme:** Indigo-Pink
- **Custom Variables:** En `styles.scss`
- **Responsive:** Sidebar colapsa en móviles

## Build y Deploy

### Producción
```bash
npx ng build --configuration production
```

**Output:** `dist/ramen-frontend/`

El backend sirve estos archivos estáticos en `http://localhost:4000`

## Troubleshooting

### Error al hacer F5
**Problema:** Página en blanco al recargar

**Solución:** Ya implementado en `index.html`:
```html
<base href="/">
```

### JWT decode error
**Problema:** `Cannot read property 'exp' of undefined`

**Solución:** Verificar versión de jwt-decode 4.x:
```bash
npm install jwt-decode@4.0.0
```

### Módulos no filtran por rol
**Problema:** Sidebar muestra todos los módulos

**Solución:** Verificar que `AuthService.getUserRoles()` retorna array correcto

### Material icons no cargan
**Problema:** Iconos aparecen como texto

**Solución:** Verificar `index.html` incluye:
```html
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```

## Comandos Útiles

```bash
# Instalar Angular CLI globalmente
npm install -g @angular/cli@16

# Generar nuevo componente
ng generate component features/nuevo-componente

# Generar nuevo servicio
ng generate service core/services/nuevo-service

# Linter
ng lint

# Tests
ng test

# Verificar versión
ng version
```

## Estado Actual

✅ **Funcional:**
- Login con JWT
- Sidebar dinámico
- Routing RBAC
- Panel admin completo
- Module viewer (iframe/link/proxy)
- Branding personalizable

⚠️ **Pendiente:**
- Tests unitarios
- Tests e2e
- Mejoras de performance (lazy loading)
- PWA support

---

**Última actualización:** Noviembre 2025

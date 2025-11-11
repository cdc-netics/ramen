# Contributing to Ramen SOC

¡Gracias por tu interés en contribuir a Ramen SOC! 🍜

## 🤝 Cómo Contribuir

### Reportar Bugs

Si encuentras un bug, por favor crea un issue con:

1. **Descripción clara** del problema
2. **Pasos para reproducir** el error
3. **Comportamiento esperado** vs **comportamiento actual**
4. **Información del entorno**: OS, Node.js version, navegador
5. **Screenshots o logs** si es posible

### Sugerir Mejoras

Las sugerencias son bienvenidas. Por favor incluye:

1. **Descripción detallada** de la funcionalidad
2. **Casos de uso** específicos
3. **Mockups o diagramas** si aplica

### Pull Requests

1. **Fork** el repositorio
2. **Crea una rama** para tu feature: `git checkout -b feature/nueva-funcionalidad`
3. **Commit** tus cambios: `git commit -m 'Add: nueva funcionalidad'`
4. **Push** a tu rama: `git push origin feature/nueva-funcionalidad`
5. **Abre un Pull Request** con descripción detallada

## 📝 Estilo de Código

### JavaScript/TypeScript

- Usar **camelCase** para variables y funciones
- Usar **PascalCase** para clases y componentes
- Indentación: **2 espacios**
- Usar **const** por defecto, **let** solo si es necesario
- Agregar **JSDoc** para funciones públicas

```javascript
/**
 * Función de ejemplo
 * @param {string} param - Descripción del parámetro
 * @returns {Object} Descripción del retorno
 */
function ejemploFuncion(param) {
  const resultado = procesarParam(param);
  return resultado;
}
```

### Commits

Usar formato convencional:

- `Add:` Nueva funcionalidad
- `Fix:` Corrección de bug
- `Update:` Actualización de código existente
- `Refactor:` Refactorización de código
- `Docs:` Cambios en documentación
- `Test:` Agregar o modificar tests
- `Style:` Cambios de formato (sin afectar lógica)

Ejemplos:
```
Add: validación de módulos ZIP
Fix: error en eliminación de archivos del disco
Update: mejorar reporte de validación
Docs: actualizar README con nuevos endpoints
```

## 🧪 Testing

Antes de abrir un PR verifica como mínimo lo siguiente:

1. **Backend**  
   - Ejecuta los scripts de pruebas automatizadas (requieren PowerShell / pwsh):
     ```bash
     pwsh ./backend/test-api.ps1
     pwsh ./backend/test-module-config.ps1
     pwsh ./backend/test-zip-validation.ps1
     ```
   - Levanta el backend demo para validar manualmente (`node simple-server.js`) u opcionalmente `npm start` si trabajas con Mongo (`server.js`).

2. **Frontend**  
   - Ejecuta `npm run test` (alias de `ng test`) en `frontend/`.
   - Corre `npm start` y navega el panel admin para validar los flujos impactados.

3. **Documentación y scripts**  
   - Si tocaste endpoints o procesos, actualiza los documentos relevantes (README, TECHNICAL_REFERENCE, CONFIGURACION_MODULOS, README_FRONTEND, etc.).
   - Asegúrate de que los scripts `.ps1` / `.sh` sigan funcionando con los cambios.

## 📚 Documentación

- Actualizar **README.md** si agregaste funcionalidad
- Actualizar **TECHNICAL_REFERENCE.md** si cambiaste arquitectura
- Agregar comentarios en código complejo
- Actualizar **OpenAPI/Swagger** si modificaste endpoints

## 🚀 Proceso de Revisión

1. El PR será revisado por un mantenedor
2. Se pueden solicitar cambios
3. Una vez aprobado, será merged al branch principal
4. Los cambios serán incluidos en el próximo release

## 🔒 Seguridad

Si encuentras una vulnerabilidad de seguridad:

- **NO** abras un issue público
- Envía un email a: [tu-email@synet.spa]
- Describe la vulnerabilidad en detalle
- Incluye pasos para reproducirla

## 📜 Código de Conducta

- Ser respetuoso con todos los contribuidores
- Aceptar críticas constructivas
- Enfocarse en lo mejor para el proyecto
- Mostrar empatía hacia otros miembros de la comunidad

## ❓ Preguntas

Si tienes dudas:

1. Revisa la **documentación** en `/docs`
2. Busca en **issues cerrados**
3. Abre un **nuevo issue** con la etiqueta `question`

---

¡Gracias por contribuir! 🙏

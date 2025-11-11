# Security Policy

## 🔒 Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## 🚨 Reporting a Vulnerability

Si descubres una vulnerabilidad de seguridad en Ramen SOC, por favor **NO** la reportes públicamente.

### Proceso de Reporte

1. **Email**: Envía un email a [security@synet.spa] con:
   - Descripción detallada de la vulnerabilidad
   - Pasos para reproducirla
   - Posible impacto
   - Sugerencias de solución (si las tienes)

2. **Respuesta**: Responderemos dentro de **48 horas** para confirmar recepción

3. **Análisis**: Investigaremos y validaremos la vulnerabilidad

4. **Solución**: Trabajaremos en un patch y te mantendremos informado

5. **Divulgación**: Una vez solucionado, coordinaremos la divulgación pública

## 🛡️ Mejores Prácticas de Seguridad

### Para Usuarios

1. **Cambiar credenciales por defecto** inmediatamente:
   ```bash
   Usuario: owner
   Password: admin123  # ⚠️ CAMBIAR EN PRODUCCIÓN
   ```

2. **Usar HTTPS** en producción (configurar nginx/Apache con SSL)

3. **Cambiar JWT_SECRET** en `.env`:
   ```bash
   JWT_SECRET=your_super_secret_key_here
   ```

4. **Configurar CORS** apropiadamente en producción

5. **Habilitar rate limiting** (roadmap)

### Para Desarrolladores

1. **Nunca commitear** archivos `.env` o credenciales

2. **Validar inputs** en todos los endpoints

3. **Sanitizar** nombres de archivo en uploads

4. **Usar prepared statements** (ya implementado con Mongoose)

5. **Mantener dependencias actualizadas**:
   ```bash
   npm audit
   npm audit fix
   ```

## 🔐 Características de Seguridad Implementadas

- ✅ **JWT Authentication** con expiración 8h
- ✅ **Bcrypt password hashing** (10 rounds)
- ✅ **RBAC granular** con 4 roles y 20 permisos
- ✅ **File upload validation** (MIME types, size limits)
- ✅ **SHA256 hashing** para integridad de archivos
- ✅ **Helmet.js** para security headers
- ✅ **CORS configuration**
- ✅ **Audit logging** de todas las operaciones

## 🚧 Pendiente de Implementar

- ⚠️ **HTTPS/TLS** (configurar en producción)
- ⚠️ **Rate limiting** para prevenir brute force
- ⚠️ **CSRF tokens**
- ⚠️ **OAuth/OIDC** (estructura lista)
- ⚠️ **2FA/MFA** (futuro)

## 📋 Checklist de Seguridad para Producción

- [ ] Cambiar contraseña del usuario `owner`
- [ ] Cambiar `JWT_SECRET` en `.env`
- [ ] Configurar HTTPS con certificado SSL válido
- [ ] Habilitar `NODE_ENV=production`
- [ ] Configurar CORS con origins específicos
- [ ] Cambiar `USE_MEMORY_DB=false` y usar MongoDB con autenticación
- [ ] Configurar backups automáticos
- [ ] Configurar firewall (solo puertos necesarios abiertos)
- [ ] Configurar rate limiting
- [ ] Habilitar logging detallado
- [ ] Configurar monitoring (uptime, errores)
- [ ] Revisar permisos de carpetas (storage, modules)
- [ ] Deshabilitar stack traces en producción

## 🔍 Auditorías de Seguridad

Ejecutar periódicamente:

```bash
# Verificar vulnerabilidades en dependencias
npm audit

# Actualizar dependencias con vulnerabilidades
npm audit fix

# Análisis de código estático
npm run lint
```

## 📞 Contacto

Para reportes de seguridad: [security@synet.spa]  
Para otras consultas: [support@synet.spa]

---

**Última actualización**: Noviembre 2025

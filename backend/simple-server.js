/**
 * simple-server.js - Express API simple para demo sin MongoDB
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware');
const ModuleManager = require('./module-manager');
const oauthRoutes = require('./routes/oauth');
const moduleConfigRoutes = require('./routes/moduleConfig');
const logger = require('./logger');
const StorageManager = require('./storage-manager');
const storageConfig = require('./storage-config');
const multer = require('multer');
const seedModuleConfigs = require('./seed-module-configs');

const app = express();

// Inicializar Storage Manager
const storageManager = new StorageManager({
  storagePath: storageConfig[storageConfig.storageType].storagePath
});

// Inicializar Module Manager
const moduleManager = new ModuleManager();

// Proxy reverso para módulo externo "Bitácora SOC"
// - Elimina headers que bloquean iframes
// - Reescribe rutas absolutas (/assets, /api, etc.) para que pasen por el proxy
app.use('/proxy-bitacora', createProxyMiddleware({
  target: 'http://10.0.100.13:8477',
  changeOrigin: true,
  ws: true,
  selfHandleResponse: true,
  pathRewrite: { '^/proxy-bitacora': '' },
  onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
    delete proxyRes.headers['x-frame-options'];
    delete proxyRes.headers['content-security-policy'];
    res.removeHeader('x-frame-options');
    res.removeHeader('content-security-policy');

    const contentType = proxyRes.headers['content-type'] || '';
    if (contentType.includes('text/html')) {
  let html = responseBuffer.toString('utf8');
  html = html.replace(/(href|src)="\/(?!\/)/g, '$1="/proxy-bitacora/');
  html = html.replace(/(href|src)='\/(?!\/)/g, "$1='/proxy-bitacora/");
      return html;
    }

    return responseBuffer;
  }),
  logLevel: 'warn'
}));

app.use(helmet({ contentSecurityPolicy: false })); // Deshabilitar CSP para demo
app.use(cors({ origin: '*', credentials:false })); // Permitir cualquier origen para demo
app.use(bodyParser.json({ limit: '5mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

// In-memory database for demo
let database = {
  users: [],
  modules: [],
  moduleFiles: {}, // { moduleId: [{ path, content, language }] }
  leakedPasswords: [],
  findings: [],
  moduleConfigs: [], // Configuración de módulos con plantillas
  branding: {  // Configuración de branding
    appName: 'Ramen SOC',
    logoUrl: '',
    loginLogoUrl: '',
    loadingAnimationUrl: '',
    primaryColor: '#667eea',
    secondaryColor: '#764ba2'
  }
};

// Initialize demo data
async function initDB() {
  const pw = await bcrypt.hash('admin123', 10);
  database.users = [{
    _id: '1',
    username: 'owner',
    fullName: 'Owner',
    passwordHash: pw,
    roles: ['Owner', 'Admin'],
    createdAt: new Date()
  }];

  database.modules = [
    {
      _id: 'bitacora-react',
      name: 'Bitácora (React)',
      baseUrl: 'http://localhost:3001',
      embedType: 'iframe',
      moduleType: 'internal',
      allowedRoles: ['User','Admin','Owner'],
      description: 'Bitácora React en Docker (ejemplo)',
      status: 'online'
    },
    {
      _id: 'leaked-passwords',
      name: 'LeakedPasswords',
      baseUrl: '/app/leaked',
      embedType: 'proxy',
      moduleType: 'external',
      allowedRoles: ['Admin','Owner'],
      description: 'DB de contraseñas filtradas',
      status: 'active'
    },
    {
      _id: 'hallazgos',
      name: 'Hallazgos',
      baseUrl: '/app/hallazgos',
      embedType: 'proxy',
      moduleType: 'external',
      allowedRoles: ['Admin','Owner'],
      description: 'Módulo de hallazgos',
      status: 'active'
    },
    {
      _id: 'bitacora-soc',
      name: 'Bitacora SOC',
      baseUrl: 'http://localhost:4000/proxy-bitacora',
      embedType: 'iframe',
      moduleType: 'external',
      allowedRoles: ['Owner', 'Admin'],
      description: 'Sistema de bitácora SOC externo (requiere proxy para eliminar X-Frame-Options)',
      status: 'online',
      icon: 'security'
    }
  ];
  
  // Inicializar configuraciones de módulos
  await seedModuleConfigs(database);
  
  // Hacer database accesible en toda la app
  app.locals.database = database;
}

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = database.users.find(u => u.username === username);
    
    if (!user) {
      logger.warning(username || 'unknown', 'login_failed', 'auth', `Usuario no existe: ${username}`);
      return res.status(401).json({msg: 'invalid credentials'});
    }
    
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      logger.warning(username, 'login_failed', 'auth', 'Contraseña incorrecta');
      return res.status(401).json({msg: 'invalid credentials'});
    }
    
    const token = jwt.sign({ 
      sub: user._id, 
      username: user.username, 
      roles: user.roles 
    }, JWT_SECRET, { expiresIn: '8h' });
    
    logger.success(username, 'login', 'auth', `Login exitoso - Roles: ${user.roles.join(', ')}`);
    
    res.json({ token });
  } catch(err) {
    logger.error('system', 'login_error', 'auth', `Error en login: ${err.message}`);
    res.status(500).json({error: '' + err});
  }
});

// Middleware de autenticación JWT
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  
  console.log('🔐 authenticateJWT - Verificando token');
  console.log('   Authorization header:', authHeader ? 'Existe' : '❌ NO EXISTE');
  console.log('   Header completo:', authHeader);
  console.log('   Tipo de dato:', typeof authHeader);
  
  if (!authHeader) {
    console.log('❌ No authorization header');
    return res.status(401).json({ error: 'No authorization header' });
  }
  
  const token = authHeader.split(' ')[1]; // Bearer TOKEN
  console.log('   Token extraído:', token ? token.substring(0, 20) + '...' : 'VACÍO');
  console.log('   Split result:', authHeader.split(' '));
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token válido - Usuario:', decoded.username);
    console.log('   Roles:', decoded.roles);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('❌ Token inválido o expirado:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Alias para compatibilidad con rutas de storage
const authenticateToken = authenticateJWT;

// Middleware para verificar roles específicos
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // El usuario puede tener 'roles' (array) o 'role' (string)
    const userRoles = req.user.roles || (req.user.role ? [req.user.role] : []);
    
    // Verificar si el usuario tiene alguno de los roles permitidos
    const hasPermission = userRoles.some(role => allowedRoles.includes(role));
    
    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: userRoles
      });
    }
    
    next();
  };
};

// OAuth routes (Microsoft, Google)
app.use('/api/auth', oauthRoutes);

// Module Config routes (requiere autenticación)
app.use('/api/module-config', authenticateJWT, moduleConfigRoutes);

// ==========================================
// SSO - Single Sign-On para módulos third-party
// ==========================================

// Validar token SSO (usado por módulos third-party)
app.post('/api/auth/validate-sso', (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ valid: false, error: 'Token required' });
    }
    
    // Verificar JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Buscar usuario
    const user = database.users.find(u => u._id === decoded.sub);
    
    if (!user) {
      return res.status(404).json({ valid: false, error: 'User not found' });
    }
    
    // Token válido
    res.json({
      valid: true,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        roles: user.roles
      },
      tokenInfo: {
        module: decoded.module,
        type: decoded.type,
        expiresAt: new Date(decoded.exp * 1000)
      }
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ valid: false, error: 'Token expired' });
    } else if (err.name === 'JsonWebTokenError') {
      res.status(401).json({ valid: false, error: 'Invalid token' });
    } else {
      res.status(500).json({ valid: false, error: err.message });
    }
  }
});

// Generar token SSO para módulo específico (requiere autenticación)
app.post('/api/auth/sso-token', authenticateJWT, (req, res) => {
  try {
    const { moduleId } = req.body;
    
    // Obtener módulo
    const module = database.modules.find(m => m._id === moduleId);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    // Verificar que el usuario tiene permisos para acceder al módulo
    const userRoles = req.user.roles || [];
    const moduleRoles = module.allowedRoles || [];
    
    const hasAccess = userRoles.some(role => moduleRoles.includes(role));
    if (!hasAccess && !userRoles.includes('Owner')) {
      return res.status(403).json({ error: 'Access denied to this module' });
    }
    
    // Generar token SSO (válido por 1 hora)
    const ssoToken = jwt.sign({
      sub: req.user.sub,
      username: req.user.username,
      roles: req.user.roles,
      module: moduleId,
      moduleName: module.name,
      type: 'sso'
    }, JWT_SECRET, { expiresIn: '1h' });
    
    res.json({
      ssoToken,
      expiresIn: 3600, // segundos
      module: {
        id: module._id,
        name: module.name,
        baseUrl: module.baseUrl
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Branding routes (Solo Owner)
app.get('/api/branding', (req, res) => {
  res.json(database.branding);
});

app.post('/api/branding', authenticateJWT, (req, res) => {
  console.log('📥 POST /api/branding');
  console.log('👤 Usuario autenticado:', req.user);
  console.log('🔑 Roles del usuario:', req.user?.roles);
  console.log('📦 Body recibido:', req.body);
  
  // Verificar que sea Owner
  if (!req.user.roles || !req.user.roles.includes('Owner')) {
    console.log('❌ ACCESO DENEGADO - Usuario no es Owner');
    console.log('   Roles esperados: ["Owner"]');
    console.log('   Roles recibidos:', req.user.roles);
    logger.warning(req.user.username, 'branding_denied', 'branding', `Intento de cambiar branding sin permisos de Owner - Roles: ${req.user.roles?.join(', ')}`);
    return res.status(403).json({ error: 'Solo Owner puede cambiar branding' });
  }

  console.log('✅ Usuario es Owner - Actualizando branding...');
  
  // Actualizar branding
  const before = JSON.stringify(database.branding);
  database.branding = {
    ...database.branding,
    ...req.body
  };

  console.log('💾 Branding actualizado:', database.branding);
  logger.success(req.user.username, 'branding_updated', 'branding', `Actualizado branding: ${req.body.appName || 'sin cambio de nombre'}`);

  res.json({ 
    success: true, 
    message: 'Branding actualizado',
    branding: database.branding 
  });
});

// ==========================================
// LOGS ROUTES
// ==========================================

// Obtener logs con filtros
app.get('/api/logs', authenticateJWT, (req, res) => {
  const { level, user, action, resource, startDate, endDate, limit } = req.query;
  
  const filters = {};
  if (level) filters.level = level;
  if (user) filters.user = user;
  if (action) filters.action = action;
  if (resource) filters.resource = resource;
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;
  if (limit) filters.limit = parseInt(limit);

  const logs = logger.getLogs(filters);
  
  logger.info(req.user.username, 'view_logs', 'logs', `Consultó ${logs.length} logs`);
  
  res.json(logs);
});

// Obtener estadísticas de logs
app.get('/api/logs/stats', authenticateJWT, (req, res) => {
  const stats = logger.getStats();
  res.json(stats);
});

// Limpiar logs antiguos (solo Owner)
app.post('/api/logs/cleanup', authenticateJWT, (req, res) => {
  if (!req.user.roles || !req.user.roles.includes('Owner')) {
    return res.status(403).json({ error: 'Solo Owner puede limpiar logs' });
  }

  const { days } = req.body;
  const removed = logger.clearOldLogs(days || 30);
  
  res.json({ success: true, removed });
});

// Limpiar TODOS los logs (solo Owner)
app.delete('/api/logs', authenticateJWT, (req, res) => {
  if (!req.user.roles || !req.user.roles.includes('Owner')) {
    return res.status(403).json({ error: 'Solo Owner puede limpiar logs' });
  }

  const count = logger.clearAll();
  logger.warning(req.user.username, 'logs_cleared', 'logs', `Limpiados TODOS los logs (${count} entradas)`);
  
  res.json({ success: true, cleared: count });
});

// Modules routes
app.get('/api/modules', (req, res) => {
  res.json(database.modules);
});

app.get('/api/modules/:id', (req, res) => {
  const module = database.modules.find(m => m._id === req.params.id);
  if (!module) {
    return res.status(404).json({ error: 'Module not found' });
  }
  res.json(module);
});

app.post('/api/modules', (req, res) => {
  try {
    console.log('📥 POST /api/modules - Creating new module');
    console.log('   Body:', JSON.stringify(req.body, null, 2));
    
    const newModule = {
      _id: Date.now().toString(),
      ...req.body,
      createdAt: new Date()
    };
    
    database.modules.push(newModule);
    console.log('✅ Module created:', newModule._id, '-', newModule.name);
    
    res.status(201).json(newModule);
  } catch(err) {
    console.error('❌ Error creating module:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/modules/:id', (req, res) => {
  const idx = database.modules.findIndex(m => m._id === req.params.id);
  if (idx === -1) return res.status(404).json({error: 'Module not found'});
  
  database.modules[idx] = {
    ...database.modules[idx],
    ...req.body,
    updatedAt: new Date()
  };
  res.json(database.modules[idx]);
});

app.delete('/api/modules/:id', async (req, res) => {
  const idx = database.modules.findIndex(m => m._id === req.params.id);
  if (idx === -1) return res.status(404).json({error: 'Module not found'});
  
  try {
    // 1. Eliminar archivos del disco (módulo completo con dependencias)
    const deleteResult = await moduleManager.deleteModule(req.params.id);
    
    if (!deleteResult.success) {
      console.error('Failed to delete module from disk:', deleteResult.error);
    }
    
    // 2. Eliminar de memoria
    delete database.moduleFiles[req.params.id];
    database.modules.splice(idx, 1);
    
    res.json({
      message: 'Module deleted',
      diskDeleted: deleteResult.success,
      moduleDir: deleteResult.moduleDir
    });
  } catch (error) {
    console.error('Error deleting module:', error);
    // Aún si falla el disco, eliminamos de memoria
    delete database.moduleFiles[req.params.id];
    database.modules.splice(idx, 1);
    
    res.json({
      message: 'Module deleted from memory',
      diskDeleted: false,
      error: error.message
    });
  }
});

// ==================== MODULE ZIP VALIDATION & UPLOAD ====================

const ModuleValidator = require('./module-validator');
const moduleValidator = new ModuleValidator();
const fs = require('fs');
const os = require('os');

// Configurar multer para ZIP uploads (separado del storage)
const uploadZip = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const tmpDir = path.join(os.tmpdir(), 'ramen-module-uploads');
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      cb(null, tmpDir);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
      cb(null, uniqueName);
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files are allowed'));
    }
  }
});

// POST /api/modules/validate-zip - Valida un ZIP sin instalarlo
app.post('/api/modules/validate-zip', authenticateToken, uploadZip.single('module'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No ZIP file provided' });
    }

    console.log(`📦 Validating module ZIP: ${req.file.originalname}`);

    // Validar el ZIP
    const validation = moduleValidator.validateZip(req.file.path);

    // Generar reporte de texto
    const textReport = moduleValidator.generateTextReport(validation);

    // Eliminar archivo temporal
    fs.unlinkSync(req.file.path);

    res.json({
      ...validation,
      fileName: req.file.originalname,
      textReport
    });

  } catch (error) {
    console.error('Error validating module ZIP:', error);
    
    // Limpiar archivo temporal si existe
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ 
      error: error.message,
      valid: false
    });
  }
});

// POST /api/modules/upload-zip - Valida, extrae e instala un módulo desde ZIP
app.post('/api/modules/upload-zip', authenticateToken, requireRole(['Owner', 'Admin']), uploadZip.single('module'), async (req, res) => {
  let tempZipPath = null;
  let extractPath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No ZIP file provided' });
    }

    tempZipPath = req.file.path;
    const { enabled = true, type = 'internal' } = req.body;

    console.log(`📦 Uploading and installing module: ${req.file.originalname}`);

    // 1. Validar el ZIP
    const validation = moduleValidator.validateZip(tempZipPath);

    if (!validation.valid) {
      fs.unlinkSync(tempZipPath);
      return res.status(400).json({
        error: 'Module validation failed',
        validation,
        textReport: moduleValidator.generateTextReport(validation)
      });
    }

    // 2. Extraer a directorio temporal
    const moduleId = Date.now().toString();
    extractPath = path.join(os.tmpdir(), `ramen-module-${moduleId}`);
    
    const extraction = moduleValidator.extractAndValidate(tempZipPath, extractPath);

    if (!extraction.success) {
      fs.unlinkSync(tempZipPath);
      return res.status(500).json({
        error: 'Failed to extract module',
        details: extraction.error
      });
    }

    // 3. Leer package.json del módulo extraído
    const packageJsonPath = path.join(extractPath, 'package.json');
    let packageJson = null;
    
    // Buscar package.json (puede estar en subdirectorio)
    const findPackageJson = (dir) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && file !== 'node_modules') {
          const found = findPackageJson(fullPath);
          if (found) return found;
        } else if (file === 'package.json') {
          return fullPath;
        }
      }
      return null;
    };

    const pkgPath = findPackageJson(extractPath);
    if (pkgPath) {
      packageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    } else {
      throw new Error('package.json not found in extracted module');
    }

    // 4. Mover archivos del módulo a la carpeta definitiva
    const finalModuleDir = moduleManager.getModuleDir(moduleId);
    
    // Copiar archivos recursivamente
    const copyRecursive = (src, dest) => {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      const entries = fs.readdirSync(src);
      
      for (const entry of entries) {
        const srcPath = path.join(src, entry);
        const destPath = path.join(dest, entry);
        const stat = fs.statSync(srcPath);
        
        if (stat.isDirectory()) {
          copyRecursive(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    };

    // Copiar desde el directorio que contiene package.json
    const sourceDir = path.dirname(pkgPath);
    copyRecursive(sourceDir, finalModuleDir);

    // 5. Instalar dependencias
    let installResult = null;
    try {
      installResult = await moduleManager.installDependencies(moduleId);
      console.log(`✅ Dependencies installed for module ${moduleId}`);
    } catch (installError) {
      console.error(`⚠️ Failed to install dependencies: ${installError.message}`);
      // Continuar aunque falle la instalación
    }

    // 6. Crear registro del módulo en la base de datos
    const newModule = {
      _id: moduleId,
      name: packageJson.name || req.file.originalname.replace('.zip', ''),
      description: packageJson.description || 'Uploaded module from ZIP',
      type: type,
      enabled: enabled === 'true' || enabled === true,
      route: `/${packageJson.name || moduleId}`,
      icon: '📦',
      entryPoint: validation.entryPoint || packageJson.main || 'server.js',
      version: packageJson.version || '1.0.0',
      author: packageJson.author || req.user.username,
      uploadedBy: req.user.username,
      uploadedAt: new Date(),
      packageJson: packageJson,
      validation: validation,
      installed: installResult ? installResult.status === 'installed' : false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    database.modules.push(newModule);

    // 7. Limpiar archivos temporales
    fs.unlinkSync(tempZipPath);
    
    // Eliminar carpeta temporal de extracción
    if (fs.existsSync(extractPath)) {
      if (fs.rmSync) {
        fs.rmSync(extractPath, { recursive: true, force: true });
      }
    }

    console.log(`✅ Module ${moduleId} uploaded and installed successfully`);

    res.json({
      message: 'Module uploaded and installed successfully',
      module: newModule,
      validation: validation,
      installation: installResult,
      textReport: moduleValidator.generateTextReport(validation)
    });

  } catch (error) {
    console.error('Error uploading module:', error);

    // Limpiar archivos temporales
    if (tempZipPath && fs.existsSync(tempZipPath)) {
      fs.unlinkSync(tempZipPath);
    }
    if (extractPath && fs.existsSync(extractPath)) {
      if (fs.rmSync) {
        fs.rmSync(extractPath, { recursive: true, force: true });
      }
    }

    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Module files endpoints
app.get('/api/modules/:id/files', (req, res) => {
  const files = database.moduleFiles[req.params.id] || [];
  res.json({ files });
});

app.post('/api/modules/:id/files', async (req, res) => {
  try {
    const { files } = req.body;
    if (!Array.isArray(files)) {
      return res.status(400).json({error: 'files array required'});
    }
    
    // Guardar en memoria (para compatibilidad)
    database.moduleFiles[req.params.id] = files;
    
    // Guardar en disco en carpeta aislada
    const result = await moduleManager.saveModuleFiles(req.params.id, files);
    
    res.json({ 
      message: 'Files saved', 
      count: files.length,
      moduleDir: result.moduleDir,
      packageJsonFound: result.packageJsonFound
    });
  } catch (error) {
    console.error('Error saving module files:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/modules/:id/files/:filename', (req, res) => {
  const files = database.moduleFiles[req.params.id] || [];
  const file = files.find(f => f.path === req.params.filename);
  
  if (!file) return res.status(404).json({error: 'File not found'});
  
  res.json(file);
});

app.delete('/api/modules/:id/files/:filename', (req, res) => {
  const files = database.moduleFiles[req.params.id] || [];
  const idx = files.findIndex(f => f.path === req.params.filename);
  
  if (idx === -1) return res.status(404).json({error: 'File not found'});
  
  files.splice(idx, 1);
  database.moduleFiles[req.params.id] = files;
  
  res.json({message: 'File deleted'});
});

// ==========================================
// NUEVOS ENDPOINTS: Module Manager
// ==========================================

// Instalar dependencias de un módulo
app.post('/api/modules/:id/install', async (req, res) => {
  try {
    const moduleId = req.params.id;
    const { force } = req.body;
    
    console.log(`📦 Installing dependencies for module ${moduleId}...`);
    
    const result = await moduleManager.installDependencies(moduleId, { force });
    
    res.json({
      success: true,
      moduleId,
      ...result
    });
  } catch (error) {
    console.error('Error installing dependencies:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Iniciar un módulo
app.post('/api/modules/:id/start', async (req, res) => {
  try {
    const moduleId = req.params.id;
    const { port, dbCollection, entryPoint, envVars } = req.body;
    
    // Obtener configuración del módulo desde database
    const module = database.modules.find(m => m._id === moduleId);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    // Verificar si es un módulo externo (iframe, link, etc)
    const isExternal = module.embedType === 'iframe' || 
                       module.embedType === 'link' ||
                       (module.baseUrl && (module.baseUrl.startsWith('http://') || module.baseUrl.startsWith('https://')));
    
    if (isExternal) {
      // Los módulos externos NO se ejecutan localmente, solo se "activan"
      console.log(`🌐 Module ${moduleId} is external (${module.embedType}), marking as online...`);
      
      // Actualizar estado en database
      const idx = database.modules.findIndex(m => m._id === moduleId);
      if (idx !== -1) {
        database.modules[idx].status = 'online';
      }
      
      return res.json({
        success: true,
        moduleId,
        type: 'external',
        embedType: module.embedType,
        baseUrl: module.baseUrl,
        status: 'online',
        message: 'External module marked as online (not executed locally)'
      });
    }
    
    // Solo módulos locales (proxy) se ejecutan como procesos
    const config = {
      port: port || module.devPort || 3000,
      dbCollection: dbCollection || module.dbCollection || moduleId,
      entryPoint: entryPoint || module.entryPoint || 'server.js',
      envVars: {
        DB_CONNECTION_STRING: process.env.DB_CONNECTION_STRING || 'mongodb://localhost:27017/ramen',
        ...(module.envVars || {}),
        ...(envVars || {})
      }
    };
    
    console.log(`🚀 Starting local module ${moduleId} on port ${config.port}...`);
    
    const result = await moduleManager.startModule(moduleId, config);
    
    // Actualizar estado en database
    const idx = database.modules.findIndex(m => m._id === moduleId);
    if (idx !== -1) {
      database.modules[idx].status = 'running';
    }
    
    res.json({
      success: true,
      moduleId,
      type: 'local',
      port: result.port,
      status: result.status,
      pid: result.process.pid
    });
  } catch (error) {
    console.error('Error starting module:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Detener un módulo
app.post('/api/modules/:id/stop', async (req, res) => {
  try {
    const moduleId = req.params.id;
    
    // Obtener configuración del módulo desde database
    const module = database.modules.find(m => m._id === moduleId);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    // Verificar si es un módulo externo
    const isExternal = module.embedType === 'iframe' || 
                       module.embedType === 'link' ||
                       (module.baseUrl && (module.baseUrl.startsWith('http://') || module.baseUrl.startsWith('https://')));
    
    if (isExternal) {
      // Los módulos externos solo se marcan como offline
      console.log(`🌐 Module ${moduleId} is external, marking as offline...`);
      
      const idx = database.modules.findIndex(m => m._id === moduleId);
      if (idx !== -1) {
        database.modules[idx].status = 'offline';
      }
      
      return res.json({
        success: true,
        moduleId,
        type: 'external',
        status: 'offline',
        message: 'External module marked as offline'
      });
    }
    
    // Solo detener procesos locales
    console.log(`🛑 Stopping local module ${moduleId}...`);
    
    const result = await moduleManager.stopModule(moduleId);
    
    // Actualizar estado en database
    const idx = database.modules.findIndex(m => m._id === moduleId);
    if (idx !== -1) {
      database.modules[idx].status = 'stopped';
    }
    
    res.json({
      success: true,
      moduleId,
      type: 'local',
      ...result
    });
  } catch (error) {
    console.error('Error stopping module:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Reiniciar un módulo
app.post('/api/modules/:id/restart', async (req, res) => {
  try {
    const moduleId = req.params.id;
    const { port, dbCollection, entryPoint, envVars } = req.body;
    
    // Obtener configuración del módulo desde database
    const module = database.modules.find(m => m._id === moduleId);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    const config = {
      port: port || module.devPort || 3000,
      dbCollection: dbCollection || module.dbCollection || moduleId,
      entryPoint: entryPoint || module.entryPoint || 'server.js',
      envVars: {
        DB_CONNECTION_STRING: process.env.DB_CONNECTION_STRING || 'mongodb://localhost:27017/ramen',
        ...(module.envVars || {}),
        ...(envVars || {})
      }
    };
    
    console.log(`♻️ Restarting module ${moduleId}...`);
    
    const result = await moduleManager.restartModule(moduleId, config);
    
    res.json({
      success: true,
      moduleId,
      port: result.port,
      status: result.status,
      pid: result.process.pid
    });
  } catch (error) {
    console.error('Error restarting module:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Obtener estado de un módulo
app.get('/api/modules/:id/status', (req, res) => {
  try {
    const moduleId = req.params.id;
    const status = moduleManager.getModuleStatus(moduleId);
    
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('Error getting module status:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Obtener información completa de un módulo
app.get('/api/modules/:id/info', (req, res) => {
  try {
    const moduleId = req.params.id;
    const info = moduleManager.getModuleInfo(moduleId);
    
    res.json({
      success: true,
      ...info
    });
  } catch (error) {
    console.error('Error getting module info:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Validar package.json de un módulo
app.get('/api/modules/:id/validate', (req, res) => {
  try {
    const moduleId = req.params.id;
    const validation = moduleManager.validatePackageJson(moduleId);
    
    res.json({
      success: validation.valid,
      moduleId,
      ...validation
    });
  } catch (error) {
    console.error('Error validating module:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Listar todos los módulos en ejecución
app.get('/api/modules-running', (req, res) => {
  try {
    const modules = moduleManager.listRunningModules();
    
    res.json({
      success: true,
      count: modules.length,
      modules
    });
  } catch (error) {
    console.error('Error listing running modules:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Leaked passwords routes
app.get('/api/leaked', (req, res) => {
  res.json(database.leakedPasswords);
});

app.post('/api/leaked/bulk', (req, res) => {
  const items = req.body.items || [];
  if (!Array.isArray(items)) return res.status(400).json({msg: 'items array required'});
  
  const created = items.map(item => ({
    _id: Date.now().toString() + Math.random(),
    ...item,
    firstSeen: item.firstSeen || new Date()
  }));
  
  database.leakedPasswords.push(...created);
  res.json({ inserted: created.length });
});

// Findings routes
app.get('/api/findings', (req, res) => {
  res.json(database.findings);
});

app.post('/api/findings', (req, res) => {
  const newFinding = {
    _id: Date.now().toString(),
    ...req.body,
    createdAt: new Date()
  };
  database.findings.push(newFinding);
  res.status(201).json(newFinding);
});

// Users routes
app.get('/api/users', (req, res) => {
  // No enviar passwordHash
  const users = database.users.map(u => {
    const { passwordHash, ...rest } = u;
    return rest;
  });
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, fullName, email, password, roles, status } = req.body;
    
    // Validar que no exista el username
    if (database.users.find(u => u.username === username)) {
      return res.status(400).json({error: 'Username already exists'});
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    const newUser = {
      _id: Date.now().toString(),
      username,
      fullName,
      email,
      passwordHash,
      roles: roles || ['User'],
      status: status || 'active',
      createdAt: new Date()
    };
    
    database.users.push(newUser);
    
    // No enviar passwordHash en response
    const { passwordHash: _, ...userResponse } = newUser;
    res.status(201).json(userResponse);
  } catch(err) {
    res.status(500).json({error: '' + err});
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const idx = database.users.findIndex(u => u._id === req.params.id);
    if (idx === -1) return res.status(404).json({error: 'User not found'});
    
    const { fullName, email, password, roles, status } = req.body;
    
    // Actualizar campos
    if (fullName) database.users[idx].fullName = fullName;
    if (email !== undefined) database.users[idx].email = email;
    if (roles) database.users[idx].roles = roles;
    if (status) database.users[idx].status = status;
    
    // Si hay nueva password, hashear
    if (password) {
      database.users[idx].passwordHash = await bcrypt.hash(password, 10);
    }
    
    database.users[idx].updatedAt = new Date();
    
    // No enviar passwordHash
    const { passwordHash: _, ...userResponse } = database.users[idx];
    res.json(userResponse);
  } catch(err) {
    res.status(500).json({error: '' + err});
  }
});

app.delete('/api/users/:id', authenticateJWT, (req, res) => {
  const idx = database.users.findIndex(u => u._id === req.params.id);
  if (idx === -1) return res.status(404).json({error: 'User not found'});
  
  // No permitir eliminar owner
  if (database.users[idx].username === 'owner') {
    return res.status(403).json({error: 'Cannot delete owner user'});
  }
  
  // Solo Owner puede borrar usuarios
  if (!req.user.roles || !req.user.roles.includes('Owner')) {
    return res.status(403).json({error: 'Only Owner can delete users'});
  }
  
  const deletedUser = database.users[idx];
  database.users.splice(idx, 1);
  
  logger.warning(req.user.username, 'user_deleted', 'users', `Usuario ${deletedUser.username} eliminado`);
  res.json({message: 'User deleted'});
});

// Cambio de contraseña (para el propio usuario)
app.put('/api/users/:id/password', authenticateJWT, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const idx = database.users.findIndex(u => u._id === req.params.id);
    
    if (idx === -1) return res.status(404).json({error: 'User not found'});
    
    const user = database.users[idx];
    
    // Verificar que sea el mismo usuario o sea Owner
    if (req.user.sub !== req.params.id && !req.user.roles.includes('Owner')) {
      return res.status(403).json({error: 'You can only change your own password'});
    }
    
    // Si NO es Owner cambiando la contraseña de otro, verificar contraseña actual
    if (req.user.sub === req.params.id) {
      const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({error: 'Current password is incorrect'});
      }
    }
    
    // Hashear nueva contraseña
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.updatedAt = new Date();
    
    logger.success(req.user.username, 'password_changed', 'users', `Contraseña actualizada para ${user.username}`);
    res.json({message: 'Password updated successfully'});
  } catch(err) {
    logger.error(req.user.username, 'password_change_error', 'users', err.message);
    res.status(500).json({error: '' + err});
  }
});

// Bloquear/Desbloquear usuario
app.put('/api/users/:id/status', authenticateJWT, (req, res) => {
  try {
    const { status } = req.body; // 'active' o 'blocked'
    const idx = database.users.findIndex(u => u._id === req.params.id);
    
    if (idx === -1) return res.status(404).json({error: 'User not found'});
    
    // Solo Owner puede bloquear usuarios
    if (!req.user.roles || !req.user.roles.includes('Owner')) {
      return res.status(403).json({error: 'Only Owner can block/unblock users'});
    }
    
    // No permitir bloquear owner
    if (database.users[idx].username === 'owner') {
      return res.status(403).json({error: 'Cannot block owner user'});
    }
    
    database.users[idx].status = status;
    database.users[idx].updatedAt = new Date();
    
    const action = status === 'blocked' ? 'bloqueado' : 'desbloqueado';
    logger.warning(req.user.username, 'user_status_changed', 'users', `Usuario ${database.users[idx].username} ${action}`);
    
    const { passwordHash: _, ...userResponse } = database.users[idx];
    res.json(userResponse);
  } catch(err) {
    res.status(500).json({error: '' + err});
  }
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
  res.json({
    totalModules: database.modules.length,
    totalUsers: database.users.length,
    activeModules: database.modules.filter(m => m.status === 'active' || m.status === 'online').length,
    onlineUsers: 1, // Demo
    recentActivity: [
      { type: 'login', user: 'owner', timestamp: new Date(Date.now() - 300000) },
      { type: 'module_access', user: 'owner', module: 'Bitácora', timestamp: new Date(Date.now() - 600000) }
    ]
  });
});

// ==================== STORAGE API ====================

// Configurar multer para uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: storageConfig.maxFileSize },
  fileFilter: (req, file, cb) => {
    if (storageConfig.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
    }
  }
});

// Upload de archivo
app.post('/api/storage/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { moduleId, category = 'documents', description, customMetadata } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó archivo' });
    }

    if (!moduleId) {
      return res.status(400).json({ error: 'moduleId es requerido' });
    }

    const metadata = {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      uploadedBy: req.user.username,
      custom: {
        description,
        ...(customMetadata ? JSON.parse(customMetadata) : {})
      }
    };

    const result = await storageManager.uploadFile(
      moduleId,
      category,
      req.file.buffer,
      metadata
    );

    logger.info(req.user.username, 'file_uploaded', 'storage', `Archivo subido: ${req.file.originalname} (${moduleId}/${category})`);

    res.json(result);
  } catch (error) {
    console.error('[Storage] Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Descargar archivo
app.get('/api/storage/files/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { buffer, metadata } = await storageManager.getFile(fileId);

    res.setHeader('Content-Type', metadata.mimetype);
    res.setHeader('Content-Disposition', `inline; filename="${metadata.originalName}"`);
    res.setHeader('Content-Length', metadata.size);
    
    logger.info(req.user.username, 'file_downloaded', 'storage', `Archivo descargado: ${metadata.originalName}`);
    
    res.send(buffer);
  } catch (error) {
    console.error('[Storage] Download error:', error);
    res.status(404).json({ error: 'Archivo no encontrado' });
  }
});

// Listar archivos de un módulo
app.get('/api/storage/files', authenticateToken, async (req, res) => {
  try {
    const { moduleId, category, limit, offset } = req.query;

    if (!moduleId) {
      return res.status(400).json({ error: 'moduleId es requerido' });
    }

    const result = await storageManager.listFiles(moduleId, category, {
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0
    });

    res.json(result);
  } catch (error) {
    console.error('[Storage] List error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar archivo
app.delete('/api/storage/files/:fileId', authenticateToken, async (req, res) => {
  try {
    // Solo Admin y Owner pueden eliminar
    if (!req.user.roles.includes('Admin') && !req.user.roles.includes('Owner')) {
      return res.status(403).json({ error: 'Permisos insuficientes' });
    }

    const { fileId } = req.params;
    const metadata = await storageManager.getMetadata(fileId);
    
    const result = await storageManager.deleteFile(fileId);

    logger.warning(req.user.username, 'file_deleted', 'storage', `Archivo eliminado: ${metadata?.originalName || fileId}`);

    res.json(result);
  } catch (error) {
    console.error('[Storage] Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Estadísticas de storage
app.get('/api/storage/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await storageManager.getStorageStats();
    res.json(stats);
  } catch (error) {
    console.error('[Storage] Stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Migrar storage (solo Owner)
app.post('/api/storage/migrate', authenticateToken, async (req, res) => {
  try {
    if (!req.user.roles.includes('Owner')) {
      return res.status(403).json({ error: 'Solo Owner puede migrar storage' });
    }

    const { newPath, copyOnly = true, verifyHashes = true } = req.body;

    if (!newPath) {
      return res.status(400).json({ error: 'newPath es requerido' });
    }

    logger.warning(req.user.username, 'storage_migration_started', 'storage', `Iniciando migración a: ${newPath}`);

    const result = await storageManager.migrateStorage(newPath, { copyOnly, verifyHashes });

    logger.info(req.user.username, 'storage_migration_completed', 'storage', `Migración completada: ${result.migrated} archivos`);

    res.json(result);
  } catch (error) {
    console.error('[Storage] Migration error:', error);
    logger.error(req.user.username, 'storage_migration_failed', 'storage', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Ramen Orquestador API is running',
    timestamp: new Date().toISOString(),
    database: 'in-memory'
  });
});

// Servir Angular app (debe ir DESPUÉS de todas las rutas API)
// Deshabilitar caché para desarrollo
app.use(express.static(path.join(__dirname, '../frontend/dist/ramen-frontend'), {
  maxAge: 0,
  etag: false,
  lastModified: false,
  setHeaders: (res, path) => {
    // No cachear nada en desarrollo
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Catchall route - devuelve index.html para rutas que NO son API
app.get('*', (req, res) => {
  // Si la ruta empieza con /api, NO servir index.html (esto es una API que no existe)
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Para todas las demás rutas, servir index.html (rutas de Angular)
  // Sin caché
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, '../frontend/dist/ramen-frontend/index.html'));
});

const PORT = process.env.PORT || 4000;

initDB()
  .then(async () => {
    // Inicializar Storage Manager
    await storageManager.init();
    
    const server = app.listen(PORT, () => {
      console.log('🚀 Ramen Orquestador API listening on port', PORT);
      console.log('📊 Demo mode - using in-memory database');
      console.log('🔑 Login credentials: owner / admin123');
      console.log('🌐 API Health: http://localhost:' + PORT + '/api/health');
      console.log('📦 Module Manager initialized');
      console.log('📁 Modules directory:', moduleManager.modulesBaseDir);
      console.log('💾 Storage initialized:', storageManager.baseStoragePath);
      console.log('📂 Storage type:', storageConfig.storageType);
    });
    
    server.on('error', (err) => {
      console.error('❌ Server error:', err);
      process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('\n🛑 SIGTERM received, shutting down gracefully...');
      await moduleManager.stopAllModules();
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', async () => {
      console.log('\n🛑 SIGINT received, shutting down gracefully...');
      await moduleManager.stopAllModules();
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
  })
  .catch((err) => {
    console.error('❌ Failed to initialize:', err);
    process.exit(1);
  });

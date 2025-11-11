/**
 * module-manager.js - Gestión de módulos aislados con dependencias propias
 * 
 * Cada módulo se ejecuta en su propia carpeta con su propio node_modules:
 * C:\ramen\modules\{moduleId}\
 *   ├── node_modules\      ← Dependencias PROPIAS del módulo
 *   ├── package.json       ← Config PROPIA del módulo
 *   ├── server.js          ← Entry point
 *   ├── .env               ← Variables de entorno inyectadas
 *   └── src\               ← Código fuente
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

class ModuleManager {
  constructor(modulesBaseDir) {
    this.modulesBaseDir = modulesBaseDir || path.join(__dirname, '../modules');
    this.runningModules = new Map(); // moduleId -> { process, port, status, restarts }
    
    // Crear directorio base si no existe
    if (!fs.existsSync(this.modulesBaseDir)) {
      fs.mkdirSync(this.modulesBaseDir, { recursive: true });
      console.log('📂 Created modules directory:', this.modulesBaseDir);
    }
  }

  /**
   * Obtiene el directorio de un módulo específico
   */
  getModuleDir(moduleId) {
    return path.join(this.modulesBaseDir, moduleId);
  }

  /**
   * Crea la estructura de carpetas para un módulo
   */
  async createModuleDirectory(moduleId) {
    const moduleDir = this.getModuleDir(moduleId);
    
    if (!fs.existsSync(moduleDir)) {
      fs.mkdirSync(moduleDir, { recursive: true });
      console.log(`📂 Created module directory: ${moduleDir}`);
    }
    
    return moduleDir;
  }

  /**
   * Guarda archivos del módulo en su carpeta aislada
   * @param {string} moduleId - ID del módulo
   * @param {Array} files - Array de { path, content, language }
   */
  async saveModuleFiles(moduleId, files) {
    const moduleDir = await this.createModuleDirectory(moduleId);
    
    let savedCount = 0;
    let packageJsonFound = false;
    
    for (const file of files) {
      const filePath = path.join(moduleDir, file.path);
      const fileDir = path.dirname(filePath);
      
      // Crear directorios necesarios
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }
      
      // Guardar archivo
      fs.writeFileSync(filePath, file.content, 'utf-8');
      savedCount++;
      
      // Detectar package.json
      if (file.path === 'package.json' || file.path.endsWith('/package.json')) {
        packageJsonFound = true;
      }
    }
    
    console.log(`💾 Saved ${savedCount} files to ${moduleDir}`);
    
    return {
      savedCount,
      moduleDir,
      packageJsonFound
    };
  }

  /**
   * Instala las dependencias del módulo en su carpeta aislada
   * @param {string} moduleId - ID del módulo
   * @param {Object} options - Opciones: { force: boolean }
   */
  async installDependencies(moduleId, options = {}) {
    const moduleDir = this.getModuleDir(moduleId);
    const packageJsonPath = path.join(moduleDir, 'package.json');
    
    // Verificar que existe package.json
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`package.json not found in ${moduleDir}`);
    }
    
    // Leer package.json para validar
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    console.log(`📦 Installing dependencies for module: ${packageJson.name || moduleId}`);
    
    // Verificar si ya existen dependencias instaladas
    const nodeModulesPath = path.join(moduleDir, 'node_modules');
    const hasNodeModules = fs.existsSync(nodeModulesPath);
    
    if (hasNodeModules && !options.force) {
      console.log(`✅ Dependencies already installed in ${moduleDir}`);
      return {
        status: 'already_installed',
        moduleDir,
        dependencies: packageJson.dependencies || {}
      };
    }
    
    // Instalar dependencias
    console.log(`⏳ Running npm install in ${moduleDir}...`);
    
    try {
      // Ejecutar npm install en la carpeta del módulo
      const output = execSync('npm install --production', {
        cwd: moduleDir,
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      
      console.log(`✅ Dependencies installed successfully for ${moduleId}`);
      
      return {
        status: 'installed',
        moduleDir,
        dependencies: packageJson.dependencies || {},
        output: output.substring(0, 500) // Primeros 500 caracteres del log
      };
    } catch (error) {
      console.error(`❌ Failed to install dependencies for ${moduleId}:`, error.message);
      throw new Error(`npm install failed: ${error.message}`);
    }
  }

  /**
   * Crea archivo .env con variables de entorno para el módulo
   * @param {string} moduleId - ID del módulo
   * @param {Object} envVars - Variables de entorno { PORT, DB_COLLECTION, API_KEY, etc }
   */
  async createEnvFile(moduleId, envVars) {
    const moduleDir = this.getModuleDir(moduleId);
    const envPath = path.join(moduleDir, '.env');
    
    // Convertir objeto a formato .env
    const envContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    fs.writeFileSync(envPath, envContent, 'utf-8');
    console.log(`📝 Created .env file for ${moduleId}`);
    
    return envPath;
  }

  /**
   * Inicia un módulo como proceso hijo aislado
   * @param {string} moduleId - ID del módulo
   * @param {Object} config - Configuración { port, dbCollection, entryPoint, envVars }
   */
  async startModule(moduleId, config) {
    const moduleDir = this.getModuleDir(moduleId);
    const entryPoint = config.entryPoint || 'server.js';
    const entryPath = path.join(moduleDir, entryPoint);
    
    // Verificar que existe el entry point
    if (!fs.existsSync(entryPath)) {
      throw new Error(`Entry point ${entryPoint} not found in ${moduleDir}`);
    }
    
    // Verificar que no esté ya corriendo
    if (this.runningModules.has(moduleId)) {
      const existing = this.runningModules.get(moduleId);
      if (existing.status === 'running') {
        console.log(`⚠️ Module ${moduleId} is already running on port ${existing.port}`);
        return existing;
      }
    }
    
    // Preparar variables de entorno
    const env = {
      ...process.env,
      PORT: config.port,
      DB_COLLECTION: config.dbCollection || moduleId,
      MODULE_ID: moduleId,
      ...(config.envVars || {})
    };
    
    console.log(`🚀 Starting module ${moduleId} on port ${config.port}...`);
    
    // Spawn proceso hijo
    const childProcess = spawn('node', [entryPoint], {
      cwd: moduleDir,
      env,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    // Estado del módulo
    const moduleState = {
      process: childProcess,
      port: config.port,
      status: 'starting',
      startTime: new Date(),
      restarts: 0,
      logs: {
        stdout: [],
        stderr: []
      }
    };
    
    // Capturar stdout
    childProcess.stdout.on('data', (data) => {
      const log = data.toString();
      moduleState.logs.stdout.push({
        timestamp: new Date(),
        message: log
      });
      
      // Mantener solo los últimos 100 logs
      if (moduleState.logs.stdout.length > 100) {
        moduleState.logs.stdout.shift();
      }
      
      console.log(`[${moduleId}] ${log.trim()}`);
      
      // Detectar si el módulo arrancó exitosamente
      if (log.includes('listening') || log.includes('started') || log.includes('running')) {
        moduleState.status = 'running';
        console.log(`✅ Module ${moduleId} is now running on port ${config.port}`);
      }
    });
    
    // Capturar stderr
    childProcess.stderr.on('data', (data) => {
      const log = data.toString();
      moduleState.logs.stderr.push({
        timestamp: new Date(),
        message: log
      });
      
      // Mantener solo los últimos 100 logs
      if (moduleState.logs.stderr.length > 100) {
        moduleState.logs.stderr.shift();
      }
      
      console.error(`[${moduleId}] ERROR: ${log.trim()}`);
    });
    
    // Manejar salida del proceso
    childProcess.on('exit', (code, signal) => {
      console.log(`⚠️ Module ${moduleId} exited with code ${code}, signal ${signal}`);
      moduleState.status = 'stopped';
      moduleState.exitCode = code;
      moduleState.exitSignal = signal;
      
      // Auto-restart si crasheó (máximo 3 intentos)
      if (code !== 0 && moduleState.restarts < 3) {
        console.log(`♻️ Auto-restarting module ${moduleId}... (attempt ${moduleState.restarts + 1}/3)`);
        setTimeout(() => {
          moduleState.restarts++;
          this.startModule(moduleId, config);
        }, 5000); // Esperar 5 segundos antes de reiniciar
      }
    });
    
    // Manejar errores del proceso
    childProcess.on('error', (error) => {
      console.error(`❌ Error starting module ${moduleId}:`, error);
      moduleState.status = 'error';
      moduleState.error = error.message;
    });
    
    this.runningModules.set(moduleId, moduleState);
    
    return moduleState;
  }

  /**
   * Detiene un módulo en ejecución
   * @param {string} moduleId - ID del módulo
   */
  async stopModule(moduleId) {
    const moduleState = this.runningModules.get(moduleId);
    
    if (!moduleState) {
      console.log(`⚠️ Module ${moduleId} is not running`);
      return { status: 'not_running' };
    }
    
    console.log(`🛑 Stopping module ${moduleId}...`);
    
    // Enviar SIGTERM para cerrar gracefully
    moduleState.process.kill('SIGTERM');
    
    // Esperar 5 segundos y forzar SIGKILL si no se cerró
    setTimeout(() => {
      if (moduleState.status !== 'stopped') {
        console.log(`⚠️ Force killing module ${moduleId}...`);
        moduleState.process.kill('SIGKILL');
      }
    }, 5000);
    
    moduleState.status = 'stopping';
    
    return {
      status: 'stopping',
      moduleId
    };
  }

  /**
   * Reinicia un módulo
   * @param {string} moduleId - ID del módulo
   * @param {Object} config - Configuración { port, dbCollection, entryPoint, envVars }
   */
  async restartModule(moduleId, config) {
    console.log(`♻️ Restarting module ${moduleId}...`);
    
    await this.stopModule(moduleId);
    
    // Esperar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return await this.startModule(moduleId, config);
  }

  /**
   * Obtiene el estado de un módulo
   * @param {string} moduleId - ID del módulo
   */
  getModuleStatus(moduleId) {
    const moduleState = this.runningModules.get(moduleId);
    
    if (!moduleState) {
      return {
        status: 'not_running',
        moduleId
      };
    }
    
    return {
      moduleId,
      status: moduleState.status,
      port: moduleState.port,
      startTime: moduleState.startTime,
      uptime: Date.now() - moduleState.startTime.getTime(),
      restarts: moduleState.restarts,
      pid: moduleState.process.pid,
      recentLogs: {
        stdout: moduleState.logs.stdout.slice(-10), // Últimos 10 logs
        stderr: moduleState.logs.stderr.slice(-10)
      }
    };
  }

  /**
   * Lista todos los módulos en ejecución
   */
  listRunningModules() {
    const modules = [];
    
    for (const [moduleId, state] of this.runningModules.entries()) {
      modules.push({
        moduleId,
        status: state.status,
        port: state.port,
        startTime: state.startTime,
        uptime: Date.now() - state.startTime.getTime(),
        restarts: state.restarts,
        pid: state.process.pid
      });
    }
    
    return modules;
  }

  /**
   * Detiene todos los módulos
   */
  async stopAllModules() {
    console.log('🛑 Stopping all modules...');
    
    const promises = [];
    for (const moduleId of this.runningModules.keys()) {
      promises.push(this.stopModule(moduleId));
    }
    
    await Promise.all(promises);
    
    console.log('✅ All modules stopped');
  }

  /**
   * Valida el package.json de un módulo
   * @param {string} moduleId - ID del módulo
   */
  validatePackageJson(moduleId) {
    const moduleDir = this.getModuleDir(moduleId);
    const packageJsonPath = path.join(moduleDir, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return {
        valid: false,
        error: 'package.json not found'
      };
    }
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      // Validar campos requeridos
      const errors = [];
      if (!packageJson.name) errors.push('Missing "name" field');
      if (!packageJson.version) errors.push('Missing "version" field');
      
      // Advertencias
      const warnings = [];
      if (!packageJson.main && !packageJson.scripts?.start) {
        warnings.push('No "main" field or "start" script defined');
      }
      
      return {
        valid: errors.length === 0,
        errors,
        warnings,
        packageJson
      };
    } catch (error) {
      return {
        valid: false,
        error: `Invalid JSON: ${error.message}`
      };
    }
  }

  /**
   * Obtiene información detallada de un módulo
   * @param {string} moduleId - ID del módulo
   */
  getModuleInfo(moduleId) {
    const moduleDir = this.getModuleDir(moduleId);
    
    if (!fs.existsSync(moduleDir)) {
      return {
        exists: false,
        moduleId
      };
    }
    
    const packageJsonPath = path.join(moduleDir, 'package.json');
    const hasPackageJson = fs.existsSync(packageJsonPath);
    const hasNodeModules = fs.existsSync(path.join(moduleDir, 'node_modules'));
    
    let packageJson = null;
    if (hasPackageJson) {
      try {
        packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      } catch (e) {
        // Ignorar errores de parsing
      }
    }
    
    // Listar archivos en el directorio
    const files = this.listModuleFiles(moduleDir);
    
    return {
      exists: true,
      moduleId,
      moduleDir,
      hasPackageJson,
      hasNodeModules,
      packageJson,
      fileCount: files.length,
      files: files.slice(0, 20) // Primeros 20 archivos
    };
  }

  /**
   * Lista archivos de un módulo (excluyendo node_modules)
   */
  listModuleFiles(dir, baseDir = dir) {
    const files = [];
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        // Excluir node_modules, .git, etc
        if (item === 'node_modules' || item === '.git' || item === 'dist' || item === 'build') {
          continue;
        }
        
        const fullPath = path.join(dir, item);
        const relativePath = path.relative(baseDir, fullPath);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Recursivo
          files.push(...this.listModuleFiles(fullPath, baseDir));
        } else {
          files.push({
            path: relativePath,
            size: stat.size,
            modified: stat.mtime
          });
        }
      }
    } catch (error) {
      console.error(`Error listing files in ${dir}:`, error);
    }
    
    return files;
  }

  /**
   * Elimina completamente un módulo del disco (archivos, dependencias, todo)
   * @param {string} moduleId - ID del módulo a eliminar
   * @returns {Object} Resultado de la operación
   */
  async deleteModule(moduleId) {
    const moduleDir = this.getModuleDir(moduleId);
    
    // Verificar si el módulo existe
    if (!fs.existsSync(moduleDir)) {
      console.log(`⚠️ Module directory not found: ${moduleDir}`);
      return {
        success: false,
        error: 'Module directory not found',
        moduleDir
      };
    }
    
    try {
      // 1. Detener el módulo si está corriendo
      if (this.runningModules.has(moduleId)) {
        console.log(`🛑 Stopping running module ${moduleId}...`);
        await this.stopModule(moduleId);
        
        // Esperar 2 segundos para asegurar que el proceso terminó
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Remover de la lista de módulos corriendo
        this.runningModules.delete(moduleId);
      }
      
      // 2. Eliminar carpeta completa del disco (recursivo)
      console.log(`🗑️ Deleting module directory: ${moduleDir}`);
      
      // Usar fs.rmSync con recursive: true (Node.js 14.14+)
      // Si falla, intentar método manual compatible con versiones antiguas
      try {
        if (fs.rmSync) {
          // Node.js 14.14+
          fs.rmSync(moduleDir, { recursive: true, force: true });
        } else {
          // Node.js < 14.14 - Método manual
          const deleteFolderRecursive = (dirPath) => {
            if (fs.existsSync(dirPath)) {
              fs.readdirSync(dirPath).forEach((file) => {
                const curPath = path.join(dirPath, file);
                
                if (fs.lstatSync(curPath).isDirectory()) {
                  deleteFolderRecursive(curPath);
                } else {
                  fs.unlinkSync(curPath);
                }
              });
              fs.rmdirSync(dirPath);
            }
          };
          deleteFolderRecursive(moduleDir);
        }
      } catch (rmError) {
        throw new Error(`Failed to delete directory: ${rmError.message}`);
      }
      
      console.log(`✅ Module ${moduleId} deleted successfully from disk`);
      
      return {
        success: true,
        moduleId,
        moduleDir,
        message: 'Module deleted from disk'
      };
      
    } catch (error) {
      console.error(`❌ Error deleting module ${moduleId}:`, error);
      return {
        success: false,
        error: error.message,
        moduleId,
        moduleDir
      };
    }
  }
}

module.exports = ModuleManager;

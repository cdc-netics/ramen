/**
 * module-validator.js - Validador de módulos en formato ZIP
 * 
 * Valida que un módulo tenga:
 * - package.json válido con campos requeridos
 * - Entry point (server.js, index.js, etc.) que exista
 * - Estructura de carpetas coherente
 * - Dependencias compatibles
 * - Sin archivos prohibidos (node_modules, .git, etc.)
 */

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

class ModuleValidator {
  constructor() {
    // Campos requeridos en package.json
    this.requiredFields = ['name', 'version'];
    
    // Campos recomendados
    this.recommendedFields = ['description', 'main', 'scripts'];
    
    // Archivos/carpetas prohibidos en el ZIP
    this.forbiddenPaths = [
      'node_modules',
      '.git',
      '.env',
      'dist',
      'build',
      '.DS_Store',
      'Thumbs.db'
    ];
    
    // Extensiones de archivos válidos
    this.validExtensions = [
      '.js', '.ts', '.json', '.jsx', '.tsx',
      '.html', '.css', '.scss', '.sass', '.less',
      '.md', '.txt', '.yml', '.yaml',
      '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'
    ];
    
    // Entry points comunes
    this.commonEntryPoints = [
      'server.js',
      'index.js',
      'app.js',
      'main.js',
      'src/server.js',
      'src/index.js',
      'src/app.js'
    ];
  }

  /**
   * Valida un archivo ZIP de módulo completo
   * @param {string} zipPath - Ruta al archivo ZIP
   * @returns {Object} Reporte de validación con errores, advertencias y aprobación
   */
  validateZip(zipPath) {
    const report = {
      valid: true,
      errors: [],
      warnings: [],
      info: [],
      structure: {
        files: [],
        totalSize: 0,
        fileCount: 0
      },
      packageJson: null,
      entryPoint: null,
      score: 100
    };

    try {
      // 1. Verificar que el archivo existe
      if (!fs.existsSync(zipPath)) {
        report.valid = false;
        report.errors.push('ZIP file not found');
        return report;
      }

      // 2. Abrir ZIP
      let zip;
      try {
        zip = new AdmZip(zipPath);
      } catch (error) {
        report.valid = false;
        report.errors.push(`Invalid ZIP file: ${error.message}`);
        return report;
      }

      const entries = zip.getEntries();
      
      if (entries.length === 0) {
        report.valid = false;
        report.errors.push('ZIP file is empty');
        return report;
      }

      // 3. Analizar estructura del ZIP
      let packageJsonFound = false;
      let packageJsonContent = null;
      let packageJsonPath = null;
      const files = [];
      let totalSize = 0;

      for (const entry of entries) {
        const entryPath = entry.entryName.replace(/\\/g, '/');
        
        // Ignorar carpetas vacías
        if (entry.isDirectory) {
          continue;
        }

        totalSize += entry.header.size;
        files.push({
          path: entryPath,
          size: entry.header.size,
          compressed: entry.header.compressedSize
        });

        // 4. Verificar archivos prohibidos
        const fileName = path.basename(entryPath);
        const dirPath = path.dirname(entryPath);
        
        for (const forbidden of this.forbiddenPaths) {
          if (entryPath.includes(forbidden)) {
            report.warnings.push(`Forbidden path found: ${entryPath} (will be ignored)`);
            report.score -= 5;
          }
        }

        // 5. Verificar extensiones
        const ext = path.extname(fileName);
        if (ext && !this.validExtensions.includes(ext)) {
          report.warnings.push(`Unknown file extension: ${fileName}`);
          report.score -= 2;
        }

        // 6. Buscar package.json
        if (fileName === 'package.json' && !packageJsonFound) {
          try {
            packageJsonContent = JSON.parse(entry.getData().toString('utf8'));
            packageJsonPath = entryPath;
            packageJsonFound = true;
          } catch (error) {
            report.errors.push(`Invalid package.json: ${error.message}`);
            report.valid = false;
            report.score -= 30;
          }
        }
      }

      report.structure.files = files;
      report.structure.totalSize = totalSize;
      report.structure.fileCount = files.length;

      // 7. Validar tamaño total
      const maxSize = 50 * 1024 * 1024; // 50 MB
      if (totalSize > maxSize) {
        report.errors.push(`Module too large: ${(totalSize / 1024 / 1024).toFixed(2)} MB (max 50 MB)`);
        report.valid = false;
        report.score -= 20;
      }

      // 8. Validar que existe package.json
      if (!packageJsonFound) {
        report.errors.push('package.json not found in ZIP');
        report.valid = false;
        report.score -= 50;
        return report;
      }

      report.info.push(`package.json found at: ${packageJsonPath}`);

      // 9. Validar contenido de package.json
      const pkgValidation = this.validatePackageJson(packageJsonContent);
      report.packageJson = {
        ...packageJsonContent,
        validation: pkgValidation
      };

      if (!pkgValidation.valid) {
        report.valid = false;
        report.errors.push(...pkgValidation.errors);
        report.score -= 30;
      }
      
      report.warnings.push(...pkgValidation.warnings);
      report.info.push(...pkgValidation.info);

      // 10. Validar entry point
      const entryPoint = packageJsonContent.main || 'server.js';
      const baseDir = path.dirname(packageJsonPath);
      const entryPointPath = baseDir ? `${baseDir}/${entryPoint}` : entryPoint;
      
      const entryExists = files.some(f => 
        f.path === entryPointPath || 
        f.path === entryPoint ||
        f.path.endsWith(`/${entryPoint}`)
      );

      if (!entryExists) {
        // Buscar entry points comunes
        let foundAlternative = false;
        for (const common of this.commonEntryPoints) {
          const commonPath = baseDir ? `${baseDir}/${common}` : common;
          if (files.some(f => f.path === commonPath || f.path === common)) {
            report.warnings.push(`Entry point '${entryPoint}' not found, but '${common}' exists`);
            report.entryPoint = common;
            foundAlternative = true;
            report.score -= 10;
            break;
          }
        }

        if (!foundAlternative) {
          report.errors.push(`Entry point '${entryPoint}' not found in ZIP`);
          report.valid = false;
          report.score -= 30;
        }
      } else {
        report.entryPoint = entryPoint;
        report.info.push(`Entry point found: ${entryPoint}`);
      }

      // 11. Validar scripts de inicio
      if (packageJsonContent.scripts) {
        if (packageJsonContent.scripts.start) {
          report.info.push(`Start script: ${packageJsonContent.scripts.start}`);
        } else {
          report.warnings.push('No "start" script defined in package.json');
          report.score -= 5;
        }
      } else {
        report.warnings.push('No "scripts" section in package.json');
        report.score -= 5;
      }

      // 12. Validar dependencias
      if (packageJsonContent.dependencies) {
        const depCount = Object.keys(packageJsonContent.dependencies).length;
        report.info.push(`Dependencies: ${depCount} packages`);
        
        // Advertir sobre dependencias peligrosas
        const dangerousDeps = ['eval', 'vm2', 'child_process'];
        for (const dep of dangerousDeps) {
          if (packageJsonContent.dependencies[dep]) {
            report.warnings.push(`Potentially dangerous dependency: ${dep}`);
            report.score -= 10;
          }
        }
      } else {
        report.info.push('No dependencies declared');
      }

      // 13. Verificar estructura recomendada
      const hasReadme = files.some(f => f.path.toLowerCase().includes('readme.md'));
      if (!hasReadme) {
        report.warnings.push('No README.md found (recommended)');
        report.score -= 5;
      } else {
        report.info.push('README.md found');
      }

      // 14. Score final
      report.score = Math.max(0, Math.min(100, report.score));

      if (report.score >= 80) {
        report.info.push(`✅ Module quality: EXCELLENT (${report.score}/100)`);
      } else if (report.score >= 60) {
        report.info.push(`⚠️ Module quality: GOOD (${report.score}/100)`);
      } else if (report.score >= 40) {
        report.info.push(`⚠️ Module quality: FAIR (${report.score}/100)`);
      } else {
        report.info.push(`❌ Module quality: POOR (${report.score}/100)`);
      }

    } catch (error) {
      report.valid = false;
      report.errors.push(`Validation error: ${error.message}`);
      report.score = 0;
    }

    return report;
  }

  /**
   * Valida el contenido de package.json
   * @param {Object} pkg - Contenido de package.json
   * @returns {Object} Reporte de validación
   */
  validatePackageJson(pkg) {
    const report = {
      valid: true,
      errors: [],
      warnings: [],
      info: []
    };

    // 1. Verificar campos requeridos
    for (const field of this.requiredFields) {
      if (!pkg[field]) {
        report.errors.push(`Missing required field: "${field}"`);
        report.valid = false;
      } else {
        report.info.push(`✓ ${field}: ${pkg[field]}`);
      }
    }

    // 2. Verificar campos recomendados
    for (const field of this.recommendedFields) {
      if (!pkg[field]) {
        report.warnings.push(`Missing recommended field: "${field}"`);
      }
    }

    // 3. Validar nombre del paquete
    if (pkg.name) {
      if (!/^[a-z0-9-_]+$/.test(pkg.name)) {
        report.warnings.push('Package name should only contain lowercase letters, numbers, hyphens and underscores');
      }
      if (pkg.name.length > 50) {
        report.warnings.push('Package name is too long (max 50 characters)');
      }
    }

    // 4. Validar versión
    if (pkg.version) {
      if (!/^\d+\.\d+\.\d+/.test(pkg.version)) {
        report.warnings.push('Version should follow semantic versioning (e.g., 1.0.0)');
      }
    }

    // 5. Verificar tipo de módulo
    if (pkg.type === 'module') {
      report.info.push('ES Module detected (type: "module")');
    } else {
      report.info.push('CommonJS module (default)');
    }

    // 6. Verificar engines (versión de Node.js)
    if (pkg.engines && pkg.engines.node) {
      report.info.push(`Node.js requirement: ${pkg.engines.node}`);
    } else {
      report.warnings.push('No Node.js version requirement specified (engines.node)');
    }

    return report;
  }

  /**
   * Extrae un ZIP a un directorio temporal y valida
   * @param {string} zipPath - Ruta al ZIP
   * @param {string} extractPath - Ruta donde extraer
   * @returns {Object} Resultado de extracción y validación
   */
  extractAndValidate(zipPath, extractPath) {
    const report = {
      success: false,
      extractPath: null,
      filesExtracted: 0,
      validation: null,
      error: null
    };

    try {
      // 1. Validar ZIP primero
      const validation = this.validateZip(zipPath);
      report.validation = validation;

      if (!validation.valid) {
        report.error = 'ZIP validation failed';
        return report;
      }

      // 2. Crear directorio de destino
      if (!fs.existsSync(extractPath)) {
        fs.mkdirSync(extractPath, { recursive: true });
      }

      // 3. Extraer ZIP
      const zip = new AdmZip(zipPath);
      const entries = zip.getEntries();
      let extracted = 0;

      for (const entry of entries) {
        // Saltar archivos prohibidos
        const entryPath = entry.entryName;
        let forbidden = false;
        
        for (const forbiddenPath of this.forbiddenPaths) {
          if (entryPath.includes(forbiddenPath)) {
            forbidden = true;
            break;
          }
        }

        if (forbidden) {
          continue;
        }

        // Extraer archivo
        if (!entry.isDirectory) {
          try {
            zip.extractEntryTo(entry, extractPath, true, true);
            extracted++;
          } catch (error) {
            console.error(`Failed to extract ${entryPath}:`, error.message);
          }
        }
      }

      report.success = true;
      report.extractPath = extractPath;
      report.filesExtracted = extracted;

    } catch (error) {
      report.error = error.message;
    }

    return report;
  }

  /**
   * Genera un reporte legible en texto
   * @param {Object} validation - Objeto de validación
   * @returns {string} Reporte formateado
   */
  generateTextReport(validation) {
    let report = '';

    report += '╔════════════════════════════════════════════════════════════╗\n';
    report += '║          MODULE VALIDATION REPORT                          ║\n';
    report += '╚════════════════════════════════════════════════════════════╝\n\n';

    // Status
    if (validation.valid) {
      report += '✅ STATUS: VALID - Module can be uploaded\n\n';
    } else {
      report += '❌ STATUS: INVALID - Module cannot be uploaded\n\n';
    }

    // Score
    report += `📊 QUALITY SCORE: ${validation.score}/100\n\n`;

    // Package info
    if (validation.packageJson) {
      report += '📦 PACKAGE INFORMATION:\n';
      report += `   Name:        ${validation.packageJson.name || 'N/A'}\n`;
      report += `   Version:     ${validation.packageJson.version || 'N/A'}\n`;
      report += `   Description: ${validation.packageJson.description || 'N/A'}\n`;
      report += `   Entry Point: ${validation.entryPoint || validation.packageJson.main || 'N/A'}\n\n`;
    }

    // Structure
    report += '📁 STRUCTURE:\n';
    report += `   Files:       ${validation.structure.fileCount}\n`;
    report += `   Total Size:  ${(validation.structure.totalSize / 1024).toFixed(2)} KB\n\n`;

    // Errors
    if (validation.errors.length > 0) {
      report += '❌ ERRORS:\n';
      validation.errors.forEach((error, i) => {
        report += `   ${i + 1}. ${error}\n`;
      });
      report += '\n';
    }

    // Warnings
    if (validation.warnings.length > 0) {
      report += '⚠️  WARNINGS:\n';
      validation.warnings.forEach((warning, i) => {
        report += `   ${i + 1}. ${warning}\n`;
      });
      report += '\n';
    }

    // Info
    if (validation.info.length > 0) {
      report += 'ℹ️  INFORMATION:\n';
      validation.info.forEach((info, i) => {
        report += `   ${i + 1}. ${info}\n`;
      });
      report += '\n';
    }

    report += '═══════════════════════════════════════════════════════════\n';

    return report;
  }
}

module.exports = ModuleValidator;

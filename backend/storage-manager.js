/**
 * Storage Manager - Sistema de almacenamiento modular y portable
 * 
 * Características:
 * - Carpeta por módulo
 * - Fácil migración a NFS/Samba/Nube/Otro disco
 * - Configuración centralizada
 * - Metadata en JSON (portable sin BD)
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class StorageManager {
  constructor(config = {}) {
    // Configuración flexible - puede ser path local, NFS mount, etc.
    this.baseStoragePath = config.storagePath || path.join(__dirname, 'storage');
    this.metadataPath = path.join(this.baseStoragePath, '_metadata');
    this.initialized = false;
  }

  /**
   * Inicializa estructura de carpetas por módulo
   */
  async init() {
    if (this.initialized) return;

    try {
      // Crear carpeta base de storage
      await fs.mkdir(this.baseStoragePath, { recursive: true });
      await fs.mkdir(this.metadataPath, { recursive: true });

      // Estructura modular
      const modules = [
        'bitacora-soc',
        'siem',
        'forensics',
        'reportes',
        'admin',
        'shared' // Para archivos compartidos entre módulos
      ];

      for (const module of modules) {
        const modulePath = path.join(this.baseStoragePath, module);
        await fs.mkdir(modulePath, { recursive: true });

        // Subcarpetas por tipo dentro de cada módulo
        const subfolders = ['images', 'documents', 'evidences', 'logs', 'exports'];
        for (const subfolder of subfolders) {
          await fs.mkdir(path.join(modulePath, subfolder), { recursive: true });
        }
      }

      this.initialized = true;
      console.log(`[StorageManager] Inicializado en: ${this.baseStoragePath}`);
    } catch (error) {
      console.error('[StorageManager] Error al inicializar:', error);
      throw error;
    }
  }

  /**
   * Sube un archivo a un módulo específico
   */
  async uploadFile(moduleId, category, fileBuffer, metadata = {}) {
    await this.init();

    const fileId = this.generateFileId();
    const fileName = metadata.originalName || `file_${fileId}`;
    const safeFileName = this.sanitizeFileName(fileName);
    const ext = path.extname(safeFileName);
    const finalFileName = `${fileId}${ext}`;

    // Path del módulo y categoría
    const modulePath = path.join(this.baseStoragePath, moduleId, category);
    const filePath = path.join(modulePath, finalFileName);

    // Guardar archivo
    await fs.writeFile(filePath, fileBuffer);

    // Metadata del archivo
    const fileMeta = {
      id: fileId,
      moduleId,
      category,
      originalName: metadata.originalName || fileName,
      fileName: finalFileName,
      relativePath: path.join(moduleId, category, finalFileName),
      size: fileBuffer.length,
      mimetype: metadata.mimetype || 'application/octet-stream',
      hash: this.calculateHash(fileBuffer),
      uploadedAt: new Date().toISOString(),
      uploadedBy: metadata.uploadedBy || 'system',
      customMetadata: metadata.custom || {}
    };

    // Guardar metadata en JSON
    await this.saveMetadata(fileId, fileMeta);

    return {
      success: true,
      fileId,
      url: `/api/storage/files/${fileId}`,
      metadata: fileMeta
    };
  }

  /**
   * Descarga un archivo por ID
   */
  async getFile(fileId) {
    const metadata = await this.getMetadata(fileId);
    if (!metadata) {
      throw new Error('Archivo no encontrado');
    }

    const filePath = path.join(this.baseStoragePath, metadata.relativePath);
    const buffer = await fs.readFile(filePath);

    return {
      buffer,
      metadata
    };
  }

  /**
   * Lista archivos de un módulo
   */
  async listFiles(moduleId, category = null, options = {}) {
    const limit = options.limit || 100;
    const offset = options.offset || 0;

    // Leer todos los archivos de metadata
    const metadataFiles = await fs.readdir(this.metadataPath);
    const files = [];

    for (const metaFile of metadataFiles) {
      if (!metaFile.endsWith('.json')) continue;

      const metaPath = path.join(this.metadataPath, metaFile);
      const content = await fs.readFile(metaPath, 'utf-8');
      const metadata = JSON.parse(content);

      // Filtrar por módulo y categoría
      if (metadata.moduleId === moduleId) {
        if (!category || metadata.category === category) {
          files.push(metadata);
        }
      }
    }

    // Ordenar por fecha (más reciente primero)
    files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    // Paginación
    const paginatedFiles = files.slice(offset, offset + limit);

    return {
      files: paginatedFiles,
      total: files.length,
      limit,
      offset
    };
  }

  /**
   * Elimina un archivo
   */
  async deleteFile(fileId) {
    const metadata = await this.getMetadata(fileId);
    if (!metadata) {
      throw new Error('Archivo no encontrado');
    }

    // Eliminar archivo físico
    const filePath = path.join(this.baseStoragePath, metadata.relativePath);
    await fs.unlink(filePath);

    // Eliminar metadata
    const metaPath = path.join(this.metadataPath, `${fileId}.json`);
    await fs.unlink(metaPath);

    return { success: true, deletedFileId: fileId };
  }

  /**
   * Obtiene estadísticas de uso por módulo
   */
  async getStorageStats() {
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      byModule: {}
    };

    const metadataFiles = await fs.readdir(this.metadataPath);

    for (const metaFile of metadataFiles) {
      if (!metaFile.endsWith('.json')) continue;

      const content = await fs.readFile(path.join(this.metadataPath, metaFile), 'utf-8');
      const metadata = JSON.parse(content);

      stats.totalFiles++;
      stats.totalSize += metadata.size;

      if (!stats.byModule[metadata.moduleId]) {
        stats.byModule[metadata.moduleId] = {
          files: 0,
          size: 0,
          categories: {}
        };
      }

      stats.byModule[metadata.moduleId].files++;
      stats.byModule[metadata.moduleId].size += metadata.size;

      if (!stats.byModule[metadata.moduleId].categories[metadata.category]) {
        stats.byModule[metadata.moduleId].categories[metadata.category] = 0;
      }
      stats.byModule[metadata.moduleId].categories[metadata.category]++;
    }

    return stats;
  }

  /**
   * Migra storage a nueva ubicación
   * Útil para mover a NFS, otro disco, nube, etc.
   */
  async migrateStorage(newStoragePath, options = {}) {
    const { copyOnly = false, verifyHashes = true } = options;

    console.log(`[StorageManager] Iniciando migración a: ${newStoragePath}`);

    // Crear nueva estructura
    const tempConfig = { storagePath: newStoragePath };
    const newStorage = new StorageManager(tempConfig);
    await newStorage.init();

    // Copiar todos los archivos con metadata
    const metadataFiles = await fs.readdir(this.metadataPath);
    let migrated = 0;
    let errors = 0;

    for (const metaFile of metadataFiles) {
      if (!metaFile.endsWith('.json')) continue;

      try {
        const fileId = metaFile.replace('.json', '');
        const { buffer, metadata } = await this.getFile(fileId);

        // Verificar hash si está activado
        if (verifyHashes) {
          const currentHash = this.calculateHash(buffer);
          if (currentHash !== metadata.hash) {
            console.error(`[StorageManager] Hash mismatch para ${fileId}`);
            errors++;
            continue;
          }
        }

        // Copiar a nueva ubicación
        const newPath = path.join(newStoragePath, metadata.relativePath);
        await fs.mkdir(path.dirname(newPath), { recursive: true });
        await fs.writeFile(newPath, buffer);

        // Copiar metadata
        const newMetaPath = path.join(newStoragePath, '_metadata', metaFile);
        await fs.copyFile(
          path.join(this.metadataPath, metaFile),
          newMetaPath
        );

        migrated++;
      } catch (error) {
        console.error(`[StorageManager] Error migrando ${metaFile}:`, error);
        errors++;
      }
    }

    // Si no es solo copia, actualizar configuración
    if (!copyOnly && errors === 0) {
      this.baseStoragePath = newStoragePath;
      this.metadataPath = path.join(newStoragePath, '_metadata');
    }

    console.log(`[StorageManager] Migración completada: ${migrated} archivos, ${errors} errores`);

    return {
      success: errors === 0,
      migrated,
      errors,
      newPath: newStoragePath
    };
  }

  /**
   * Limpia archivos antiguos (por fecha o tamaño)
   */
  async cleanupOldFiles(options = {}) {
    const { olderThanDays = 90, maxSizeGB = null, dryRun = false } = options;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const metadataFiles = await fs.readdir(this.metadataPath);
    let deleted = 0;
    let freedSpace = 0;
    const toDelete = [];

    for (const metaFile of metadataFiles) {
      if (!metaFile.endsWith('.json')) continue;

      const content = await fs.readFile(path.join(this.metadataPath, metaFile), 'utf-8');
      const metadata = JSON.parse(content);
      const uploadDate = new Date(metadata.uploadedAt);

      if (uploadDate < cutoffDate) {
        toDelete.push({ fileId: metadata.id, size: metadata.size });
        freedSpace += metadata.size;
      }
    }

    if (!dryRun) {
      for (const item of toDelete) {
        await this.deleteFile(item.fileId);
        deleted++;
      }
    }

    return {
      deleted,
      freedSpace,
      toDelete: dryRun ? toDelete : null
    };
  }

  // ========== MÉTODOS AUXILIARES ==========

  generateFileId() {
    return crypto.randomBytes(16).toString('hex');
  }

  calculateHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  sanitizeFileName(fileName) {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  async saveMetadata(fileId, metadata) {
    const metaPath = path.join(this.metadataPath, `${fileId}.json`);
    await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2));
  }

  async getMetadata(fileId) {
    try {
      const metaPath = path.join(this.metadataPath, `${fileId}.json`);
      const content = await fs.readFile(metaPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }
}

module.exports = StorageManager;

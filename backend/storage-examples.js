/**
 * Ejemplos de uso del Storage Manager
 */

// ============= DESDE FRONTEND ANGULAR =============

// 1. UPLOAD DE EVIDENCIA (Bitácora SOC)
async uploadEvidence(file: File, incidentId: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('moduleId', 'bitacora-soc');
  formData.append('category', 'evidences');
  formData.append('description', `Evidencia de incidente ${incidentId}`);
  formData.append('customMetadata', JSON.stringify({
    incidentId: incidentId,
    severity: 'high',
    type: 'screenshot'
  }));

  const token = localStorage.getItem('ramen_token');
  const response = await fetch('http://localhost:4000/api/storage/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const result = await response.json();
  console.log('File uploaded:', result);
  // Resultado: { success: true, fileId: 'abc123...', url: '/api/storage/files/abc123...' }
  
  return result;
}

// 2. LISTAR EVIDENCIAS DE UN INCIDENTE
async getEvidences(moduleId: string, category: string = 'evidences') {
  const token = localStorage.getItem('ramen_token');
  const response = await fetch(
    `http://localhost:4000/api/storage/files?moduleId=${moduleId}&category=${category}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );

  const result = await response.json();
  console.log('Files:', result);
  // Resultado: { files: [...], total: 10, limit: 100, offset: 0 }
  
  return result.files;
}

// 3. DESCARGAR/MOSTRAR ARCHIVO
async downloadFile(fileId: string) {
  const token = localStorage.getItem('ramen_token');
  const url = `http://localhost:4000/api/storage/files/${fileId}`;
  
  // Opción A: Abrir en nueva pestaña
  window.open(url + `?token=${token}`, '_blank');
  
  // Opción B: Mostrar en <img>
  const img = document.createElement('img');
  img.src = url;
  img.headers = { 'Authorization': `Bearer ${token}` };
  document.body.appendChild(img);
  
  // Opción C: Descargar blob
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = 'evidence.png';
  a.click();
}

// 4. ELIMINAR ARCHIVO (Solo Admin/Owner)
async deleteFile(fileId: string) {
  const token = localStorage.getItem('ramen_token');
  const response = await fetch(`http://localhost:4000/api/storage/files/${fileId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const result = await response.json();
  console.log('File deleted:', result);
  return result;
}

// 5. VER ESTADÍSTICAS DE STORAGE
async getStorageStats() {
  const token = localStorage.getItem('ramen_token');
  const response = await fetch('http://localhost:4000/api/storage/stats', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const stats = await response.json();
  console.log('Storage stats:', stats);
  /* Resultado:
  {
    totalFiles: 150,
    totalSize: 524288000, // bytes
    byModule: {
      'bitacora-soc': {
        files: 80,
        size: 320000000,
        categories: { evidences: 50, logs: 20, exports: 10 }
      },
      'siem': { files: 40, size: 150000000, ... },
      'forensics': { files: 30, size: 54288000, ... }
    }
  }
  */
  return stats;
}

// ============= DESDE MÓDULO EXTERNO (Node.js) =============

// Módulo externo puede subir archivos usando el token de Ramen
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

async function uploadFromModule(filePath, ramenToken) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('moduleId', 'bitacora-soc');
  form.append('category', 'logs');
  form.append('description', 'Log exportado automáticamente');

  const response = await fetch('http://ramen-host:4000/api/storage/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ramenToken}`
    },
    body: form
  });

  return response.json();
}

// ============= MIGRACIÓN DE STORAGE =============

// Escenario 1: Mover a otro disco local
async function migrateToAnotherDisk() {
  const token = 'owner_jwt_token';
  const response = await fetch('http://localhost:4000/api/storage/migrate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      newPath: 'D:\\ramen-storage', // Otro disco
      copyOnly: false, // Mover definitivamente
      verifyHashes: true // Verificar integridad
    })
  });

  const result = await response.json();
  console.log('Migration result:', result);
  // Resultado: { success: true, migrated: 150, errors: 0, newPath: 'D:\\ramen-storage' }
}

// Escenario 2: Copiar a NFS para respaldo
async function backupToNFS() {
  const token = 'owner_jwt_token';
  const response = await fetch('http://localhost:4000/api/storage/migrate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      newPath: 'Z:\\ramen-backup', // Mount NFS en Z:
      copyOnly: true, // Solo copiar, no mover
      verifyHashes: true
    })
  });

  const result = await response.json();
  console.log('Backup result:', result);
}

// ============= LIMPIEZA AUTOMÁTICA =============

// Borrar archivos más antiguos de 90 días
const StorageManager = require('./storage-manager');
const storageConfig = require('./storage-config');

const storage = new StorageManager({
  storagePath: storageConfig[storageConfig.storageType].storagePath
});

async function cleanupOldFiles() {
  await storage.init();
  
  // Dry run primero (ver qué se borraría)
  const preview = await storage.cleanupOldFiles({
    olderThanDays: 90,
    dryRun: true
  });
  console.log('Would delete:', preview.toDelete.length, 'files');
  console.log('Would free:', preview.freedSpace / 1024 / 1024, 'MB');
  
  // Si estás seguro, ejecutar sin dryRun
  const result = await storage.cleanupOldFiles({
    olderThanDays: 90,
    dryRun: false
  });
  console.log('Deleted:', result.deleted, 'files');
  console.log('Freed:', result.freedSpace / 1024 / 1024, 'MB');
}

// Programar limpieza automática (cron)
const cron = require('node-cron');

// Ejecutar todos los domingos a las 2 AM
cron.schedule('0 2 * * 0', async () => {
  console.log('[Cleanup] Iniciando limpieza automática...');
  await cleanupOldFiles();
});

/**
 * Configuración de Storage
 * 
 * Cambiar storageType y storageConfig según necesidad:
 * - 'local': Disco local
 * - 'nfs': Mount NFS
 * - 'smb': Samba/CIFS
 * - 's3': Compatible S3 (MinIO, AWS, etc.)
 */

module.exports = {
  // Tipo de storage activo
  storageType: 'local', // 'local' | 'nfs' | 'smb' | 's3'

  // Configuraciones por tipo
  local: {
    storagePath: 'C:\\ramen-storage', // Windows
    // storagePath: '/var/ramen-storage', // Linux
  },

  nfs: {
    // Path donde está montado el NFS
    storagePath: 'Z:\\ramen-storage', // Windows con mount
    // storagePath: '/mnt/nfs/ramen-storage', // Linux con mount
    // Para montar en Windows: net use Z: \\servidor\share /persistent:yes
    // Para montar en Linux: sudo mount -t nfs servidor:/export/ramen /mnt/nfs/ramen-storage
  },

  smb: {
    // Path donde está montado Samba
    storagePath: '\\\\servidor\\ramen-storage', // Windows UNC
    // storagePath: '/mnt/smb/ramen-storage', // Linux con mount
    // Para montar en Windows: net use * \\servidor\ramen-storage /persistent:yes
    // Para montar en Linux: sudo mount -t cifs //servidor/ramen-storage /mnt/smb/ramen-storage
  },

  s3: {
    // Para MinIO, AWS S3, DigitalOcean Spaces, etc.
    endpoint: 'localhost:9000',
    accessKey: 'minioadmin',
    secretKey: 'minioadmin',
    bucket: 'ramen-storage',
    useSSL: false,
    // Si usas AWS S3: endpoint: 's3.amazonaws.com', useSSL: true
  },

  // Configuración general
  maxFileSize: 100 * 1024 * 1024, // 100MB por archivo
  allowedMimeTypes: [
    // Imágenes
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    // Documentos
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Archivos comprimidos
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
    // Logs y texto
    'text/plain', 'text/csv', 'application/json',
    // Videos (para evidencias)
    'video/mp4', 'video/webm', 'video/quicktime',
    // Binarios (para forensics)
    'application/octet-stream'
  ],

  // Limpieza automática
  cleanup: {
    enabled: false, // Activar limpieza automática
    olderThanDays: 90, // Borrar archivos más antiguos que X días
    cronSchedule: '0 2 * * 0', // Domingos a las 2 AM
  },

  // Respaldo automático
  backup: {
    enabled: false,
    destinationPath: 'D:\\ramen-backup', // Otro disco
    schedule: '0 3 * * *', // Diario a las 3 AM
  }
};

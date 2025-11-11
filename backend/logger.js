/**
 * Sistema de logging centralizado para Ramen SOC
 * Captura TODOS los eventos: autenticación, módulos, RBAC, errores, etc.
 */

class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 10000; // Máximo de logs en memoria
  }

  /**
   * Agregar un log al sistema
   * @param {string} level - info, success, warning, error
   * @param {string} user - Usuario que realizó la acción
   * @param {string} action - Acción realizada
   * @param {string} resource - Recurso afectado
   * @param {string} details - Detalles adicionales
   * @param {object} metadata - Metadata adicional (IP, user-agent, etc)
   */
  log(level, user, action, resource, details, metadata = {}) {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      user: user || 'system',
      action,
      resource,
      details,
      metadata
    };

    this.logs.unshift(entry); // Agregar al inicio (más recientes primero)

    // Limitar tamaño
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Console output con colores
    this.consoleLog(entry);

    return entry;
  }

  consoleLog(entry) {
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };

    const symbol = emoji[entry.level] || 'ℹ️';
    const timestamp = new Date(entry.timestamp).toLocaleTimeString('es-CL');
    
    console.log(`${symbol} [${timestamp}] ${entry.user} → ${entry.action} (${entry.resource}): ${entry.details}`);
  }

  // Métodos de conveniencia
  info(user, action, resource, details, metadata) {
    return this.log('info', user, action, resource, details, metadata);
  }

  success(user, action, resource, details, metadata) {
    return this.log('success', user, action, resource, details, metadata);
  }

  warning(user, action, resource, details, metadata) {
    return this.log('warning', user, action, resource, details, metadata);
  }

  error(user, action, resource, details, metadata) {
    return this.log('error', user, action, resource, details, metadata);
  }

  // Obtener logs con filtros
  getLogs(filters = {}) {
    let filtered = [...this.logs];

    if (filters.level) {
      filtered = filtered.filter(log => log.level === filters.level);
    }

    if (filters.user) {
      filtered = filtered.filter(log => 
        log.user.toLowerCase().includes(filters.user.toLowerCase())
      );
    }

    if (filters.action) {
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(filters.action.toLowerCase())
      );
    }

    if (filters.resource) {
      filtered = filtered.filter(log => 
        log.resource.toLowerCase().includes(filters.resource.toLowerCase())
      );
    }

    if (filters.startDate) {
      filtered = filtered.filter(log => 
        new Date(log.timestamp) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(log => 
        new Date(log.timestamp) <= new Date(filters.endDate)
      );
    }

    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  // Obtener estadísticas
  getStats() {
    const total = this.logs.length;
    const byLevel = {
      info: this.logs.filter(l => l.level === 'info').length,
      success: this.logs.filter(l => l.level === 'success').length,
      warning: this.logs.filter(l => l.level === 'warning').length,
      error: this.logs.filter(l => l.level === 'error').length
    };

    const byUser = {};
    this.logs.forEach(log => {
      byUser[log.user] = (byUser[log.user] || 0) + 1;
    });

    const byResource = {};
    this.logs.forEach(log => {
      byResource[log.resource] = (byResource[log.resource] || 0) + 1;
    });

    return {
      total,
      byLevel,
      byUser,
      byResource,
      oldest: this.logs[this.logs.length - 1]?.timestamp,
      newest: this.logs[0]?.timestamp
    };
  }

  // Limpiar logs antiguos (más de X días)
  clearOldLogs(days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const before = this.logs.length;
    this.logs = this.logs.filter(log => new Date(log.timestamp) >= cutoff);
    const removed = before - this.logs.length;

    this.info('system', 'cleanup', 'logs', `Limpiados ${removed} logs de más de ${days} días`);
    
    return removed;
  }

  // Limpiar TODOS los logs
  clearAll() {
    const count = this.logs.length;
    this.logs = [];
    console.log(`🗑️ Limpiados ${count} logs del sistema`);
    return count;
  }
}

// Singleton
const logger = new Logger();

// Agregar logs iniciales del sistema
logger.info('system', 'startup', 'logger', 'Sistema de logging inicializado');

module.exports = logger;

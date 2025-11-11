const express = require('express');
const router = express.Router();
const logger = require('../logger');
const ModuleConfig = require('../models/moduleConfig.model');

// Función helper para generar IDs únicos
function generateId() {
  return 'tpl-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Middleware: Requiere roles específicos
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const hasPermission = req.user.roles.some(role => allowedRoles.includes(role));

    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Acceso denegado',
        required: allowedRoles,
        current: req.user.roles
      });
    }

    next();
  };
}

// Middleware: Solo Owner/Admin
const requireAdminAccess = requireRole(['Owner', 'Admin']);

function isInMemory(req) {
  return !!req.app?.locals?.database?.moduleConfigs;
}

function getInMemoryConfigs(req) {
  return req.app.locals.database.moduleConfigs;
}

function touchInMemoryConfig(config, userId) {
  if (!config) return;
  config.lastModifiedBy = userId;
  config.lastModifiedAt = new Date();
  config.version = (config.version || 0) + 1;
}

function ensureConfigShape(config) {
  if (!config.config) config.config = {};
  if (!config.config.templates) config.config.templates = [];
  if (!config.config.lists) config.config.lists = {};
  if (!config.config.policies) config.config.policies = [];
  if (!config.config.slas) config.config.slas = {};
}

function getMapValue(container, key) {
  if (!container) return undefined;
  if (typeof container.get === 'function') {
    return container.get(key);
  }
  return container[key];
}

function setMapValue(container, key, value) {
  if (!container) return;
  if (typeof container.set === 'function') {
    container.set(key, value);
  } else {
    container[key] = value;
  }
}

function normalizeMap(container) {
  if (!container) return {};
  if (typeof container.entries === 'function') {
    const obj = {};
    for (const [key, value] of container.entries()) {
      obj[key] = value;
    }
    return obj;
  }
  return container;
}

// ==========================================
// CONFIGURACIÓN GENERAL DEL MÓDULO
// ==========================================

// GET /api/module-config/:moduleId - Obtener configuración (Admin)
router.get('/:moduleId', requireAdminAccess, async (req, res) => {
  try {
    let config;
    if (isInMemory(req)) {
      const configs = getInMemoryConfigs(req);
      config = configs.find(c => c.moduleId === req.params.moduleId);
    } else {
      config = await ModuleConfig.findOne({ moduleId: req.params.moduleId });
    }
    
    if (!config) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }
    
    logger.info(req.user.username, 'view_module_config', 'module-config', `Consultó configuración de ${req.params.moduleId}`);
    
    const payload = typeof config.toObject === 'function' ? config.toObject() : config;
    res.json(payload);
  } catch (error) {
    logger.error(req.user.username, 'get_module_config_error', 'module-config', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/module-config/:moduleId - Actualizar configuración (Admin)
router.put('/:moduleId', requireAdminAccess, async (req, res) => {
  try {
    if (isInMemory(req)) {
      const configs = getInMemoryConfigs(req);
      const configIndex = configs.findIndex(c => c.moduleId === req.params.moduleId);
      
      if (configIndex === -1) {
        return res.status(404).json({ error: 'Configuración no encontrada' });
      }
      
      configs[configIndex].config = req.body.config;
      touchInMemoryConfig(configs[configIndex], req.user.sub);
      
      logger.success(
        req.user.username,
        'update_module_config',
        'module-config',
        `Actualizó configuración de ${req.params.moduleId}`
      );
      
      return res.json(configs[configIndex]);
    }
    
    const updated = await ModuleConfig.findOneAndUpdate(
      { moduleId: req.params.moduleId },
      {
        $set: {
          config: req.body.config,
          lastModifiedBy: req.user.sub,
          lastModifiedAt: new Date()
        },
        $inc: { version: 1 }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }

    logger.success(
      req.user.username,
      'update_module_config',
      'module-config',
      `Actualizó configuración de ${req.params.moduleId}`
    );

    res.json(updated);
  } catch (error) {
    logger.error(req.user.username, 'update_module_config_error', 'module-config', error.message);
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// PLANTILLAS
// ==========================================

// GET /api/module-config/:moduleId/templates - Listar plantillas
router.get('/:moduleId/templates', async (req, res) => {
  try {
    let templates = [];
    if (isInMemory(req)) {
      const database = getInMemoryConfigs(req);
      const config = database.find(c => c.moduleId === req.params.moduleId);
      if (config) {
        templates = config.config.templates || [];
      }
    } else {
      const config = await ModuleConfig.findOne({ moduleId: req.params.moduleId });
      if (config) {
        templates = config.config?.templates || [];
      }
    }
    
    // SOC puede ver plantillas pero no editarlas
    logger.info(req.user.username, 'view_templates', 'module-config', `Consultó plantillas de ${req.params.moduleId}`);
    
    res.json({ templates });
  } catch (error) {
    logger.error(req.user.username, 'get_templates_error', 'module-config', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/module-config/:moduleId/templates/:templateId - Obtener plantilla
router.get('/:moduleId/templates/:templateId', async (req, res) => {
  try {
    let config;
    if (isInMemory(req)) {
      config = getInMemoryConfigs(req).find(c => c.moduleId === req.params.moduleId);
    } else {
      config = await ModuleConfig.findOne({ moduleId: req.params.moduleId });
    }
    
    if (!config) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }
    
    const template = (config.config?.templates || []).find(t => t._id === req.params.templateId);
    
    if (!template) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }
    
    // Filtrar campos adminOnly si el usuario no es Admin
    let responseTemplate = { ...template };
    
    const isPrivileged = Array.isArray(req.user.roles) && 
      req.user.roles.some(role => ['Owner', 'Admin'].includes(role));

    if (!isPrivileged) {
      responseTemplate.fields = (template.fields || []).map(field => {
        if (field.adminOnly) {
          return {
            ...field,
            editable: false,
            hint: field.hint || 'Solo lectura - Configurado por Admin'
          };
        }
        return field;
      });
    }
    
    logger.info(req.user.username, 'view_template', 'module-config', `Consultó plantilla ${req.params.templateId}`);
    
    res.json(responseTemplate);
  } catch (error) {
    logger.error(req.user.username, 'get_template_error', 'module-config', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/module-config/:moduleId/templates - Crear plantilla (Admin)
router.post('/:moduleId/templates', requireAdminAccess, async (req, res) => {
  try {
    if (isInMemory(req)) {
      const database = getInMemoryConfigs(req);
      const config = database.find(c => c.moduleId === req.params.moduleId);
      
      if (!config) {
        return res.status(404).json({ error: 'Configuración no encontrada' });
      }
      
      const newTemplate = {
        _id: generateId(),
        ...req.body,
        createdBy: req.user.sub,
        createdAt: new Date()
      };
      
      ensureConfigShape(config);
      config.config.templates.push(newTemplate);
      touchInMemoryConfig(config, req.user.sub);
      
      logger.success(
        req.user.username,
        'create_template',
        'module-config',
        `Creó plantilla "${newTemplate.name}" en ${req.params.moduleId}`
      );
      
      return res.status(201).json(newTemplate);
    }
    
    const config = await ModuleConfig.findOne({ moduleId: req.params.moduleId });
    if (!config) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }
    
    ensureConfigShape(config);
    
    const newTemplate = {
      _id: generateId(),
      ...req.body,
      createdBy: req.user.sub,
      createdAt: new Date()
    };
    
    config.config.templates.push(newTemplate);
    config.lastModifiedBy = req.user.sub;
    config.lastModifiedAt = new Date();
    config.version = (config.version || 0) + 1;
    config.markModified('config.templates');
    await config.save();
    
    logger.success(
      req.user.username,
      'create_template',
      'module-config',
      `Creó plantilla "${newTemplate.name}" en ${req.params.moduleId}`
    );
    
    res.status(201).json(newTemplate);
  } catch (error) {
    logger.error(req.user.username, 'create_template_error', 'module-config', error.message);
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/module-config/:moduleId/templates/:templateId - Actualizar (Admin)
router.put('/:moduleId/templates/:templateId', requireAdminAccess, async (req, res) => {
  try {
    if (isInMemory(req)) {
      const config = getInMemoryConfigs(req).find(c => c.moduleId === req.params.moduleId);
      
      if (!config) {
        return res.status(404).json({ error: 'Configuración no encontrada' });
      }
      
      const templateIndex = (config.config.templates || []).findIndex(t => t._id === req.params.templateId);
      
      if (templateIndex === -1) {
        return res.status(404).json({ error: 'Plantilla no encontrada' });
      }
      
      config.config.templates[templateIndex] = {
        ...config.config.templates[templateIndex],
        ...req.body,
        _id: req.params.templateId,
        updatedAt: new Date()
      };
      touchInMemoryConfig(config, req.user.sub);
      
      logger.success(
        req.user.username,
        'update_template',
        'module-config',
        `Actualizó plantilla "${req.body.name}" en ${req.params.moduleId}`
      );
      
      return res.json(config.config.templates[templateIndex]);
    }
    
    const config = await ModuleConfig.findOne({ moduleId: req.params.moduleId });
    
    if (!config) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }
    
    ensureConfigShape(config);
    
    const templateIndex = config.config.templates.findIndex(t => t._id === req.params.templateId);
    
    if (templateIndex === -1) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }
    
    config.config.templates[templateIndex] = {
      ...config.config.templates[templateIndex].toObject?.() || config.config.templates[templateIndex],
      ...req.body,
      _id: req.params.templateId,
      updatedAt: new Date()
    };
    config.lastModifiedBy = req.user.sub;
    config.lastModifiedAt = new Date();
    config.version = (config.version || 0) + 1;
    config.markModified('config.templates');
    await config.save();
    
    logger.success(
      req.user.username,
      'update_template',
      'module-config',
      `Actualizó plantilla "${req.body.name}" en ${req.params.moduleId}`
    );
    
    res.json(config.config.templates[templateIndex]);
  } catch (error) {
    logger.error(req.user.username, 'update_template_error', 'module-config', error.message);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/module-config/:moduleId/templates/:templateId - Eliminar (Owner)
router.delete('/:moduleId/templates/:templateId', requireRole(['Owner']), async (req, res) => {
  try {
    if (isInMemory(req)) {
      const configs = getInMemoryConfigs(req);
      const config = configs.find(c => c.moduleId === req.params.moduleId);
      
      if (!config) {
        return res.status(404).json({ error: 'Configuración no encontrada' });
      }
      
      const templateName = (config.config.templates || []).find(t => t._id === req.params.templateId)?.name;
      config.config.templates = config.config.templates.filter(t => t._id !== req.params.templateId);
      touchInMemoryConfig(config, req.user.sub);
      
      logger.warning(
        req.user.username,
        'delete_template',
        'module-config',
        `Eliminó plantilla "${templateName}" en ${req.params.moduleId}`
      );
      
      return res.json({ message: 'Plantilla eliminada', templateId: req.params.templateId });
    }
    
    const config = await ModuleConfig.findOne({ moduleId: req.params.moduleId });
    if (!config) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }
    
    ensureConfigShape(config);
    const templateName = config.config.templates.find(t => t._id === req.params.templateId)?.name;
    config.config.templates = config.config.templates.filter(t => t._id !== req.params.templateId);
    config.lastModifiedBy = req.user.sub;
    config.lastModifiedAt = new Date();
    config.version = (config.version || 0) + 1;
    config.markModified('config.templates');
    await config.save();
    
    logger.warning(
      req.user.username,
      'delete_template',
      'module-config',
      `Eliminó plantilla "${templateName}" en ${req.params.moduleId}`
    );
    
    res.json({ message: 'Plantilla eliminada', templateId: req.params.templateId });
  } catch (error) {
    logger.error(req.user.username, 'delete_template_error', 'module-config', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// LISTAS CONFIGURABLES
// ==========================================

// GET /api/module-config/:moduleId/lists/:listName - Obtener lista
router.get('/:moduleId/lists/:listName', async (req, res) => {
  try {
    let items = [];
    if (isInMemory(req)) {
      const config = getInMemoryConfigs(req).find(c => c.moduleId === req.params.moduleId);
      if (config) {
        ensureConfigShape(config);
        const list = getMapValue(config.config.lists, req.params.listName);
        items = Array.isArray(list) ? list : (list ? [list] : []);
      }
    } else {
      const config = await ModuleConfig.findOne({ moduleId: req.params.moduleId });
      if (config) {
        ensureConfigShape(config);
        const list = getMapValue(config.config.lists, req.params.listName);
        items = Array.isArray(list) ? list : (list ? [list] : []);
      }
    }
    
    logger.info(req.user.username, 'view_list', 'module-config', `Consultó lista "${req.params.listName}" de ${req.params.moduleId}`);
    
    res.json({ items });
  } catch (error) {
    logger.error(req.user.username, 'get_list_error', 'module-config', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/module-config/:moduleId/lists/:listName - Actualizar lista (Admin)
router.put('/:moduleId/lists/:listName', requireAdminAccess, async (req, res) => {
  try {
    if (isInMemory(req)) {
      const config = getInMemoryConfigs(req).find(c => c.moduleId === req.params.moduleId);
      
      if (!config) {
        return res.status(404).json({ error: 'Configuración no encontrada' });
      }
      
      ensureConfigShape(config);
      setMapValue(config.config.lists, req.params.listName, req.body.items);
      touchInMemoryConfig(config, req.user.sub);
      
      logger.success(
        req.user.username,
        'update_list',
        'module-config',
        `Actualizó lista "${req.params.listName}" en ${req.params.moduleId}`
      );
      
      return res.json({ items: getMapValue(config.config.lists, req.params.listName) || [] });
    }

    const config = await ModuleConfig.findOne({ moduleId: req.params.moduleId });
    
    if (!config) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }
    
    ensureConfigShape(config);
    setMapValue(config.config.lists, req.params.listName, req.body.items);
    config.lastModifiedBy = req.user.sub;
    config.lastModifiedAt = new Date();
    config.version = (config.version || 0) + 1;
    config.markModified('config.lists');
    await config.save();
    
    logger.success(
      req.user.username,
      'update_list',
      'module-config',
      `Actualizó lista "${req.params.listName}" en ${req.params.moduleId}`
    );
    
    res.json({ items: getMapValue(config.config.lists, req.params.listName) || [] });
  } catch (error) {
    logger.error(req.user.username, 'update_list_error', 'module-config', error.message);
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// POLÍTICAS Y PROCEDIMIENTOS
// ==========================================

// GET /api/module-config/:moduleId/policies - Listar políticas
router.get('/:moduleId/policies', async (req, res) => {
  try {
    let policies = [];
    if (isInMemory(req)) {
      const config = getInMemoryConfigs(req).find(c => c.moduleId === req.params.moduleId);
      if (config) {
        ensureConfigShape(config);
        policies = config.config.policies || [];
      }
    } else {
      const config = await ModuleConfig.findOne({ moduleId: req.params.moduleId });
      if (config) {
        ensureConfigShape(config);
        policies = config.config.policies || [];
      }
    }
    
    logger.info(req.user.username, 'view_policies', 'module-config', `Consultó políticas de ${req.params.moduleId}`);
    
    res.json({ policies });
  } catch (error) {
    logger.error(req.user.username, 'get_policies_error', 'module-config', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/module-config/:moduleId/policies - Agregar política (Admin)
router.post('/:moduleId/policies', requireAdminAccess, async (req, res) => {
  try {
    if (isInMemory(req)) {
      const config = getInMemoryConfigs(req).find(c => c.moduleId === req.params.moduleId);
      
      if (!config) {
        return res.status(404).json({ error: 'Configuración no encontrada' });
      }
      
      ensureConfigShape(config);
      const newPolicy = {
        id: 'POL-' + Date.now(),
        ...req.body,
        lastUpdated: new Date()
      };
      
      config.config.policies.push(newPolicy);
      touchInMemoryConfig(config, req.user.sub);
      
      logger.success(
        req.user.username,
        'add_policy',
        'module-config',
        `Agregó política "${newPolicy.title}" en ${req.params.moduleId}`
      );
      
      return res.status(201).json(newPolicy);
    }
    
    const config = await ModuleConfig.findOne({ moduleId: req.params.moduleId });
    
    if (!config) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }
    
    ensureConfigShape(config);
    const newPolicy = {
      id: 'POL-' + Date.now(),
      ...req.body,
      lastUpdated: new Date()
    };
    
    config.config.policies.push(newPolicy);
    config.lastModifiedBy = req.user.sub;
    config.lastModifiedAt = new Date();
    config.version = (config.version || 0) + 1;
    config.markModified('config.policies');
    await config.save();
    
    logger.success(
      req.user.username,
      'add_policy',
      'module-config',
      `Agregó política "${newPolicy.title}" en ${req.params.moduleId}`
    );
    
    res.status(201).json(newPolicy);
  } catch (error) {
    logger.error(req.user.username, 'add_policy_error', 'module-config', error.message);
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// SLAs
// ==========================================

// GET /api/module-config/:moduleId/slas - Obtener SLAs
router.get('/:moduleId/slas', async (req, res) => {
  try {
    let slas = {};
    if (isInMemory(req)) {
      const config = getInMemoryConfigs(req).find(c => c.moduleId === req.params.moduleId);
      if (config) {
        ensureConfigShape(config);
        slas = config.config.slas || {};
      }
    } else {
      const config = await ModuleConfig.findOne({ moduleId: req.params.moduleId });
      if (config) {
        ensureConfigShape(config);
        slas = normalizeMap(config.config.slas);
      }
    }
    
    logger.info(req.user.username, 'view_slas', 'module-config', `Consultó SLAs de ${req.params.moduleId}`);
    
    res.json({ slas });
  } catch (error) {
    logger.error(req.user.username, 'get_slas_error', 'module-config', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/module-config/:moduleId/slas - Actualizar SLAs (Admin)
router.put('/:moduleId/slas', requireAdminAccess, async (req, res) => {
  try {
    if (isInMemory(req)) {
      const config = getInMemoryConfigs(req).find(c => c.moduleId === req.params.moduleId);
      
      if (!config) {
        return res.status(404).json({ error: 'Configuración no encontrada' });
      }
      
      ensureConfigShape(config);
      config.config.slas = req.body.slas || {};
      touchInMemoryConfig(config, req.user.sub);
      
      logger.success(
        req.user.username,
        'update_slas',
        'module-config',
        `Actualizó SLAs en ${req.params.moduleId}`
      );
      
      return res.json({ slas: config.config.slas });
    }
    
    const config = await ModuleConfig.findOne({ moduleId: req.params.moduleId });
    
    if (!config) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }
    
    ensureConfigShape(config);
    config.config.slas = req.body.slas || {};
    config.lastModifiedBy = req.user.sub;
    config.lastModifiedAt = new Date();
    config.version = (config.version || 0) + 1;
    config.markModified('config.slas');
    await config.save();
    
    logger.success(
      req.user.username,
      'update_slas',
      'module-config',
      `Actualizó SLAs en ${req.params.moduleId}`
    );
    
    res.json({ slas: normalizeMap(config.config.slas) });
  } catch (error) {
    logger.error(req.user.username, 'update_slas_error', 'module-config', error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

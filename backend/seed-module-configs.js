// Seed Module Configs - Configuración inicial de módulos
const ModuleConfig = require('./models/moduleConfig.model');

async function seedModuleConfigs(database) {
  try {
    // Crear configuración de ejemplo
    const config = {
      _id: 'cfg-bitacora-soc',
      moduleId: 'bitacora-soc',
      moduleName: 'Bitácora SOC',
      config: {
        templates: [
          {
            _id: 'tpl-incident-report',
            name: 'Reporte de Incidente',
            description: 'Plantilla estándar para documentar incidentes de seguridad',
            category: 'incident',
            fields: [
              {
                id: 'incident_date',
                label: 'Fecha del Incidente',
                type: 'datetime',
                editable: true,
                required: true,
                defaultValue: new Date().toISOString(),
                placeholder: 'Seleccione fecha y hora'
              },
              {
                id: 'severity',
                label: 'Severidad',
                type: 'select',
                editable: true,
                required: true,
                options: ['Critical', 'High', 'Medium', 'Low'],
                defaultValue: 'Medium'
              },
              {
                id: 'title',
                label: 'Título del Incidente',
                type: 'text',
                editable: true,
                required: true,
                placeholder: 'Resumen breve del incidente',
                validation: {
                  minLength: 10,
                  maxLength: 200
                }
              },
              {
                id: 'description',
                label: 'Descripción Detallada',
                type: 'textarea',
                editable: true,
                required: true,
                placeholder: 'Describe el incidente con el mayor detalle posible...',
                validation: {
                  minLength: 50
                }
              },
              {
                id: 'affected_systems',
                label: 'Sistemas Afectados',
                type: 'textarea',
                editable: true,
                required: false,
                placeholder: 'Lista de sistemas, servidores o aplicaciones afectadas'
              },
              {
                id: 'company_policy',
                label: 'Política Aplicable',
                type: 'text',
                editable: false,
                adminOnly: true,
                required: false,
                defaultValue: 'POL-SEC-001: Respuesta a Incidentes de Seguridad',
                hint: '🔒 Configurado por administrador'
              },
              {
                id: 'sla_response',
                label: 'SLA de Respuesta',
                type: 'text',
                editable: false,
                adminOnly: true,
                required: false,
                defaultValue: '4 horas',
                hint: 'Tiempo máximo de respuesta según severidad'
              },
              {
                id: 'escalation_contact',
                label: 'Contacto de Escalamiento',
                type: 'contact',
                editable: false,
                adminOnly: true,
                required: false,
                defaultValue: {
                  name: 'CISO - Chief Information Security Officer',
                  email: 'ciso@company.com',
                  phone: '+56912345678'
                },
                hint: '🔒 Solo lectura - Configurado por administrador'
              }
            ],
            sections: [
              {
                id: 'basic_info',
                title: 'Información Básica del Incidente',
                fields: ['incident_date', 'severity', 'title', 'description', 'affected_systems'],
                adminEditable: false
              },
              {
                id: 'policy_info',
                title: 'Información de Políticas y SLAs',
                fields: ['company_policy', 'sla_response', 'escalation_contact'],
                adminEditable: true
              }
            ],
            workflow: {
              autoAssign: true,
              autoEscalate: {
                enabled: true,
                condition: "severity === 'Critical'",
                escalateTo: 'owner_role'
              }
            },
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        lists: {
          severities: [
            { value: 'Critical', color: '#e53935', sla: '1h' },
            { value: 'High', color: '#ff6f00', sla: '4h' },
            { value: 'Medium', color: '#fbc02d', sla: '24h' },
            { value: 'Low', color: '#43a047', sla: '72h' }
          ],
          incidentTypes: [
            'Malware',
            'Phishing',
            'DDoS',
            'Data Breach',
            'Unauthorized Access',
            'Social Engineering',
            'Ransomware',
            'SQL Injection',
            'XSS Attack'
          ],
          contacts: [
            { role: 'CISO', name: 'Chief Information Security Officer', email: 'ciso@company.com', phone: '+56912345678' },
            { role: 'Legal', name: 'Legal Department', email: 'legal@company.com', phone: '+56912345679' },
            { role: 'IT Manager', name: 'IT Manager', email: 'it@company.com', phone: '+56912345680' },
            { role: 'HR', name: 'Human Resources', email: 'hr@company.com', phone: '+56912345681' }
          ]
        },
        defaultValues: {
          timezone: 'America/Santiago',
          dateFormat: 'DD/MM/YYYY HH:mm',
          language: 'es',
          autoNotify: true
        },
        policies: [
          {
            id: 'POL-SEC-001',
            title: 'Respuesta a Incidentes de Seguridad',
            description: 'Procedimiento estándar para la gestión y respuesta de incidentes de seguridad',
            url: 'https://intranet.company.com/policies/pol-sec-001',
            version: '2.1',
            lastUpdated: new Date()
          },
          {
            id: 'POL-SEC-002',
            title: 'Política de Escalamiento',
            description: 'Define los niveles de escalamiento según la severidad del incidente',
            url: 'https://intranet.company.com/policies/pol-sec-002',
            version: '1.5',
            lastUpdated: new Date()
          }
        ],
        slas: {
          responseTime: {
            Critical: '1h',
            High: '4h',
            Medium: '24h',
            Low: '72h'
          },
          resolutionTime: {
            Critical: '4h',
            High: '24h',
            Medium: '72h',
            Low: '168h'
          }
        }
      },
      permissions: {
        viewConfig: ['Owner', 'Admin'],
        editConfig: ['Owner', 'Admin'],
        viewTemplates: ['Owner', 'Admin', 'SOC'],
        editTemplates: ['Owner', 'Admin'],
        useTemplates: ['Owner', 'Admin', 'SOC']
      },
      lastModifiedAt: new Date(),
      version: 1,
      createdAt: new Date()
    };

    if (database?.moduleConfigs) {
      const existing = database.moduleConfigs.find(c => c.moduleId === config.moduleId);
      if (existing) {
        console.log('⚠️  Configuración de módulos ya existe (in-memory)');
        return;
      }

      database.moduleConfigs.push(config);
    } else {
      const existing = await ModuleConfig.findOne({ moduleId: config.moduleId });
      if (existing) {
        console.log('⚠️  Configuración de módulos ya existe (MongoDB)');
        return;
      }

      await ModuleConfig.create(config);
    }

    console.log('✅ Configuración de módulos creada exitosamente');
    console.log(`   📋 Plantillas: ${config.config.templates.length}`);
    console.log(`   📝 Listas: ${Object.keys(config.config.lists).length}`);
    console.log(`   📄 Políticas: ${config.config.policies.length}`);
  } catch (error) {
    console.error('❌ Error creando configuración:', error);
  }
}

module.exports = seedModuleConfigs;

const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['text', 'textarea', 'select', 'multiselect', 'number', 'datetime', 'boolean', 'contact', 'duration'],
    required: true 
  },
  editable: { type: Boolean, default: true },
  required: { type: Boolean, default: false },
  adminOnly: { type: Boolean, default: false },
  defaultValue: mongoose.Schema.Types.Mixed,
  placeholder: String,
  hint: String,
  options: [String],  // Para select/multiselect
  validation: {
    min: Number,
    max: Number,
    pattern: String,
    minLength: Number,
    maxLength: Number
  }
}, { _id: false });

const templateSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  category: String,
  fields: [fieldSchema],
  sections: [{
    id: String,
    title: String,
    fields: [String],  // IDs de campos
    adminEditable: Boolean
  }],
  workflow: {
    autoAssign: Boolean,
    autoEscalate: {
      enabled: Boolean,
      condition: String,
      escalateTo: String
    }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
}, { _id: false });

const moduleConfigSchema = new mongoose.Schema({
  moduleId: { 
    type: String, 
    required: true,
    unique: true,
    index: true
  },
  moduleName: { type: String, required: true },
  
  config: {
    templates: [templateSchema],
    
    lists: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    },
    
    defaultValues: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    },
    
    policies: [{
      id: String,
      title: String,
      description: String,
      url: String,
      version: String,
      lastUpdated: Date
    }],
    
    slas: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  
  permissions: {
    viewConfig: { type: [String], default: ['Owner', 'Admin'] },
    editConfig: { type: [String], default: ['Owner', 'Admin'] },
    viewTemplates: { type: [String], default: ['Owner', 'Admin', 'SOC'] },
    editTemplates: { type: [String], default: ['Owner', 'Admin'] },
    useTemplates: { type: [String], default: ['Owner', 'Admin', 'SOC'] }
  },
  
  lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastModifiedAt: { type: Date, default: Date.now },
  version: { type: Number, default: 1 }
}, {
  timestamps: true
});

// Índices
moduleConfigSchema.index({ moduleId: 1 });
moduleConfigSchema.index({ 'lastModifiedAt': -1 });

module.exports = mongoose.model('ModuleConfig', moduleConfigSchema);

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Module = new Schema({
  name: String,
  description: String,
  baseUrl: String,
  embedType: { type: String, enum: ['iframe','moduleFederation','proxy'], default: 'iframe' },
  allowedRoles: [String],
  icon: String,
  meta: Schema.Types.Mixed,
  status: { type: String, default:'unknown' }
});
module.exports = mongoose.model('Module', Module);

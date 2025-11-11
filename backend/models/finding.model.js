const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Finding = new Schema({
  title: String,
  description: String,
  client: String,
  severity: { type: String, enum:['Low','Medium','High','Critical'], default:'Medium' },
  evidence: [String],
  tags: [String],
  reportedBy: String,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Finding', Finding);

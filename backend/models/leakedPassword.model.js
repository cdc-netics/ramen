const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const LeakedPassword = new Schema({
  emailOrUser: String,
  hash: String,
  source: String,
  firstSeen: Date,
  lastSeen: Date,
  metadata: Schema.Types.Mixed
});
LeakedPassword.index({ emailOrUser: 'text', source: 'text' });
module.exports = mongoose.model('LeakedPassword', LeakedPassword);

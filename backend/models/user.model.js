const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = new Schema({
  username: { type: String, unique:true },
  fullName: String,
  passwordHash: String,
  roles: [String],
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('User', User);

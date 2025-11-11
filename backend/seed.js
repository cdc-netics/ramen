/**
 * seed.js - crea usuario Owner y algunos módulos de ejemplo
 * USO: node seed.js
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user.model');
const Module = require('./models/module.model');

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/ramen';

async function run(){
  await mongoose.connect(MONGO);
  console.log('connected to', MONGO);
  const pw = await bcrypt.hash('admin123', 10);
  await User.deleteMany({});
  await User.create({ username:'owner', fullName:'Owner', passwordHash: pw, roles: ['Owner','Admin'] });
  await Module.deleteMany({});
  await Module.insertMany([
    { name:'Bitacora (React)', baseUrl: 'http://localhost:3001', embedType:'iframe', allowedRoles: ['User','Admin','Owner'], description:'Bitacora React en Docker (ejemplo)', status:'online' },
    { name:'LeakedPasswords', baseUrl: '/app/leaked', embedType:'proxy', allowedRoles:['Admin','Owner'], description:'DB de contraseñas filtradas' },
    { name:'Hallazgos', baseUrl: '/app/hallazgos', embedType:'proxy', allowedRoles:['Admin','Owner'], description:'Módulo de hallazgos' }
  ]);
  console.log('seed done');
  process.exit(0);
}
run().catch(e=>{ console.error(e); process.exit(1); });

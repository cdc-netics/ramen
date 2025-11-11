/**
 * server-demo.js - Express API for Ramen Orquestador with fallback to mock DB
 * Use this version when MongoDB is not available
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');

// Try MongoDB first, fallback to mock
let mongoose, User, Module, LeakedPassword, Finding;
try {
  mongoose = require('mongoose');
  User = require('./models/user.model');
  Module = require('./models/module.model');
  LeakedPassword = require('./models/leakedPassword.model');
  Finding = require('./models/finding.model');
} catch (e) {
  console.log('MongoDB models not available, using mock database');
}

const app = express();
app.use(helmet());
app.use(cors({ origin: ['http://localhost:4200', 'http://ramen.local:4200'], credentials:true }));
app.use(bodyParser.json({ limit: '5mb' }));

// Database connection with fallback
async function connectDB() {
  const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/ramen';
  try {
    await mongoose.connect(MONGO);
    console.log('Connected to MongoDB', MONGO);
  } catch (err) {
    console.log('MongoDB not available, using mock database');
    // Use mock database
    const mockDB = require('./mock-db');
    User = new mockDB.User('users');
    Module = new mockDB.Module('modules');
    LeakedPassword = new mockDB.LeakedPassword('leakedPasswords');
    Finding = new mockDB.Finding('findings');
    
    // Initialize with demo data
    await initializeDemoData();
  }
}

async function initializeDemoData() {
  const bcrypt = require('bcryptjs');
  
  // Check if user already exists
  const existingUser = await User.findOne({ username: 'owner' });
  if (!existingUser) {
    const pw = await bcrypt.hash('admin123', 10);
    await User.create({ 
      username: 'owner', 
      fullName: 'Owner', 
      passwordHash: pw, 
      roles: ['Owner','Admin'] 
    });
    
    await Module.create({
      name: 'Bitacora (React)',
      baseUrl: 'http://localhost:3001',
      embedType: 'iframe',
      allowedRoles: ['User','Admin','Owner'],
      description: 'Bitacora React en Docker (ejemplo)',
      status: 'online'
    });
    
    await Module.create({
      name: 'LeakedPasswords',
      baseUrl: '/app/leaked',
      embedType: 'proxy',
      allowedRoles: ['Admin','Owner'],
      description: 'DB de contraseñas filtradas'
    });
    
    await Module.create({
      name: 'Hallazgos',
      baseUrl: '/app/hallazgos',
      embedType: 'proxy',
      allowedRoles: ['Admin','Owner'],
      description: 'Módulo de hallazgos'
    });
    
    console.log('Demo data initialized');
  }
}

connectDB();

// Auth routes
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

app.post('/api/auth/login', async (req,res)=>{
  try{
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if(!user) return res.status(401).json({msg:'invalid credentials'});
    const ok = await bcrypt.compare(password, user.passwordHash);
    if(!ok) return res.status(401).json({msg:'invalid credentials'});
    const token = jwt.sign({ sub:user._id, username:user.username, roles:user.roles }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token });
  }catch(err){
    res.status(500).json({error: ''+err});
  }
});

// Modules routes
app.get('/api/modules', async (req,res)=>{
  const all = await Module.find({});
  res.json(all);
});

app.post('/api/modules', async (req,res)=>{
  const p = req.body;
  const m = await Module.create(p);
  res.status(201).json(m);
});

// Leaked passwords routes
app.get('/api/leaked', async (req,res)=>{
  const docs = await LeakedPassword.find({});
  res.json(docs.slice(0, 200)); // Limit results
});

app.post('/api/leaked/bulk', async (req,res)=>{
  const items = req.body.items || [];
  if(!Array.isArray(items)) return res.status(400).json({msg:'items array required'});
  const created = await LeakedPassword.insertMany(items.map(i=>({ ...i, firstSeen: i.firstSeen || new Date() })));
  res.json({ inserted: created.length });
});

// Findings routes
app.get('/api/findings', async (req,res)=>{
  const items = await Finding.find({});
  res.json(items.slice(0, 200)); // Limit results
});

app.post('/api/findings', async (req,res)=>{
  const f = await Finding.create(req.body);
  res.status(201).json(f);
});

// Simple proxy path
const { createProxyMiddleware } = require('http-proxy-middleware');
app.use('/proxy', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  pathRewrite: {'^/proxy': ''},
  onProxyReq: (proxyReq, req, res) => {
    if (req.headers.authorization) proxyReq.setHeader('Authorization', req.headers.authorization);
  }
}));

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=>console.log('🚀 Ramen Orquestador API listening on port', PORT));
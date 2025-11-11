/**
 * server.js - Express API skeleton for Ramen Orquestador
 * - Auth (local JWT)
 * - Modules registry
 * - Leaked passwords / findings routes (basic)
 *
 * Configure MONGO_URI and JWT_SECRET in environment or use defaults below.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const moduleRoutes = require('./routes/modules');
const leaked = require('./routes/leakedPasswords');
const findings = require('./routes/findings');
const jwt = require('jsonwebtoken');
const moduleConfigRoutes = require('./routes/moduleConfig');
const seedModuleConfigs = require('./seed-module-configs');

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: ['http://localhost:4200', 'http://ramen.local:4200'], credentials:true }));
app.use(bodyParser.json({ limit: '5mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/ramen';
mongoose.connect(MONGO)
  .then(async () => {
    console.log('Connected to MongoDB', MONGO);
    await seedModuleConfigs();
  })
  .catch(err => console.error('Mongo error', err));

// Middleware JWT (reutilizado por rutas que requieren roles)
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Invalid authorization header' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

app.use('/api/auth', authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/leaked', leaked);
app.use('/api/findings', findings);
app.use('/api/module-config', authenticateJWT, moduleConfigRoutes);

// simple proxy path (if you want to forward Authorization to an external service)
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
app.listen(PORT, ()=>console.log('API listening on', PORT));

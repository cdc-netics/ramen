/**
 * OAuth Routes - Microsoft Azure AD y Google OAuth 2.0
 * 
 * CONFIGURACIÓN REQUERIDA:
 * 
 * 1. Microsoft Azure AD:
 *    - Crear App Registration en Azure Portal: https://portal.azure.com
 *    - Configurar Redirect URI: http://localhost:4000/api/auth/microsoft/callback
 *    - Obtener: Application (client) ID y Client Secret
 *    - Variables de entorno:
 *      AZURE_CLIENT_ID=tu-client-id
 *      AZURE_CLIENT_SECRET=tu-client-secret
 *      AZURE_TENANT_ID=common (o tu tenant específico)
 * 
 * 2. Google OAuth:
 *    - Crear proyecto en Google Cloud Console: https://console.cloud.google.com
 *    - Habilitar Google+ API
 *    - Crear OAuth 2.0 Client ID
 *    - Configurar Redirect URI: http://localhost:4000/api/auth/google/callback
 *    - Variables de entorno:
 *      GOOGLE_CLIENT_ID=tu-client-id
 *      GOOGLE_CLIENT_SECRET=tu-client-secret
 * 
 * Ver documentación completa en README.md
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Configuración OAuth (desde variables de entorno)
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID || '';
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET || '';
const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID || 'common';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.OAUTH_REDIRECT_URI || 'http://localhost:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

/**
 * Microsoft Azure AD OAuth Flow
 */
router.get('/microsoft', (req, res) => {
  if (!AZURE_CLIENT_ID) {
    return res.status(501).json({
      error: 'OAuth no configurado',
      message: 'Configurar AZURE_CLIENT_ID en variables de entorno',
      docs: 'Ver README.md para instrucciones de configuración'
    });
  }

  const authUrl = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/authorize?` +
    `client_id=${AZURE_CLIENT_ID}&` +
    `response_type=code&` +
    `redirect_uri=${REDIRECT_URI}/api/auth/microsoft/callback&` +
    `response_mode=query&` +
    `scope=openid%20profile%20email&` +
    `state=${Math.random().toString(36).substring(7)}`;

  res.redirect(authUrl);
});

router.get('/microsoft/callback', async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error) {
    return res.redirect(`/login?error=${error_description || error}`);
  }

  try {
    // Intercambiar código por token
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: AZURE_CLIENT_ID,
        client_secret: AZURE_CLIENT_SECRET,
        code: code,
        redirect_uri: `${REDIRECT_URI}/api/auth/microsoft/callback`,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error(tokenData.error_description || 'Error obteniendo token');
    }

    // Obtener perfil del usuario
    const profileResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const profile = await profileResponse.json();

    // Buscar o crear usuario en DB
    let user = await User.findOne({ email: profile.mail || profile.userPrincipalName });

    if (!user) {
      // Crear nuevo usuario (rol por defecto: User)
      user = new User({
        username: (profile.mail || profile.userPrincipalName).split('@')[0],
        email: profile.mail || profile.userPrincipalName,
        fullName: profile.displayName || 'Usuario Microsoft',
        roles: ['User'],
        authProvider: 'microsoft',
        authProviderId: profile.id,
        // Sin password - solo OAuth
        password: Math.random().toString(36) // Random, no se usará
      });
      await user.save();
    }

    // Generar JWT para el orquestador
    const token = jwt.sign(
      {
        sub: user._id,
        username: user.username,
        roles: user.roles,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Redirigir al frontend con token en URL (opción temporal)
    // En producción, usar cookies httpOnly o postMessage
    res.redirect(`/login?token=${token}&provider=microsoft`);

  } catch (err) {
    console.error('Error OAuth Microsoft:', err);
    res.redirect(`/login?error=${encodeURIComponent(err.message)}`);
  }
});

/**
 * Google OAuth Flow
 */
router.get('/google', (req, res) => {
  if (!GOOGLE_CLIENT_ID) {
    return res.status(501).json({
      error: 'OAuth no configurado',
      message: 'Configurar GOOGLE_CLIENT_ID en variables de entorno',
      docs: 'Ver README.md para instrucciones de configuración'
    });
  }

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}&` +
    `response_type=code&` +
    `redirect_uri=${REDIRECT_URI}/api/auth/google/callback&` +
    `scope=openid%20profile%20email&` +
    `state=${Math.random().toString(36).substring(7)}`;

  res.redirect(authUrl);
});

router.get('/google/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`/login?error=${error}`);
  }

  try {
    // Intercambiar código por token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code: code,
        redirect_uri: `${REDIRECT_URI}/api/auth/google/callback`,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error(tokenData.error_description || 'Error obteniendo token');
    }

    // Obtener perfil del usuario
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const profile = await profileResponse.json();

    // Buscar o crear usuario en DB
    let user = await User.findOne({ email: profile.email });

    if (!user) {
      // Crear nuevo usuario (rol por defecto: User)
      user = new User({
        username: profile.email.split('@')[0],
        email: profile.email,
        fullName: profile.name || 'Usuario Google',
        roles: ['User'],
        authProvider: 'google',
        authProviderId: profile.id,
        // Sin password - solo OAuth
        password: Math.random().toString(36) // Random, no se usará
      });
      await user.save();
    }

    // Generar JWT para el orquestador
    const token = jwt.sign(
      {
        sub: user._id,
        username: user.username,
        roles: user.roles,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Redirigir al frontend con token en URL (opción temporal)
    // En producción, usar cookies httpOnly o postMessage
    res.redirect(`/login?token=${token}&provider=google`);

  } catch (err) {
    console.error('Error OAuth Google:', err);
    res.redirect(`/login?error=${encodeURIComponent(err.message)}`);
  }
});

/**
 * Status - Verificar si OAuth está configurado
 */
router.get('/status', (req, res) => {
  res.json({
    microsoft: {
      configured: !!AZURE_CLIENT_ID,
      clientId: AZURE_CLIENT_ID ? AZURE_CLIENT_ID.substring(0, 8) + '...' : null
    },
    google: {
      configured: !!GOOGLE_CLIENT_ID,
      clientId: GOOGLE_CLIENT_ID ? GOOGLE_CLIENT_ID.substring(0, 8) + '...' : null
    }
  });
});

module.exports = router;

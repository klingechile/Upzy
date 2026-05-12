// src/routes/api.auth.js
// Endpoints de autenticación: login, logout, perfil, gestión de usuarios

const express      = require('express');
const router       = express.Router();
const { createClient } = require('@supabase/supabase-js');
const supabase     = require('../db/supabase');
const config       = require('../config/env');
const { requireAuth, requireRole } = require('../middleware/auth');

const supabaseAuth = createClient(config.supabase.url, config.supabase.anonKey);

// ── POST /api/auth/login ──────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email y password requeridos' });

  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });

  if (error) {
    const msg = error.message.includes('Invalid') ? 'Email o contraseña incorrectos' : error.message;
    return res.status(401).json({ error: msg, code: 'AUTH_FAILED' });
  }

  // Obtener perfil con tenant y rol
  const { data: perfil } = await supabase
    .from('upzy_users')
    .select('id, tenant_id, nombre, rol, activo, email, avatar_url')
    .eq('id', data.user.id)
    .single();

  if (!perfil?.activo) {
    return res.status(403).json({ error: 'Usuario desactivado. Contacta al administrador.', code: 'INACTIVE' });
  }

  res.json({
    token:         data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at:    data.session.expires_at,
    user: {
      id:        perfil.id,
      email:     perfil.email,
      nombre:    perfil.nombre,
      rol:       perfil.rol,
      tenant_id: perfil.tenant_id,
      avatar_url:perfil.avatar_url,
    },
  });
});

// ── POST /api/auth/refresh ────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: 'refresh_token requerido' });

  const { data, error } = await supabaseAuth.auth.refreshSession({ refresh_token });
  if (error) return res.status(401).json({ error: 'Sesión expirada, vuelve a iniciar sesión' });

  res.json({
    token:         data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at:    data.session.expires_at,
  });
});

// ── POST /api/auth/logout ─────────────────────────────────────
router.post('/logout', requireAuth, async (req, res) => {
  await supabaseAuth.auth.signOut();
  res.json({ ok: true });
});

// ── GET /api/auth/me ──────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  res.json({
    id:         req.user.id,
    email:      req.user.email,
    nombre:     req.user.nombre,
    rol:        req.user.rol,
    tenant_id:  req.user.tenant_id,
    avatar_url: req.user.avatar_url,
  });
});

// ── GET /api/auth/usuarios ────────────────────────────────────
router.get('/usuarios', requireAuth, requireRole('admin'), async (req, res) => {
  const { data, error } = await supabase
    .from('upzy_users')
    .select('id, email, nombre, rol, activo, ultimo_login, created_at')
    .eq('tenant_id', req.tenantId)
    .order('created_at');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// ── POST /api/auth/usuarios — crear usuario (admin only) ──────
router.post('/usuarios', requireAuth, requireRole('admin'), async (req, res) => {
  const { email, nombre, rol, password } = req.body;
  if (!email || !nombre || !password) return res.status(400).json({ error: 'email, nombre y password requeridos' });

  // 1. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError) return res.status(400).json({ error: authError.message });

  // 2. Crear perfil en upzy_users
  const { data, error } = await supabase
    .from('upzy_users')
    .insert({
      id:        authData.user.id,
      tenant_id: req.tenantId,
      email,
      nombre,
      rol:       rol || 'agente',
    })
    .select().single();

  if (error) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

// ── PATCH /api/auth/usuarios/:id ─────────────────────────────
router.patch('/usuarios/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { nombre, rol, activo } = req.body;
  const updates = {};
  if (nombre  !== undefined) updates.nombre = nombre;
  if (rol     !== undefined) updates.rol    = rol;
  if (activo  !== undefined) updates.activo = activo;

  const { data, error } = await supabase
    .from('upzy_users')
    .update(updates)
    .eq('id', req.params.id)
    .eq('tenant_id', req.tenantId)
    .select().single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// ── POST /api/auth/cambiar-password ──────────────────────────
router.post('/cambiar-password', requireAuth, async (req, res) => {
  const { password_actual, password_nuevo } = req.body;
  if (!password_nuevo || password_nuevo.length < 8) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
  }
  const { error } = await supabaseAuth.auth.updateUser({ password: password_nuevo });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

// ── DELETE /api/auth/usuarios/:id ────────────────────────────
router.delete('/usuarios/:id', requireAuth, requireRole('admin'), async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
  await supabase.from('upzy_users').update({ activo: false }).eq('id', req.params.id).eq('tenant_id', req.tenantId);
  res.json({ ok: true });
});

module.exports = router;

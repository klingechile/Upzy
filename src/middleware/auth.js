// src/middleware/auth.js
// Middleware de autenticación JWT via Supabase Auth
// Protege todos los endpoints del API

const { createClient } = require('@supabase/supabase-js');
const config = require('../config/env');

// Cliente con anon key para verificar JWTs del frontend
const supabasePublic = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  { auth: { persistSession: false } }
);

// Cliente con service role para operaciones internas
const supabaseAdmin = require('../db/supabase');

/**
 * Middleware principal: verifica JWT y adjunta user + tenant al request
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Token requerido', code: 'NO_TOKEN' });
    }

    // Verificar JWT con Supabase
    const { data: { user }, error } = await supabasePublic.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido o expirado', code: 'INVALID_TOKEN' });
    }

    // Obtener perfil del usuario con tenant y rol
    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from('upzy_users')
      .select('id, tenant_id, nombre, rol, activo, email')
      .eq('id', user.id)
      .single();

    if (perfilError || !perfil) {
      return res.status(403).json({ error: 'Usuario sin perfil en Upzy', code: 'NO_PROFILE' });
    }

    if (!perfil.activo) {
      return res.status(403).json({ error: 'Usuario desactivado', code: 'INACTIVE' });
    }

    // Adjuntar al request
    req.user      = { ...user, ...perfil };
    req.tenantId  = perfil.tenant_id;
    req.userRol   = perfil.rol;

    // Actualizar último login (async, sin bloquear)
    supabaseAdmin.from('upzy_users')
      .update({ ultimo_login: new Date().toISOString() })
      .eq('id', user.id)
      .then(() => {})
      .catch(() => {});

    next();
  } catch (err) {
    console.error('[auth] Error:', err.message);
    res.status(500).json({ error: 'Error de autenticación' });
  }
};

/**
 * Middleware de rol: verifica que el usuario tenga el rol requerido
 * Uso: requireRole('admin') o requireRole(['admin', 'agente'])
 */
const requireRole = (roles) => (req, res, next) => {
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(req.userRol)) {
    return res.status(403).json({
      error: `Acceso denegado. Se requiere rol: ${allowed.join(' o ')}`,
      code: 'INSUFFICIENT_ROLE',
      tu_rol: req.userRol,
    });
  }
  next();
};

/**
 * Middleware opcional: no bloquea si no hay token,
 * pero adjunta user si lo hay. Para rutas semi-públicas.
 */
const optionalAuth = async (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return next();
  try {
    const { data: { user } } = await supabasePublic.auth.getUser(token);
    if (user) {
      const { data: perfil } = await supabaseAdmin
        .from('upzy_users').select('*').eq('id', user.id).single();
      if (perfil) { req.user = { ...user, ...perfil }; req.tenantId = perfil.tenant_id; }
    }
  } catch {}
  next();
};

module.exports = { requireAuth, requireRole, optionalAuth };

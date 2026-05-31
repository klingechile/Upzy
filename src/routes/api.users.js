const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const config = require('../config/env');
const { requireRole } = require('../middleware/auth');
const { auditLog } = require('../services/audit');

const TENANT_ID = config.tenantId;
const VALID_ROLES = ['admin', 'agente', 'viewer'];

// GET /api/users
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('upzy_users')
      .select('id, email, nombre, rol, activo, ultimo_login, created_at')
      .eq('tenant_id', req.tenantId || TENANT_ID)
      .order('created_at', { ascending: false });

    if (error) throw error;

    await auditLog(req, 'users.viewed', { entity_type: 'users', metadata: { count: data?.length || 0 } });
    res.json({ ok: true, users: data || [] });
  } catch (err) {
    console.error('[users] list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/:id
router.patch('/:id', requireRole('admin'), async (req, res) => {
  try {
    const updates = {};
    const { rol, activo, nombre } = req.body || {};

    if (rol !== undefined) {
      if (!VALID_ROLES.includes(String(rol))) return res.status(400).json({ error: 'rol inválido' });
      updates.rol = String(rol);
    }

    if (activo !== undefined) updates.activo = Boolean(activo);
    if (nombre !== undefined) updates.nombre = String(nombre || '').trim().slice(0, 160) || null;

    if (!Object.keys(updates).length) return res.status(400).json({ error: 'sin cambios válidos' });

    const { data, error } = await supabase
      .from('upzy_users')
      .update(updates)
      .eq('tenant_id', req.tenantId || TENANT_ID)
      .eq('id', req.params.id)
      .select('id, email, nombre, rol, activo, ultimo_login, created_at')
      .single();

    if (error) throw error;

    await auditLog(req, rol !== undefined ? 'user.role_updated' : 'user.status_updated', {
      entity_type: 'user',
      entity_id: req.params.id,
      metadata: { updates },
    });

    res.json({ ok: true, user: data });
  } catch (err) {
    console.error('[users] update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

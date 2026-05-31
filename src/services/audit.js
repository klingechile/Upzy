const supabase = require('../db/supabase');
const config = require('../config/env');

const TENANT_ID = config.tenantId;

async function auditLog(req, action, data = {}) {
  try {
    const row = {
      tenant_id: req.tenantId || TENANT_ID,
      user_id: req.user?.id || null,
      user_email: req.user?.email || null,
      user_role: req.userRol || req.user?.rol || null,
      action,
      entity_type: data.entity_type || null,
      entity_id: data.entity_id ? String(data.entity_id) : null,
      metadata: data.metadata || {},
      ip: req.ip || null,
      user_agent: req.headers?.['user-agent'] || null,
    };

    const { error } = await supabase.from('upzy_audit_logs').insert(row);
    if (error) {
      console.warn('[audit] not persisted:', error.message);
      return { ok: true, persisted: false, warning: error.message, row };
    }

    return { ok: true, persisted: true };
  } catch (err) {
    console.warn('[audit] skipped:', err.message);
    return { ok: true, persisted: false, warning: err.message };
  }
}

module.exports = { auditLog };

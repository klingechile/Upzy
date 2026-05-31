const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const config = require('../config/env');
const { requireRole } = require('../middleware/auth');
const { auditLog } = require('../services/audit');

const TENANT_ID = config.tenantId;

// GET /api/audit/logs
router.get('/logs', requireRole('admin'), async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 100);

    const { data, error } = await supabase
      .from('upzy_audit_logs')
      .select('*')
      .eq('tenant_id', req.tenantId || TENANT_ID)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('[audit] read unavailable:', error.message);
      return res.json({ ok: true, persisted: false, logs: [], warning: error.message });
    }

    res.json({ ok: true, persisted: true, logs: data || [] });
  } catch (err) {
    console.error('[audit] list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/audit/logs
router.post('/logs', async (req, res) => {
  try {
    const { action, entity_type, entity_id, metadata } = req.body || {};
    if (!action) return res.status(400).json({ error: 'action requerida' });

    const result = await auditLog(req, String(action), {
      entity_type,
      entity_id,
      metadata: metadata || {},
    });

    res.status(result.persisted ? 201 : 202).json(result);
  } catch (err) {
    console.error('[audit] create error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

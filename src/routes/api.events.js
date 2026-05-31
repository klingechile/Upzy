const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const config = require('../config/env');

const TENANT_ID = config.tenantId;

// POST /api/events
router.post('/', async (req, res) => {
  try {
    const {
      event_type,
      source_module,
      entity_type,
      entity_id,
      payload,
    } = req.body || {};

    if (!event_type || !source_module) {
      return res.status(400).json({ error: 'event_type y source_module son requeridos' });
    }

    const event = {
      tenant_id: TENANT_ID,
      event_type: String(event_type).trim(),
      source_module: String(source_module).trim(),
      entity_type: entity_type ? String(entity_type).trim() : null,
      entity_id: entity_id ? String(entity_id).trim() : null,
      payload: payload || {},
    };

    const { data, error } = await supabase
      .from('upzy_events')
      .insert(event)
      .select('*')
      .single();

    if (error) {
      console.warn('[events] event not persisted:', error.message);
      return res.status(202).json({ ok: true, persisted: false, warning: error.message, event });
    }

    res.status(201).json({ ok: true, persisted: true, event: data });
  } catch (err) {
    console.error('[events] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

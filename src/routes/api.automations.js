// src/routes/api.automations.js
const express     = require('express');
const router      = express.Router();
const automations = require('../services/automations');
const config      = require('../config/env');

const TENANT_ID = config.tenantId;

// GET /api/automations — listar flows disponibles
router.get('/', async (req, res) => {
  try {
    const defaults = Object.entries(automations.FLOWS_DEFAULT).map(([id, f]) => ({
      id,
      nombre:  f.nombre,
      trigger: f.trigger,
      canal:   f.canal,
      pasos:   f.pasos.length,
      tipo:    'default',
    }));

    const personalizados = await automations.getFlows(TENANT_ID);

    res.json({ defaults, personalizados });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/automations/trigger — disparar un flow manualmente (para testing)
router.post('/trigger', async (req, res) => {
  const { lead_id, trigger, contexto } = req.body;
  if (!lead_id || !trigger) {
    return res.status(400).json({ error: 'lead_id y trigger son requeridos' });
  }

  await automations.dispararPorTrigger(TENANT_ID, lead_id, trigger, contexto || {});
  res.json({ ok: true, mensaje: `Flow '${trigger}' disparado para lead ${lead_id}` });
});

module.exports = router;

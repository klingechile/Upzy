const express     = require('express');
const router      = express.Router();
const automations = require('../services/automations');
const supabase    = require('../db/supabase');
const config      = require('../config/env');
const TENANT_ID   = config.tenantId;

// GET /api/automations
router.get('/', async (req, res) => {
  try {
    const defaults = Object.entries(automations.FLOWS_DEFAULT).map(([id, f]) => ({
      id, nombre: f.nombre, trigger: f.trigger, canal: f.canal,
      pasos: f.pasos.length, activo: true, tipo: 'default', pasos_json: f.pasos,
    }));
    const { data: custom } = await supabase.from('upzy_automatizaciones')
      .select('*').eq('tenant_id', TENANT_ID).order('created_at', { ascending: false });
    res.json({ defaults, personalizados: custom || [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/automations — crear flow personalizado
router.post('/', async (req, res) => {
  try {
    const { nombre, trigger, canal, pasos } = req.body;
    if (!nombre || !trigger) return res.status(400).json({ error: 'nombre y trigger requeridos' });
    const { data, error } = await supabase.from('upzy_automatizaciones')
      .insert({ tenant_id: TENANT_ID, nombre, trigger, canal: canal||'whatsapp', pasos: pasos||[] })
      .select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/automations/:id
router.patch('/:id', async (req, res) => {
  try {
    const { nombre, activo, pasos, trigger, canal } = req.body;
    const updates = {};
    if (nombre !== undefined) updates.nombre = nombre;
    if (activo !== undefined) updates.activo = activo;
    if (pasos  !== undefined) updates.pasos  = pasos;
    if (trigger!== undefined) updates.trigger= trigger;
    if (canal  !== undefined) updates.canal  = canal;
    const { data, error } = await supabase.from('upzy_automatizaciones')
      .update(updates).eq('id', req.params.id).eq('tenant_id', TENANT_ID).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/automations/:id
router.delete('/:id', async (req, res) => {
  try {
    await supabase.from('upzy_automatizaciones')
      .delete().eq('id', req.params.id).eq('tenant_id', TENANT_ID);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/automations/trigger — disparar manualmente (testing)
router.post('/trigger', async (req, res) => {
  const { lead_id, trigger, contexto } = req.body;
  if (!lead_id || !trigger) return res.status(400).json({ error: 'lead_id y trigger requeridos' });
  await automations.dispararPorTrigger(TENANT_ID, lead_id, trigger, contexto||{});
  res.json({ ok: true, mensaje: `Flow '${trigger}' disparado` });
});

module.exports = router;

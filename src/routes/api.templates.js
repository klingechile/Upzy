// src/routes/api.templates.js
const express  = require('express');
const router   = express.Router();
const supabase = require('../db/supabase');
const config   = require('../config/env');

const TENANT_ID = config.tenantId;

// GET /api/templates
router.get('/', async (req, res) => {
  const { canal, categoria } = req.query;
  let q = supabase.from('upzy_templates').select('*').eq('tenant_id', TENANT_ID);
  if (canal)     q = q.eq('canal', canal);
  if (categoria) q = q.eq('categoria', categoria);
  const { data, error } = await q.order('categoria').order('nombre');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// GET /api/templates/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('upzy_templates').select('*')
    .eq('id', req.params.id).eq('tenant_id', TENANT_ID).single();
  if (error) return res.status(404).json({ error: 'No encontrado' });
  res.json(data);
});

// POST /api/templates
router.post('/', async (req, res) => {
  const { nombre, canal, categoria, asunto, cuerpo, variables } = req.body;
  if (!nombre || !cuerpo) return res.status(400).json({ error: 'nombre y cuerpo requeridos' });

  // Detectar variables automáticamente del cuerpo
  const autoVars = (cuerpo.match(/\[([^\]]+)\]/g) || [])
    .map(v => v.slice(1, -1))
    .filter((v, i, a) => a.indexOf(v) === i);

  const { data, error } = await supabase.from('upzy_templates').insert({
    tenant_id:  TENANT_ID,
    nombre,
    canal:      canal || 'whatsapp',
    categoria:  categoria || 'general',
    asunto:     asunto || null,
    cuerpo,
    variables:  variables || autoVars,
  }).select().single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// PATCH /api/templates/:id
router.patch('/:id', async (req, res) => {
  const allowed = ['nombre', 'canal', 'categoria', 'asunto', 'cuerpo', 'variables', 'activo'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

  // Re-detectar variables si se actualizó el cuerpo
  if (updates.cuerpo && !updates.variables) {
    updates.variables = (updates.cuerpo.match(/\[([^\]]+)\]/g) || [])
      .map(v => v.slice(1, -1))
      .filter((v, i, a) => a.indexOf(v) === i);
  }

  const { data, error } = await supabase.from('upzy_templates')
    .update(updates).eq('id', req.params.id).eq('tenant_id', TENANT_ID)
    .select().single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// DELETE /api/templates/:id
router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('upzy_templates')
    .delete().eq('id', req.params.id).eq('tenant_id', TENANT_ID);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

// POST /api/templates/:id/usar — incrementa contador de usos
router.post('/:id/usar', async (req, res) => {
  await supabase.rpc('increment_template_uses', { template_id: req.params.id }).catch(() => {
    // fallback si no existe la función
    supabase.from('upzy_templates').update({ usos: supabase.raw('usos + 1') })
      .eq('id', req.params.id);
  });
  res.json({ ok: true });
});

module.exports = router;

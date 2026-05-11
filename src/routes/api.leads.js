const express  = require('express');
const router   = express.Router();
const scoring  = require('../services/scoring');
const supabase = require('../db/supabase');

const TENANT_ID = require('../config/env').tenantId;

// GET /api/leads — todos los leads con score
router.get('/', async (req, res) => {
  try {
    const leads = await scoring.getLeadsPorSegmento(TENANT_ID);
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leads/estadisticas
router.get('/estadisticas', async (req, res) => {
  try {
    const stats = await scoring.getEstadisticas(TENANT_ID);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leads/carritos — carritos abandonados pendientes
router.get('/carritos', async (req, res) => {
  try {
    const carritos = await scoring.getCarritosPendientes(TENANT_ID);
    res.json(carritos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leads/:id — detalle de un lead
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('upzy_leads')
      .select(`
        *,
        conversaciones (id, canal, estado, created_at),
        score_eventos (motivo, delta, score_nuevo, created_at)
      `)
      .eq('id', req.params.id)
      .eq('tenant_id', TENANT_ID)
      .single();

    if (error) return res.status(404).json({ error: 'Lead no encontrado' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/leads/:id — actualizar etapa, asignación, notas
router.patch('/:id', async (req, res) => {
  try {
    const allowed = ['etapa', 'asignado_a', 'notas', 'nombre', 'empresa', 'telefono', 'email', 'tags'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );

    const { data, error } = await supabase
      .from('upzy_leads')
      .update(updates)
      .eq('id', req.params.id)
      .eq('tenant_id', TENANT_ID)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/leads/:id/score — ajuste manual desde el CRM
router.post('/:id/score', async (req, res) => {
  try {
    const { motivo } = req.body;
    if (!motivo) return res.status(400).json({ error: 'motivo requerido' });

    const lead = await scoring.addScore(TENANT_ID, req.params.id, motivo);
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/leads/:id/asignar-agente
router.post('/:id/asignar-agente', async (req, res) => {
  try {
    const { agente } = req.body;
    const { data, error } = await supabase
      .from('upzy_leads')
      .update({ asignado_a: agente || 'agente' })
      .eq('id', req.params.id)
      .eq('tenant_id', TENANT_ID)
      .select().single();

    // Cambiar estado de conversación activa a 'agente'
    await supabase
      .from('upzy_conversaciones')
      .update({ estado: 'agente' })
      .eq('lead_id', req.params.id)
      .eq('estado', 'bot');

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

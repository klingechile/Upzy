// src/routes/api.agente.js
// API para el panel del agente humano (CRM dashboard)
// Maneja el handoff bot→agente, respuestas manuales y cierre de conversaciones

const express  = require('express');
const router   = express.Router();
const supabase = require('../db/supabase');
const wa       = require('../services/whatsapp');
const ig       = require('../services/instagram');
const scoring  = require('../services/scoring');
const config   = require('../config/env');

const TENANT_ID = config.tenantId;

// ── GET /api/agente/bandeja ───────────────────────────────────
// Conversaciones asignadas al agente (bot pausado)
router.get('/bandeja', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('upzy_conversaciones')
      .select(`
        id, canal, estado, created_at, updated_at,
        upzy_leads (
          id, nombre, empresa, telefono, canal, segmento, score, etapa,
          ultimo_contacto, tipo_negocio, total_mensajes, total_compras, total_gastado
        )
      `)
      .eq('tenant_id', TENANT_ID)
      .in('estado', ['agente', 'bot'])
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Agregar último mensaje a cada conversación
    const withLastMsg = await Promise.all((data || []).map(async (conv) => {
      const { data: msgs } = await supabase
        .from('upzy_mensajes')
        .select('origen, contenido, created_at')
        .eq('conversacion_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1);

      return { ...conv, ultimo_mensaje: msgs?.[0] || null };
    }));

    res.json(withLastMsg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/agente/conversacion/:id/mensajes ─────────────────
// Historial completo de una conversación
router.get('/conversacion/:id/mensajes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('upzy_mensajes')
      .select('*')
      .eq('conversacion_id', req.params.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/agente/responder ────────────────────────────────
// Agente envía mensaje manual
router.post('/responder', async (req, res) => {
  const { conversacion_id, mensaje } = req.body;
  if (!conversacion_id || !mensaje) {
    return res.status(400).json({ error: 'conversacion_id y mensaje requeridos' });
  }

  try {
    // Obtener conversación y lead
    const { data: conv } = await supabase
      .from('upzy_conversaciones')
      .select('*, upzy_leads(telefono, canal, canal_id)')
      .eq('id', conversacion_id)
      .single();

    if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });

    const lead  = conv.upzy_leads;
    const canal = conv.canal;

    // Enviar por el canal correcto
    if (canal === 'whatsapp' && lead?.telefono) {
      await wa.enviarTexto(lead.telefono, mensaje);
    } else if (canal === 'instagram' && lead?.canal_id) {
      await ig.enviarTexto(lead.canal_id, mensaje);
    }

    // Guardar en BD
    const { data: msg } = await supabase
      .from('upzy_mensajes')
      .insert({
        tenant_id:       TENANT_ID,
        conversacion_id,
        origen:          'agente',
        contenido:       mensaje,
      })
      .select()
      .single();

    // Actualizar último contacto del lead
    if (conv.lead_id) {
      await supabase.from('upzy_leads')
        .update({ ultimo_contacto: new Date().toISOString() })
        .eq('id', conv.lead_id);
    }

    res.json({ ok: true, mensaje: msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/agente/tomar/:conversacion_id ───────────────────
// Agente toma control de una conversación (bot → agente)
router.post('/tomar/:conversacion_id', async (req, res) => {
  try {
    await supabase.from('upzy_conversaciones')
      .update({ estado: 'agente' })
      .eq('id', req.params.conversacion_id);

    // Obtener lead para actualizar etapa
    const { data: conv } = await supabase
      .from('upzy_conversaciones')
      .select('lead_id')
      .eq('id', req.params.conversacion_id)
      .single();

    if (conv?.lead_id) {
      await scoring.addScore(TENANT_ID, conv.lead_id, 'respondio_rapido');
    }

    res.json({ ok: true, estado: 'agente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/agente/devolver-bot/:conversacion_id ────────────
// Devuelve el control al bot
router.post('/devolver-bot/:conversacion_id', async (req, res) => {
  try {
    await supabase.from('upzy_conversaciones')
      .update({ estado: 'bot' })
      .eq('id', req.params.conversacion_id);

    res.json({ ok: true, estado: 'bot' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/agente/cerrar/:conversacion_id ──────────────────
// Cierra la conversación
router.post('/cerrar/:conversacion_id', async (req, res) => {
  try {
    const { etapa_final } = req.body;

    await supabase.from('upzy_conversaciones')
      .update({ estado: 'cerrado' })
      .eq('id', req.params.conversacion_id);

    if (etapa_final) {
      const { data: conv } = await supabase
        .from('upzy_conversaciones')
        .select('lead_id')
        .eq('id', req.params.conversacion_id)
        .single();

      if (conv?.lead_id) {
        await supabase.from('upzy_leads')
          .update({ etapa: etapa_final })
          .eq('id', conv.lead_id);
      }
    }

    res.json({ ok: true, estado: 'cerrado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/agente/stats ────────────────────────────────────
// Estadísticas rápidas para el header del CRM
router.get('/stats', async (req, res) => {
  try {
    const [leads, convs, carritos] = await Promise.all([
      supabase.from('upzy_leads').select('segmento, etapa').eq('tenant_id', TENANT_ID).eq('activo', true),
      supabase.from('upzy_conversaciones').select('estado').eq('tenant_id', TENANT_ID),
      supabase.from('upzy_eventos_shopify').select('monto').eq('tenant_id', TENANT_ID).eq('tipo', 'checkout_abandoned').eq('recuperacion_estado', 'pendiente'),
    ]);

    const leadsData = leads.data || [];
    const convsData = convs.data || [];
    const carritosData = carritos.data || [];

    res.json({
      leads: {
        total:  leadsData.length,
        hot:    leadsData.filter(l => l.segmento === 'hot').length,
        warm:   leadsData.filter(l => l.segmento === 'warm').length,
        cold:   leadsData.filter(l => l.segmento === 'cold').length,
      },
      conversaciones: {
        total:  convsData.length,
        bot:    convsData.filter(c => c.estado === 'bot').length,
        agente: convsData.filter(c => c.estado === 'agente').length,
      },
      carritos_pendientes: {
        total: carritosData.length,
        valor: carritosData.reduce((a, c) => a + (c.monto || 0), 0),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

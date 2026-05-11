// src/routes/api.inbox.js
// Bridge que lee de lumi_conversations + lumi_messages (tablas existentes del bot)
// Y también de upzy_conversaciones para las nuevas

const express  = require('express');
const router   = express.Router();
const supabase = require('../db/supabase');
const wa       = require('../services/whatsapp');
const ig       = require('../services/instagram');
const config   = require('../config/env');

const TENANT_ID = config.tenantId;

// GET /api/inbox/bandeja — conversaciones de AMBAS tablas
router.get('/bandeja', async (req, res) => {
  try {
    // 1. Conversaciones del bot original (lumi_conversations)
    const { data: lumiConvs } = await supabase
      .from('lumi_conversations')
      .select(`
        id, channel, status, lumi_active, last_message_at, assigned_agent, created_at, updated_at,
        lumi_customers ( id, full_name, phone, email, instagram_id, business_type, intent_score, lead_temperature )
      `)
      .eq('tenant_id', TENANT_ID)
      .order('last_message_at', { ascending: false })
      .limit(50);

    // 2. Conversaciones Upzy nuevas (upzy_conversaciones)
    const { data: upzyConvs } = await supabase
      .from('upzy_conversaciones')
      .select(`
        id, canal, estado, created_at, updated_at,
        upzy_leads ( id, nombre, empresa, telefono, email, canal, segmento, score, etapa, ultimo_contacto )
      `)
      .eq('tenant_id', TENANT_ID)
      .order('updated_at', { ascending: false })
      .limit(50);

    // 3. Último mensaje de cada lumi_conversation
    const lumiWithMsg = await Promise.all((lumiConvs || []).map(async (c) => {
      const { data: msgs } = await supabase
        .from('lumi_messages')
        .select('body, sender_type, created_at')
        .eq('conversation_id', c.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const lead = c.lumi_customers;
      return {
        id:          c.id,
        source:      'lumi',
        canal:       c.channel,
        estado:      c.lumi_active ? 'bot' : (c.assigned_agent ? 'agente' : 'cerrado'),
        created_at:  c.created_at,
        updated_at:  c.last_message_at || c.updated_at,
        ultimo_mensaje: msgs?.[0] ? { contenido: msgs[0].body, origen: msgs[0].sender_type } : null,
        lead: lead ? {
          id:       lead.id,
          nombre:   lead.full_name,
          telefono: lead.phone,
          email:    lead.email,
          canal_id: lead.instagram_id || lead.phone,
          segmento: lead.lead_temperature || 'cold',
          score:    Math.round(lead.intent_score || 2),
          tipo_negocio: lead.business_type,
        } : null,
      };
    }));

    // 4. Último mensaje de cada upzy_conversacion
    const upzyWithMsg = await Promise.all((upzyConvs || []).map(async (c) => {
      const { data: msgs } = await supabase
        .from('upzy_mensajes')
        .select('contenido, origen, created_at')
        .eq('conversacion_id', c.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const lead = c.upzy_leads;
      return {
        id:          c.id,
        source:      'upzy',
        canal:       c.canal,
        estado:      c.estado,
        created_at:  c.created_at,
        updated_at:  c.updated_at,
        ultimo_mensaje: msgs?.[0] ? { contenido: msgs[0].contenido, origen: msgs[0].origen } : null,
        lead: lead ? {
          id:       lead.id,
          nombre:   lead.nombre,
          telefono: lead.telefono,
          email:    lead.email,
          segmento: lead.segmento,
          score:    lead.score,
          etapa:    lead.etapa,
        } : null,
      };
    }));

    // Merge y ordenar por updated_at
    const all = [...lumiWithMsg, ...upzyWithMsg]
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    res.json(all);
  } catch (err) {
    console.error('[inbox] bandeja error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/inbox/:id/mensajes — mensajes de una conversación (lumi o upzy)
router.get('/:id/mensajes', async (req, res) => {
  const { id } = req.params;
  const { source } = req.query; // 'lumi' o 'upzy'

  try {
    if (source === 'upzy') {
      const { data } = await supabase
        .from('upzy_mensajes')
        .select('*')
        .eq('conversacion_id', id)
        .order('created_at', { ascending: true });
      return res.json((data || []).map(m => ({
        id: m.id, origen: m.origen, contenido: m.contenido, created_at: m.created_at,
      })));
    }

    // Default: lumi_messages
    const { data } = await supabase
      .from('lumi_messages')
      .select('id, sender_type, body, created_at, ai_intent')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    res.json((data || []).map(m => ({
      id:         m.id,
      origen:     m.sender_type === 'customer' ? 'cliente' : m.sender_type === 'ai' ? 'bot' : 'agente',
      contenido:  m.body,
      created_at: m.created_at,
      intent:     m.ai_intent,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/inbox/:id/responder — agente responde
router.post('/:id/responder', async (req, res) => {
  const { mensaje, source, telefono, canal_id, canal } = req.body;
  if (!mensaje) return res.status(400).json({ error: 'mensaje requerido' });

  try {
    // Enviar por WA o IG
    if (canal === 'whatsapp' && telefono) {
      await wa.enviarTexto(wa.normalizarNumero(telefono), mensaje);
    } else if (canal === 'instagram' && canal_id) {
      await ig.enviarTexto(canal_id, mensaje);
    }

    // Guardar en la tabla correcta
    if (source === 'upzy') {
      await supabase.from('upzy_mensajes').insert({
        tenant_id: TENANT_ID, conversacion_id: req.params.id,
        origen: 'agente', contenido: mensaje,
      });
    } else {
      // Guardar en lumi_messages con sender_type='agent'
      const { data: conv } = await supabase
        .from('lumi_conversations')
        .select('customer_id')
        .eq('id', req.params.id)
        .single();

      await supabase.from('lumi_messages').insert({
        tenant_id:       TENANT_ID,
        conversation_id: req.params.id,
        customer_id:     conv?.customer_id,
        channel:         canal || 'whatsapp',
        sender_type:     'agent',
        body:            mensaje,
      });

      // Actualizar last_message_at
      await supabase.from('lumi_conversations')
        .update({ last_message_at: new Date().toISOString(), lumi_active: false, assigned_agent: 'agente' })
        .eq('id', req.params.id);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[inbox] responder error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/inbox/:id/tomar
router.post('/:id/tomar', async (req, res) => {
  const { source } = req.body;
  try {
    if (source === 'upzy') {
      await supabase.from('upzy_conversaciones').update({ estado: 'agente' }).eq('id', req.params.id);
    } else {
      await supabase.from('lumi_conversations')
        .update({ lumi_active: false, assigned_agent: 'agente' })
        .eq('id', req.params.id);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/inbox/:id/devolver-bot
router.post('/:id/devolver-bot', async (req, res) => {
  const { source } = req.body;
  try {
    if (source === 'upzy') {
      await supabase.from('upzy_conversaciones').update({ estado: 'bot' }).eq('id', req.params.id);
    } else {
      await supabase.from('lumi_conversations')
        .update({ lumi_active: true, assigned_agent: null })
        .eq('id', req.params.id);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

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

const normalizeCanal = (canal = '') => {
  const c = String(canal || '').toLowerCase();
  if (['ig', 'instagram', 'instagram_dm'].includes(c)) return 'instagram';
  if (['wa', 'whatsapp', 'whatsapp_cloud'].includes(c)) return 'whatsapp';
  return c || 'whatsapp';
};

const compact = (value = '') => String(value || '').replace(/\s+/g, ' ').trim();
const digitsOnly = (value = '') => String(value || '').replace(/\D/g, '');
const isUuid = (value = '') => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || '').trim());
const isPhoneLike = (value = '') => {
  const d = digitsOnly(value);
  return d.length >= 8 && d.length >= String(value || '').replace(/\s/g, '').length - 3;
};
const isIdLike = (value = '') => {
  const v = compact(value);
  if (!v) return true;
  if (isUuid(v)) return true;
  if (/^\d{6,}$/.test(v)) return true;
  if (isPhoneLike(v)) return true;
  if (/^(cliente|customer|usuario|user)\s*(instagram|whatsapp|wa|ig)?$/i.test(v)) return true;
  if (/^(instagram|whatsapp|wa|ig)\s*\d+$/i.test(v)) return true;
  return false;
};

const pickDisplayName = (lead, canal) => {
  const forbidden = new Set([
    compact(lead?.id),
    compact(lead?.canal_id),
    compact(lead?.instagram_id),
    compact(lead?.phone),
    compact(lead?.telefono),
  ].filter(Boolean));

  const candidates = [
    lead?.nombre,
    lead?.full_name,
    lead?.name,
    lead?.profile_name,
    lead?.username,
    lead?.empresa,
    lead?.email,
  ];

  for (const candidate of candidates) {
    const value = compact(candidate);
    if (!value) continue;
    if (forbidden.has(value)) continue;
    if (isIdLike(value)) continue;
    return value;
  }

  // Si Meta todavía no entregó nombre, no mostramos IDs parciales: dejamos claro que falta nombre real.
  return canal === 'instagram' ? 'Cliente Instagram sin nombre' : 'Cliente WhatsApp sin nombre';
};

const messageDate = (msg) => msg?.created_at || msg?.updated_at || null;

// GET /api/inbox/bandeja — conversaciones de AMBAS tablas
router.get('/bandeja', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '150', 10), 300);

    // 1. Conversaciones del bot original (lumi_conversations)
    const { data: lumiConvs, error: lumiError } = await supabase
      .from('lumi_conversations')
      .select(`
        id, channel, status, lumi_active, last_message_at, assigned_agent, created_at, updated_at,
        lumi_customers ( id, full_name, phone, email, instagram_id, business_type, intent_score, lead_temperature )
      `)
      .eq('tenant_id', TENANT_ID)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (lumiError) console.warn('[inbox] lumi_conversations:', lumiError.message);

    // 2. Conversaciones Upzy nuevas (upzy_conversaciones)
    const { data: upzyConvs, error: upzyError } = await supabase
      .from('upzy_conversaciones')
      .select(`
        id, canal, estado, created_at, updated_at,
        upzy_leads ( id, nombre, empresa, telefono, email, canal, canal_id, segmento, score, etapa, ultimo_contacto, total_compras, total_gastado, tipo_negocio )
      `)
      .eq('tenant_id', TENANT_ID)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (upzyError) console.warn('[inbox] upzy_conversaciones:', upzyError.message);

    // 3. Último mensaje de cada lumi_conversation
    const lumiWithMsg = await Promise.all((lumiConvs || []).map(async (c) => {
      const { data: msgs } = await supabase
        .from('lumi_messages')
        .select('body, sender_type, created_at')
        .eq('conversation_id', c.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const lead = c.lumi_customers;
      const canal = normalizeCanal(c.channel);
      const ultimo = msgs?.[0] ? { contenido: msgs[0].body, origen: msgs[0].sender_type, created_at: msgs[0].created_at } : null;
      const updatedAt = messageDate(ultimo) || c.last_message_at || c.updated_at || c.created_at;
      return {
        id:          c.id,
        source:      'lumi',
        canal,
        estado:      c.lumi_active ? 'bot' : (c.assigned_agent ? 'agente' : 'cerrado'),
        created_at:  c.created_at,
        updated_at:  updatedAt,
        ultimo_mensaje: ultimo,
        lead: lead ? {
          id:       lead.id,
          nombre:   pickDisplayName(lead, canal),
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
      const canal = normalizeCanal(c.canal || lead?.canal);
      const ultimo = msgs?.[0] ? { contenido: msgs[0].contenido, origen: msgs[0].origen, created_at: msgs[0].created_at } : null;
      const updatedAt = messageDate(ultimo) || c.updated_at || lead?.ultimo_contacto || c.created_at;
      return {
        id:          c.id,
        source:      'upzy',
        canal,
        estado:      c.estado,
        created_at:  c.created_at,
        updated_at:  updatedAt,
        ultimo_mensaje: ultimo,
        lead: lead ? {
          id:       lead.id,
          nombre:   pickDisplayName(lead, canal),
          empresa:  lead.empresa,
          telefono: lead.telefono,
          email:    lead.email,
          canal_id: lead.canal_id,
          segmento: lead.segmento,
          score:    lead.score,
          etapa:    lead.etapa,
          total_compras: lead.total_compras,
          total_gastado: lead.total_gastado,
          tipo_negocio: lead.tipo_negocio,
        } : null,
      };
    }));

    // Merge, deduplicar por source/id y ordenar por último mensaje real
    const seen = new Set();
    const all = [...lumiWithMsg, ...upzyWithMsg]
      .filter(c => {
        const key = `${c.source}:${c.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));

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
  const limit = Math.min(parseInt(req.query.limit || '300', 10), 500);
  const before = req.query.before;

  try {
    if (source === 'upzy') {
      let q = supabase
        .from('upzy_mensajes')
        .select('*')
        .eq('conversacion_id', id);
      if (before) q = q.lt('created_at', before);
      const { data } = await q.order('created_at', { ascending: true }).limit(limit);
      return res.json((data || []).map(m => ({
        id: m.id, origen: m.origen, contenido: m.contenido, created_at: m.created_at,
      })));
    }

    // Default: lumi_messages
    let q = supabase
      .from('lumi_messages')
      .select('id, sender_type, body, created_at, ai_intent')
      .eq('conversation_id', id);
    if (before) q = q.lt('created_at', before);
    const { data } = await q.order('created_at', { ascending: true }).limit(limit);

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
      await supabase.from('upzy_conversaciones')
        .update({ updated_at: new Date().toISOString(), estado: 'agente' })
        .eq('id', req.params.id);
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
      await supabase.from('upzy_conversaciones').update({ estado: 'agente', updated_at: new Date().toISOString() }).eq('id', req.params.id);
    } else {
      await supabase.from('lumi_conversations')
        .update({ lumi_active: false, assigned_agent: 'agente', last_message_at: new Date().toISOString() })
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
      await supabase.from('upzy_conversaciones').update({ estado: 'bot', updated_at: new Date().toISOString() }).eq('id', req.params.id);
    } else {
      await supabase.from('lumi_conversations')
        .update({ lumi_active: true, assigned_agent: null, last_message_at: new Date().toISOString() })
        .eq('id', req.params.id);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

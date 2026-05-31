const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const config = require('../config/env');

const TENANT_ID = config.tenantId;

// POST /api/lumi-web/conversations
router.post('/conversations', async (req, res) => {
  try {
    const { name, email, phone, message, page_url, product, session_id, website } = req.body || {};

    if (website) return res.status(200).json({ ok: true, ignored: true });

    const cleanEmail = normalizeEmail(email);
    const cleanPhone = normalizePhone(phone);
    const cleanMessage = safeText(message, 1200);

    if (!cleanMessage) return res.status(400).json({ error: 'mensaje requerido' });
    if (!cleanEmail && !cleanPhone) return res.status(400).json({ error: 'email o teléfono requerido' });

    const canalId = cleanEmail || cleanPhone || safeText(session_id, 120);
    const leadPayload = {
      tenant_id: TENANT_ID,
      nombre: safeText(name, 160) || 'Cliente Web',
      email: cleanEmail,
      telefono: cleanPhone,
      canal: 'web',
      canal_id: canalId,
      score: 2,
      segmento: 'warm',
      etapa: 'nuevo',
      tipo_negocio: null,
      notas: buildNotes({ page_url, product, session_id }),
    };

    const { data: lead, error: leadError } = await supabase
      .from('upzy_leads')
      .upsert(leadPayload, { onConflict: 'tenant_id,canal,canal_id', ignoreDuplicates: false })
      .select('id, nombre, email, telefono, canal, canal_id, segmento, score, etapa')
      .single();

    if (leadError) throw leadError;

    const { data: conversation, error: convError } = await supabase
      .from('upzy_conversaciones')
      .insert({
        tenant_id: TENANT_ID,
        lead_id: lead.id,
        canal: 'web',
        estado: 'agente',
      })
      .select('id, canal, estado, created_at, updated_at')
      .single();

    if (convError) throw convError;

    await supabase.from('upzy_mensajes').insert({
      tenant_id: TENANT_ID,
      conversacion_id: conversation.id,
      origen: 'cliente',
      contenido: cleanMessage,
    });

    const autoReply = 'Gracias por escribirnos. Ya recibimos tu mensaje y un asesor de Klinge te responderá por este chat. Si quieres avanzar más rápido, déjanos la medida o producto que estás buscando.';

    await supabase.from('upzy_mensajes').insert({
      tenant_id: TENANT_ID,
      conversacion_id: conversation.id,
      origen: 'bot',
      contenido: autoReply,
    });

    return res.status(201).json({
      ok: true,
      conversation,
      lead,
      messages: [
        { origen: 'cliente', contenido: cleanMessage },
        { origen: 'bot', contenido: autoReply },
      ],
    });
  } catch (err) {
    console.error('[lumi-web] conversation error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/lumi-web/conversations/:id/messages
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const cleanMessage = safeText(req.body?.message, 1200);
    if (!cleanMessage) return res.status(400).json({ error: 'mensaje requerido' });

    const { data: message, error } = await supabase
      .from('upzy_mensajes')
      .insert({
        tenant_id: TENANT_ID,
        conversacion_id: req.params.id,
        origen: 'cliente',
        contenido: cleanMessage,
      })
      .select('id, origen, contenido, created_at')
      .single();

    if (error) throw error;

    await supabase.from('upzy_conversaciones')
      .update({ estado: 'agente', updated_at: new Date().toISOString() })
      .eq('tenant_id', TENANT_ID)
      .eq('id', req.params.id);

    res.status(201).json({ ok: true, message });
  } catch (err) {
    console.error('[lumi-web] message error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/lumi-web/conversations/:id/messages
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('upzy_mensajes')
      .select('id, origen, contenido, created_at')
      .eq('tenant_id', TENANT_ID)
      .eq('conversacion_id', req.params.id)
      .order('created_at', { ascending: true })
      .limit(120);

    if (error) throw error;
    res.json({ ok: true, messages: data || [] });
  } catch (err) {
    console.error('[lumi-web] get messages error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

function normalizeEmail(value) {
  if (!value) return null;
  const email = String(value).trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function normalizePhone(value) {
  if (!value) return null;
  let phone = String(value).replace(/[\s\-\(\)\.]/g, '');
  if (phone.startsWith('+')) phone = phone.slice(1);
  if (phone.startsWith('0')) phone = phone.slice(1);
  if (phone.startsWith('9') && phone.length === 9) phone = `56${phone}`;
  if (phone.length >= 8) return phone;
  return null;
}

function safeText(value, max = 180) {
  if (!value) return null;
  return String(value).trim().slice(0, max) || null;
}

function buildNotes({ page_url, product, session_id }) {
  const parts = [];
  if (page_url) parts.push(`page_url:${safeText(page_url, 300)}`);
  if (product) parts.push(`product:${safeText(product, 180)}`);
  if (session_id) parts.push(`session_id:${safeText(session_id, 120)}`);
  return parts.join(' | ') || null;
}

module.exports = router;

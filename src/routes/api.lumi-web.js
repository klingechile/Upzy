const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const config = require('../config/env');

const TENANT_ID = config.tenantId;

// POST /api/lumi-web/track
router.post('/track', async (req, res) => {
  try {
    const { event_type, session_id, page_url, product, variant, cart, utm, referrer, website } = req.body || {};
    if (website) return res.status(200).json({ ok: true, ignored: true });

    const eventType = safeText(event_type, 80) || 'lumi_web.event';
    const sessionId = safeText(session_id, 160) || `anonymous_${Date.now()}`;

    const event = {
      tenant_id: TENANT_ID,
      event_type: eventType,
      source_module: 'lumi-web',
      entity_type: 'web_session',
      entity_id: sessionId,
      payload: {
        page_url: safeText(page_url, 600),
        product: sanitizeObject(product),
        variant: sanitizeObject(variant),
        cart: sanitizeObject(cart),
        utm: sanitizeObject(utm),
        referrer: safeText(referrer, 600),
      },
    };

    const { error } = await supabase.from('upzy_events').insert(event);
    if (error) {
      console.warn('[lumi-web] track not persisted:', error.message);
      return res.status(202).json({ ok: true, persisted: false, warning: error.message });
    }

    res.status(201).json({ ok: true, persisted: true });
  } catch (err) {
    console.error('[lumi-web] track error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/lumi-web/conversations
router.post('/conversations', async (req, res) => {
  try {
    const { name, email, phone, message, page_url, product, variant, cart, utm, session_id, website } = req.body || {};

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
      score: cart?.item_count ? 4 : 3,
      segmento: cart?.item_count ? 'hot' : 'warm',
      etapa: 'nuevo',
      tipo_negocio: null,
      notas: buildNotes({ page_url, product, variant, cart, utm, session_id }),
    };

    const { data: lead, error: leadError } = await supabase
      .from('upzy_leads')
      .upsert(leadPayload, { onConflict: 'tenant_id,canal,canal_id', ignoreDuplicates: false })
      .select('id, nombre, email, telefono, canal, canal_id, segmento, score, etapa, notas')
      .single();

    if (leadError) throw leadError;

    const { data: conversation, error: convError } = await supabase
      .from('upzy_conversaciones')
      .insert({
        tenant_id: TENANT_ID,
        lead_id: lead.id,
        canal: 'whatsapp',
        estado: 'agente',
      })
      .select('id, canal, estado, created_at, updated_at')
      .single();

    if (convError) throw convError;

    const contextLine = buildContextLine({ product, variant, cart, page_url });
    const messageWithContext = contextLine ? `${cleanMessage}\n\nOrigen: Lumi Web\nContexto web: ${contextLine}` : `${cleanMessage}\n\nOrigen: Lumi Web`;

    await supabase.from('upzy_mensajes').insert({
      tenant_id: TENANT_ID,
      conversacion_id: conversation.id,
      origen: 'cliente',
      contenido: messageWithContext,
    });

    const autoReply = 'Gracias por escribirnos. Ya recibimos tu mensaje y un asesor de Klinge te responderá por este chat. Si quieres avanzar más rápido, déjanos la medida o producto que estás buscando.';

    await supabase.from('upzy_mensajes').insert({
      tenant_id: TENANT_ID,
      conversacion_id: conversation.id,
      origen: 'bot',
      contenido: autoReply,
    });

    await registerWebEvent('lumi_web.conversation_created', session_id, { lead, conversation, page_url, product, variant, cart, utm });

    return res.status(201).json({
      ok: true,
      conversation,
      lead,
      messages: [
        { origen: 'cliente', contenido: messageWithContext },
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

async function registerWebEvent(eventType, sessionId, payload) {
  try {
    await supabase.from('upzy_events').insert({
      tenant_id: TENANT_ID,
      event_type: eventType,
      source_module: 'lumi-web',
      entity_type: 'web_session',
      entity_id: safeText(sessionId, 160),
      payload: sanitizeObject(payload),
    });
  } catch (err) {
    console.warn('[lumi-web] event skipped:', err.message);
  }
}

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

function sanitizeObject(value) {
  if (!value || typeof value !== 'object') return value || null;
  try {
    return JSON.parse(JSON.stringify(value)).slice ? null : JSON.parse(JSON.stringify(value));
  } catch (_) {
    return null;
  }
}

function buildNotes({ page_url, product, variant, cart, utm, session_id }) {
  const parts = ['origin:web'];
  if (page_url) parts.push(`page_url:${safeText(page_url, 300)}`);
  if (product?.title || product?.name || product) parts.push(`product:${safeText(product.title || product.name || product, 180)}`);
  if (variant?.id || variant?.title) parts.push(`variant:${safeText(variant.id || variant.title, 120)}`);
  if (cart?.item_count) parts.push(`cart_items:${cart.item_count}`);
  if (cart?.total_price) parts.push(`cart_total:${cart.total_price}`);
  if (utm?.source || utm?.campaign) parts.push(`utm:${safeText(`${utm.source || ''}/${utm.campaign || ''}`, 160)}`);
  if (session_id) parts.push(`session_id:${safeText(session_id, 120)}`);
  return parts.join(' | ') || null;
}

function buildContextLine({ product, variant, cart, page_url }) {
  const parts = [];
  if (product?.title || product?.name || product) parts.push(`Producto ${product.title || product.name || product}`);
  if (variant?.id || variant?.title) parts.push(`Variante ${variant.title || variant.id}`);
  if (cart?.item_count) parts.push(`Carrito ${cart.item_count} ítem(s)`);
  if (cart?.total_price) parts.push(`Total carrito ${cart.total_price}`);
  if (page_url) parts.push(`URL ${safeText(page_url, 220)}`);
  return parts.join(' · ');
}

module.exports = router;

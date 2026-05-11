const express  = require('express');
const router   = express.Router();
const ig       = require('../services/instagram');
const ai       = require('../services/ai');
const scoring  = require('../services/scoring');
const supabase = require('../db/supabase');

const TENANT_ID = require('../config/env').tenantId;

// Verificación del webhook (GET — Meta lo llama al configurar)
router.get('/', (req, res) => {
  const challenge = ig.verificarWebhook(req.query);
  if (challenge) {
    console.log('[IG] Webhook verificado ✅');
    return res.status(200).send(challenge);
  }
  console.warn('[IG] Verificación fallida — revisar IG_VERIFY_TOKEN');
  res.sendStatus(403);
});

// Mensajes entrantes (POST)
router.post('/', async (req, res) => {
  res.status(200).json({ ok: true });

  try {
    const msg = ig.parsearWebhook(req.body);
    if (!msg) return;

    console.log(`[IG] ← ${msg.senderId}: ${msg.texto.substring(0, 60)}`);

    // 1. Intentar obtener nombre real / username de Instagram
    const perfil = await ig.obtenerPerfil(msg.senderId);
    const nombreInstagram = perfil?.nombre || perfil?.username || `Instagram ${String(msg.senderId).slice(-6)}`;

    // 2. Registrar lead y score con nombre visible
    const { lead, intenciones } = await scoring.procesarMensajeEntrante(
      TENANT_ID,
      { texto: msg.texto, canal_id: msg.senderId, nombre: nombreInstagram },
      'instagram'
    );

    // Refuerzo: si el lead ya existía como "Cliente Instagram", actualizarlo cuando Meta entregue nombre
    if (perfil?.nombre || perfil?.username) {
      await supabase
        .from('upzy_leads')
        .update({ nombre: nombreInstagram, ultimo_contacto: new Date().toISOString() })
        .eq('id', lead.id);
    }

    // 3. Buscar o crear conversación ANTES de responder para que el inbox tenga última actividad real
    let { data: conversacion } = await supabase
      .from('upzy_conversaciones')
      .select('id, estado')
      .eq('tenant_id', TENANT_ID)
      .eq('lead_id', lead.id)
      .eq('canal', 'instagram')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!conversacion?.id) {
      const { data } = await supabase
        .from('upzy_conversaciones')
        .insert({ tenant_id: TENANT_ID, lead_id: lead.id, canal: 'instagram', estado: 'bot' })
        .select('id, estado')
        .single();
      conversacion = data;
    }

    const convId = conversacion?.id;

    if (convId) {
      await supabase.from('upzy_mensajes').insert({
        tenant_id: TENANT_ID,
        conversacion_id: convId,
        origen: 'cliente',
        contenido: msg.texto,
      });
      await supabase
        .from('upzy_conversaciones')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', convId);
    }

    // 4. Si quiere agente, delegar y dejar registrado en chat
    if (ai.quiereAgente(msg.texto)) {
      const respuestaAgente = 'Te conecto con un asesor ahora mismo 🙏';
      await ig.enviarTexto(msg.senderId, respuestaAgente);
      await supabase.from('upzy_leads').update({ asignado_a: 'agente' }).eq('id', lead.id);
      if (convId) {
        await supabase.from('upzy_mensajes').insert({
          tenant_id: TENANT_ID,
          conversacion_id: convId,
          origen: 'bot',
          contenido: respuestaAgente,
        });
        await supabase
          .from('upzy_conversaciones')
          .update({ estado: 'agente', updated_at: new Date().toISOString() })
          .eq('id', convId);
      }
      return;
    }

    if (conversacion?.estado === 'agente') return;

    // 5. Historial completo reciente de la conversación
    let historial = [];
    if (convId) {
      const { data: mensajes } = await supabase
        .from('upzy_mensajes')
        .select('origen, contenido')
        .eq('conversacion_id', convId)
        .order('created_at', { ascending: true })
        .limit(20);

      historial = (mensajes || []).slice(-10).map(m => ({
        role:    m.origen === 'cliente' ? 'user' : 'assistant',
        content: m.contenido,
      }));
    }

    // 6. Respuesta IA
    const respuesta = await ai.responder(msg.texto, historial, { lead: { ...lead, nombre: nombreInstagram }, intenciones });

    // 7. Guardar respuesta, actualizar conversación y enviar
    if (convId) {
      await supabase.from('upzy_mensajes').insert({
        tenant_id: TENANT_ID,
        conversacion_id: convId,
        origen: 'bot',
        contenido: respuesta,
      });
      await supabase
        .from('upzy_conversaciones')
        .update({ estado: 'bot', updated_at: new Date().toISOString() })
        .eq('id', convId);
    }

    await ig.enviarTexto(msg.senderId, respuesta);
    console.log(`[IG] → ${msg.senderId}: ${respuesta.substring(0, 60)}`);
  } catch (err) {
    console.error('[IG webhook] Error:', err.message);
  }
});

module.exports = router;

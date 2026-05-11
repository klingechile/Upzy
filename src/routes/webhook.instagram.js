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

    // 1. Registrar lead y score
    const { lead, intenciones } = await scoring.procesarMensajeEntrante(
      TENANT_ID,
      { texto: msg.texto, canal_id: msg.senderId },
      'instagram'
    );

    // 2. Si quiere agente, delegar
    if (ai.quiereAgente(msg.texto)) {
      await ig.enviarTexto(msg.senderId, 'Te conecto con un asesor ahora mismo 🙏');
      await supabase.from('upzy_leads').update({ asignado_a: 'agente' }).eq('id', lead.id);
      return;
    }

    // 3. Historial de la conversación
    const { data: conversacion } = await supabase
      .from('upzy_conversaciones')
      .select('id, estado')
      .eq('tenant_id', TENANT_ID)
      .eq('lead_id', lead.id)
      .eq('canal', 'instagram')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (conversacion?.estado === 'agente') return;

    let historial = [];
    if (conversacion) {
      const { data: mensajes } = await supabase
        .from('upzy_mensajes')
        .select('origen, contenido')
        .eq('conversacion_id', conversacion.id)
        .order('created_at', { ascending: true })
        .limit(10);

      historial = (mensajes || []).map(m => ({
        role:    m.origen === 'cliente' ? 'user' : 'assistant',
        content: m.contenido,
      }));
    }

    // 4. Respuesta IA
    const respuesta = await ai.responder(msg.texto, historial, { lead, intenciones });

    // 5. Guardar y enviar
    let convId = conversacion?.id;
    if (!convId) {
      const { data } = await supabase
        .from('upzy_conversaciones')
        .insert({ tenant_id: TENANT_ID, lead_id: lead.id, canal: 'instagram', estado: 'bot' })
        .select('id').single();
      convId = data?.id;
    }

    if (convId) {
      await supabase.from('upzy_mensajes').insert([
        { tenant_id: TENANT_ID, conversacion_id: convId, origen: 'cliente', contenido: msg.texto },
        { tenant_id: TENANT_ID, conversacion_id: convId, origen: 'bot',     contenido: respuesta },
      ]);
    }

    await ig.enviarTexto(msg.senderId, respuesta);
    console.log(`[IG] → ${msg.senderId}: ${respuesta.substring(0, 60)}`);
  } catch (err) {
    console.error('[IG webhook] Error:', err.message);
  }
});

module.exports = router;
